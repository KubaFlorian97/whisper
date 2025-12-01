package com.whisper.service;

import com.whisper.dto.chat.ChatResponse;
import com.whisper.dto.chat.CreateChatRequest;
import com.whisper.dto.chat.MessageResponse;
import com.whisper.dto.chat.ParticipantResponse;
import com.whisper.entity.*;
import com.whisper.repository.*;
import com.whisper.websocket.WebSocketMessageBroadcaster;
import com.whisper.websocket.WebSocketSessionManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final ChatParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final WebSocketMessageBroadcaster messageBroadcaster;
    private final WebSocketSessionManager sessionManager;
    private final MessageReadReceiptRepository readReceiptRepository;

    /**
     * Lista czatow uzytkownika
     * @param currentUser
     * @return
     */
    @Transactional(readOnly = true)
    public List<ChatResponse> getUserChats(User currentUser) {
        List<ChatProjection> rawData = chatRepository.findChatProjectionsByUserId(currentUser.getId());

        Map<Long, List<ChatProjection>> groupedByChat = rawData.stream()
                .collect(Collectors.groupingBy(ChatProjection::getChatId));

        List<ChatResponse> response = new ArrayList<>();

        for (Map.Entry<Long, List<ChatProjection>> entry : groupedByChat.entrySet()) {
            Long chatId = entry.getKey();
            List<ChatProjection> rows = entry.getValue();

            if (rows.isEmpty()) continue;

            ChatProjection firstRow = rows.getFirst();

            List<ParticipantResponse> participants = rows.stream()
                    .map(row -> ParticipantResponse.builder()
                            .userId(row.getUserId())
                            .displayName(row.getDisplayName())
                            .avatarUrl(row.getAvatarUrl())
                            .build())
                    .collect(Collectors.toList());

            response.add(ChatResponse.builder()
                    .chatId(chatId)
                    .name(firstRow.getChatName())
                    .type(firstRow.getChatType())
                    .participants(participants)
                    .build());
        }

        return response;
    }

    /**
     * Utworzenie nowego czatu
     * @param req
     * @param creator
     * @return
     */
    @Transactional
    public ChatResponse createChat(CreateChatRequest req, User creator) {
        if (req.getType() == Chat.ChatType.GROUP && (req.getName() == null || req.getName().isBlank())) {
            throw new IllegalArgumentException("Group chat name is required!");
        }

        Chat chat = new Chat();
        chat.setType(req.getType());
        chat.setName(req.getName());
        Chat savedChat = chatRepository.save(chat);

        List<User> participants = new ArrayList<>();
        participants.add(creator);

        for (Long userId : req.getParticipantIds()) {
            userRepository.findById(userId)
                    .ifPresent(participants::add);
        }

        List<ChatParticipant> chatParticipants = new ArrayList<>();
        for (User user : participants) {
            ChatParticipant participant = new ChatParticipant();
            participant.setUser(user);
            participant.setChat(savedChat);

            if (user.getId().equals(creator.getId())) {
                participant.setRole(ChatParticipant.ParticipantRole.ADMIN);
            } else {
                participant.setRole(ChatParticipant.ParticipantRole.MEMBER);
            }
            chatParticipants.add(participant);
        }

        participantRepository.saveAll(chatParticipants);

        List<ParticipantResponse> participantResponses = participants.stream()
                .map(p -> ParticipantResponse.builder()
                        .userId(p.getId())
                        .displayName(p.getDisplayName())
                        .avatarUrl(p.getAvatarUrl())
                        .build())
                .toList();

        return ChatResponse.builder()
                .chatId(savedChat.getId())
                .name(savedChat.getName())
                .type(savedChat.getType())
                .participants(participantResponses)
                .build();
    }

    /**
     * Lista wiadomosci w czacie
     * @param chatId
     * @param currentUser
     * @param pageable
     * @return Lista wiadomosci
     */
    @Transactional(readOnly = true)
    public Page<MessageResponse> getChatMessages(Long chatId, User currentUser, Pageable pageable) {
        if (!participantRepository.existsByUserAndChatId(currentUser, chatId)) {
            throw new SecurityException("No access to this chat.");
        }

        Page<Message> messagePage = messageRepository.findByChatIdOrderByTimestampDesc(chatId, pageable);

        Set<Long> messagesIds = messagePage.getContent().stream()
                .map(Message::getId)
                .collect(Collectors.toSet());

        Map<Long, Set<Long>> receiptsMap = Map.of();
        if (!messagesIds.isEmpty()) {
             receiptsMap = readReceiptRepository.findByMessageIds(messagesIds).stream()
                     .collect(Collectors.groupingBy(
                             receipt -> receipt.getMessage().getId(),
                             Collectors.mapping(receipt -> receipt.getUser().getId(), Collectors.toSet())
                     ));
        }

        final Map<Long, Set<Long>> finalReceiptsMap = receiptsMap;

        List<MessageResponse> messageResponses = messagePage.getContent().stream()
                .map(message -> {
                    MessageResponse response = MessageResponse.fromEntity(message);
                    response.setReadBy(finalReceiptsMap.getOrDefault(message.getId(), Set.of()));
                    return response;
                }).toList();

        return new PageImpl<>(messageResponses, pageable, messagePage.getTotalElements());
    }

    /**
     * Zapis zaszyfrowanej wiadomosci
     * @param senderId
     * @param chatId
     * @param content
     * @param type
     * @return Obiekt z zaszyfrowana wiadomoscia
     */
    @Transactional
    public Message saveMessage(Long senderId, Long chatId, String content, Message.MessageType type) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));

        Hibernate.initialize(chat.getParticipants());

        boolean isParticipant = chat.getParticipants().stream()
                .anyMatch(p -> p.getUser().getId().equals(senderId));
        if (!isParticipant) {
            throw new SecurityException("User is not a participant of this chat");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        Message msg = new Message();
        msg.setChat(chat);
        msg.setSender(sender);
        msg.setContent(content);
        msg.setType(type);

        return messageRepository.save(msg);
    }

    /**
     * Odznaczenie wiadomosci jako przeczytanej
     * @param messageId
     * @param readerId
     * @return Id uzytkownika
     */
    @Transactional
    public Long markMessageAsRead(Long messageId, Long readerId) {
        if (readReceiptRepository.existsByMessageIdAndUserId(messageId, readerId)) {
            return null;
        }

        Message message = messageRepository.findById(messageId).orElse(null);
        if (message == null) {
            return null;
        }

        if (message.getSender().getId().equals(readerId)) {
            return null;
        }

        User reader = userRepository.getReferenceById(readerId);

        MessageReadReceipt receipt = new MessageReadReceipt(message, reader);
        readReceiptRepository.save(receipt);

        return message.getSender().getId();
    }

    /**
     * Zmiana nazwy grupy
     * @param chatId
     * @param newName
     * @param currentUser
     */
    @Transactional
    public void updateGroupName(Long chatId, String newName, User currentUser) {
        Chat chat = getChatAndVerifyAdminAccess(chatId, currentUser);

        if(chat.getType() != Chat.ChatType.GROUP) {
            throw new IllegalArgumentException("Cannot change name of private chat");
        }

        chat.setName(newName);
        chatRepository.save(chat);

        String content = currentUser.getDisplayName() + " zmienił(a) nazwe grupy na " + newName;
        createAndBroadcastSystemMessage(chat, content);
    }

    /**
     * Dodanie uczestnika do czatu
     * @param chatId
     * @param userIdToAdd
     * @param currentUser
     */
    @Transactional
    public void addParticipant(Long chatId, Long userIdToAdd, User currentUser) {
        Chat chat = getChatAndVerifyAdminAccess(chatId, currentUser);

        if (chat.getType() != Chat.ChatType.GROUP) {
            throw new IllegalArgumentException("Cannot add users to private chat");
        }

        if (participantRepository.findByChatIdAndUserId(chatId, userIdToAdd).isPresent()) {
            throw new IllegalArgumentException(("User already is member od this chat"));
        }

        User userToAdd = userRepository.findById(userIdToAdd)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ChatParticipant newParticipant = new ChatParticipant();
        newParticipant.setChat(chat);
        newParticipant.setUser(userToAdd);
        newParticipant.setRole(ChatParticipant.ParticipantRole.MEMBER);
        participantRepository.save(newParticipant);

        String content = currentUser.getDisplayName() + " dodał(a) " + userToAdd.getDisplayName() + " do grupy";
        createAndBroadcastSystemMessage(chat, content);
    }

    /**
     * Usuniecie uczestnika czatu
     * @param chatId
     * @param userIdToRemove
     * @param currentUser
     */
    @Transactional
    public void removeParticipant(Long chatId, Long userIdToRemove, User currentUser) {
        Chat chat = getChatAndVerifyAdminAccess(chatId, currentUser);

        ChatParticipant participantToRemove = participantRepository.findByChatIdAndUserId(chatId, userIdToRemove)
                .orElseThrow(() -> new RuntimeException("User is not a member of this group chat"));
        User removedUser = participantToRemove.getUser();

        participantRepository.delete(participantToRemove);

        String content = currentUser.getDisplayName() + " usunął/usunęła " + removedUser.getDisplayName() + " z grupy";
        createAndBroadcastSystemMessage(chat, content);
    }

    /**
     * Opuszczenie czatu grupowego
     * @param chatId
     * @param currentUser
     */
    @Transactional
    public void leaveGroup(Long chatId, User currentUser) {
        ChatParticipant participant = participantRepository.findByChatIdAndUserId(chatId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("You are not a member of this chat"));

        if (participant.getChat().getType() != Chat.ChatType.GROUP) {
            throw new IllegalArgumentException("You cannot leave private chat");
        }
        Chat chat = participant.getChat();

        participantRepository.delete(participant);

        String content = currentUser.getDisplayName() + " opuścił(a) grupę";
        createAndBroadcastSystemMessage(chat, content);
    }

    /**
     * Wyslanie wiadomosci przez WebSocket
     * @param chat
     * @param content
     */
    private void createAndBroadcastSystemMessage(Chat chat, String content) {
        Message systemMessage = new Message();
        systemMessage.setChat(chat);
        systemMessage.setSender(null);
        systemMessage.setType(Message.MessageType.SYSTEM);
        systemMessage.setContent(content);

        Message savedMessage = messageRepository.save(systemMessage);

        messageBroadcaster.broadcastMessage(savedMessage);
    }

    /**
     * Pobranie czatu ze sprawdzeniem czy ma role admina
     * @param chatId
     * @param user
     * @return Chat
     */
    private Chat getChatAndVerifyAdminAccess(Long chatId, User user) {
        ChatParticipant participant = participantRepository.findByChatIdAndUserId(chatId, user.getId())
                .orElseThrow(() -> new SecurityException("No access to this chat"));

        if (participant.getRole() != ChatParticipant.ParticipantRole.ADMIN) {
            throw new SecurityException("Only administrator can run this action");
        }

        return participant.getChat();
    }

    /**
     * Mapa z statusami uztkownikow
     * @param chatId
     * @param currentUser
     * @return Mapa z statusami uzytkownikow
     */
    @Transactional(readOnly = true)
    public Map<Long, String> getChatPresence(Long chatId, User currentUser) {
        if (!participantRepository.existsByUserAndChatId(currentUser, chatId)) {
            throw new SecurityException("No access to this chat");
        }

        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));

        return chat.getParticipants().stream()
                .collect(Collectors.toMap(
                        p -> p.getUser().getId(),
                        p -> sessionManager.getSession(p.getUser().getId()).isPresent()
                            ? "ONLINE" : "OFFLINE"
                ));
    }

}
