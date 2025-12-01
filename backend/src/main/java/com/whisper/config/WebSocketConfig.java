package com.whisper.config;

import com.whisper.websocket.ChatWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final ChatWebSocketHandler chatWebSocketHandler;

    /**
     * Konfiguracja WebSocket
     * @param reg
     */
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry reg) {
        reg.addHandler(chatWebSocketHandler, "/ws/chat")
                .setAllowedOrigins("http://localhost:5173");
    }
}
