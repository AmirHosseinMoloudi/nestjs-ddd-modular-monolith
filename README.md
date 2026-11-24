# Enterprise Modular Monolith Task Platform

Production-ready and deploy-ready Task & Workflow Management Platform engineered with **Domain-Driven Design (DDD)**, **Hexagonal Clean Architecture (Ports & Adapters)**, **Vertical Slice Architecture**, and an enterprise **OpenTelemetry + Prometheus + Grafana + Tempo** observability suite.

---

## 🛠 Technology Stack

### Backend
- **Framework**: [NestJS 11](https://nestjs.com/) with **Fastify** engine (`@nestjs/platform-fastify`)
- **Language**: TypeScript (ES2022, Strict Invariants)
- **ORM / Persistence**: [TypeORM](https://typeorm.io/) with **SQLite file** (`todo.sqlite`)
- **Security & IAM**: JWT, RBAC/ABAC Fine-Grained Authorization, Policy Enforcement Points (PEP), Password Hashing with Bcrypt
- **Architectural Patterns**:
  - Strategic & Tactical DDD (Aggregates, Value Objects, Domain Events, Specifications)
  - Hexagonal Ports and Adapters
  - Transactional Outbox Pattern with Polling Worker
  - Append-Only Tamper-Evident Audit Ledger
  - Optimistic Concurrency Control (OCC `version` tokens)
  - Maker-Checker Separation of Duties (HITL signoff)
  - Multi-Tenant Logical Isolation

### Frontend
- **Framework**: [Nuxt 4](https://nuxt.com/) with [Vue 3](https://vuejs.org/) & [Vite](https://vitejs.dev/)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Design System & Styling**: [Tailwind CSS](https://tailwindcss.com/) with shadcn-vue aesthetics
- **Interactive Capabilities**:
  - Multi-Tenant Organization Switcher
  - Real-time KPI Bento Metrics
  - Interactive Kanban Board & Filterable Data Table Views
  - Finite State Machine (FSM) Lifecycle Transition Controls
  - Human-in-the-Loop (HITL) Maker-Checker Signoff Interface
  - Immutable Audit History with Before/After JSON Snapshot Diffs

### Infrastructure & Observability
- **Docker & Docker Compose**: Multi-stage production containerization with non-root security principles
- **OpenTelemetry**: OpenTelemetry Node SDK exporting OTLP traces & metrics
- **Grafana Tempo**: Distributed tracing backend
- **Prometheus**: Real-time metrics scraper & time-series database
- **Grafana**: Pre-provisioned dashboards for RED metrics (Rate, Errors, Duration) & Business Activity Monitoring (BAM)

---

## 🏛 Architecture Overview

```
                          ┌──────────────────────────────────────────────┐
                          │         Nuxt 4 Client (Vite + Pinia)         │
                          └──────────────────────┬───────────────────────┘
                                                 │ HTTP / REST
                                                 ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ NestJS Fastify Backend (Modular Monolith)                                              │
│                                                                                        │
│  ┌─────────────────────────┐  ┌───────────────────────────┐  ┌──────────────────────┐  │
│  │       IAM Context       │  │     Task Core Context     │  │  Audit & Outbox Ctx  │  │
│  │ (Generic Subdomain)     │  │ (Core Domain)             │  │ (Supporting Subdom)  │  │
│  │                         │  │                           │  │                      │  │
│  │ • Tenant Entity         │  │ • TaskAggregate (Root)   │  │ • Outbox Worker      │  │
│  │ • User Entity           │  │ • FSM Lifecycle          │  │ • Immutable Audit Log │  │
│  │ • RBAC / ABAC           │  │ • Maker-Checker Policy    │  │ • Snapshot Diffs     │  │
│  │ • JWT Security Service  │  │ • OCC Version Guard       │  │ • Correlation ID     │  │
│  └────────────┬────────────┘  └─────────────┬─────────────┘  └──────────┬───────────┘  │
│               │                             │                           │              │
│               └─────────────────────────────┼───────────────────────────┘              │
│                                             ▼                                          │
│                                  TypeORM SQLite Database                              │
└─────────────────────────────────────────────┬──────────────────────────────────────────┘
                                              │ OTLP Traces & Metrics
                                              ▼
                        ┌───────────────────────────────────────────┐
                        │       OpenTelemetry Collector             │
                        └─────────────┬─────────────────────────────┘
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
               ┌──────────────────┐      ┌──────────────────┐
               │  Grafana Tempo   │      │    Prometheus    │
               │ (Distributed Traces)│   │ (Metrics & RED)  │
               └─────────┬────────┘      └─────────┬────────┘
                         │                         │
                         └────────────┬────────────┘
                                      ▼
                        ┌───────────────────────────┐
                        │          Grafana          │
                        │    (Live Dashboards)      │
                        └───────────────────────────┘
```

---

## 🚀 Quickstart & Deployment

### 1. Run Complete Platform with Docker Compose
```bash
docker compose up -d --build
```

### 2. Service Endpoints
| Service | URL | Credentials / Notes |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:3001](http://localhost:3001) | Nuxt 4 Dashboard |
| **Backend Fastify API** | [http://localhost:3000](http://localhost:3000) | REST API & OpenTelemetry |
| **Grafana Dashboards** | [http://localhost:3002](http://localhost:3002) | `admin` / `admin` (Anonymous Viewer enabled) |
| **Prometheus Metrics** | [http://localhost:9091](http://localhost:9091) | Scrapes `/metrics` |
| **Tempo Traces** | [http://localhost:3201](http://localhost:3201) | Distributed Tracing Backend |

---

## 🔑 Pre-seeded Accounts & Personas

The database automatically seeds two tenants and three role personas:

| Name | Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Alice Administrator** | `ADMIN` | `admin@acme.com` | `Password123!` | Full governance, task CRUD, approval signoff, audit trail |
| **Bob Manager** | `MANAGER` | `manager@acme.com` | `Password123!` | Maker-Checker signoff, task management, audit trail |
| **Charlie Developer** | `USER` | `user@acme.com` | `Password123!` | Task creation, work breakdown, subtasks (cannot self-approve) |

### Tenants:
- **Acme Enterprise Solutions** (`11111111-1111-1111-1111-111111111111`)
- **Beta Global Industries** (`22222222-2222-2222-2222-222222222222`)

---

## 🧪 Automated End-to-End Verification

A comprehensive automated verification script is included:

```bash
./scripts/verify.sh
```

This script validates:
1. Fastify backend `/health` endpoint.
2. Prometheus `/metrics` endpoint.
3. JWT Authentication & Tenant Context.
4. Creation of a `CRITICAL` task with automatic Maker-Checker policy enforcement.
5. Finite State Machine lifecycle transition (`TODO` -> `IN_PROGRESS` -> `IN_REVIEW`).
6. **Maker-Checker Violation Prevention**: Alice attempts to approve her own task and is rejected.
7. **Independent Maker-Checker Signoff**: Bob signs off on the task, automatically completing it.
8. Append-Only Audit Trail verification with before-and-after snapshots.
9. Verification of Prometheus, Grafana, and Tempo availability.
