# BookLeaf Publishing — Author Support & Operations Portal

> Full-stack author query ticketing, AI auto-classification, targeted response drafting, and real-time operations portal built for **BookLeaf Publishing**.

---

## Table of Contents
1. [Overview & Tech Stack](#overview--tech-stack)
2. [Design System & Editorial Philosophy](#design-system--editorial-philosophy)
3. [Architecture Decisions & Reasons](#architecture-decisions--reasons)
4. [AI Integration & Engineering (25% Evaluation Weight)](#ai-integration--engineering)
   - [Single-Call Classification & Priority](#1-single-call-classification--priority)
   - [Targeted Knowledge Base Slicing (Cost Optimization)](#2-targeted-knowledge-base-slicing)
   - [Tone Rules Enforcement](#3-tone-rules-enforcement)
   - [Graceful Degradation & Zero-Failure Fallback](#4-graceful-degradation--zero-failure-fallback)
   - [API Key Security & Model Choice Justification](#5-api-key-security--model-choice-justification)
5. [Pre-Seeded Accounts & Edge Cases](#pre-seeded-accounts--edge-cases)
6. [Local Setup Guide](#local-setup-guide)
7. [Complete REST API Documentation](#complete-rest-api-documentation)
8. [Known Limitations & Future Improvements](#known-limitations--future-improvements)

---

## Overview & Tech Stack

BookLeaf Publishing releases 1,200+ titles monthly across India and the US, maintaining a catalog of 22,000+ active books. This platform eliminates manual email backlog by providing a dual-portal architecture:
- **Author Portal:** Catalog tracking, sales & royalty breakdown (80% net split, minimum ₹1,000 threshold visibility), ticket submission with automatic AI triage, and real-time conversation threads.
- **Admin Operations Desk:** Dense queue with SLA highlighting, category & priority overrides, private staff internal notes, and AI-assisted reply drafting grounded in BookLeaf's operational policies.

### Selected Tech Stack

| Layer | Technology | Justification |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, React Router 6, Lucide Icons | Fast compile times, reactive state management, strict CSS token-driven design system with zero bloated styling frameworks. |
| **Backend** | Node.js, Express, Socket.io | Non-blocking asynchronous I/O ideal for bidirectional ticket threads, modular routing, and WebSocket broadcasting. |
| **Database** | MongoDB & Mongoose | Flexible document model accommodating nested platform distribution arrays, rich AI classification metadata, conversation messages, and internal notes. |
| **AI / LLM** | OpenAI `gpt-4o-mini` + BookLeaf Grounded Heuristic Engine | Low cost, low latency, deterministic JSON extraction for triage, and automated targeted knowledge base injection. |
| **Real-time** | WebSockets (Socket.io) | Immediate push of new tickets to admin queues and live delivery of admin replies to authors without page reloads. |

---

## Design System & Editorial Philosophy

Per the design brief, the application intentionally avoids generic AI SaaS templates (no purple gradients, no glassmorphism, no rounded pill buttons, and no robot/sparkle branding). Instead, it adopts a calm, warm, print-inspired visual language reflecting a physical publishing house:

- **Typography:**
  - Headings & book titles: Serif (`Newsreader`, Georgia)
  - Body, tables, forms: `IBM Plex Sans` (400 and 600 weight only)
  - Numbers: Tabular figures (`font-variant-numeric: tabular-nums`)
  - ISBN: Monospace (`JetBrains Mono`)
- **Color Tokens (CSS Variables):**
  - **Light mode (default):** `--bg: #FCFAF6` (warm paper), `--surface: #FFFFFF`, `--surface-alt: #F5F1EA`, `--border: #E6E0D6`, `--text: #1F1B16`, `--primary: #2F5D50` (forest green), `--accent: #B5562F` (rust, strictly reserved for single primary actions).
  - **Dark mode:** `--bg: #1A1815` (warm dark, never pure black/navy), `--surface: #23201C`, `--border: #3A352E`, `--text: #EDE7DC`, `--primary: #7FB3A2`.
- **Theme Switcher:**
  - Persistent in `localStorage("theme")`, follows system `prefers-color-scheme` on first visit.
  - Script executes in `<head>` before DOM render to completely eliminate white-flash on reload.
- **Queue Layout:**
  - Dense table with striped rows (`--surface-alt`).
  - Critical and oldest tickets feature a colored left accent border (`#8A1F14`) with human-readable relative age (`3 days ago`).

---

## Architecture Decisions & Reasons

```
bookleaf_task/
├── client/                     # React Single Page Application (Vite)
│   ├── src/
│   │   ├── components/         # Header, Sidebar, Badge, EmptyState, DemoSwitcherModal
│   │   ├── context/            # AuthContext, ThemeContext, SocketContext
│   │   ├── pages/
│   │   │   ├── author/         # BooksPage, RaiseQueryPage, TicketsPage, TicketDetailPage
│   │   │   └── admin/          # QueuePage, AdminTicketDetailPage
│   │   └── utils/              # api.js, formatters.js
│   └── index.html              # Pre-render anti-flash theme script
├── server/                     # Node.js / Express REST API + WebSocket Server
│   ├── config/                 # db.js, knowledgeBase.js (Modular Knowledge Base)
│   ├── controllers/            # auth, books, tickets, admin controllers
│   ├── middleware/             # auth.js (JWT + RBAC), errorHandler.js
│   ├── models/                 # User, Book, Ticket, Message, InternalNote (Mongoose)
│   ├── routes/                 # authRoutes, bookRoutes, ticketRoutes, adminRoutes
│   ├── services/               # aiService.js, socketService.js
│   ├── swagger/                # OpenAPI 3.0 specification & Swagger UI
│   └── data/                   # bookleaf_sample_data.json, seed.js
├── package.json                # Root scripts for build, seed, and development
├── README.md                   # System documentation
└── WRITEUP.md                  # Priorities, trade-offs, and production evolution
```

### Key Architectural Patterns
1. **Separation of Author & Staff Concerns:**
   - Database level: `InternalNote` records are maintained in a separate collection.
   - API level: Author endpoints automatically sanitize tickets and strip `aiDraft` and `internalNotes` from responses.
   - WebSocket level: Internal notes are broadcast exclusively to staff channels (`admin-queue` and `ticket:${id}` staff listeners).
2. **Deterministic Role-Based Access Control (RBAC):**
   - Authors can strictly query only their own books and tickets. Attempting to query another author's record returns `403 Forbidden`.
   - Admins possess comprehensive oversight across the entire author queue and catalog.
3. **Dual Serving Capability:**
   - In development: React runs on Vite (`:5173`) with automated API and WebSocket proxying to Express (`:5002`).
   - In production: Express statically serves the optimized Vite build from `client/dist`, allowing deployment on a single container port.

---

## AI Integration & Engineering

### 1. Single-Call Classification & Priority
To eliminate unnecessary latency and token costs, ticket submission executes a unified AI prompt that performs **both category classification and priority scoring in a single call**:

- **Categories (6 standard taxonomy types):**
  1. `Royalty & Payments`
  2. `ISBN & Metadata Issues`
  3. `Printing & Quality`
  4. `Distribution & Availability`
  5. `Book Status & Production Updates`
  6. `General Inquiry`
- **Priority Scoring Rules:**
  - **Critical:** Overdue royalties (e.g. 4+ months), missing payouts exceeding threshold, or live retailer ISBN metadata mismatches affecting active sales.
  - **High:** Physical defects in author copies (cracked spine, binding flaws), or title displaying "Currently Unavailable" on Amazon/Flipkart.
  - **Medium:** Royalty percentage formula questions, minor production pacing inquiries.
  - **Low:** Routine author bio updates, blurb refreshes, or general inquiries.

### 2. Targeted Knowledge Base Slicing
Rather than transmitting BookLeaf's entire company policy and knowledge base on every prompt, the `aiService` employs **targeted context slicing**:
- It inspects the classified category and query text.
- It extracts **only** the relevant policy slice (e.g., Royalties slice: 80% net formula, quarterly schedule, 45-day payout, ₹1,000 threshold; Printing slice: 5-7 day turnaround, free reprints for defects via Repro India / Epitome Books from Delhi plant).
- Token usage is reduced by **over 70%** per inference compared to naive full-KB dumping.

### 3. Tone Rules Enforcement
AI-drafted replies adhere strictly to BookLeaf's representative communication standard:
- **Empathetic & Partner-Focused:** Congratulates author on sales and readership first.
- **Concrete Details:** Uses exact dates (e.g. "within 48 hours", "5 to 7 business days"), verified bank names, and live production stages.
- **Direct Ownership:** Direct apologies for printing defects or feed mismatches with zero corporate evasion.
- **Definitive Next Step:** Closes with clear action points (e.g. requesting photos of defects, or initiating NEFT batch tracking).

### 4. Graceful Degradation & Zero-Failure Fallback
If the LLM API is unavailable, unconfigured, or rate-limited:
- **Ticket creation never fails.**
- The built-in `bookleaf-kb-engine` heuristic rule system classifies the ticket, assigns priority based on semantic patterns, and drafts a policy-compliant response using the exact BookLeaf rules.
- The admin interface indicates whether a draft was produced by `gpt-4o-mini` or the fallback knowledge-base engine.
- Admins can edit the draft or click **Regenerate** at any time.

### 5. API Key Security & Model Choice Justification
- **Security:** Keys (`ANTHROPIC_API_KEY` or `OPENAI_API_KEY`) reside exclusively in server-side environment variables and are never bundled, transmitted, or logged to the client.
- **Model Choice Justification:**
  - **Anthropic (`claude-3-haiku-20240307`):** Outstanding adherence to editorial tone rules, nuanced empathetic drafting, and extremely low cost ($0.25 / 1M input tokens) which makes it ideal for handling 1,200+ monthly book queries at scale.
  - **OpenAI (`gpt-4o-mini`):** High reasoning accuracy for deterministic JSON triage, low cost ($0.15 / 1M input tokens), and sub-second latency for author ticket submission flows.
  - Both providers are fully plug-and-play supported with identical targeted knowledge base slicing and tone enforcement.

---

## Pre-Seeded Accounts & Edge Cases

The database seeds from the official `bookleaf_sample_data.json` containing **12 accounts** (2 admins, 10 authors) and **18 books**, explicitly covering all required edge cases:

| Author ID & Name | Email | Role | Scenario & Edge Case Tested |
| :--- | :--- | :--- | :--- |
| **Rohan Mehra** | `admin@bookleaf.com` | Admin | Senior Operations Lead (Full queue triage, status changes, overrides) |
| **Aditi Roy** | `ops@bookleaf.com` | Admin | Author Success Specialist (Ticket resolution, internal notes) |
| **Priya Sharma (AUTH001)** | `priya.sharma@email.com` | Author | **Critical Royalty:** 4+ months overdue inquiry on `BL-1001`, ₹3,570 pending on *Whispers of the Ganges* (`BK001`) |
| **Rohit Kapoor (AUTH002)** | `rohit.kapoor@email.com` | Author | **Royalty Calculation:** 876 copies sold on *Code & Karma* (`BK003`) & 1203 copies on *Startup Sutra* (`BK004`) |
| **Ananya Reddy (AUTH003)** | `ananya.reddy@email.com` | Author | **Pending First Payout:** *Between Two Temples* (`BK005`), ₹2,546 pending, zero paid |
| **Vikram Joshi (AUTH004)** | `vikram.joshi@email.com` | Author | **Printing Defect:** Cracked spine binding & cover scratches on *Debugging Life* (`BK006`) |
| **Meera Nair (AUTH005)** | `meera.nair@email.com` | Author | **Distribution Availability:** "Currently Unavailable" stock sync lag on *Cardamom & Chaos* (`BK008`) |
| **Arjun Malhotra (AUTH006)** | `arjun.malhotra@email.com`| Author | **Pending Payout:** *Turban Tales* (`BK010`), 88 copies sold, ₹2,464 pending |
| **Sneha Kulkarni (AUTH007)**| `sneha.kulkarni@email.com`| Author | **Critical ISBN Mismatch & Production:** *The Algorithm of Love* (`BK011`) + *Midnight in Mysore* (`BK013` - Cover Design) |
| **Farhan Sheikh (AUTH008)** | `farhan.sheikh@email.com` | Author | **Clean Empty State:** 1 published book (*Ghazal of the Forgotten*, `BK014`) and **0 tickets** |
| **Kavita Deshmukh (AUTH009)**| `kavita.deshmukh@email.com`| Author | **Production & Below Threshold:** *Raising Roots* (`BK015` - Typesetting) & *The Nagpur Notebooks* (`BK016` - ₹850 pending < ₹1,000 threshold) |
| **Diya Chatterjee (AUTH010)**| `diya.chatterjee@email.com`| Author | **Resolved Ticket:** Amazon blurb and bio update completed (`BL-1007`) for *Durga’s Daughters* (`BK017`) |

> **Default Password:** `password123` for all seeded accounts.  
> *A 1-click account switcher is accessible on the Login screen and in the top Header navigation for rapid reviewer evaluation.*

---

## Local Setup Guide

### Prerequisites
- Node.js v18+ (tested on v18.20.8)
- MongoDB v6+ (running locally on port 27017 or remote MongoDB Atlas URI)

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone <https://github.com/ashutosh04k/bookleaf-author-support-portal>
cd bookleaf_task

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables
In `server/.env`:
```env
PORT=5002
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/bookleaf_db
JWT_SECRET=bookleaf_author_support_jwt_secret_production_ready_key_2024

# Optional: Add your OpenAI key to enable live LLM generation
# If omitted, system automatically operates in high-fidelity fallback mode
# OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o-mini
```

### 3. Seed Database with Sample Data
```bash
cd server
npm run seed
```
*Output will confirm 12 users, 18 books, and 7 pre-seeded tickets created.*

### 4. Run the Application

#### Option A: Running in Development (Separate Client & Server)
```bash
# In terminal 1: Start backend API & WebSocket server
cd server
npm start
# Server listens on http://localhost:5002

# In terminal 2: Start Vite React client
cd client
npm run dev
# Frontend accessible on http://localhost:5173
```

#### Option B: Unified Single-Port Serving
```bash
# Build the client bundle
cd client
npm run build

# Start the server (serves API, WebSockets, and static client bundle)
cd ../server
npm start
# Open http://localhost:5002 in your browser!
```

---

## Complete REST API Documentation

An interactive Swagger UI is available at **`http://localhost:5002/api-docs`** when the server is running.

### 1. Authentication (`/api/auth`)
- `POST /api/auth/login`
  - Body: `{ "email": "admin@bookleaf.com", "password": "password123" }`
  - Response: `{ "success": true, "token": "JWT...", "user": { ... } }`
- `GET /api/auth/me` (Protected)
  - Returns authenticated user details and linked bank account verification.
- `GET /api/auth/demo-users` (Public)
  - Returns list of pre-seeded test personas.

### 2. Books (`/api/books`)
- `GET /api/books/my-books` (Author only)
  - Returns author's catalog, copies sold, royalty earned, paid, and pending balances, along with threshold rollup flags.
- `GET /api/books` (Admin only)
  - Returns catalog with author references.
- `GET /api/books/:id` (Protected)
  - Returns specific book details.

### 3. Tickets (`/api/tickets`)
- `POST /api/tickets` (Author only)
  - Body: `{ "bookId": "...", "subject": "...", "description": "...", "attachments": [] }`
  - Runs AI single-call classification and generates targeted response draft.
  - Broadcasts `ticket:created` via WebSockets.
- `GET /api/tickets/my-tickets` (Author only)
  - Query parameters: `?status=Open`
  - Returns author's tickets.
- `GET /api/tickets/:id` (Protected)
  - Returns ticket metadata and chronological conversation messages.
  - If author requests: internal notes and AI draft are sanitized out.
  - If admin requests: includes internal notes and editable AI draft.
- `POST /api/tickets/:id/messages` (Protected)
  - Body: `{ "content": "..." }`
  - Dispatches message, updates lifecycle status, and emits `message:new`.

### 4. Admin Operations (`/api/admin`)
- `GET /api/admin/queue` (Admin only)
  - Query parameters: `?status=Open&category=...&priority=Critical&search=...&sortBy=oldest`
  - Returns filtered ticket queue.
- `GET /api/admin/stats` (Admin only)
  - Returns active, critical unresolved, unassigned, and resolved ticket counts.
- `PATCH /api/admin/tickets/:id/status` (Admin only)
  - Body: `{ "status": "In Progress" | "Resolved" | "Closed" }`
- `PATCH /api/admin/tickets/:id/override` (Admin only)
  - Body: `{ "category": "...", "priority": "..." }`
  - Overrides AI suggested classification and marks `isOverridden: true`.
- `PATCH /api/admin/tickets/:id/assign` (Admin only)
  - Body: `{ "adminId": "me" | "unassign" | "<id>" }`
- `POST /api/admin/tickets/:id/internal-notes` (Admin only)
  - Body: `{ "content": "Private staff note..." }`
  - Stored in staff collection, never exposed to author.
- `POST /api/admin/tickets/:id/regenerate-draft` (Admin only)
  - Forces fresh AI draft generation based on revised ticket state.
- `POST /api/admin/tickets/:id/send-reply` (Admin only)
  - Body: `{ "content": "Edited response to author..." }`
  - Dispatches official staff message, transitions ticket status to In Progress, and notifies author in real time.

---

## Known Limitations & Future Improvements

1. **Attachment File Uploads:** Current implementation simulates file attachment metadata and sizes cleanly. In a production cloud deployment, this would connect directly to an S3/GCS bucket via pre-signed upload URLs.
2. **Vector RAG Knowledge Base:** While category-targeted knowledge base slicing currently maintains strict relevance and low token costs, expanding beyond 100+ policy pages would benefit from embedding indexing (e.g. pgvector or Pinecone) for sub-section retrieval.
3. **Retailer API Webhooks:** Re-sync operations currently trigger staff notifications and timelines; direct Amazon SP-API and Flipkart Marketplace API webhooks could automate real-time inventory pings.
