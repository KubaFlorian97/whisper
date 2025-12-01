package com.whisper.service;

import com.whisper.dto.storage.UploadResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
public class StorageService {

    private final RestTemplate restTemplate;
    private final String supabaseStorageUrl;
    private final String supabaseServiceKey;
    private final String supabaseBucket;

    public StorageService(
            RestTemplate restTemplate,
            @Value("${supabase.storage.url}") String supabaseStorageUrl,
            @Value("${supabase.service.key}") String supabaseServiceKey,
            @Value("${supabase.storage.bucket}") String supabaseBucket) {
        this.restTemplate = restTemplate;
        this.supabaseStorageUrl = supabaseStorageUrl;
        this.supabaseServiceKey = supabaseServiceKey;
        this.supabaseBucket = supabaseBucket;
    }

    public UploadResponse uploadFile(MultipartFile file, Long uploaderId)
        throws IOException {
        String extension = getFileExtension(file.getOriginalFilename());
        String uniqueFileName = uploaderId + "/" + UUID.randomUUID() + "." + extension;

        String uploadUrl = supabaseStorageUrl + "/object/" + supabaseBucket + "/" + uniqueFileName;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + supabaseServiceKey);
        headers.set("apikey", supabaseServiceKey);
        headers.set("Content-Type", file.getContentType());
        headers.set("x-upsert", "true");

        HttpEntity<ByteArrayResource> requestEntity = new HttpEntity<>(
                new ByteArrayResource(file.getBytes()),
                headers
        );

        ResponseEntity<String> response = restTemplate.exchange(
                uploadUrl,
                HttpMethod.POST,
                requestEntity,
                String.class
        );

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new IOException("Failed to upload file: " + response.getBody());
        }

        String publicUrl = supabaseStorageUrl + "/object/public/" + supabaseBucket + "/" + uniqueFileName;

        return UploadResponse.builder()
                .fileUrl(publicUrl)
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .build();
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || fileName.lastIndexOf('.') == -1) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1);
    }

}
