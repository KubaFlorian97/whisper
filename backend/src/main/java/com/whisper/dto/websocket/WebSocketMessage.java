package com.whisper.dto.websocket;

import com.whisper.entity.Message;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class WebSocketMessage {

    private MessageType type;

    // AUTH
    private String token;

    // CHAT_MESSAGE
    private Long chatId;
    private String content;
    private Message.MessageType messageType;

    // PRESENCE_UPDATE
    private Long userId;
    private String status;

    // MARK_AS_READ
    private Long messageId;

    public enum MessageType {
        AUTH,
        CHAT_MESSAGE,
        ERROR,
        PRESENCE_UPDATE,
        MARK_AS_READ,
        READ_RECEIPT
    }

}
