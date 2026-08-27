package com.Orvixa.Orvixa.controller;

import com.Orvixa.Orvixa.dto.ChatRequest;
import com.Orvixa.Orvixa.dto.ChatResponse;
import com.Orvixa.Orvixa.service.AssistantService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    private final AssistantService assistantService;

    public AssistantController(AssistantService assistantService) {
        this.assistantService = assistantService;
    }

    @PostMapping("/ask")
    public ResponseEntity<ChatResponse> ask(@RequestBody ChatRequest request, Authentication authentication) {
        String answer = assistantService.answerQuestion(authentication.getName(), request.getQuestion());
        return ResponseEntity.ok(new ChatResponse(answer));
    }
}