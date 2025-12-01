package com.whisper.repository;

import com.whisper.entity.Chat;

public interface ChatProjection {

    Long getChatId();
    String getChatName();

    Chat.ChatType getChatType();

    Long getUserId();
    String getDisplayName();
    String getAvatarUrl();

}
