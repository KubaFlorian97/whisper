package com.whisper.service;

import com.whisper.dto.chat.MessageResponse;
import com.whisper.entity.Chat;
import com.whisper.entity.Message;
import com.whisper.entity.User;
import com.whisper.repository.*;
import com.whisper.websocket.WebSocketMessageBroadcaster;
import com.whisper.websocket.WebSocketSessionManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ChatServiceTest {

    @Mock
    private ChatRepository chatRepository;
    @Mock
    private ChatParticipantRepository participantRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private MessageRepository messageRepository;
    @Mock
    private MessageReadReceiptRepository readReceiptRepository;
    @Mock
    private WebSocketMessageBroadcaster messageBroadcaster;
    @Mock
    private WebSocketSessionManager sessionManager;

    @InjectMocks
    private ChatService chatService;

    private User currentUser;
    private Long chatId;
    private Pageable pageable;

    @BeforeEach
    void setUp() {
        currentUser = new User();
        currentUser.setId(1L);
        currentUser.setDisplayName("Current User");

        chatId = 10L;
        pageable = Pageable.unpaged();
    }

    @Test
    void whenGetChatMessages_withoutAccess_thenThrowsSecurityException() {
        when(participantRepository.existsByUserAndChatId(currentUser, chatId)).thenReturn(false);

        assertThrows(SecurityException.class, () -> {
            chatService.getChatMessages(chatId, currentUser, pageable);
        });

        verify(messageRepository, never()).findByChatIdOrderByTimestampDesc(anyLong(), any(Pageable.class));
    }

    @Test
    void whenGetChatMessages_withAccess_thenReturnsMessagePage() {
        Message msg1 = new Message();
        msg1.setId(100L);
        msg1.setContent("Content1");
        msg1.setSender(currentUser);
        msg1.setChat(new Chat());

        Page<Message> messagePage = new PageImpl<>(List.of(msg1));

        when(participantRepository.existsByUserAndChatId(currentUser, chatId)).thenReturn(true);
        when(messageRepository.findByChatIdOrderByTimestampDesc(chatId, pageable)).thenReturn(messagePage);
        when(readReceiptRepository.findByMessageIds(Set.of(100L))).thenReturn(List.of());

        Page<MessageResponse> resultPage = chatService.getChatMessages(chatId, currentUser, pageable);

        assertNotNull(resultPage);
        assertEquals(1, resultPage.getTotalElements());
        assertEquals("Content1", resultPage.getContent().get(0).getContent());

        verify(participantRepository, times(1)).existsByUserAndChatId(currentUser, chatId);
        verify(messageRepository, times(1)).findByChatIdOrderByTimestampDesc(chatId, pageable);
        verify(readReceiptRepository, times(1)).findByMessageIds(Set.of(100L));
    }

}
