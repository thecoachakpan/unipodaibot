# PodPal BOT - UniPods METI AI Assistant & Admin Dashboard

**PodPal BOT** is an automated, production-grade WhatsApp AI Assistant and Management Dashboard designed for the UniPods METI AI Innovation Cohort (240+ startup founders, facilitators, and program leads across MIT Universal AI, Wadhwani Ignite, and Ethiopia AI Institute tracks).

It operates with **zero cloud storage costs**, supports **multilingual voice notes** (English, French, Arabic, Amharic), features **Per-Turn Dynamic Language Detection & Mid-Chat Switching**, an **Engaging Humanized DM Welcome Persona**, **Multi-Participant Summary Queue & Varied Receipts**, **Missed Meeting Executive Summary & Action Points Dispatch**, **Admin Group Recap Engine (`!recap`)**, **Supabase-Persisted Smart Group-to-DM Response Routing**, **Selective Drive URL Privacy Shield**, **Guaranteed Native Document Attachment Delivery**, **Message Revocation (`!delete`)**, **Admin DM Private Scheduling**, **Automatic Link Extraction (`!links`)**, **Expired Event Guards**, **Proactive Screenshot Requests & Computer Vision Diagnostics**, **Meta anti-ban guardrails**, **Web QR & Auth Reset Server (`/qr`, `/reset-qr`)**, and a **Supabase Auth protected Next.js admin portal**.

---

## 🏗️ Infrastructure Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                 Next.js Admin Dashboard                     │
│               (Hosted on Vercel: $0)                        │
│  - Supabase Auth Guarded Access (Login / Logout)            │
│  - Remote Master Kill-Switch (Online / Offline)             │
│  - Chat Scope Selector (Both / Private Only / Group Off)    │
│  - Scheduled Reminders Monitor & Manual Broadcast Trigger   │
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
                               │ Realtime Subscriptions & Persistence
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Render 24/7 Background Worker                 │
│                 (Docker / Node Web Service)                 │
│  - @whiskeysockets/baileys (WhatsApp Web Emulation)         │
│  - Web QR & Session Reset Engine (/qr & /reset-qr)          │
│  - Health & Zero-Sleep Metric Server (/health & Self-Ping)  │
│  - Gemini AI Fallback Engine:                               │
│      1. Primary: Gemini API (gemini-3.1-flash-lite)          │
│      2. Fallback: Gemini API (gemini-3.5-flash-lite)         │
│  - Dynamic Per-Turn Language Detection & Mid-Chat Switching │
│  - Admin Private DM Command Mode & Scheduler Ticker         │
│  - In-Memory Chat Buffer & Admin Recap Engine (!recap)      │
│  - Smart Group-to-DM Routing & Supabase DM Session Tracker  │
│  - Selective Drive URL Privacy Shield & Native PDF Uploader │
│  - WhatsApp LID Identity Guard & PushName Admin Fallback    │
│  - Multimodal Computer Vision Diagnostics & Audio Engine    │
│  - Anti-Ban Safeguards (Presence composing, jitter, 15s RL) │
└─────────────────────────────────────────────────────────────┘
```

---

## 🌟 Key Infrastructure & Capabilities

1. **WhatsApp Background Worker (Render 24/7 Web Container)**
   - Built on `@whiskeysockets/baileys` (WhatsApp Web multi-device emulation).
   - Powered by a **Gemini AI Fallback Engine**: Primary Model (**`gemini-3.1-flash-lite`**) ➔ Fallback Model (**`gemini-3.5-flash-lite`**).
   - **WhatsApp LID Identity Guard & Clean Phone Tagging**: Filters out WhatsApp Linked Identity (`@lid`) numbers (>15 digits) when tagging users or sending receipts, restricting mentions strictly to clean E.164 phone numbers (<=15 digits).
   - **PushName Facilitator / Admin Recognition Engine**: Automatically resolves admin rights and phone JIDs via `PushName` matching against `FACILITATOR_MAP` (Victor Akpan, Diane, Gift, Jeovaire, Munira, Charles Bolton) when WhatsApp sends unmapped `@lid` identities.
   - **Guaranteed Native Document Delivery Pipeline**: Downloads file buffers from Google Drive and uploads native attachments (`.pdf`, etc.) directly to WhatsApp. Validates DM sessions via **Supabase-persisted** `hasActiveDMSession()` (survives Render spin-downs) and delivers to current chat context by default. Only attempts cross-context DM delivery when explicitly requested ("send privately", "in my DM"). Nudges users to send a DM first if no active session exists.
   - **Selective Drive URL Privacy Shield**: Internal document storage Drive URLs (`### Document:` KB entries) are stripped from Gemini's context and AI responses. Meeting recording links and other shareable Drive file URLs are preserved and shared normally.
   - **Per-Turn Dynamic Multilingual Detection & Mid-Chat Language Switcher**: Detects prompt language (English, French, Arabic, Amharic, etc.) on every turn. If a user switches languages mid-conversation, PodPal BOT seamlessly switches response language.
   - **Engaging DM Welcome Persona**: Greets new DM users with a warm, encouraging, humanized overview of capabilities while enforcing a firm program focus shield against off-topic queries.
   - **Multi-Participant Summary Dispatch Queue**: Queues users requesting summaries, dispatches with 2.5s jitter, and posts natural varied group receipts (*"I have sent it to your DM!"*, *"Check your DM shortly"*, *"You'll get it right away!"*).
   - **Missed Meeting Executive Summary & Action Points Dispatcher**: Proactively offers executive summaries and action items when founders ask about concluded sessions.
   - **Admin Group Recap Engine (`!recap`)**: Synthesizes today's admin announcements and cohort updates using in-memory chat buffers or historical KB summaries with participant privacy protection.
   - **Supabase-Persisted Smart Group-to-DM Response Routing**:
     - Defaults to current chat location (DM → DM, Group → Group).
     - General cohort questions -> Answered directly in group.
     - Participant-specific queries or explicit private requests -> Checked against `dm_sessions` table in Supabase. Sends detailed response to DM & posts group notification. If no active DM session exists, prompts user to send a private DM first.
     - Recorded under phone-based JIDs (`targetDmJid`) for reliable cross-context lookup.
   - **Three Operational Scope Modes**:
     - `both` — Responds in both private DMs and group chats (tagged/quoted/fresh questions).
     - `private_only` — Responds only in private DMs, ignores group messages.
     - `group_deactivated` — Responds in DMs and monitors groups silently without auto-replying in groups.
   - **Message Revocation Engine (`!delete` / `!revoke`)**: Admins can reply to any bot message with `!delete` to revoke it instantly for everyone.
   - **Admin Private DM Scheduling Engine**: Admins (Victor Akpan, Diane, Gift, Jeovaire, Munira, Charles Bolton) chat in private DMs to schedule group reminders (30m, 5m before calls; 12h, 1h before deadlines).
   - **Automatic Link Extraction & Indexing (`!links`)**: Intercepts URLs shared by admins and categorizes them for easy founder retrieval.
   - **Expired Event & Past Deadline Guard**: Detects concluded events, informs users, and provides recording links or support contacts (`unipods.regional@undp.org`).
   - **Proactive Screenshot Requests & Computer Vision Diagnostic Engine**: Analyzes platform error images (`image/jpeg`, `image/png`, `image/webp`) in RAM using Gemini's vision capabilities.
   - **Automatic Auth Session Recovery & Web QR Server (`/qr` & `/reset-qr`)**: Serves a web QR code page for phone linking. Automatically detects session disconnects (`loggedOut`), purges stale auth records in Supabase, and re-generates fresh QR codes. Supports one-click manual reset via `/reset-qr`.
   - **Academic Integrity & Strict Assignment Boundary Guard**: Prevents the bot from solving technical assignments or completing coursework exercises for participants. Guides participants strictly on requirements, formats, and deadlines.
   - **Direct Task Output & Dissatisfaction Escalation Protocol**: Responds directly without boilerplate outros. Handles feedback emoji reactions, asks clarifying follow-ups on vague dissatisfaction, and escalates persistent issues by tagging relevant program admins (`@Gift`, `@Diane`, `@Charles`, `@Jeovaire`, `@Munira`) or providing support email (`unipods.regional@undp.org`).

2. **Next.js Admin Portal with Supabase Auth (Vercel - $0)**
   - **Authentication Guard**: Protected login using Supabase Auth.
   - **Remote Master Kill Switch**: Enable or suspend bot activity instantly across all channels.
   - **Operational Scope Toggle**: Switch between *Both (DMs & Groups)*, *Private Only*, and *Group Deactivated (Silent Observation)*.
   - **Scheduled Reminders Monitor**: View and manage upcoming group reminders.
   - **Knowledge Publisher**: Publish Q&A pairs, meeting transcripts, or course rules categorized by track.
   - **Log-on-Miss Synthesizer**: Review unanswered questions logged in `unresolved_queries` and update answers with one click.

---

## 🛠️ Complete Setup Guide (Run & Maintain locally or on Server)

Follow this step-by-step guide to run and maintain **PodPal BOT** from scratch on any system.

### Prerequisites
- **Node.js**: v18.0.0 or higher.
- **npm**: v9.0.0 or higher.
- **Git**: Installed on your system.
- **Supabase Account**: Free project on [supabase.com](https://supabase.com).
- **Google Cloud Console Account**: With Gemini API key and Google Drive API enabled.
- **WhatsApp Mobile App**: Account logged in on a mobile phone (for QR scanning).

---

### Step 1: Clone Repository & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/thecoachakpan/unipodaibot.git
cd PodPal

# Install dependencies
npm install
```

---

### Step 2: Database Setup (Supabase)

1. Log in to [Supabase](https://supabase.com) and create a new project (e.g. `PodPal-BOT`).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open `schema.sql` from this repository, copy its entire contents, paste it into the SQL Editor, and click **Run**.
4. This creates all necessary tables:
   - `bot_config` (Bot master switch & scope mode)
   - `whatsapp_auth` (Baileys persistent auth credentials)
   - `knowledge_entries` (Grounded knowledge base & link index)
   - `scheduled_reminders` (Admin meeting & deadline reminders)
   - `unresolved_queries` (Log-on-miss unanswered queries)
   - `dm_sessions` (Persisted active DM tracker for group-to-DM routing)
5. Go to **Project Settings > API** and copy:
   - `Project URL`
   - `anon public` key
   - `service_role` secret key (Required for backend worker access).
6. Go to **Authentication > Users** in Supabase and click **Add User > Create User** to create an admin user for the Next.js Admin Portal.

---

### Step 3: Google Gemini API & Google Drive Setup

#### 3.1 Get Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Create an API Key and copy the key string (`GEMINI_API_KEY`).

#### 3.2 Setup Google Drive Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project named `PodPal-BOT`.
3. Navigate to **APIs & Services > Library**, search for **Google Drive API**, and click **Enable**.
4. Go to **IAM & Admin > Service Accounts** and create a service account named `podpal-bot-drive`.
5. Click on the created service account, go to the **Keys** tab, click **Add Key > Create new key**, choose **JSON**, and download the file.
6. Open your Google Drive in a web browser, create a folder named `PodPal BOT Storage`, and share it with your Service Account email address giving **Editor** access.
7. Copy the Folder ID from the URL (`https://drive.google.com/drive/folders/FOLDER_ID`).

---

### Step 4: Configure Environment Variables (`.env`)

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Fill in your variables in `.env`:

```env
# Google Gemini API Key
GEMINI_API_KEY=AIzaSy...

# Supabase Credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJh...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...

# Google Drive Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=podpal-bot-drive@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_DRIVE_FOLDER_ID=1abc...

# Server Port (Default: 10000)
PORT=10000

# Render External URL (Set in production for self-ping zero-sleep)
RENDER_EXTERNAL_URL=https://your-app-name.onrender.com
```

---

### Step 5: Seed the Knowledge Base

Populate the database with foundational cohort knowledge (MIT, Wadhwani, Ethiopia AI, hackathon rules, submission requirements, contacts):

```bash
npm run seed
```

---

### Step 6: Run Locally

#### Option A: Start Background Worker (WhatsApp AI Engine)
```bash
npm run worker
```

1. Watch the terminal output or open your browser to `http://localhost:10000/qr`.
2. A QR code will display in the terminal and on the web page.
3. Open **WhatsApp** on your phone, go to **Settings > Linked Devices > Link a Device**, and scan the QR code.
4. Once scanned, the worker output will log: `✅ [Baileys Client]: WhatsApp Client Successfully Connected!`.

#### Option B: Start Next.js Admin Dashboard
In a separate terminal window:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser, log in with your Supabase Admin user credentials, and manage bot settings.

---

### Step 7: Production Deployment & 100% Uptime Setup

#### 7.1 Deploy Worker on Render (24/7 Web Container)
1. Log in to [Render.com](https://render.com).
2. Click **New + > Web Service** and connect your Git repository.
3. Set the following settings:
   - **Name**: `podpal-bot`
   - **Environment**: `Node` (or Docker using `Dockerfile`)
   - **Build Command**: `npm install`
   - **Start Command**: `npm run worker`
4. Add all environment variables from `.env` in the Render Environment tab.
5. Set `RENDER_EXTERNAL_URL` to `https://podpal-bot.onrender.com`.
6. Click **Deploy Web Service**.

#### 7.2 Web QR Authentication in Production
- After Render builds and starts the container, navigate to `https://podpal-bot.onrender.com/qr` in your web browser.
- Scan the QR code displayed on the page with your WhatsApp phone.
- If the session ever disconnects or needs resetting, visit `https://podpal-bot.onrender.com/reset-qr` to disconnect and generate a fresh QR code instantly.

#### 7.3 Guaranteed 100% Zero-Sleep Uptime Setup
1. Render Web Services automatically include a built-in heartbeat self-ping (`startSelfPing()`) every 9 minutes when `RENDER_EXTERNAL_URL` is set.
2. **Recommended Secondary Monitor**:
   - Create a free account on [UptimeRobot.com](https://uptimerobot.com) or [cron-job.org](https://cron-job.org).
   - Add an **HTTP Monitor**:
     - **URL**: `https://podpal-bot.onrender.com/health`
     - **Interval**: Every 5 minutes.
   - This keeps your Render container active 24/7/365 with **Zero Sleep**!

#### 7.4 Deploy Admin Dashboard on Vercel
1. Log in to [Vercel.com](https://vercel.com) and import the repository.
2. Set Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Click **Deploy**.

---

## 👨‍💼 Admin & Maintainer Operating Manual

### 1. Admin WhatsApp DM Commands
Verified facilitators (Victor Akpan, Diane, Gift Ntuli, Jeovaire Umukundwa, Munira Umugwaneza, Charles Bolton) can issue private commands directly in WhatsApp DMs with the bot:

| Command | Usage | Description |
| :--- | :--- | :--- |
| `!remind` | `!remind 30m,5m "Wadhwani Q&A session starting in 30 mins! Join: https://..."` | Schedules automated group reminders prior to meetings or submission deadlines. |
| `!announce` | `!announce "New submission rules for MIT Universal AI have been updated."` | Broadcasts an instant official announcement across active cohort group chats. |
| `!recap` | `!recap` | Synthesizes today's admin announcements or recent updates into a clear executive summary (anonymizes participant names). |
| `!delete` / `!revoke` | Reply to any bot message with `!delete` | Instantly revokes/deletes the target bot message for everyone in the chat. |
| `!links` | `!links` | Retrieves all categorized official links (portals, forms, recordings, sheets). |
| `!deadlines` | `!deadlines` | Displays active milestone countdowns and submission cutoffs. |
| `!schedule` | `!schedule` | Displays upcoming scheduled group reminders. |
| `!reset` | `!reset` | Resets current DM conversation context memory. |

---

### 2. Managing System Facilitators & Admin Permissions
Facilitators are recognized automatically via phone numbers and WhatsApp PushNames.

To update or add program facilitators:
1. Open `worker/bot.js` in your editor.
2. Update `FACILITATOR_MAP` and `FACILITATOR_CORE_NUMBERS`:

```javascript
const FACILITATOR_MAP = [
  { name: 'victor', jid: '2349093696284@s.whatsapp.net' },
  { name: 'diane', jid: '250783188655@s.whatsapp.net' },
  { name: 'charles', jid: '27793565520@s.whatsapp.net' },
  { name: 'gift', jid: '263774094822@s.whatsapp.net' },
  { name: 'jeovaire', jid: '250789355992@s.whatsapp.net' },
  { name: 'munira', jid: '250786387244@s.whatsapp.net' }
];

const FACILITATOR_CORE_NUMBERS = [
  '9093696284',
  '783188655',
  '793565520',
  '774094822',
  '789355992',
  '786387244'
];
```
3. Save and commit changes.

---

### 3. Managing Operational Scope Modes
The bot supports 3 scope modes configured dynamically via the Next.js Admin Portal or directly in Supabase table `bot_config`:

1. **Both (`both`)**: Responds to tagged/quoted/fresh questions in groups AND handles all private DMs.
2. **Private Only (`private_only`)**: Responds ONLY to private DMs. Ignores all group messages.
3. **Group Deactivated (`group_deactivated`)**: Monitors groups silently (recording links & admin announcements) but NEVER auto-replies in groups. Responds fully in private DMs.

To change via Supabase SQL Editor:
```sql
UPDATE bot_config SET chat_scope = 'both' WHERE id = 1;
-- Options: 'both', 'private_only', 'group_deactivated'
```

---

### 4. Session Maintenance & Web QR Management

#### Checking Connection Status
Visit `https://your-render-url.onrender.com/qr` or `http://localhost:10000/qr`.
- **Status Green (`✅ Connected to WhatsApp`)**: Worker is actively listening.
- **Status Amber (`⏳ Initializing...`)**: QR code generating or socket reconnecting.

#### Resetting Stale WhatsApp Session
If WhatsApp log-out occurs or socket disconnects persistently:
1. Visit `https://your-render-url.onrender.com/reset-qr` in your browser.
2. This automatically purges `whatsapp_auth` records from Supabase and generates a fresh QR code.
3. Scan the new QR code with your phone.

Alternatively, execute in Supabase SQL Editor:
```sql
TRUNCATE TABLE whatsapp_auth;
```
Then restart the worker process.

---

### 5. Knowledge Base Maintenance & Log-on-Miss
1. Open the Next.js Admin Portal (`/admin`).
2. **Publish FAQs**: Add new course rules, deadlines, or portal guides under **Knowledge Base**.
3. **Resolve Unanswered Queries ("Log-on-Miss")**:
   - Review entries in the **Unresolved Queries** tab (logged automatically when the bot could not resolve a question).
   - Click **Resolve & Add to Knowledge Base** to answer and train the bot with one click.
4. **Manual Knowledge Seeding Script**:
   Edit `worker/addKnowledgeEntries.js` or `worker/resetAndSeedKnowledgeBase.js` and execute `npm run seed`.

---

### 6. Troubleshooting Common Maintenance Issues

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **Bot not replying in Group** | Scope set to `private_only` or `group_deactivated`, or Master Switch OFFLINE. | Check Next.js Admin Dashboard or run `UPDATE bot_config SET is_active=true, chat_scope='both' WHERE id=1;`. |
| **Logged Out / Conflict Error** | Phone unlinked or secondary WhatsApp Web session logged in. | Visit `/reset-qr` to purge session and re-scan QR code. |
| **PDF Attachment Fails** | Google Service Account key invalid or folder missing permissions. | Verify `GOOGLE_SERVICE_ACCOUNT_EMAIL` has **Editor** access to `GOOGLE_DRIVE_FOLDER_ID`. |
| **LID Tagging (`@1203...`)** | Raw WhatsApp LID string parsed instead of E.164 phone. | Internal LID guard handles this automatically; ensure `FACILITATOR_MAP` includes the member's phone number. |
| **Render Container Sleep** | Self-ping URL missing or UptimeRobot monitor disabled. | Ensure `RENDER_EXTERNAL_URL` is set in Render environment and HTTP monitor is active on `/health`. |

---

## 📄 License & Maintainer Credits

- **Program**: UNDP timbuktoo UniPods METI AI Innovation Programme
- **Maintainers**: Victor Akpan, Diane, Gift Ntuli, Jeovaire Umukundwa, Munira Umugwaneza, Charles Bolton.
- **Tech Stack**: Baileys, Google Gemini API, Supabase, Google Drive API, Next.js, React, Tailwind CSS, Render, Vercel.
