package com.whisper.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Display name required")
    private String displayName;

    private String email;

    private String phoneNumber;

    @NotBlank(message = "Password required")
    private String password;

}
