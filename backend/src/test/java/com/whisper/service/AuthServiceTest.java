package com.whisper.service;

import com.whisper.dto.auth.AuthResponse;
import com.whisper.dto.auth.RegisterRequest;
import com.whisper.entity.User;
import com.whisper.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private User savedUser;

    @BeforeEach
    void setUp() {
        registerRequest = RegisterRequest.builder()
                .displayName("Test User")
                .email("test@example.com")
                .password("passwd123")
                .build();

        savedUser = new User();
        savedUser.setId(1L);
        savedUser.setDisplayName("Test User");
        savedUser.setEmail("test@example.com");
        savedUser.setPassword("hashed_passwd123");
    }

    @Test
    void whenRegisterWithNewUser_thenReturnsAuthResponse() {
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("hashed_passwd123");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtService.generateToken(savedUser)).thenReturn("test_token");

        AuthResponse res = authService.register(registerRequest);

        assertNotNull(res);
        assertEquals("test_token", res.getToken());
        assertEquals(1L, res.getUserId());

        verify(userRepository, times(1)).save(any(User.class));
        verify(passwordEncoder, times(1)).encode("passwd123");
    }

    @Test
    void whenRegisterWithExistingEmail_thenThrowsIllegalArgumentException() {
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> {
            authService.register(registerRequest);
        });

        verify(userRepository, never()).save(any(User.class));
    }

}
