package com.whisper.controller;

import com.whisper.dto.storage.UploadResponse;
import com.whisper.entity.User;
import com.whisper.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/storage")
@RequiredArgsConstructor
public class StorageController {

    private final StorageService storageService;

    /**
     * Endpoint do zapisu plikow w Supabase
     * @param file
     * @param currentUser
     * @return
     */
    @PostMapping("/upload")
    public ResponseEntity<UploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User currentUser) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            UploadResponse response = storageService.uploadFile(file, currentUser.getId());
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

}
