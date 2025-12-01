package com.whisper.service;

import com.whisper.dto.user.*;
import com.whisper.entity.User;
import com.whisper.entity.UserDevice;
import com.whisper.repository.UserDeviceRepository;
import com.whisper.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserDeviceRepository userDeviceRepository;
    @Autowired
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserSearchResponse> searchUsers(String query, User currentUser) {
        PageRequest pageable = PageRequest.of(0, 20);

        List<User> users = userRepository.searchByDisplayName(query, currentUser.getId(), pageable);

        return users.stream()
                .map(UserSearchResponse::fromEntity)
                .toList();
    }

    @Transactional
    public void uploadPublicKey(PublicKeyUploadRequest req, User currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalStateException("User not found"));
        user.setPublicKey(req.getPublicKey());
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public PublicKeyResponse getPublicKey(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getPublicKey() == null || user.getPublicKey().isBlank()) {
            throw new RuntimeException("User do not have public key");
        }

        return PublicKeyResponse.builder()
                .userId(user.getId())
                .publicKey(user.getPublicKey())
                .build();
    }

    @Transactional
    public void registerDevice(RegisterDeviceRequest req, User currentUser) {
        String token = req.getFcmToken();

        UserDevice device = userDeviceRepository.findByFcmToken(token)
                .orElse(new UserDevice());
        device.setUser(currentUser);
        device.setFcmToken(token);
        device.setLastLogin(Instant.now());
        userDeviceRepository.save(device);
    }

    @Transactional
    public void syncKeys(KeySyncRequestResponse req, User currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPublicKey(req.getPublicKey());
        user.setEncryptedPrivateKey(req.getEncryptedPrivateKey());

        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public KeySyncRequestResponse getMyKeys(User currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow();

        return KeySyncRequestResponse.builder()
                .publicKey(user.getPublicKey())
                .encryptedPrivateKey(user.getEncryptedPrivateKey())
                .build();
    }

    @Transactional
    public void updateProfile(UpdateProfileRequest req, User currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow();

        if (req.getDisplayName() != null) user.setDisplayName(req.getDisplayName());
        if (req.getEmail() != null) user.setEmail(req.getEmail());
        if (req.getPhoneNumber() != null) user.setPhoneNumber(req.getPhoneNumber());
        if (req.getAvatarUrl() != null) user.setAvatarUrl(req.getAvatarUrl());

        userRepository.save(user);
    }

    @Transactional
    public void changePassword(ChangePasswordRequest req, User currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow();

        if (!passwordEncoder.matches(req.getOldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Wrong old password.");
        }

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        user.setEncryptedPrivateKey(req.getEncryptedPrivateKey());

        userRepository.save(user);
    }

}
