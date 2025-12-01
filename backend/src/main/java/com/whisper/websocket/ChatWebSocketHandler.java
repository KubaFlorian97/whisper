package com.whisper.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.whisper.dto.websocket.WebSocketMessage;
import com.whisper.entity.*;
import com.whisper.repository.ChatRepository;
import com.whisper.repository.MessageReadReceiptRepository;
import com.whisper.repository.MessageRepository;
import com.whisper.repository.UserRepository;
import com.whisper.service.ChatService;
import com.whisper.service.JwtService;
import com.whisper.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {
    
    private final WebSocketSessionManager sessionManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final ChatService chatService;
    private final WebSocketMessageBroadcaster messageBroadcaster;
    private final ObjectMapper objectMapper;
    private final PresenceService presenceService;
    private final MessageReadReceiptRepository readReceiptRepository;

    private static final String USER_ID_ATTRIBUTE = "USER_ID";

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        System.out.println("New WebSocket session: " + session.getId() + ". Waiting for authorization...");
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            String payload = message.getPayload();
            WebSocketMessage wsMessage = objectMapper.readValue(payload, WebSocketMessage.class);

            Long userId = (Long) session.getAttributes().get(USER_ID_ATTRIBUTE);

            if (userId == null) {
                if (wsMessage.getType() == WebSocketMessage.MessageType.AUTH) {
                    handleAuth(session, wsMessage.getToken());
                } else {
                    session.close(CloseStatus.POLICY_VIOLATION.withReason("Authorization required!"));
                }
            } else {
                switch (wsMessage.getType()) {
                    case CHAT_MESSAGE:
                        handleChatMessage(userId, wsMessage);
                        break;
                    case MARK_AS_READ:
                        handleMarkAsRead(userId, wsMessage.getMessageId());
                        break;
                }
            }
        } catch (Exception e) {
            System.err.println("Error during processing message: " + e.getMessage());
        }
    }

    private void handleAuth(WebSocketSession session, String token)
        throws IOException {
        if (token == null || token.isBlank()) {
            session.close(CloseStatus.POLICY_VIOLATION.withReason("Empty token."));
            return;
        }

        try {
            String userIdStr = jwtService.extractUserId(token);
            Long userId = Long.parseLong(userIdStr);
            User user = userRepository.findById(userId).orElse(null);

            if (user != null && jwtService.isTokenValid(token, user)) {
                session.getAttributes().put(USER_ID_ATTRIBUTE, userId);
                sessionManager.registerSession(userId, session);

                presenceService.broadcastPresenceUpdate(userId, "ONLINE");
            } else {
                session.close(CloseStatus.POLICY_VIOLATION.withReason("Incorrect token"));
            }
        } catch (Exception e) {
            session.close(CloseStatus.POLICY_VIOLATION.withReason("Token validation error: " + e.getMessage()));
        }
    }

    private void handleChatMessage(Long senderId, WebSocketMessage wsMessage) {
        try {
            Message saveMessage = chatService.saveMessage(
                    senderId,
                    wsMessage.getChatId(),
                    wsMessage.getContent(),
                    wsMessage.getMessageType()
            );

            messageBroadcaster.broadcastMessage(saveMessage);
        } catch (Exception e) {
            System.err.println("Error processing/saving chat message: " + e.getMessage());
        }
    }

    private void handleMarkAsRead(Long readerId, Long messageId) {
        if (messageId == null) return;

        try {
            Long senderId = chatService.markMessageAsRead(messageId, readerId);

            if (senderId != null) {
                sessionManager.getSession(senderId).ifPresent(senderSession -> {
                    try {
                        WebSocketMessage receiptMessage = new WebSocketMessage();
                        receiptMessage.setType(WebSocketMessage.MessageType.READ_RECEIPT);
                        receiptMessage.setMessageId(messageId);
                        receiptMessage.setUserId(readerId);

                        String payload = objectMapper.writeValueAsString(receiptMessage);
                        senderSession.sendMessage(new TextMessage(payload));
                    } catch (Exception e) {
                        System.err.println("Error sending read receipt to sender: " + senderId);
                    }
                });
            }
        } catch (Exception e) {
            System.err.println("Error handling mark as read: " + e.getMessage());
        }
    }
    
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Long userId = (Long) session.getAttributes().get(USER_ID_ATTRIBUTE);
        if (userId != null) {
            sessionManager.removeSession(userId);

            presenceService.broadcastPresenceUpdate(userId, "OFFLINE");
        }
        System.out.println("Session closed: " + session.getId() + " | Status: " + status);
    }
    
}
