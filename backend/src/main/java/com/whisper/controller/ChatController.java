package com.whisper.controller;

import com.whisper.dto.chat.*;
import com.whisper.entity.User;
import com.whisper.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /**
     * Endpoint do tworzenia nowego czatu
     * @param req
     * @param currentUser
     * @return
     */
    @PostMapping
    public ResponseEntity<ChatResponse> createChat(
            @Valid @RequestBody CreateChatRequest req,
            @AuthenticationPrincipal User currentUser) {
        ChatResponse chat = chatService.createChat(req, currentUser);
        return ResponseEntity.ok(chat);
    }

    /**
     * Endopint zwracajacy liste czatow uzytkownika
     * @param currentUser
     * @return
     */
    @GetMapping
    public ResponseEntity<List<ChatResponse>> getUserChats(
            @AuthenticationPrincipal User currentUser) {
        List<ChatResponse> chats = chatService.getUserChats(currentUser);
        return ResponseEntity.ok(chats);
    }

    /**
     * Endpoint zwracajacy liste wiadomosci w czacie
     * @param chatId
     * @param currentUser
     * @param page
     * @param size
     * @return
     */
    @GetMapping("/{chatId}/messages")
    public ResponseEntity<Page<MessageResponse>> getChatMessages(
            @PathVariable Long chatId,
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
        Page<MessageResponse> messages = chatService.getChatMessages(chatId, currentUser, pageable);
        return ResponseEntity.ok(messages);
    }

    /**
     * Endpoint do aktualizacji nazwy grupy
     * @param chatId
     * @param req
     * @param currentUser
     * @return
     */
    @PutMapping("/{chatId}/name")
    public ResponseEntity<Void> updateGroupName(
            @PathVariable Long chatId,
            @Valid @RequestBody UpdateGroupNameRequest req,
            @AuthenticationPrincipal User currentUser) {
        try {
            chatService.updateGroupName(chatId, req.getNewName(), currentUser);
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Endpoint dodajacy uczestnika czatu
     * @param chatId
     * @param req
     * @param currentUser
     * @return
     */
    @PostMapping("/{chatId}/participants")
    public ResponseEntity<Void> addParticipant(
            @PathVariable Long chatId,
            @Valid @RequestBody GroupMembershipRequest req,
            @AuthenticationPrincipal User currentUser) {
        try {
            chatService.addParticipant(chatId, req.getUserId(), currentUser);
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Endpoint usuwajacy uczestnika czatu
     * @param chatId
     * @param userIdToRemove
     * @param currentUser
     * @return
     */
    @DeleteMapping("/{chatId}/participants/{userIdToRemove}")
    public ResponseEntity<Void> removeParticipant(
            @PathVariable Long chatId,
            @PathVariable Long userIdToRemove,
            @AuthenticationPrincipal User currentUser) {
        try {
            chatService.removeParticipant(chatId, userIdToRemove, currentUser);
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Endpoint do opuszczenia czatu grupowego
     * @param chatId
     * @param currentUser
     * @return
     */
    @PostMapping("/{chatId}/leave")
    public ResponseEntity<Void> leaveGroup(
            @PathVariable Long chatId,
            @AuthenticationPrincipal User currentUser) {
        try {
            chatService.leaveGroup(chatId, currentUser);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Endpoint zwracajacy statusy uzytkownikow
     * @param chatId
     * @param currentUser
     * @return
     */
    @GetMapping("/{chatId}/presence")
    public ResponseEntity<Map<Long, String>> getChatPresence(
            @PathVariable Long chatId,
            @AuthenticationPrincipal User currentUser) {
        try {
            Map<Long, String> presenceMap = chatService.getChatPresence(chatId, currentUser);
            return ResponseEntity.ok(presenceMap);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

}
