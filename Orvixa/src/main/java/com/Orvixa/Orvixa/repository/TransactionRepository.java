package com.Orvixa.Orvixa.repository;

import com.Orvixa.Orvixa.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByRazorpayOrderId(String razorpayOrderId);

    List<Transaction> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Transaction> findTop10ByUserIdOrderByCreatedAtDesc(String userId);
}