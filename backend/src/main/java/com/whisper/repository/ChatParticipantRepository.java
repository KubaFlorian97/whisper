package com.whisper.repository;

import com.whisper.entity.ChatParticipant;
import com.whisper.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, Long> {

    List<ChatParticipant> findByUser(User user);
    List<ChatParticipant> findByChatId(Long chatId);
    boolean existsByUserAndChatId(User user, Long chatId);
    Optional<ChatParticipant> findByChatIdAndUserId(Long chatId, Long userId);
    List<ChatParticipant> findByUser_Id(Long userId);

}
