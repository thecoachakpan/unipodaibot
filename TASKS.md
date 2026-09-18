# PodPal BOT - Project Task List & Execution Matrix

This document tracks the step-by-step implementation tasks for **PodPal BOT** (UniPods WhatsApp AI Assistant & Next.js Admin Dashboard with Supabase Auth).

---

## Phase 1: Project Setup & Environment Architecture
- [ ] **1.1 Initialize Project Structure**
  - Create directory layout (`/worker`, `/app`, `/components`, `/lib`).
  - Configure root `package.json` with scripts for dev dashboard (`npm run dev`), background worker (`npm run worker`), and knowledge seeding (`npm run seed`).
- [ ] **1.2 Dependencies & Configuration**
  - Install Next.js, React, Tailwind CSS, Lucide Icons, `@supabase/supabase-js`, `@supabase/ssr`.
  - Install `@whiskeysockets/baileys`, `@google/genai`, `googleapis`, `dotenv`.
  - Create `.env.example` with Supabase Auth, Gemini, and Google Drive credentials.
- [ ] **1.3 Database Schema & Render Deployment Files**
  - Create `schema.sql` for Supabase SQL Editor including `scheduled_reminders` table.
  - Create `Dockerfile` and `render.yaml` for Render 24/7 background worker deployment.

---

## Phase 2: WhatsApp Background Worker (`/worker`)
- [ ] **2.1 Session Memory & Group Quote-Reply Tracker (`worker/sessionManager.js`)**
  - Implement 3-turn (6-message) sliding window conversation memory.
  - Add 30-minute inactivity TTL and 10-minute periodic sweeper.
  - Track DM session existence for Smart Group-to-DM routing.
- [ ] **2.2 Google Drive & Link Ingestion Module (`worker/googleDrive.js`)**
  - Setup Google Service Account JWT authentication.
  - Build stream uploader for decrypted WhatsApp document buffers (<20MB).
  - Extract URLs from admin announcements and save categorized links to `knowledge_entries`.
- [ ] **2.3 Admin Private DM Scheduling Engine (`worker/reminderScheduler.js`)**
  - Recognize verified Admin WhatsApp JIDs (Diane, Gift, Jeovaire, Munira, Charles Bolton).
  - Enable private DM Admin Mode with commands (`!remind 30m,5m`, `!announce`, `!faq`).
  - Implement 1-minute ticker for automated group reminder broadcasts.
- [ ] **2.4 Baileys Engine, Language Switcher & Smart DM Router (`worker/bot.js`)**
  - Initialize Baileys WhatsApp client with **PodPal BOT** identity.
  - Implement **Per-Turn Multilingual Detection & Mid-Chat Language Switcher** (seamlessly switches between English, French, Arabic, etc.).
  - Implement **First-Time DM Interactive Welcome Message & Engaging Persona** in user's language.
  - Implement **Multi-Participant Summary Dispatch Queue**: Queue multiple users replying *"send to me too"*, process with 2.5s rate-limit jitter, and send natural varied confirmation receipts (*"I have sent it to your DM!"*, *"Check your DM shortly"*, *"You'll get it right away!"*).
  - Implement **Missed Meeting Executive Summary & Action Points Dispatcher**: Proactively offer session summaries & key action items when founders inquire about past calls.
  - Implement **Smart Group-to-DM Response Router**: Route participant-specific questions to DMs cleanly while respecting Meta anti-ban rules.
  - Implement **Message Revocation Engine**: Allow admins to delete bot messages with `!delete` / `!revoke`.
  - Commands: `!links`, `!deadlines`, `!schedule`, `!reset`, `!delete`, `!start`.
  - Expired event detection & past deadline guard.
  - Multimodal Vision & Proactive Screenshot Request handler.
  - Multi-timezone output (`CAT / WAT / EAT / GMT`) & Franglais code-switching support.
  - Anti-Ban safeguards: presence simulation (`composing`), 2.0s-3.5s jitter, per-user 15s rate limiter.
  - Voice note processor (OGG Opus native RAM buffer, <90s limit, DMs only).
  - Implement log-on-miss entry into `unresolved_queries`.
- [ ] **2.5 Grounded Knowledge Base Seeding (`worker/seedKnowledge.js`)**
  - Seed initial FAQs from `UniPods_AI_Assistant_Spec.md` for MIT, Wadhwani, Ethiopia AI, deadlines, and UN GA demo video submission.

---

## Phase 3: Next.js Admin Dashboard with Supabase Auth (`/app`)
- [ ] **3.1 Supabase Auth Authentication Guard**
  - Build `app/login/page.tsx` for secure admin login.
  - Add middleware / session guard protecting admin routes.
- [ ] **3.2 Admin Portal Interface (`app/admin/page.tsx`)**
  - Modern glassmorphic dark/light UI using Tailwind CSS & Lucide icons.
  - Master Kill Switch toggle (ACTIVE / OFFLINE).
  - Operational Scope selector (Private Only vs DMs & Groups).
  - Scheduled Reminders monitor & manual broadcast trigger.
  - FAQ Publisher & Knowledge Base browser.
  - Log-on-Miss Unresolved Queries viewer with 1-click resolution.

---

## Phase 4: Documentation, Testing & Deployment
- [ ] **4.1 Workspace Documentation (`README.md`)**
  - Document system architecture, Supabase setup, Google Drive setup, Admin DM scheduling, Smart DM routing, language switching, welcome persona, multi-user summary queue, message deletion, Render deployment, and Vercel hosting.
- [ ] **4.2 End-to-End Build & Logic Verification**
  - Execute `npm run build` to verify clean TypeScript compilation.
  - Test login flow, language switching (English <-> French), welcome message, multi-participant summary queue & varied receipts, missed meeting summary offers, Smart DM routing, `!delete` command, Admin DM reminder scheduling, `!links` command, screenshot diagnostic flow, and kill-switch sync.
