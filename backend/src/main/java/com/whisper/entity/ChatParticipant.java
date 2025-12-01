package com.whisper.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.Instant;

@Entity
@Table(name = "chat_participants", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "chat_id"})
})
@Data
@NoArgsConstructor
public class ChatParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id", nullable = false)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Chat chat;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ParticipantRole role;

    @Column(nullable = false)
    private Instant joinedAt;

    public enum ParticipantRole {
        MEMBER,
        ADMIN
    }

    @PrePersist
    protected void onCreate() {
        if (role == null)
            role = ParticipantRole.MEMBER;
        joinedAt = Instant.now();
    }

}
