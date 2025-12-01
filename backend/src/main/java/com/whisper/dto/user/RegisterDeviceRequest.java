package com.whisper.dto.user;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterDeviceRequest {

    @NotBlank(message = "FCM Token required")
    private String fcmToken;

}
