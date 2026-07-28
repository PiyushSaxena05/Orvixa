package com.Orvixa.Orvixa.service;

import com.Orvixa.Orvixa.model.Transaction;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class TransactionBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;

    public TransactionBroadcaster(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcast(Transaction transaction) {
        String destination = "/topic/transactions/" + transaction.getUserId();
        messagingTemplate.convertAndSend(destination, transaction);
    }
}