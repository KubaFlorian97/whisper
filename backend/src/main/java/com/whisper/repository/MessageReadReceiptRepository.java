package com.whisper.repository;

import com.whisper.entity.MessageReadReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface MessageReadReceiptRepository extends JpaRepository<MessageReadReceipt, Long> {

    boolean existsByMessageIdAndUserId(Long messageId, Long userId);

    @Query("SELECT r FROM MessageReadReceipt r WHERE r.message.id IN :messageIds")
    List<MessageReadReceipt> findByMessageIds(@Param("messageIds") Set<Long> messageIds);

}
