<div align="center">

# Orvixa

### Real-Time Payment Platform with Face Biometric Auth, Explainable AI Fraud Detection & Conversational Assistant

A learning project combining Razorpay payment integration, JWT + face-recognition authentication, a locally-hosted LLM for fraud analysis, retry guidance and Q&A over transaction history, and real-time WebSocket updates — built end-to-end with Spring Boot and React.

![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-brightgreen?logo=springboot)
![Spring Security](https://img.shields.io/badge/Spring%20Security-JWT-6DB33F?logo=springsecurity)
![face-api.js](https://img.shields.io/badge/Biometrics-face--api.js-purple)
![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react)
![H2 Database](https://img.shields.io/badge/H2-Database-blue?logo=h2)
![WebSocket](https://img.shields.io/badge/Realtime-WebSocket%20%2F%20STOMP-blue)
![Ollama](https://img.shields.io/badge/AI-Ollama%20(llama3.2)-black)
![Status](https://img.shields.io/badge/Status-Work%20in%20Progress-yellow)

</div>

---

## Overview

Orvixa is a payment platform that goes well beyond "payment succeeded" or "payment failed." Every registered user authenticates with a real email/password account (JWT-secured) **plus a face scan**, and can only ever see and act on their own transactions. Every **successful** transaction is passed to a locally-hosted LLM (via [Ollama](https://ollama.com)), which evaluates it against the user's recent transaction history and returns a plain-English fraud risk explanation — not just a numeric score. Every **failed** transaction gets an AI-generated, practical retry suggestion instead of a generic error message. Users can also **ask natural-language questions about their own payment history** and get an answer grounded in their real transaction data. Status changes are pushed to the frontend instantly over a WebSocket connection, with no polling involved.

This is an actively-developed, project-based learning build. The features below are grouped honestly into **what's built and working** and **what's planned next** — nothing here is overstated.

---

## Table of Contents

- [What's Actually Built](#whats-actually-built)
- [System Architecture](#system-architecture)
- [Auth Flow](#auth-flow)
- [Payment & AI Flow](#payment--ai-flow)
- [Tech Stack](#tech-stack)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Security Notes](#security-notes)
- [Roadmap](#roadmap)
- [Learning Outcomes](#learning-outcomes)
- [Demonstration](#demonstration)

---

## What's Actually Built

### 1. JWT Authentication (Spring Security)
- Real signup/login with `/api/auth/signup` and `/api/auth/login`. Passwords are hashed with **BCrypt** before storage — plaintext passwords are never persisted or logged.
- On successful signup/login, the backend issues a **JWT** signed with a server-side secret, containing the user's email and an expiry.
- A custom `JwtAuthFilter` runs on every request, validates the token's signature and expiry, and populates Spring Security's context — no server-side session storage (fully stateless).
- All payment and assistant endpoints are protected (`anyRequest().authenticated()`); only `/api/auth/**`, the WebSocket handshake, and the H2 console are public.
- **Critically:** `userId` is never trusted from the request body or URL anymore — every endpoint derives it from the verified JWT (`Authentication.getName()`), so one user can never create, view, or query another user's transactions, even by guessing IDs.

### 2. Face Biometric Authentication (face-api.js)
- On signup and login, the browser captures a live camera frame and extracts a 128-dimension face descriptor client-side using `face-api.js` (SSD MobileNet v1 for detection, plus landmark and recognition models).
- The descriptor — not a photo — is sent to the backend and compared server-side against the stored descriptor using Euclidean distance (`FaceMatchService`), never trusting a match verdict from the client.
- **Duplicate-identity protection:** on signup, the new descriptor is checked against every existing user's descriptor before an account is created. If it matches an existing user, signup is rejected — this closes a real gap where the same face could otherwise be registered under multiple email addresses, a pattern that enables bonus abuse or identity impersonation in real systems.
- This is a demonstration-level biometric layer, not bank-grade liveness detection (no anti-spoofing against a printed photo, for example) — documented here rather than overstated.

### 3. Razorpay Payment Integration (test mode)
- Backend creates a Razorpay order (`/api/payments/create-order`), persists a `Transaction` row immediately with status `CREATED`, tied to the authenticated user.
- Frontend opens Razorpay's Checkout popup using the returned order ID.
- On completion (or failure), the frontend sends the relevant `orderId` / `paymentId` / `signature` to `/api/payments/verify`.
- The backend **independently recomputes the HMAC-SHA256 signature** server-side using the Razorpay secret key and compares it — a payment is only ever marked `SUCCESS` if this matches. The client's word alone is never trusted.

### 4. AI Fraud Detection (Ollama, running locally)
- On every `SUCCESS` transaction, the backend pulls the user's last 10 transactions and builds a prompt describing the new transaction's amount against that history.
- The prompt is sent to a **locally-running Ollama model (`llama3.2`)** — no external API key, no data leaving the machine.
- The model returns a risk score (0.0–1.0) and a one-line plain-English explanation, which are parsed and stored on the transaction (`fraudScore`, `fraudExplanation`).
- If the score crosses a threshold (0.6), the transaction status is overwritten to `FLAGGED`.

Example stored explanation:
```
FLAGGED — This amount is significantly higher than the user's typical
spending pattern and occurred outside their usual activity hours.
```

### 5. AI Retry Advisor (Ollama, running locally)
- On every `FAILED` transaction, the backend checks the user's recent failure history and sends it, along with the failed amount, to the same local Ollama model.
- The model returns **one short, practical suggestion** (e.g. *"Try again after a few minutes or contact your bank"*) instead of a generic "Payment Failed" message.
- Stored on the transaction as `retrySuggestion` and pushed to the frontend in real time, same as fraud flags.

### 6. Conversational Assistant (RAG over transaction history)
- A dedicated `/api/assistant/ask` endpoint accepts a natural-language question; the user is identified via JWT, not a client-supplied ID.
- The backend **retrieves** that user's full transaction history and computes accurate summary facts (total transactions, success count, failure count) in Java — not left to the model to calculate.
- Both the raw history and the pre-computed facts are injected into a prompt (retrieval-augmented generation), explicitly instructing the model to answer only from the provided data and to say so honestly if it can't — verified in practice: when asked about data outside the provided context, the model correctly declined rather than guessing.
- Exposed in the frontend as a simple chat widget (`AssistantChat.jsx`) with optimistic UI updates and a "Thinking..." state while waiting on the model.

### 7. Real-Time Updates (WebSocket / STOMP)
- Spring's STOMP-over-WebSocket broker (`/ws` endpoint) broadcasts every transaction state change to a per-user topic: `/topic/transactions/{userEmail}`.
- The React frontend subscribes on load and merges incoming updates into its transaction list live — no polling, no manual refresh. A transaction visibly moves `CREATED → SUCCESS → FLAGGED` (or `CREATED → FAILED`, with a retry tip) in real time.
- CORS is configured with `allowCredentials(true)` so the SockJS/STOMP handshake — which sends credentials — isn't blocked, alongside origin-restricted access for regular REST calls.

### 8. Transaction Persistence
- Every transaction (order ID, payment ID, amount, currency, owning user, status, fraud score, fraud explanation, retry suggestion, timestamps) is stored in an embedded H2 database — zero external setup required.

### 9. Frontend Polish
- A real login/signup screen — with face capture — gates the app; the JWT is kept in `localStorage` and attached to every API call.
- Loading and empty states for the transaction list (no more blank screens while history is fetching or before a user's first payment).
- Client-side amount validation and inline error messages on the payment form, instead of silent console-only failures.

---

## System Architecture

```
        React (Vite) Frontend
                │
     REST (fetch, JWT header)   │   WebSocket (STOMP)
                │
                ▼
        Spring Boot Backend
                │
      JwtAuthFilter → SecurityContext
                │
   ┌────────────┼─────────────┬─────────────┐
   ▼            ▼             ▼             ▼
Razorpay    H2 Database    Ollama (LLM)  FaceMatchService
   │            │             │             │
   └─────┬──────┴──────┬──────┴──────┬──────┘
         ▼             ▼              ▼
  PaymentService   FraudDetectionService  AuthController
         │          RetryAdvisorService
         │          AssistantService (RAG)
         ▼
  TransactionBroadcaster (WebSocket push)
         │
         ▼
   Frontend updates live
```

Backend layering:
```
JwtAuthFilter → Controller → Service → Repository → H2 Database
                    │
                    ├──→ FraudDetectionService  →  Ollama   (on SUCCESS)
                    ├──→ RetryAdvisorService     →  Ollama   (on FAILED)
                    ├──→ AssistantService        →  Ollama   (on user question, RAG)
                    ├──→ FaceMatchService        →  Euclidean distance (on signup/login)
                    └──→ TransactionBroadcaster  →  WebSocket
```

---

## Auth Flow

```
POST /api/auth/signup {email, password, fullName, faceDescriptor}
        │
        ▼
Check: does this email already exist? → reject if so
        │
        ▼
Check: does this face descriptor match any existing user? → reject if so
        │
        ▼
Password hashed (BCrypt) → User + face descriptor saved → JWT issued
        │
        ▼
Frontend stores JWT in localStorage


POST /api/auth/login {email, password, faceDescriptor}
        │
        ▼
Password verified (BCrypt) → Face descriptor compared (Euclidean distance)
        │
        ▼
Both match → JWT issued


Every subsequent request:
Authorization: Bearer <token>
        │
        ▼
JwtAuthFilter validates signature + expiry
        │
        ▼
SecurityContext populated with user's email
        │
        ▼
Controller uses Authentication.getName() as the userId —
never a client-supplied value
```

---

## Payment & AI Flow

```
User submits amount (while authenticated)
        │
        ▼
POST /create-order  →  userId taken from JWT  →  Razorpay order created  →  Transaction saved (CREATED)
        │                                                                        │
        ▼                                                              WebSocket broadcast
Razorpay Checkout popup (test card / netbanking)
        │
        ▼
POST /verify  →  HMAC-SHA256 signature recomputed & compared
        │
        ├── mismatch/declined → status FAILED → broadcast
        │                             │
        │                             ▼
        │                   RetryAdvisorService.adviseOnFailure()
        │                             │
        │                   Ollama suggests next step
        │                             │
        │                   retrySuggestion saved → broadcast
        │
        └── match → status SUCCESS → broadcast
                        │
                        ▼
              FraudDetectionService.analyzeFraud()
                        │
              Ollama scores + explains
                        │
              score ≥ 0.6 → status FLAGGED → broadcast


Anytime: User asks a question in the chat widget
        │
        ▼
POST /api/assistant/ask (JWT)  →  fetch full history + compute facts (Java)
        │
        ▼
Prompt built (history + facts + question)  →  Ollama
        │
        ▼
Grounded natural-language answer returned
```

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Backend | Java 21, Spring Boot 3.5, Spring Security, Spring Data JPA, Spring WebSocket (STOMP), Maven |
| Auth | Spring Security, BCrypt, JJWT (`jjwt-api`/`impl`/`jackson`) |
| Biometrics | face-api.js (SSD MobileNet v1, 68-point landmarks, face recognition net), browser MediaDevices API |
| Frontend | React (Vite), Tailwind CSS, sockjs-client, @stomp/stompjs |
| AI | Spring AI, Ollama (`llama3.2`) — local inference, no external API key |
| Database | H2 (embedded, file-based) |
| Payments | Razorpay (test mode), `razorpay-java` SDK |
| Tooling | IntelliJ IDEA, Postman, Git/GitHub |

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Creates an account (email, password, face descriptor), rejects duplicate email or duplicate face, returns a JWT |
| POST | `/api/auth/login` | Public | Verifies credentials and face match, returns a JWT |
| POST | `/api/payments/create-order` | JWT required | Creates a Razorpay order for the authenticated user |
| POST | `/api/payments/verify` | JWT required | Verifies payment signature, updates status, triggers AI fraud check or retry advice |
| GET | `/api/payments/history` | JWT required | Returns the authenticated user's full transaction history |
| POST | `/api/assistant/ask` | JWT required | Answers a natural-language question about the authenticated user's history (RAG) |
| WS | `/ws` (STOMP topic `/topic/transactions/{email}`) | Public handshake | Live transaction status push |

---

## Project Structure

```
Orvixa (backend)
└── src/main/java/com/Orvixa/Orvixa
    ├── config          # RazorpayConfig, WebSocketConfig, CorsConfig,
    │                     # SecurityConfig, JwtAuthFilter
    ├── controller       # PaymentController, AssistantController,
    │                     # AuthController, GlobalExceptionHandler
    ├── service          # PaymentService, FraudDetectionService,
    │                     # RetryAdvisorService, AssistantService,
    │                     # JwtService, FaceMatchService, TransactionBroadcaster
    ├── repository        # TransactionRepository, UserRepository
    ├── model              # Transaction, TransactionStatus, User
    └── dto                 # CreateOrderRequest/Response, PaymentVerificationRequest,
                              # ChatRequest, ChatResponse, SignupRequest, LoginRequest, AuthResponse

Orvixa-Frontend
└── src
    ├── components
    │   ├── Header.jsx
    │   ├── Login.jsx
    │   ├── FaceCapture.jsx
    │   ├── PaymentForm.jsx
    │   ├── TransactionCard.jsx
    │   ├── StatusBadge.jsx
    │   └── AssistantChat.jsx
    ├── App.jsx           # auth gate, fetches history, subscribes to WebSocket, renders list + chat
    └── main.jsx

public/models/            # face-api.js model weights (ssd_mobilenetv1, landmarks, recognition)
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
- A webcam (for face capture during signup/login)

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

Frontend runs on `http://localhost:5173` (Vite default). Download the `face-api.js` model weights (`ssd_mobilenetv1`, `face_landmark_68_model`, `face_recognition_model`) into `public/models/` before running — the app fetches them from there at runtime. Sign up for a new account on first load, completing the face scan step — there's no seeded/demo user.

### Ollama

Make sure Ollama is running before testing a payment or asking the assistant a question:

```bash
ollama serve
```

---

## Environment Variables

Backend (`application.properties`), values sourced from real environment variables where sensitive — never hardcoded for secrets that leave your machine:

```properties
razorpay.key-id=${RAZORPAY_KEY_ID}
razorpay.key-secret=${RAZORPAY_KEY_SECRET}

jwt.secret=<a long random string, 32+ chars — generate your own, never reuse this repo's>

spring.ai.ollama.base-url=http://localhost:11434
spring.ai.ollama.chat.options.model=llama3.2
spring.ai.ollama.chat.options.temperature=0.3
```

`RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set as environment variables (IntelliJ Run Configuration or shell export) — **never committed**. `jwt.secret` should also be rotated/externalized before any real deployment; it's kept in properties here only for local learning convenience.

---

## Security Notes

- Payment signatures are verified **server-side only**, via HMAC-SHA256, before a transaction is ever marked `SUCCESS`. The client's claim is never trusted directly.
- Razorpay secret key never leaves the backend; only the public key ID is returned to the frontend.
- Passwords are hashed with BCrypt before storage; plaintext passwords are never persisted.
- Face descriptors (not photos) are stored and compared server-side; a login or signup verdict is never trusted from the client.
- Signup checks the new face descriptor against every existing user before account creation, preventing the same face from being registered under multiple accounts — a real gap identified and closed during development.
- Authentication is stateless JWT (24-hour expiry) validated on every request by a custom filter — no server-side session store.
- **Every** endpoint that touches transaction data derives `userId` from the verified JWT, never from client input.
- CORS explicitly allows credentials for the WebSocket handshake while remaining scoped to known local frontend origins.
- **Not yet hardened for production:** the JWT secret lives in `application.properties` rather than a secrets manager, there's no refresh-token flow, the face-match check is O(n) against all users (fine at small scale, not at real scale), there's no liveness/anti-spoofing detection, and the H2 console is left open for local development — all fine for a learning build, not for real users or real money.

---

## Roadmap

Planned next, in order:

- [ ] **Email OTP** — an additional verification step at signup/login, sent via email (free) rather than SMS (which requires a paid provider like Twilio).
- [ ] **Deployment** — frontend on Netlify/Vercel (auto-deploy on push), backend on Render/Railway. Note: the AI features depend on a locally-running Ollama instance, which isn't practical on free-tier cloud hosting — production AI calls would need to move to a hosted LLM API (e.g. Groq's free tier) while local development keeps using Ollama.
- [ ] **AI spend insights** — natural-language weekly/monthly spending summaries generated from transaction history.
- [ ] **Production-grade database** — migrate from embedded H2 to PostgreSQL.
- [ ] **Refresh tokens** — replace the current "just re-login after 24h" expiry model.
- [ ] **Polished frontend** — dashboard view, transaction filtering/search.

---

## Learning Outcomes

- Building real authentication from scratch: password hashing (BCrypt), stateless JWT issuing/validation, and wiring a custom `Authentication` filter into Spring Security's chain
- Recognizing and fixing an authorization gap (client-supplied `userId`) after noticing it — and understanding *why* trusting client-provided identity is unsafe
- Implementing client-side biometric capture (face-api.js) with server-side verification, and identifying and closing a duplicate-identity gap (same face, multiple accounts) before it shipped
- Debugging real-world browser/ML issues methodically: camera lifecycle timing in React, model confidence thresholds, and distinguishing benign framework noise (React Strict Mode's `AbortError`) from actual bugs
- Payment gateway integration (Razorpay) with server-side signature verification
- Applying a local LLM (Ollama + Spring AI) to real, structured use cases: fraud scoring, retry guidance, and retrieval-augmented Q&A — rather than open-ended chat
- Recognizing and working around small-model limitations (e.g. offloading counting/arithmetic to Java rather than trusting the LLM to calculate)
- Spring Boot fundamentals: dependency injection, layered architecture, Spring Data JPA
- Real-time client-server communication with STOMP over WebSocket, including credentialed CORS for the handshake
- Full-stack integration between a Spring Boot backend and a React (Vite) frontend, including token-based auth on both sides

---

## Demonstration

https://github.com/user-attachments/assets/10789a04-a9e0-4a7f-9290-b78e5669f2f0

---
