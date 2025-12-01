package com.whisper.repository;

import com.whisper.entity.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatRepository  extends JpaRepository<Chat, Long> {

    @Query("SELECT DISTINCT c FROM Chat c " +
            "JOIN FETCH c.participants p " +
            "JOIN FETCH p.user u " +
            "WHERE c.id IN (SELECT cp.chat.id FROM ChatParticipant cp WHERE cp.user.id = :userId)")
    List<Chat> findChatsByUserId(@Param("userId") Long userId);

    @Query("SELECT " +
            "c.id as chatId, " +
            "c.name as chatName, " +
            "c.type as chatType, " +
            "u.id as userId, " +
            "u.displayName as displayName, " +
            "u.avatarUrl as avatarUrl " +
            "FROM ChatParticipant cp " +
            "JOIN cp.chat c " +
            "JOIN c.participants cp2 " +
            "JOIN cp2.user u " +
            "WHERE cp.user.id = :myUserId")
    List<ChatProjection> findChatProjectionsByUserId(@Param("myUserId") Long myUserId);

}
