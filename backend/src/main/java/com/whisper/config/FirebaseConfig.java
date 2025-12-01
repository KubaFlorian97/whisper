package com.whisper.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.service-account.path}")
    private Resource serviceAccountResource;

    /**
     * Inicjalizacja Firebase
     * @return
     */
    @Bean
    public FirebaseApp firebaseApp() {
        try (InputStream serviceAccount = serviceAccountResource.getInputStream()) {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            FirebaseApp app = FirebaseApp.getApps().isEmpty()
                    ? FirebaseApp.initializeApp(options)
                    : FirebaseApp.getInstance();

            System.out.println("Firebase Application initialized correctly");
            return app;
        } catch (Exception e) {
            System.err.println("Failed to initialize FirebaseApp: " + e.getMessage());
            throw new RuntimeException("Cannot initialize Firebase", e);
        }
    }

    @Bean
    public FirebaseMessaging firebaseMessaging(FirebaseApp firebaseApp) {
        return FirebaseMessaging.getInstance(firebaseApp);
    }

}
