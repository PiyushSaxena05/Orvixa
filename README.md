<div align="center">

# Orvixa

### Real-Time Payment Platform with Explainable AI Fraud Detection

A learning project combining Razorpay payment integration, a locally-hosted LLM for fraud analysis, and real-time WebSocket updates — built end-to-end with Spring Boot and React.

![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.x-brightgreen?logo=springboot)
![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react)
![H2 Database](https://img.shields.io/badge/H2-Database-blue?logo=h2)
![WebSocket](https://img.shields.io/badge/Realtime-WebSocket%20%2F%20STOMP-blue)
![Ollama](https://img.shields.io/badge/AI-Ollama%20(llama3.2)-black)
![Status](https://img.shields.io/badge/Status-Work%20in%20Progress-yellow)

</div>

---

## Overview

Orvixa is a payment platform that goes one step beyond "payment succeeded." Every successful transaction is passed to a locally-hosted LLM (via [Ollama](https://ollama.com)), which evaluates it against the user's recent transaction history and returns a plain-English fraud risk explanation — not just a numeric score. Status changes (order created, payment verified, fraud flagged) are pushed to the frontend instantly over a WebSocket connection, with no polling involved.

This is an actively-developed, project-based learning build. The features below are grouped honestly into **what's built and working** and **what's planned next** — nothing here is overstated.

---

## Table of Contents

- [What's Actually Built](#whats-actually-built)
- [System Architecture](#system-architecture)
- [Payment & Fraud-Check Flow](#payment--fraud-check-flow)
- [Tech Stack](#tech-stack)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Security Notes](#security-notes)
- [Roadmap](#roadmap)
- [Learning Outcomes](#learning-outcomes)

---

## What's Actually Built

### 1. Razorpay Payment Integration (test mode)
- Backend creates a Razorpay order (`/api/payments/create-order`), persists a `Transaction` row immediately with status `CREATED`.
- Frontend opens Razorpay's Checkout popup using the returned order ID.
- On completion, the frontend sends the returned `orderId` / `paymentId` / `signature` to `/api/payments/verify`.
- The backend **independently recomputes the HMAC-SHA256 signature** server-side using the Razorpay secret key and compares it — a payment is only ever marked `SUCCESS` if this matches. The client's word alone is never trusted.

### 2. AI Fraud Detection (Ollama, running locally)
- On every `SUCCESS` transaction, the backend pulls the user's last 10 transactions and builds a prompt describing the new transaction's amount against that history.
- The prompt is sent to a **locally-running Ollama model (`llama3.2`)** — no external API key, no data leaving the machine.
- The model returns a risk score (0.0–1.0) and a one-line plain-English explanation, which are parsed and stored on the transaction (`fraudScore`, `fraudExplanation`).
- If the score crosses a threshold (0.6), the transaction status is overwritten to `FLAGGED`.

Example stored explanation:
```
FLAGGED — This amount is significantly higher than the user's typical
spending pattern and occurred outside their usual activity hours.
```

### 3. Real-Time Updates (WebSocket / STOMP)
- Spring's STOMP-over-WebSocket broker (`/ws` endpoint) broadcasts every transaction state change to a per-user topic: `/topic/transactions/{userId}`.
- The React frontend subscribes on load and merges incoming updates into its transaction list live — no polling, no manual refresh. A transaction visibly moves `CREATED → SUCCESS → FLAGGED` (if applicable) in real time.

### 4. Transaction Persistence
- Every transaction (order ID, payment ID, amount, currency, user, status, fraud score, fraud explanation, timestamps) is stored in an embedded H2 database — zero external setup required.

### 5. CORS Configuration
- `/api/**` explicitly allows the local Vite dev origin, since frontend and backend run on different ports during development.

---

## System Architecture

```
        React (Vite) Frontend
                │
     REST (fetch)   │   WebSocket (STOMP)
                │
                ▼
        Spring Boot Backend
                │
   ┌────────────┼─────────────┐
   ▼            ▼             ▼
Razorpay    H2 Database    Ollama (local LLM)
   │            │             │
   └─────┬──────┴──────┬──────┘
         ▼             ▼
  PaymentService  FraudDetectionService
         │
         ▼
  TransactionBroadcaster (WebSocket push)
         │
         ▼
   Frontend updates live
```

Backend layering:
```
Controller  →  Service  →  Repository  →  H2 Database
                  │
                  └──→ FraudDetectionService  →  Ollama
                  └──→ TransactionBroadcaster  →  WebSocket
```

---

## Payment & Fraud-Check Flow

```
User submits amount
        │
        ▼
POST /create-order  →  Razorpay order created  →  Transaction saved (CREATED)
        │                                              │
        ▼                                    WebSocket broadcast
Razorpay Checkout popup (test card / UPI)
        │
        ▼
POST /verify  →  HMAC-SHA256 signature recomputed & compared
        │
        ├── mismatch → status FAILED → broadcast
        │
        └── match → status SUCCESS → broadcast
                        │
                        ▼
              FraudDetectionService.analyzeFraud()
                        │
              Ollama scores + explains
                        │
              score ≥ 0.6 → status FLAGGED → broadcast
```

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Backend | Java 21, Spring Boot, Spring Data JPA, Spring WebSocket (STOMP), Maven |
| Frontend | React (Vite), Tailwind CSS, sockjs-client, @stomp/stompjs |
| AI | Spring AI, Ollama (`llama3.2`) — local inference, no external API key |
| Database | H2 (embedded, file-based) |
| Payments | Razorpay (test mode), `razorpay-java` SDK |
| Tooling | IntelliJ IDEA, Postman, Git/GitHub |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/payments/create-order` | Creates a Razorpay order, persists a `CREATED` transaction |
| POST | `/api/payments/verify` | Verifies payment signature, updates status, triggers AI fraud check |
| GET | `/api/payments/history/{userId}` | Returns a user's full transaction history, latest first |
| WS | `/ws` (STOMP topic `/topic/transactions/{userId}`) | Live transaction status push |

> No authentication currently sits in front of these endpoints — see [Roadmap](#roadmap).

---

## Project Structure

```
Orvixa (backend)
└── src/main/java/com/Orvixa/Orvixa
    ├── config          # RazorpayConfig, WebSocketConfig, CorsConfig
    ├── controller       # PaymentController, GlobalExceptionHandler
    ├── service          # PaymentService, FraudDetectionService, TransactionBroadcaster
    ├── repository        # TransactionRepository (Spring Data JPA)
    ├── model              # Transaction, TransactionStatus
    └── dto                 # CreateOrderRequest/Response, PaymentVerificationRequest

Orvixa-Frontend
└── src
    ├── components
    │   ├── Header.jsx
    │   ├── PaymentForm.jsx
    │   ├── TransactionCard.jsx
    │   └── StatusBadge.jsx
    ├── App.jsx           # fetches history, subscribes to WebSocket, renders list
    └── main.jsx
```

---

## Getting Started

### Prerequisites
- Java 21+ and Maven
- Node.js 18+
- [Ollama](https://ollama.com) installed locally, with `llama3.2` pulled:
  ```bash
  ollama pull llama3.2
  ```
- A free [Razorpay](https://dashboard.razorpay.com/signup) test-mode account (Key ID + Key Secret)

### Backend

```bash
cd Orvixa
# Set these as environment variables (IntelliJ Run Config, or shell export)
# RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
# RAZORPAY_KEY_SECRET=xxxxxxxxxxxx
mvn spring-boot:run
```

Backend runs on `http://localhost:8080`. H2 console (dev only): `http://localhost:8080/h2-console`
JDBC URL: `jdbc:h2:file:./data/orvixa` · user: `sa` · password: *(blank)*

### Frontend

```bash
cd Orvixa-Frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` (Vite default).

### Ollama

Make sure Ollama is running before testing a payment (fraud analysis will fail silently/slowly otherwise):

```bash
ollama serve
```

---

## Environment Variables

Backend (`application.properties`), values sourced from real environment variables — never hardcoded:

```properties
razorpay.key-id=${RAZORPAY_KEY_ID}
razorpay.key-secret=${RAZORPAY_KEY_SECRET}

spring.ai.ollama.base-url=http://localhost:11434
spring.ai.ollama.chat.options.model=llama3.2
spring.ai.ollama.chat.options.temperature=0.3
```

`RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set as environment variables (IntelliJ Run Configuration or shell export) — **never committed**.

---

## Security Notes

- Payment signatures are verified **server-side only**, via HMAC-SHA256, before a transaction is ever marked `SUCCESS`. The client's claim is never trusted directly.
- Razorpay secret key never leaves the backend; only the public key ID is returned to the frontend.
- CORS is scoped to `/api/**` and restricted to the known local frontend origin.
- **Not yet implemented:** user authentication/authorization (see Roadmap) — currently `userId` is passed directly by the client, which is fine for a local learning build but would need real auth (e.g. JWT + login) before this touches real users or real money.

---

## Roadmap

Planned next, in order:

- [ ] **Smart retry / routing** — on a `FAILED` payment, suggest next steps to the user based on their actual failure history, instead of a generic error.
- [ ] **Conversational assistant (RAG)** — let a user ask natural-language questions about their own transaction history ("why did my payment fail last week").
- [ ] **AI spend insights** — natural-language weekly/monthly spending summaries generated from transaction history.
- [ ] **Authentication** — real login + JWT, replacing the current hardcoded `userId`.
- [ ] **Production-grade database** — migrate from embedded H2 to PostgreSQL.
- [ ] **Polished frontend** — dashboard view, transaction filtering/search.

---

## Learning Outcomes

- Payment gateway integration (Razorpay) with server-side signature verification
- Applying a local LLM (Ollama + Spring AI) to a real, structured use case rather than open-ended chat
- Spring Boot fundamentals: dependency injection, layered architecture, Spring Data JPA
- Real-time client-server communication with STOMP over WebSocket
- CORS and cross-origin frontend/backend integration
- Full-stack integration between a Spring Boot backend and a React (Vite) frontend

SCREENSHOTS

<img width="1115" height="395" alt="Screenshot 2026-07-28 173731" src="https://github.com/user-attachments/assets/cdb0a4ea-b6c8-484e-bc89-e8f8b183a9be" />


<img width="709" height="572" alt="Screenshot 2026-07-28 173748" src="https://github.com/user-attachments/assets/b35f20f9-b5bc-4454-bd72-f8ef2e2a6c5e" />


<img width="496" height="372" alt="Screenshot 2026-07-28 173852" src="https://github.com/user-attachments/assets/8b74a164-84d1-4db1-9a2b-5d900408cd64" />


<img width="1164" height="67" alt="Screenshot 2026-07-28 174012" src="https://github.com/user-attachments/assets/04507b81-a98f-445f-9e3a-29cbe82d22fd" />


<img width="491" height="424" alt="Screenshot 2026-07-28 174141" src="https://github.com/user-attachments/assets/5765371b-97f2-49dd-ac3b-83a562e7ffef" />


<img width="528" height="388" alt="image" src="https://github.com/user-attachments/assets/7a9e9a67-244f-416f-9583-6487e5effe6d" />

