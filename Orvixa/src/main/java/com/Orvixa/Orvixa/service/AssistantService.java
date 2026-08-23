package com.Orvixa.Orvixa.service;

import com.Orvixa.Orvixa.model.Transaction;
import com.Orvixa.Orvixa.model.TransactionStatus;
import com.Orvixa.Orvixa.repository.TransactionRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AssistantService {

    private final ChatClient chatClient;
    private final TransactionRepository transactionRepository;

    public AssistantService(ChatClient.Builder chatClientBuilder, TransactionRepository transactionRepository) {
        this.chatClient = chatClientBuilder.build();
        this.transactionRepository = transactionRepository;
    }

    public String answerQuestion(String userId, String question) {

        List<Transaction> history = transactionRepository.findByUserIdOrderByCreatedAtDesc(userId);

        String historyText = history.stream()
                .map(t -> String.format(
                        "Date: %s | Amount: ₹%.2f | Status: %s%s%s",
                        t.getCreatedAt(),
                        t.getAmountInPaise() / 100.0,
                        t.getStatus(),
                        t.getFraudExplanation() != null ? " | Fraud note: " + t.getFraudExplanation() : "",
                        t.getRetrySuggestion() != null ? " | Retry note: " + t.getRetrySuggestion() : ""
                ))
                .collect(Collectors.joining("\n"));

        if (historyText.isBlank()) {
            historyText = "No transactions found for this user.";
        }

        int transactionCount = history.size();

        long successCount = history.stream()
                .filter(t -> t.getStatus() == TransactionStatus.SUCCESS || t.getStatus() == TransactionStatus.FLAGGED)
                .count();

        long failedCount = history.stream()
                .filter(t -> t.getStatus() == TransactionStatus.FAILED)
                .count();

        String promptText = """
                You are a helpful payment assistant. Answer the user's question using
                the transaction history and facts provided below. If the history doesn't
                contain enough information to answer, say so honestly.

                Known facts (these are accurate — use them directly, do not recalculate):
                Total transactions: %d
                Successful/flagged transactions: %d
                Failed transactions: %d

                Transaction history:
                %s

                User's question: %s

                Give a short, direct answer (2-3 sentences max).
                """.formatted(transactionCount, successCount, failedCount, historyText, question);

        return chatClient.prompt()
                .user(promptText)
                .call()
                .content();
    }
}