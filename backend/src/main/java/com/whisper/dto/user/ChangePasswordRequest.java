package com.whisper.dto.user;

import lombok.Data;

@Data
public class ChangePasswordRequest {

    private String oldPassword;
    private String newPassword;
    private String encryptedPrivateKey;

}
