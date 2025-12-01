package com.whisper.dto.chat;

import com.whisper.entity.Chat;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateChatRequest {

    @NotNull(message = "Chat type required")
    private Chat.ChatType type;

    private String name;

    @NotEmpty(message = "Chat must have participants")
    private List<Long> participantIds;

}
