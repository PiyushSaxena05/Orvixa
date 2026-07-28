<div align="center">

# Orvixa

### AI-Powered Payment Intelligence Platform

Secure payment processing combined with explainable AI fraud detection and real-time transaction intelligence.

![Java](https://img.shields.io/badge/Java-17-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen?logo=springboot)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![H2 Database](https://img.shields.io/badge/H2-Database-blue?logo=h2)
![WebSocket](https://img.shields.io/badge/Realtime-WebSocket-blue)
![Ollama](https://img.shields.io/badge/AI-Ollama%20LLM-black)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

</div>

---

## Overview

Orvixa is a full-stack payment intelligence platform that extends standard payment processing with a locally hosted LLM (via Ollama), integrated directly into the transaction lifecycle. Instead of producing a black-box fraud score, the system generates explainable, human-readable fraud analysis and streams live payment status to the client over WebSockets.

The project demonstrates production-oriented backend engineering practices: layered architecture, secure payment handling, real-time systems, and applied AI.

---

## Table of Contents

- [Why Orvixa](#why-orvixa)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Payment Workflow](#payment-workflow)
- [Tech Stack](#tech-stack)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Security](#security)
- [Learning Outcomes](#learning-outcomes)
- [Author](#author)

---

## Why Orvixa

Traditional payment gateways stop at "success" or "failure." Orvixa adds a reasoning layer on top of that.

| Traditional Flow | Orvixa Flow |
|---|---|
| Process payment, then done | Process payment, then AI explains the risk, then pushes it live to the user |
| Black-box fraud score | Human-readable, explainable fraud reasoning |
| Poll for status updates | Instant WebSocket push, zero polling overhead |

---

## Features

### Secure Payment Processing
Orvixa integrates end-to-end with Razorpay to handle the full payment lifecycle. The backend creates a Razorpay order, hands off to the checkout flow, and once payment completes, independently verifies the payment signature server-side before ever marking a transaction as successful. This prevents client-side tampering, since a request claiming "payment successful" is never trusted without cryptographic verification against Razorpay's signature. Every step, from order creation to final status, is exposed through stateless REST APIs so the frontend and backend stay fully decoupled.

### AI-Powered Fraud Detection
This is the core differentiator of the project. Instead of relying on a rules engine or a plain numeric fraud score, every completed transaction is passed to a locally hosted LLM (via Ollama) along with contextual data: transaction amount, the user's historical spending pattern, merchant history, time of transaction, and behavioral signals. The model reasons over this data and returns a structured, human-readable explanation of *why* a transaction looks risky, not just *that* it does.

SCREENSHOTS

<img width="1115" height="395" alt="Screenshot 2026-07-28 173731" src="https://github.com/user-attachments/assets/cdb0a4ea-b6c8-484e-bc89-e8f8b183a9be" />


<img width="709" height="572" alt="Screenshot 2026-07-28 173748" src="https://github.com/user-attachments/assets/b35f20f9-b5bc-4454-bd72-f8ef2e2a6c5e" />


<img width="496" height="372" alt="Screenshot 2026-07-28 173852" src="https://github.com/user-attachments/assets/8b74a164-84d1-4db1-9a2b-5d900408cd64" />


<img width="1164" height="67" alt="Screenshot 2026-07-28 174012" src="https://github.com/user-attachments/assets/04507b81-a98f-445f-9e3a-29cbe82d22fd" />


<img width="491" height="424" alt="Screenshot 2026-07-28 174141" src="https://github.com/user-attachments/assets/5765371b-97f2-49dd-ac3b-83a562e7ffef" />




```text
Fraud Risk: Medium

Reason
- Transaction amount is significantly higher than the user's average spending.
- Payment was initiated during an unusual hour.
- Merchant has not appeared in previous transactions.
```

Because the model runs locally through Ollama, transaction data never leaves the server, which matters a lot in a payments context where financial data is sensitive.

### Real-Time Payment Updates
Rather than making the frontend poll an endpoint every few seconds to check if a payment went through, Orvixa opens a persistent WebSocket connection (Spring WebSocket) between backend and frontend. The moment a payment status changes or fraud analysis completes, the update is pushed to the client instantly. This cuts unnecessary network calls, reduces server load under scale, and gives the user a checkout experience that feels instant rather than "refresh and check."

### AI Payment Intelligence
Beyond per-transaction fraud checks, the platform uses accumulated transaction history to surface broader insights, such as spending trends over time, recurring merchant behavior, and shifts in a user's typical activity. This turns raw transaction logs into something a user can actually act on, rather than just a list of past payments.

### Secure Authentication
Every sensitive endpoint, including payment creation, verification, and transaction history, sits behind JWT-based authentication. Combined with Razorpay's own signature verification and explicit CORS configuration, this ensures that only authenticated users can access their own data, and that requests can only originate from trusted frontend origins.

### Transaction Management
Every transaction is durably persisted, capturing the transaction ID, payment ID, user reference, amount, merchant, payment status, timestamp, computed fraud score, and the AI-generated explanation, all in one record. This gives a complete, queryable audit trail for every payment that ever passed through the system, which is essential for both debugging and future analytics.

### Modular Backend Architecture
The backend is intentionally split into distinct layers: Controller (handles HTTP), Service (business logic), Business Logic (fraud/AI orchestration), and Repository (data access). This separation means the fraud detection logic, payment logic, and data persistence can each evolve independently, be unit tested in isolation, and be swapped out (for example, replacing Ollama with a different model provider) without touching unrelated parts of the codebase.

---

## System Architecture

```
                         React + Tailwind CSS
                                  │
                        REST APIs  /  WebSocket
                                  │
                                  ▼
                       Spring Boot Backend
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
     Razorpay API            H2 Database              Ollama AI
          │                       │                       │
          └──────────────┬────────┴──────────────┬────────┘
                          ▼                        ▼
                  Payment Service          Fraud Detection Engine
                          │
                          ▼
                  WebSocket Notification
                          │
                          ▼
                     React Frontend
```

Layered backend:

```
Controller Layer  →  Service Layer  →  Business Logic  →  Repository Layer  →  H2 Database
```

---

## Payment Workflow

```
User Initiates Payment
        │
        ▼
Create Razorpay Order
        │
        ▼
Razorpay Checkout
        │
        ▼
Payment Success
        │
        ▼
Verify Payment Signature
        │
        ▼
Store Transaction (H2 Database)
        │
        ▼
AI Fraud Analysis (Ollama LLM)
        │
        ▼
Generate Explainable Fraud Report
        │
        ▼
Push Real-Time Update (WebSocket)
        │
        ▼
Frontend Receives Updated Status
```

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Backend | Java 17, Spring Boot, Spring Security, Spring Data JPA, Spring WebSocket, Maven |
| Frontend | React, Tailwind CSS |
| AI / ML | Ollama, Local LLM inference |
| Database | H2 Database |
| Payments | Razorpay |
| Security | JWT, CORS, Payment Signature Verification |
| Tooling | Git, GitHub, IntelliJ IDEA, Postman |

---

## API Reference

> Example endpoint shape — adjust to match actual controller routes.

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/payments/create-order` | Creates a Razorpay order | Required |
| POST | `/api/payments/verify` | Verifies payment signature and persists transaction | Required |
| GET | `/api/transactions` | Fetches authenticated user's transaction history | Required |
| GET | `/api/transactions/{id}` | Fetches a single transaction with fraud report | Required |
| GET | `/api/fraud/{transactionId}` | Returns AI-generated fraud explanation | Required |
| WS | `/ws/payments` | WebSocket channel for live payment/fraud updates | Required |

---

## Project Structure

```
Orvixa
├── backend
│   ├── controller     # REST endpoints
│   ├── service         # Business logic
│   ├── repository      # Data access (JPA)
│   ├── model            # Entities
│   ├── dto               # Request/response contracts
│   ├── config            # App & security config
│   ├── security          # JWT, filters
│   └── websocket         # Real-time messaging
│
├── frontend
│   ├── components
│   ├── pages
│   ├── services
│   ├── hooks
│   └── assets
│
└── README.md
```

---

## Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- No external database installation required (H2 runs embedded)
- Ollama running locally with a pulled model
- Razorpay test account (API key and secret)

### Clone the repository

```bash
git clone https://github.com/PiyushSaxena05/Orvixa.git
cd orvixa
```

### Backend

```bash
cd backend
mvn spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Create a `.env` (frontend) and `application.properties` / `application.yml` (backend) with:

```bash
# Database (H2)
DB_URL=jdbc:h2:file:./data/orvixa
DB_USERNAME=sa
DB_PASSWORD=your_db_password
H2_CONSOLE_ENABLED=true

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=3600000

# Ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3
```

Never commit real credentials. Use `.env.example` for reference and add `.env` to `.gitignore`.

> With `H2_CONSOLE_ENABLED=true`, the H2 web console is available at `http://localhost:8080/h2-console` during local development. Disable it in production.

---

## Security

- All payment endpoints require valid JWT authentication.
- Razorpay payments are verified server-side via signature verification before persistence.
- CORS is explicitly configured to allow only trusted origins.
- Sensitive configuration (API keys, DB credentials, JWT secret) is externalized via environment variables and never hardcoded.

---

## Learning Outcomes

- Payment gateway integration (Razorpay)
- Applied and explainable AI in a production-style pipeline
- Spring Boot ecosystem: Security, Data JPA, WebSocket
- JWT-based backend security
- RESTful API design
- H2 Database schema design for financial data
- Real-time client-server communication
- Layered, modular full-stack architecture
