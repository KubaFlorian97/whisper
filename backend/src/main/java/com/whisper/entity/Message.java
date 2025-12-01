package com.whisper.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name = "messages")
@Data
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id", nullable = false)
    private Chat chat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Enumerated(EnumType.STRING)
    private MessageType type;

    @Column(columnDefinition = "TEXT")
    private String content;

    private Instant timestamp;

    public enum MessageType {
        TEXT,
        IMAGE,
        VIDEO,
        VOICE,
        FILE,
        SYSTEM
    }

    @PrePersist
    protected void onCreate() {
        timestamp = Instant.now();
    }

}
