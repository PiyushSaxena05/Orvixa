package com.Orvixa.Orvixa.service;


import com.Orvixa.Orvixa.model.Transaction;
import com.Orvixa.Orvixa.repository.TransactionRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
import com.Orvixa.Orvixa.model.TransactionStatus;

@Service
public class FraudDetectionService {

    private final ChatClient chatClient;
    private final TransactionRepository transactionRepository;

    public FraudDetectionService(ChatClient.Builder chatClientBuilder, TransactionRepository transactionRepository) {
        this.chatClient = chatClientBuilder.build();
        this.transactionRepository = transactionRepository;
    }
    public void analyzeFraud(Transaction transaction) {

        List<Transaction> history = transactionRepository
                .findTop10ByUserIdOrderByCreatedAtDesc(transaction.getUserId());

        String historyText = history.stream()
                .map(t -> "₹" + (t.getAmountInPaise() / 100.0))
                .collect(Collectors.joining(", "));

        String promptText = """
                You are a fraud detection assistant for a payment platform.

                User's recent transaction history (amounts only, for pattern reference):
                %s

                New transaction to evaluate:
                Amount: ₹%.2f
                Currency: %s

                Focus ONLY on whether the amount is unusually large compared to the
                user's typical spending pattern. Do NOT consider past failed/successful
                status as suspicious - failures can happen for many normal reasons
                (network issues, wrong OTP, etc.) and are not fraud indicators by themselves.

                Respond in EXACTLY this format (no extra text):
                SCORE: <a number between 0.0 and 1.0>
                REASON: <one short sentence explaining why, in plain English>
                """.formatted(historyText, transaction.getAmountInPaise() / 100.0, transaction.getCurrency());

        String aiResponse = chatClient.prompt()
                .user(promptText)
                .call()
                .content();

        parseAndApply(aiResponse, transaction);
    }

    private void parseAndApply(String aiResponse, Transaction transaction) {

        double score = 0.0;
        String reason = "Unable to analyze";

        try {
            String[] lines = aiResponse.split("\n");
            for (String line : lines) {
                if (line.startsWith("SCORE:")) {
                    score = Double.parseDouble(line.replace("SCORE:", "").trim());
                } else if (line.startsWith("REASON:")) {
                    reason = line.replace("REASON:", "").trim();
                }
            }
        } catch (Exception e) {
            reason = "AI response could not be parsed: " + aiResponse;
        }

        transaction.setFraudScore(score);
        transaction.setFraudExplanation(reason);

        if (score >= 0.7) {
            transaction.setStatus(TransactionStatus.FLAGGED);
        }

        transactionRepository.save(transaction);
    }
}
