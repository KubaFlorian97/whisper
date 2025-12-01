package com.whisper.dto.storage;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UploadResponse {

    private String fileUrl;
    private String fileType;
    private Long fileSize;

}
