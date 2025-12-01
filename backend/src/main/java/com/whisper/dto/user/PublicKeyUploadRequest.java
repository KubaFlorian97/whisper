package com.whisper.dto.user;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PublicKeyUploadRequest {

    @NotBlank(message = "Public key cannot be empty")
    private String publicKey;

}
