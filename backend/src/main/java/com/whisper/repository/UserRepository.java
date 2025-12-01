package com.whisper.repository;

import com.whisper.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    Optional<User> findByPhoneNumber(String phoneNumber);
    boolean existsByEmail(String email);
    boolean existsByPhoneNumber(String phoneNumber);

    @Query("SELECT u FROM User u WHERE u.displayName LIKE %:query% AND u.id != :excludeUserId")
    List<User> searchByDisplayName(
            @Param("query") String query,
            @Param("excludeUserId") Long excludeUserId,
            Pageable pageable);

}
