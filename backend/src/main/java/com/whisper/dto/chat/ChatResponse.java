package com.whisper.dto.chat;

import com.whisper.entity.Chat;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ChatResponse {

    private Long chatId;
    private String name;
    private Chat.ChatType type;
    private List<ParticipantResponse> participants;

}
