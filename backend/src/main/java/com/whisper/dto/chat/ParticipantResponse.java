package com.whisper.dto.chat;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ParticipantResponse {

    private Long userId;
    private String displayName;
    private String avatarUrl;

}
