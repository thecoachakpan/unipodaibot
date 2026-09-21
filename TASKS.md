# PodPal BOT - Project Task List & Execution Matrix

This document tracks the step-by-step implementation tasks for **PodPal BOT** (UniPods WhatsApp AI Assistant & Next.js Admin Dashboard with Supabase Auth).

---

## Phase 1: Project Setup & Environment Architecture
- [x] **1.1 Initialize Project Structure**
  - Create directory layout (`/worker`, `/app`, `/components`, `/lib`).
  - Configure root `package.json` with scripts for dev dashboard (`npm run dev`), background worker (`npm run worker`), and knowledge seeding (`npm run seed`).
- [x] **1.2 Dependencies & Configuration**
  - Install Next.js, React, Tailwind CSS, Lucide Icons, `@supabase/supabase-js`, `@supabase/ssr`.
  - Install `@whiskeysockets/baileys`, `@google/genai`, `googleapis`, `dotenv`.
  - Create `.env.example` with Supabase Auth, Gemini (`GEMINI_API_KEY`), and Google Drive credentials.
- [x] **1.3 Database Schema & Render Deployment Files**
  - Create `schema.sql` for Supabase SQL Editor including `scheduled_reminders` table.
  - Create `Dockerfile` and `render.yaml` for Render 24/7 Web Service deployment (`type: web`) with `/health` check endpoint and 100% Uptime zero-sleep configuration.

---

## Phase 2: WhatsApp Background Worker (`/worker`)
- [x] **2.1 Session Memory & Group Quote-Reply Tracker (`worker/sessionManager.js`)**
  - Implement 3-turn (6-message) sliding window conversation memory.
  - Add 30-minute inactivity TTL and 10-minute periodic sweeper.
  - Track DM session existence for Smart Group-to-DM routing.
- [x] **2.2 Google Drive & Link Ingestion Module (`worker/googleDrive.js`)**
  - Setup Google Service Account JWT authentication.
  - Build stream uploader for decrypted WhatsApp document buffers (<20MB).
  - Extract URLs from admin announcements and save categorized links to `knowledge_entries`.
- [x] **2.3 Admin Private DM Scheduling Engine (`worker/reminderScheduler.js`)**
  - Recognize verified Admin WhatsApp JIDs (Diane, Gift, Jeovaire, Munira, Charles Bolton).
  - Enable private DM Admin Mode with commands (`!remind 30m,5m`, `!announce`, `!faq`).
  - Implement 1-minute ticker for automated group reminder broadcasts with graceful stop handlers (`stopReminderScheduler`).
- [x] **2.4 Baileys Engine, Gemini AI Pipeline & Smart DM Router (`worker/bot.js`)**
  - Initialize Baileys WhatsApp client with **PodPal BOT** identity.
  - **Gemini AI Fallback Pipeline**:
    - **Primary Model**: Google GenAI (`gemini-3.1-flash-lite`).
    - **Fallback Model**: Google GenAI (`gemini-3.5-flash-lite`).
  - **Render 100% Uptime (Zero-Sleep) Engine**: HTTP Server listening on process `PORT` providing `/health` JSON metrics & built-in 9-minute heartbeat (`startSelfPing()`).
  - **Connection Resilience & Error Boundaries**: 10s backoff on session conflict (`connectionReplaced`), clean timer shutdowns, and process-level uncaught exception handlers.
  - Implement **Per-Turn Multilingual Detection & Mid-Chat Language Switcher** (seamlessly switches between English, French, Arabic, etc.).
  - Implement **First-Time DM Interactive Welcome Message & Engaging Persona** in user's language.
  - Implement **Multi-Participant Summary Dispatch Queue**: Queue multiple users replying *"send to me too"*, process with 2.5s rate-limit jitter, and send natural varied confirmation receipts (*"I have sent it to your DM!"*, *"Check your DM shortly"*, *"You'll get it right away!"*).
  - Implement **Missed Meeting Executive Summary & Action Points Dispatcher**: Proactively offer session summaries & key action items when founders inquire about past calls.
  - Implement **Smart Group-to-DM Response Router & Group Chat Privacy Guard**: Route participant-specific questions to DMs cleanly while strictly ignoring peer-to-peer conversations between group members.
  - Implement **Automatic Auth Session Purge & Web Reset Server (`/qr` & `/reset-qr`)**: Automatically purge stale Supabase auth entries on logout, auto-restart socket, and allow manual reset via `/reset-qr`.
  - Implement **Message Revocation Engine**: Allow admins to delete bot messages with `!delete` / `!revoke`.
  - Commands: `!links`, `!deadlines`, `!schedule`, `!reset`, `!delete`, `!start`.
  - Expired event detection & past deadline guard.
  - Multimodal Vision & Proactive Screenshot Request handler.
  - Multi-timezone output (`CAT / WAT / EAT / GMT`) & Franglais code-switching support.
  - Anti-Ban safeguards: presence simulation (`composing`), 2.0s-3.5s jitter, per-user 15s rate limiter.
  - Voice note processor (OGG Opus native RAM buffer, <90s limit, DMs only).
  - Implement log-on-miss entry into `unresolved_queries`.
- [x] **2.5 Grounded Knowledge Base Seeding (`worker/seedKnowledge.js`)**
  - Seed initial FAQs from `UniPods_AI_Assistant_Spec.md` for MIT, Wadhwani, Ethiopia AI, deadlines, and UN GA demo video submission.
- [x] **2.6 WhatsApp LID Resolution, PushName Admin Fallback & Native Document Delivery (`worker/bot.js`)**
  - Implement **LID Phone Guard**: Discard `@lid` numbers (>15 digits) in user identification to prevent invalid mention tagging (`@+120363430230054304`).
  - Implement **PushName Facilitator Match**: Match `validPushName` against `FACILITATOR_MAP` (Victor Akpan, Diane, Gift, Jeovaire, Munira, Charles Bolton) when WhatsApp sends unmapped `@lid` JIDs, recovering admin rights and phone JIDs seamlessly.
  - Implement **Guaranteed Native Document Attachment Pipeline**: Download Google Drive file buffers directly and upload native `.pdf` attachments. Validate `hasActiveDMSession(senderJid)` and automatically fall back to group chat delivery if no DM thread exists, if DM fails, or if explicitly requested in group. Never output raw Drive URLs.

---

## Phase 3: Next.js Admin Dashboard with Supabase Auth (`/app`)
- [x] **3.1 Supabase Auth Authentication Guard**
  - Build `app/login/page.tsx` for secure admin login.
  - Add middleware / session guard protecting admin routes.
- [x] **3.2 Admin Portal Interface (`app/admin/page.tsx`)**
  - Modern glassmorphic dark/light UI using Tailwind CSS & Lucide icons.
  - Master Kill Switch toggle (ACTIVE / OFFLINE).
  - Operational Scope selector (Private Only vs DMs & Groups).
  - Scheduled Reminders monitor & manual broadcast trigger.
  - FAQ Publisher & Knowledge Base browser.
  - Log-on-Miss Unresolved Queries viewer with 1-click resolution.

---

## Phase 4: Documentation, Testing & Deployment
- [x] **4.1 Workspace Documentation (`README.md`, `UniPods_AI_Assistant_Spec.md`)**
  - Document system architecture, 2-tier AI fallback engine, Render zero-sleep self-ping heartbeat setup, UptimeRobot external pinging, Supabase setup, Google Drive setup, Admin DM scheduling, Smart DM routing, language switching, welcome persona, multi-user summary queue, message deletion, Render deployment, and Vercel hosting.
- [x] **4.2 End-to-End Build & Logic Verification**
  - Execute `npm run build` to verify clean TypeScript compilation.
  - Verify syntax and fallback execution chains (`node --check worker/bot.js`).
  - Test login flow, language switching (English <-> French), welcome message, multi-participant summary queue & varied receipts, missed meeting summary offers, Smart DM routing, `!delete` command, Admin DM reminder scheduling, `!links` command, screenshot diagnostic flow, and kill-switch sync.

