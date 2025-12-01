package com.whisper.dto.user;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class KeySyncRequestResponse {

    private String publicKey;
    private String encryptedPrivateKey;

}
