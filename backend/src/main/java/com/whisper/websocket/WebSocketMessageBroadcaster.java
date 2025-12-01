package com.whisper.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.whisper.dto.chat.MessageResponse;
import com.whisper.entity.ChatParticipant;
import com.whisper.entity.Message;
import com.whisper.service.PushNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class WebSocketMessageBroadcaster {

    private final WebSocketSessionManager sessionManager;
    private final ObjectMapper objectMapper;
    private final PushNotificationService pushService;

    public void broadcastMessage(Message message) {
        MessageResponse messageResponse = MessageResponse.fromEntity(message);
        Long senderId = (message.getSender() != null) ? message.getSender().getId() : null;

        try {
            String payload = objectMapper.writeValueAsString(messageResponse);

            for (ChatParticipant participant : message.getChat().getParticipants()) {
                Long recipientId = participant.getUser().getId();

                Optional<WebSocketSession> sessionOpt = sessionManager.getSession(recipientId);

                if (sessionOpt.isPresent() && sessionOpt.get().isOpen()) {
                    try {
                        sessionOpt.get().sendMessage(new TextMessage(payload));
                    } catch (IOException e) {
                        System.err.println("Error sending WS message to " + recipientId);
                    }
                } else {
                    if (!recipientId.equals(senderId) && message.getType() != Message.MessageType.SYSTEM) {
                        pushService.sendNotificationToUser(recipientId, message);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error broadcasting message: " + e.getMessage());
        }
    }

}
