package com.whisper.dto.chat;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateGroupNameRequest {

    @NotBlank(message = "Group name cannot be empty")
    private String newName;

}
