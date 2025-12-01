package com.whisper.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "user_devices",
        indexes = {
            @Index(name = "idx_fcm_token", columnList = "fcmToken", unique = true)
        })
@Data
@NoArgsConstructor
public class UserDevice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true)
    private String fcmToken;

    @Column(nullable = false)
    private Instant lastLogin;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        lastLogin = Instant.now();
    }

}
