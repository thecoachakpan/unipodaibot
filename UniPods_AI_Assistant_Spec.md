# UniPods METI AI Program - WhatsApp Assistant & Knowledge Orchestration Specification

## 1. System Overview & Architecture

An automated, production-grade WhatsApp AI assistant titled **PodPal BOT** designed to eliminate repetitive administrative FAQs across 240+ startup founders, facilitators, and program leads. It runs with zero cloud storage costs, supports multilingual voice notes natively in OGG Opus, operates fluently across English and French with dynamic per-turn mid-chat language switching, incorporates Meta anti-ban guardrails, features computer vision screenshot diagnostics, automated PDF ingestion to Google Drive, guaranteed native document attachments, selective Drive URL privacy shielding, smart group-to-DM response routing with Supabase DM session persistence, admin private DM reminder scheduling, an admin group recap engine (`!recap`), Web QR code authentication & session reset endpoints (`/qr`, `/reset-qr`), `/health` zero-sleep metrics server, and a Supabase Auth protected admin portal.

```
┌─────────────────────────────────────────────────────────────┐
│                 Next.js Admin Dashboard                     │
│               (Hosted on Vercel: $0)                        │
│  - Supabase Auth Guarded Access (Login / Logout)            │
│  - Remote Master Kill-Switch (Online / Offline)             │
│  - Chat Scope Selector (Both / Private Only / Group Off)    │
│  - Scheduled Reminders Monitor & Manual Trigger             │
│  - FAQ Markdown Editor & AI Ingestion Trigger               │
│  - Unanswered Question Log Synthesizer                      │
└──────────────────────────────┬──────────────────────────────┘
                               │ Reads & Writes (HTTPS & WSS)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Postgres                      │
│  - bot_config (Config broadcasted via Realtime WebSockets)  │
│  - whatsapp_auth (Persistent Baileys session credentials)   │
│  - knowledge_entries (Dynamic context for Gemini & Links)   │
│  - scheduled_reminders (Admin scheduled group reminders)    │
│  - unresolved_queries (Logs questions the bot cannot answer)│
│  - dm_sessions (Supabase-persisted DM session tracker)      │
│  - auth.users (Supabase Admin Auth Users)                   │
└──────────────────────────────▲──────────────────────────────┘
                               │ Subscribes & Schedules (Zero-DB-polling)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Render 24/7 Background Worker                 │
│                 (Docker / Node Web Service)                 │
│  - @whiskeysockets/baileys (WhatsApp Web Emulation)         │
│  - Dynamic Per-Turn Language Detection & Mid-Chat Switching │
│  - Engaging Humanized Welcome Message & Persona Engine      │
│  - Multi-Participant Summary Dispatch Queue & Varied Receipts│
│  - Smart Group-to-DM Routing (Private vs Public relevance)  │
│  - Missed Meeting Summary & Key Action Points Dispatcher    │
│  - Admin Group Recap Engine (!recap) & Anonymized Synthesis │
│  - Message Revocation Engine (sock.sendMessage delete)      │
│  - Admin Private DM Command Mode & Scheduler Ticker         │
│  - Multimodal Vision: Computer Vision & Proactive Screenshot│
│    Requests for underspecified technical issues             │
│  - Multimodal Audio: Native OGG Opus Audio -> Gemini        │
│  - In-memory session manager with 10m TTL sweeper           │
│  - Anti-Ban safeguards (Burst rate-limiter, jitter)         │
│  - WhatsApp LID Guard & Clean E.164 Phone Tagging           │
│  - PushName Facilitator / Admin Recognition Fallback        │
│  - Native Document Buffer Delivery & Supabase DM Sessions   │
│  - Selective Drive URL Privacy Shield                       │
│  - Google Drive & Link Auto-Ingestion Pipeline              │
│  - Gemini AI Fallback Pipeline:                             │
│    1. Primary: Gemini API (gemini-3.1-flash-lite)          │
│    2. Fallback: Gemini API (gemini-3.5-flash-lite)         │
│  - Render Zero-Sleep Uptime: HTTP /health & 9m Self-Ping    │
│  - Web QR & Session Reset Engine (/qr & /reset-qr)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Operational Scope Modes & Anti-Ban Guardrails

### 2.1 Operational Scope Modes
Configured dynamically via `bot_config.chat_scope` in Supabase (or via the Next.js Admin Portal):
1. `both` — Bot responds in both private DMs and group chats (tagged, quoted, or fresh unquoted questions).
2. `private_only` — Bot responds ONLY in private DMs and completely ignores group messages.
3. `group_deactivated` — Bot responds in DMs and monitors groups silently (capturing admin announcement links & chat updates) but does NOT auto-reply in groups.

### 2.2 Meta Anti-Ban Guidelines & Hardening
Running automated bots via Baileys connects as an emulated WhatsApp Web multi-device companion. To prevent Meta's automated anti-abuse systems from flagging or banning the account:

1. **Strict Inbound-Only Engagement (No Cold DMs):**
   - **Never** perform automated cold-messaging or unsolicited DMs to users who have not messaged the bot first.
   - If a participant asks a private question in a group chat but has no active DM session (`hasActiveDMSession()`), the bot politely responds in the group: *"Hi @user, I can send messages to you privately. Kindly send me 'Hi' in a private DM so I can assist you with program-related questions. 😊"* to comply with Meta anti-ban rules.
2. **Selective Triggering, Declarative Statement Guard & Privacy Guard in Group Chats:**
   - The bot must **never** process or reply to every message in a group, and must **never** interfere in peer-to-peer conversations, casual comments, or declarative statements between participants.
   - Declarative statements (e.g. *"I submitted module 2"*, *"The call was good"*, *"Me too"*) are filtered out even if they contain program keywords.
   - Process group messages only when explicitly tagged (`@bot`, `!ask`), when facilitators/admins are mentioned (`Victor`, `Diane`, `Gift`, `Jeovaire`, `Munira`, `Charles`, `Bolton`), when a user directly replies to a message sent by PodPal BOT, or when a user asks a fresh unquoted program question.
3. **Anti-Spam Rate Limiter & Cooldown:**
   - Per-chat queue ensures max 1 reply per 2.5 seconds per chat.
   - Per-user cooldown ignores rapid duplicate tags within 15 seconds from the same user.
4. **Humanized Presence & Typing Jitter:**
   - Broadcast `sock.sendPresenceUpdate('composing', jid)` before replying with 2,000ms – 3,500ms artificial delay.
5. **Program-Relatedness Focus Shield:**
   - Gently declines off-topic questions (e.g., cat poems, general homework) to protect bot trust and save LLM compute.
6. **Academic Integrity & Strict Assignment Boundary Shield:**
   - The bot MUST NOT do or complete assignments for participants or solve technical task roadblocks for them (e.g., step-by-step API key setup exercises, debugging assignment code).
   - The bot guides participants strictly on *what* is expected of them (submission guidelines, formats, deadlines) and *how/where* to find their expected tasks on the course portals.
   - When asked for assignment troubleshooting or solution steps, the bot explicitly declines, clarifies its scope, and directs the participant to relevant facilitators/admins or official support (`unipods.regional@undp.org`).
7. **Direct Task Execution & Dissatisfaction Escalation Protocol:**
   - The bot MUST NOT append repetitive closing boilerplate paragraphs explaining its purpose. It outputs direct answers or task results (translations, reference messages, admin mentions).
   - When participants express satisfaction, the bot reacts with emojis. When participants express vague dissatisfaction ("that doesn't help", "still wrong"), the bot apologizes, asks targeted clarifying follow-up questions, and guides them step-by-step.
   - If a participant continues to express dissatisfaction after accurate, complete information has been provided, the bot politely refers and tags relevant program admins (`@Gift`, `@Diane`, `@Charles`, `@Jeovaire`, `@Munira`) or provides support email (`unipods.regional@undp.org`).

---

## 3. Core AI Engine & Multimodal Capabilities: Gemini Fallback Pipeline

**PodPal BOT** operates using a highly resilient **Gemini AI Fallback Engine**:
1. **Primary Model — Google GenAI (`gemini-3.1-flash-lite`)**: High-speed inference via Google's Gemini API (`GEMINI_API_KEY`).
2. **Fallback Model — Google GenAI (`gemini-3.5-flash-lite`)**: Activated automatically if `gemini-3.1-flash-lite` experiences a rate-limit or transient outage.

**Multimodal & Intelligence Features**:
- **Dynamic Per-Turn Language Detection & Mid-Chat Switching**: Automatically detects the language of every prompt (English, French, Arabic, Amharic, Swahili, etc.) on each turn. If a user switches from English to French mid-conversation, **PodPal BOT** seamlessly switches to French!
- **Multimodal Audio Engine**: Ingests raw decrypted WhatsApp voice notes (`audio/ogg; codecs=opus`) natively in RAM (<90s limit).
- **Multimodal Computer Vision Engine**: Ingests screenshot image attachments (`image/jpeg`, `image/png`, `image/webp`) in RAM to visually inspect error codes, login failures, or UI bugs on course platforms (MIT, Wadhwani, Ethiopia AI).
- **Proactive Screenshot Requests**: When a technical query lacks error details, **PodPal BOT** proactively prompts the user for a screenshot, then analyzes the screenshot upon receipt.

---

## 4. Database Schema (Supabase SQL)

```sql
-- 1. Bot Configuration Table
create table if not exists bot_config (
  id int primary key default 1,
  is_active boolean not null default true,
  chat_scope text not null default 'both' check (chat_scope in ('private_only', 'both', 'group_deactivated')),
  updated_at timestamptz default timezone('utc'::text, now())
);

insert into bot_config (id, is_active, chat_scope)
values (1, true, 'both')
on conflict (id) do nothing;

-- 2. WhatsApp Baileys Auth Store
create table if not exists whatsapp_auth (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default timezone('utc'::text, now())
);

-- 3. Knowledge Base Entries & Link Index Table
create table if not exists knowledge_entries (
  id bigint generated by default as identity primary key,
  source_type text not null default 'faq', -- 'teams_transcript', 'whatsapp_qa', 'course_guideline', 'link'
  course_name text not null default 'General', -- 'MIT', 'Wadhwani', 'Ethiopia AI', 'General'
  content text not null,
  link_url text,
  created_at timestamptz default timezone('utc'::text, now())
);

-- 4. Scheduled Group Reminders Table
create table if not exists scheduled_reminders (
  id bigint generated by default as identity primary key,
  creator_jid text not null,
  group_jid text not null default 'all',
  title text not null,
  reminder_type text not null default 'meeting', -- 'meeting', 'deadline'
  scheduled_for timestamptz not null,
  offsets integer[] not null default '{30, 5}', -- minutes before event (e.g. 30m, 5m or 720m, 60m)
  status text not null default 'pending', -- 'pending', 'sent', 'cancelled'
  created_at timestamptz default timezone('utc'::text, now())
);

-- 5. Unresolved Questions Table (Log on Miss)
create table if not exists unresolved_queries (
  id bigint generated by default as identity primary key,
  question text not null,
  sender_jid text,
  asked_at timestamptz default timezone('utc'::text, now()),
  is_resolved boolean default false
);

-- Enable Realtime publication
alter publication supabase_realtime add table bot_config;
alter publication supabase_realtime add table scheduled_reminders;

-- 6. DM Sessions Table (Persistent DM Session Tracker for Group-to-DM Routing)
-- Survives Render free-tier spin-downs and process restarts.
create table if not exists dm_sessions (
  jid text primary key,
  last_dm_at timestamptz not null default timezone('utc'::text, now())
);
```

---

## 5. Engaging Humanized DM Welcome Message & Persona

When a user opens a DM with **PodPal BOT** for the first time or sends greetings like `Hi`, `Hello`, `Bonjour`, `Start`, `Menu`:

### English Welcome Template:
```
👋 Hey there! Welcome to the UniPods METI AI Innovation Cohort! ✨

I’m PodPal BOT, your 24/7 cohort companion! I'm here to support your journey across our 3 tracks (MIT Universal AI, Wadhwani Ignite, and Ethiopia AI Institute). 🚀

💡 Here is what I can do for you:
📌 Answer Track FAQs — Ask me about schedules, requirements, or submission guidelines!
📸 Diagnose Errors — Got a platform error? Send a screenshot and I'll analyze it!
🎙️ Listen to Voice Notes — Drop a quick voice note (under 90s) in any language!
📅 Milestones & Links — Type !deadlines for countdowns or !links for official resources.
📝 Meeting Summaries — Missed a live call? Ask me for the key action points!

🛡️ Program Focus Guard: I'm laser-focused on your cohort success, so while I can't write poems about cats or solve unrelated homework, I'm here 24/7 for everything METI AI!

What can I help you build or resolve today? 😊
```

### French Welcome Template (Triggered automatically if prompt is in French):
```
👋 Bonjour et bienvenue dans la cohorte d'innovation UniPods METI AI ! ✨

Je suis PodPal BOT, votre co-pilote 24/7 ! Je suis là pour vous accompagner tout au long des 3 parcours (MIT Universal AI, Wadhwani Ignite et Ethiopia AI Institute). 🚀

💡 Voici ce que je peux faire pour vous :
📌 Répondre aux questions — Posez vos questions sur les calendriers, exigences ou soumissions !
📸 Diagnostiquer les erreurs — Envoyez une capture d'écran d'une erreur de plateforme et je l'analyserai !
🎙️ Traiter les messages vocaux — Envoyez une note vocale (moins de 90s) dans n'importe quelle langue !
📅 Échéances & Liens — Tapez !deadlines pour les compte à rebours ou !links pour les ressources officielles.
📝 Résumés de réunions — Vous avez manqué un appel en direct ? Demandez-moi les points clés !

🛡️ Bouclier Programme : Je suis concentré à 100 % sur la réussite de votre cohorte !

Comment puis-je vous aider aujourd'hui ? 😊
```

---

## 6. Advanced Features & Interaction Specifications

### 6.1 Admin Private DM Scheduling Engine (`!remind`)
- Verified Admin WhatsApp JIDs (Victor Akpan, Diane, Gift, Jeovaire, Munira, Charles Bolton) chatting in private DMs enter **Admin Command Mode**.
- Commands: `!remind 30m,5m "Wadhwani Q&A starting soon! Join: https://..."` or `!announce "New submission rules published"`.
- 1-minute ticker checks `scheduled_reminders` and broadcasts to group chats at 30m/5m before meetings or 12h/1h before deadlines.

### 6.2 Admin Group Recap Engine (`!recap`)
- Synthesizes today's admin updates and announcements from an expanded in-memory chat buffer.
- Historical recaps ("week", "all") pull from persistent `knowledge_entries` KB entries.
- Strictly anonymizes participant names to preserve cohort privacy.

### 6.3 Supabase-Persisted Smart Group-to-DM Response Routing
- Defaults to current chat context (DM → DM, Group → Group).
- General cohort queries -> Answered directly in group chat.
- Participant-specific queries or explicit private delivery requests:
  - User has active DM session (checked via Supabase `dm_sessions` table, survives Render spin-downs) -> Detailed answer sent to DM + group note: *"Hi @User, check your DM! I've responded to your message."*
  - User has NO active DM session -> Group note: *"Hi @User, I can send messages to you privately. Kindly send me 'Hi' in a private DM so I can assist you with program-related questions. 😊"*
- DM sessions are recorded under **phone-based JIDs** (`targetDmJid`, e.g. `2349093696284@s.whatsapp.net`) for reliable cross-context group→DM lookup, even when the DM `senderJid` is a `@lid` JID.

### 6.4 Message Revocation Engine (`!delete` / `!revoke`)
- Admins replying to any bot message with `!delete` or `!revoke` trigger instant message deletion for everyone via `sock.sendMessage(jid, { delete: messageKey })`.

### 6.5 Multi-Participant Summary Queue & Varied Receipts
- When multiple users reply *"Yes, send to me too"*, **PodPal BOT** queues requesting users, dispatches summaries sequentially with a 2.5s jitter delay, and posts natural varied group receipts (*"I have sent it to your DM!"*, *"Check your DM shortly"*, *"You'll get it right away!"*).

### 6.6 Missed Meeting Executive Summary & Action Points Dispatcher
- When founders inquire about past calls, **PodPal BOT** detects the concluded date, offers executive summaries & key action points, and answers follow-up questions.

### 6.7 Automatic Link Extraction & Retrieval (`!links`)
- Intercepts URLs shared by admins and categorizes them. Users type `!links` or ask for specific links.

### 6.8 Expired Event & Past Deadline Guard
- Warns users if a meeting or deadline has concluded, providing recording links or support email (`unipods.regional@undp.org`).

### 6.9 WhatsApp LID Identity Guard & PushName Admin Fallback
- **LID Phone Guard**: Discards `@lid` numbers or raw LID strings (>15 digits) when identifying users. Prevents invalid LID tags (e.g. `@+120363430230054304`) from being output in group receipts or mentions, restricting tags strictly to valid E.164 phone numbers (<=15 digits).
- **PushName Facilitator Match**: When WhatsApp sends an unmapped `@lid` JID, matches `validPushName` against `FACILITATOR_MAP` (Victor Akpan, Diane, Gift, Jeovaire, Munira, Charles Bolton). If matched, sets `isFacilitator = true` and recovers the correct phone JID from the facilitator map, guaranteeing admin recognition never fails.

### 6.10 Guaranteed Document & Native File Delivery Protocol
- **Native Document Attachments Only**: **NEVER** share, output, or send raw internal Google Drive storage links or web URLs when a file or document is requested from the Drive folder. **ALWAYS** download the file buffer and upload the actual native document attachment (`.pdf`, etc.) directly to WhatsApp.
- **Selective Drive URL Privacy Shield**: Internal document storage Drive URLs (from `### Document:` KB entries) are stripped from Gemini's context and AI responses. Meeting recording links and other shareable Drive file URLs stored in KB entries are **preserved** and shared normally.
- **Default Delivery Location**: Deliver to the current chat context by default (DM → DM, Group → Group). Only attempt cross-context DM delivery when the user **explicitly** requests private delivery (e.g. "send privately", "in my DM").
- **Supabase-Persisted DM Session Guard**: Validates `hasActiveDMSession(targetDmJid)` via the `dm_sessions` Supabase table (persists across Render spin-downs) **AND** `cleanSenderNum.length <= 15` before attempting DM document dispatch.
- **Group Upload Fallback**: If the user requested the document in a group chat with explicit group intent ("send here", "upload here", "in group") OR if the user does NOT have an active DM session OR if DM dispatch fails: automatically uploads the native document attachment directly into the group chat to guarantee document delivery NEVER fails.
- **Strict Delivery Confirmation**: **NEVER** output text confirming or claiming that a file was sent to a private DM if no file attachment was physically dispatched and delivered.

### 6.11 Web QR Code & Health Server (`/qr`, `/reset-qr`, `/health`)
- `http://localhost:10000/qr` or `https://<render-app>.onrender.com/qr`: Displays a responsive web page containing the live WhatsApp authentication QR code.
- `http://localhost:10000/reset-qr` or `https://<render-app>.onrender.com/reset-qr`: Instantly purges stale Supabase auth entries, resets socket connection, and forces QR re-generation.
- `/health`: Returns JSON server status metrics and maintains 24/7 zero-sleep via internal heartbeat (`startSelfPing()`) and external UptimeRobot monitors.

---

## 7. Next.js Admin Dashboard with Supabase Auth (app/admin/page.tsx)

- Protected by Supabase Auth (`app/login/page.tsx`).
- Remote Master Kill Switch (Active / Offline).
- Operational Scope Selector: *Both (DMs & Groups)* / *Private Only* / *Group Deactivated (Silent Observation)*.
- Scheduled Reminders Monitor & Manual Trigger.
- FAQ Markdown Editor & AI Ingestion Trigger.
- Unanswered Question Log Synthesizer ("Log on Miss").

---

## 8. Google Drive Automated PDF Ingestion & File Delivery Pipeline

- Uses Google Service Account JWT auth (`googleDrive.js`).
- Ingestion: Uploads decrypted WhatsApp PDF/Doc buffers (<20MB) to a shared Google Drive folder and syncs metadata to Supabase `knowledge_entries`.
- Delivery: When requested by users, downloads native document buffers from Google Drive and dispatches native document attachments directly to WhatsApp. Strictly avoids raw Drive URLs.

---

## 9. Grounded Program FAQ & Reference Data

- **Key Support Contacts**: `unipods.regional@undp.org` (General & Wadhwani), `uaisupport@mit.edu` (MIT Track), Victor Akpan (`+234 909 369 6284`), Charles Bolton (`+27 79 356 5520`), Gift Ntuli (`+263 77 409 4822`), Diane (`+250 78 318 8655`), Jeovaire Umukundwa (`+250 78 935 5992`), Munira Umugwaneza (`+250 78 638 7244`).
- **Key Deadlines**:
  - UN GA Demo Video Submission: Friday, 18 Sept 2026 @ 2:00 PM CAT.
  - UniPods Chatbot Hackathon: 18 Sept – 24 Sept 2026 ($5,000 prize).
  - MIT Universal AI Completion: Sunday, 18 October 2026 (16 foundational modules mandatory).
