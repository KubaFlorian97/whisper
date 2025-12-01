package com.whisper.controller;

import com.whisper.dto.user.*;
import com.whisper.entity.User;
import com.whisper.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Wyszukiwanie uzytkownikow
     * @param query
     * @param currentUser
     * @return
     */
    @GetMapping("/search")
    public ResponseEntity<List<UserSearchResponse>> searchUsers(
            @RequestParam("query") String query,
            @AuthenticationPrincipal User currentUser) {
        if (query == null || query.isBlank() || query.length() < 3) {
            return ResponseEntity.badRequest().build();
        }

        List<UserSearchResponse> results = userService.searchUsers(query, currentUser);
        return ResponseEntity.ok(results);
    }

    /**
     * Zapis klucza publicznego
     * @param req
     * @param currentUser
     * @return
     */
    @PutMapping("/me/public-key")
    public ResponseEntity<Void> uploadMyPublicKey(
            @Valid @RequestBody PublicKeyUploadRequest req,
            @AuthenticationPrincipal User currentUser) {
        userService.uploadPublicKey(req, currentUser);
        return ResponseEntity.ok().build();
    }

    /**
     * Pobranie klucza publicznego
     * @param userId
     * @param currentUser
     * @return
     */
    @GetMapping("/{userId}/public-key")
    public ResponseEntity<PublicKeyResponse> getPublicKey(
            @PathVariable Long userId,
            @AuthenticationPrincipal User currentUser) {
        try {
            PublicKeyResponse res = userService.getPublicKey(userId);
            return ResponseEntity.ok(res);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Zapis nowego urzadzenia uzytkownika
     * @param req
     * @param currentUser
     * @return
     */
    @PostMapping("/me/register-device")
    public ResponseEntity<Void> registerDevice(
            @Valid @RequestBody RegisterDeviceRequest req,
            @AuthenticationPrincipal User currentUser) {
        userService.registerDevice(req, currentUser);
        return ResponseEntity.ok().build();
    }

    /**
     * Synchronizacja kluczy E2EE
     * @param req
     * @param currentUser
     * @return
     */
    @PostMapping("/me/keys")
    public ResponseEntity<Void> syncKeys(
            @RequestBody KeySyncRequestResponse req,
            @AuthenticationPrincipal User currentUser
    ) {
        userService.syncKeys(req, currentUser);
        return ResponseEntity.ok().build();
    }

    /**
     * Pobranie kluczy E2EE
     * @param currentUser
     * @return
     */
    @GetMapping("/me/keys")
    public ResponseEntity<KeySyncRequestResponse> getMyKeys(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(userService.getMyKeys(currentUser));
    }

    /**
     * Aktualizacja profilu
     * @param req
     * @param currentUser
     * @return
     */
    @PutMapping("/me")
    public ResponseEntity<Void> updateProfile(
            @RequestBody UpdateProfileRequest req,
            @AuthenticationPrincipal User currentUser
    ) {
        userService.updateProfile(req, currentUser);
        return ResponseEntity.ok().build();
    }

    /**
     * Zmiana hasla i re-enkrypcja klucza prywatnego
     * @param req
     * @param currentUser
     * @return
     */
    @PostMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @RequestBody ChangePasswordRequest req,
            @AuthenticationPrincipal User currentUser
    ) {
        try {
            userService.changePassword(req, currentUser);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

}
