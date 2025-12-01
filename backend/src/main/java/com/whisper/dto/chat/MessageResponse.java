package com.whisper.dto.chat;

import com.whisper.entity.Message;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Set;

@Data
@Builder
public class MessageResponse {

    private Long messageId;
    private Long senderId;
    private String senderDisplayName;
    private Long chatId;
    private String content;
    private Message.MessageType type;
    private Instant timestamp;
    private Set<Long> readBy;

    public static MessageResponse fromEntity(Message message) {
        return MessageResponse.builder()
                .messageId(message.getId())
                .senderId(message.getSender().getId())
                .senderDisplayName(message.getSender().getDisplayName())
                .chatId(message.getChat().getId())
                .content(message.getContent())
                .type(message.getType())
                .timestamp(message.getTimestamp())
                .build();
    }

}
