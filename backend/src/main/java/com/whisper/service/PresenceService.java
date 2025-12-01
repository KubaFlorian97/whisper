package com.whisper.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.whisper.dto.websocket.WebSocketMessage;
import com.whisper.repository.ChatParticipantRepository;
import com.whisper.websocket.WebSocketSessionManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.socket.TextMessage;

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PresenceService {

    private final ChatParticipantRepository participantRepository;
    private final WebSocketSessionManager sessionManager;
    private final ObjectMapper objectMapper;

    @Transactional
    public void broadcastPresenceUpdate(Long userId, String status) {
        WebSocketMessage presenceMessage = new WebSocketMessage();
        presenceMessage.setType(WebSocketMessage.MessageType.PRESENCE_UPDATE);
        presenceMessage.setUserId(userId);
        presenceMessage.setStatus(status);

        try {
            String payload = objectMapper.writeValueAsString(presenceMessage);

            Set<Long> notifiedUsersIds = new HashSet<>();
            notifiedUsersIds.add(userId);

            participantRepository.findByUser_Id(userId).forEach(participant -> participant.getChat().getParticipants().forEach(other -> {
                Long otherUserId = other.getUser().getId();
                if (!notifiedUsersIds.contains(otherUserId)) {
                    sessionManager.getSession(otherUserId).ifPresent(session -> {
                        try {
                            if (session.isOpen()) {
                                session.sendMessage(new TextMessage(payload));
                            }
                        } catch (Exception e) {
                            System.err.println("Error during sending status to: " + otherUserId);
                        }
                    });
                    notifiedUsersIds.add(otherUserId);
                }
            }));
        } catch (Exception e) {
            System.err.println("Error during broadcasting status: " + e.getMessage());
        }
    }

}
