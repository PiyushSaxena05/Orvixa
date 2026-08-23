package com.Orvixa.Orvixa.service;

import com.Orvixa.Orvixa.model.Transaction;
import com.Orvixa.Orvixa.model.TransactionStatus;
import com.Orvixa.Orvixa.repository.TransactionRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RetryAdvisorService {

    private final ChatClient chatClient;
    private final TransactionRepository transactionRepository;
    private final TransactionBroadcaster broadcaster;

    public RetryAdvisorService(ChatClient.Builder chatClientBuilder,
                               TransactionRepository transactionRepository,
                               TransactionBroadcaster broadcaster) {
        this.chatClient = chatClientBuilder.build();
        this.transactionRepository = transactionRepository;
        this.broadcaster = broadcaster;
    }

    public void adviseOnFailure(Transaction transaction) {

        List<Transaction> recentFailures = transactionRepository
                .findTop10ByUserIdOrderByCreatedAtDesc(transaction.getUserId())
                .stream()
                .filter(t -> t.getStatus() == TransactionStatus.FAILED)
                .collect(Collectors.toList());

        String failureHistoryText = recentFailures.isEmpty()
                ? "No prior failed payments."
                : "Number of recent failed payments: " + recentFailures.size();

        String promptText = """
                You are a payment retry assistant for a payment platform.

                Context about this user:
                %s

                A payment just failed for amount ₹%.2f.

                Give ONE short, practical suggestion (max 20 words) for what the user
                should do next. Respond in EXACTLY this format:
                SUGGESTION: <your suggestion>
                """.formatted(failureHistoryText, transaction.getAmountInPaise() / 100.0);

        String aiResponse = chatClient.prompt()
                .user(promptText)
                .call()
                .content();

        String suggestion = aiResponse.replace("SUGGESTION:", "").trim();

        transaction.setRetrySuggestion(suggestion);
        transactionRepository.save(transaction);
        broadcaster.broadcast(transaction);
    }
}