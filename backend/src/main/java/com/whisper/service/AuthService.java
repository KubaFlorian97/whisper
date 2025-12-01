package com.whisper.service;

import com.whisper.dto.auth.AuthResponse;
import com.whisper.dto.auth.LoginRequest;
import com.whisper.dto.auth.RegisterRequest;
import com.whisper.entity.User;
import com.whisper.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    /**
     * Rejestracja nowego uzytkownika
     * @param req
     * @return
     */
    public AuthResponse register(RegisterRequest req) {
        if (req.getEmail() != null && userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("User with email " + req.getEmail() + " already exists.");
        }
        if (req.getPhoneNumber() != null && userRepository.existsByPhoneNumber(req.getPhoneNumber())) {
            throw new IllegalArgumentException("User with phone number " + req.getPhoneNumber() + " already exists.");
        }
        if (req.getEmail() == null && req.getPhoneNumber() == null) {
            throw new IllegalArgumentException("You have to type email or phone number");
        }

        User user = new User();
        user.setDisplayName(req.getDisplayName());
        user.setEmail(req.getEmail());
        user.setPhoneNumber(req.getPhoneNumber());
        user.setPassword(passwordEncoder.encode(req.getPassword()));

        User savedUser = userRepository.save(user);
        String token = jwtService.generateToken(savedUser);

        return AuthResponse.builder()
                .token(token)
                .userId(savedUser.getId())
                .displayName(savedUser.getDisplayName())
                .build();
    }

    /**
     * Autoryzacja uzytkownika
     * @param req
     * @return
     */
    public AuthResponse login(LoginRequest req) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                req.getLoginIdentifier(),
                req.getPassword()
        ));

        User user = userRepository.findByEmail(req.getLoginIdentifier())
                .or(() -> userRepository.findByPhoneNumber(req.getLoginIdentifier()))
                .orElseThrow(() -> new IllegalArgumentException("Error during logging. User not found."));

        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .displayName(user.getDisplayName())
                .build();
    }

}
