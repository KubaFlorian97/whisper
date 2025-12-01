package com.whisper.dto.chat;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GroupMembershipRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

}
