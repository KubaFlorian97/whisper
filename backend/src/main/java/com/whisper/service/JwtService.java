package com.whisper.service;

import com.whisper.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    private final String jwtSecret;
    private final long jwtExpirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String jwtSecret,
            @Value("${app.jwt.expiration_ms}") long jwtExpirationMs) {
        this.jwtSecret = jwtSecret;
        this.jwtExpirationMs = jwtExpirationMs;
    }

    /**
     * Generuje JWT
     * @param user
     * @return String
     */
    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(Long.toString(user.getId()))
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Wyciaga id uzytkownika z tokenu
     * @param token
     * @return String
     */
    public String extractUserId(String token) {
        return extractClaims(token, Claims::getSubject);
    }

    /**
     * Sprawdza czy token nie jest uszkodzony
     * @param token
     * @param user
     * @return boolean
     */
    public boolean isTokenValid(String token, User user) {
        final String userId = extractUserId(token);
        return (userId.equals(user.getId().toString()) && !isTokenExpired(token));
    }

    /**
     * Sprawdza czy token nie wygasl
     * @param token
     * @return boolean
     */
    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Wyciaga date waznosci tokena
     * @param token
     * @return Date
     */
    private Date extractExpiration(String token) {
        return extractClaims(token, Claims::getExpiration);
    }

    /**
     * Wyciaga claims'y z tokena
     * @param token
     * @param claimsResolver
     * @return Claims
     * @param <T>
     */
    public <T> T extractClaims(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Wyciaga claims'y z tokena
     * @param token
     * @return Claims
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Zwraca klucz szyfrujacy
     * @return Key
     */
    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

}
