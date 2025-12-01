package com.whisper.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "message_read_receipts",
        uniqueConstraints = {
            @UniqueConstraint(columnNames = {"message_id", "user_id"})
        })
@Data
@NoArgsConstructor
public class MessageReadReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Instant readAt;

    public MessageReadReceipt(Message message, User user) {
        this.message = message;
        this.user = user;
    }

    @PrePersist
    protected void onCreate() {
        readAt = Instant.now();
    }

}
