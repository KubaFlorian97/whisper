package com.whisper.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketSessionManager {

    private final Map<Long, WebSocketSession> sessions = new ConcurrentHashMap<>();

    public void registerSession(Long userId, WebSocketSession session) {
        sessions.compute(userId, (id, oldSession) -> {
            if (oldSession != null && oldSession.isOpen()) {
                try {
                    oldSession.close();
                } catch (Exception e) {
                    System.err.println("Error during closing old session | user: " + userId);
                }
            }
            return session;
        });
        System.out.println("User session registered | user: " + userId);
    }

    public void removeSession(Long userId) {
        sessions.remove(userId);
        System.out.println("User session removed | user: " + userId);
    }

    public void removeSession(WebSocketSession session) {
        sessions.entrySet().removeIf(entry -> entry.getValue().equals(session));
    }

    public Optional<WebSocketSession> getSession(Long userId) {
        return Optional.ofNullable(sessions.get(userId));
    }

}
