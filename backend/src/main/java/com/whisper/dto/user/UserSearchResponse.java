package com.whisper.dto.user;

import com.whisper.entity.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserSearchResponse {

    private Long userId;
    private String displayName;
    private String avatarUrl;

    public static UserSearchResponse fromEntity(User user) {
        return UserSearchResponse.builder()
                .userId(user.getId())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

}
