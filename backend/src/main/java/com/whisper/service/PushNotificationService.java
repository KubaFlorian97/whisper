package com.whisper.service;

import com.google.firebase.messaging.*;
import com.whisper.entity.Chat;
import com.whisper.entity.Message;
import com.whisper.entity.UserDevice;
import com.whisper.repository.UserDeviceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PushNotificationService {

    private final FirebaseMessaging fcm;
    private final UserDeviceRepository userDeviceRepository;

    public void sendNotificationToUser(Long recipientId, Message message) {
        List<String> tokens = userDeviceRepository.findByUserId(recipientId).stream()
                .map(UserDevice::getFcmToken)
                .toList();

        if (tokens.isEmpty()) {
            System.out.println("No FCM devices for user: " + recipientId);
            return;
        }

        String title;
        String body;

        if (message.getChat().getType() == Chat.ChatType.PRIVATE) {
            title = message.getSender().getDisplayName();
        } else {
            title = message.getChat().getName();
        }

        body = switch (message.getType()) {
            case TEXT ->
                //body = message.getContent();
                    "Nowa wiadomość tekstowa";
            case IMAGE -> "Obraz";
            case SYSTEM -> message.getContent();
            default -> "Nowa wiadomość";
        };

        Notification notification = Notification.builder()
                .setTitle(title)
                .setBody(body)
                .build();

        MulticastMessage multicastMessage = MulticastMessage.builder()
                .setNotification(notification)
                .putData("chatId", message.getChat().getId().toString())
                .addAllTokens(tokens)
                .build();

        try {
            BatchResponse res = fcm.sendEachForMulticast(multicastMessage);
            System.out.println("Notifications sent, success: " + res.getSuccessCount());

            if (res.getFailureCount() > 0) {
                handleFailedTokens(res.getResponses(), tokens);
            }
        } catch (FirebaseMessagingException e) {
            System.err.println("Failed to send FCM notifications: " + e.getMessage());
        }
    }

    private void handleFailedTokens(List<SendResponse> responses, List<String> tokens) {
        for (int i = 0; i < responses.size(); i++) {
            if (!responses.get(i).isSuccessful()) {
                String failedToken = tokens.get(i);
                String errorCode = responses.get(i).getException().getMessagingErrorCode().name();

                if ("UNREGISTERED".equals(errorCode) || "INVALID_ARGUMENT".equals(errorCode)) {
                    userDeviceRepository.findByFcmToken(failedToken).ifPresent(device -> {
                        System.out.println("Deleting expired FCM token: " + failedToken);
                        userDeviceRepository.delete(device);
                    });
                }
            }
        }
    }

}
