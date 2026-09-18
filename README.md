# PodPal BOT - UniPods METI AI Assistant & Admin Dashboard

**PodPal BOT** is an automated, production-grade WhatsApp AI Assistant and Management Dashboard designed for the UniPods METI AI Innovation Cohort (240+ startup founders, facilitators, and program leads across MIT Universal AI, Wadhwani Ignite, and Ethiopia AI Institute tracks).

It operates with **zero cloud storage costs**, supports **multilingual voice notes** (English, French, Arabic), includes **Per-Turn Dynamic Language Detection & Mid-Chat Switching**, **Engaging Humanized DM Welcome Persona**, **Multi-Participant Summary Queue & Varied Receipts**, **Missed Meeting Executive Summary & Action Points Dispatch**, **Smart Group-to-DM Response Routing**, **Message Revocation (`!delete`)**, **Admin DM Private Scheduling**, **Automatic Link Extraction (`!links`)**, **Expired Event Guards**, **Proactive Screenshot Requests & Computer Vision Diagnostics**, **Meta anti-ban guardrails**, **group quote-replies**, auto-uploads cohort PDFs to **Google Drive**, and provides a **Supabase Auth protected admin portal**.

---

## 🌟 Key Features

1. **WhatsApp AI Background Worker (Render 24/7 Container)**
   - Built on `@whiskeysockets/baileys` (WhatsApp Web multi-device emulation).
   - Powered by **Google Gemini 3.1 Flash-Lite** (`@google/genai`).
   - **Per-Turn Dynamic Multilingual Detection & Mid-Chat Language Switcher**: Detects the language of every prompt (English, French, Arabic, Amharic, etc.) on each turn. If a user switches from English to French mid-conversation, PodPal BOT seamlessly switches to French!
   - **Engaging DM Welcome Message**: Greets new DM users with a warm, encouraging, humanized overview of capabilities in their language while enforcing a firm program focus shield against off-topic queries.
   - **Multi-Participant Summary Dispatch Queue & Varied Group Receipts**: When multiple participants reply *"Yes, send to me too"*, PodPal BOT queues them, dispatches summaries sequentially with a 2.5s jitter delay, and posts natural varied group receipts (*"I have sent it to your DM!"*, *"Check your DM shortly"*, *"You'll get it right away!"*).
   - **Missed Meeting Executive Summary & Action Points Dispatcher**: When founders ask about concluded sessions, PodPal BOT proactively offers to send executive summaries and key action items, and answers follow-up questions about what was discussed.
   - **Smart Group-to-DM Response Routing**:
     - General cohort questions -> Answered directly in group.
     - Participant-specific queries -> If user previously messaged bot: sends detailed response to DM & posts *"Check your DM, I've responded to your message"* in group. If user has never messaged bot: posts *"Send me 'Hi' in a private chat and I will respond to your question"* in group (strictly complying with Meta anti-ban rules).
   - **Message Revocation Engine (`!delete` / `!revoke`)**: Admins can reply to any bot message with `!delete` to revoke it instantly for everyone.
   - **Admin Private DM Scheduling Engine**: Admins (Diane, Gift, Jeovaire, Munira, Charles Bolton) can chat with PodPal BOT in private DMs to schedule group meeting reminders (e.g. 30m, 5m before calls) or deadline warnings (12h, 1h before submission).
   - **Automatic Link Extraction & Indexing (`!links`)**: Intercepts URLs shared by admins and categorizes them so founders can retrieve links anytime.
   - **Expired Event & Past Deadline Guard**: Detects concluded events, informs users, and provides recording/slides links or support contacts (`unipods.regional@undp.org`).
   - **Proactive Screenshot Requests**: Asks for screenshots when technical queries lack context.
   - **Computer Vision Screenshot Diagnostic Engine**: Ingests image attachments (`image/jpeg`, `image/png`, `image/webp`) in RAM and uses Gemini 3.1 Flash-Lite's vision capabilities alongside session context.
   - Group Chat Intelligence: Triggers when tagged (`@bot`, `!ask`), when facilitators are mentioned, **OR when a group member directly replies to a previous message from PodPal BOT**.
   - Anti-Ban Guardrails: Presence updates (`composing`), 2.0s–3.5s artificial jitter, per-user 15s rate limiter, and program-relevance guard filter.
   - Google Drive automated PDF ingestion for cohort guidelines and info-packs.
   - Unanswered question logging ("Log on Miss") to `unresolved_queries`.

2. **Next.js Admin Portal with Supabase Auth (Vercel - $0)**
   - **Authentication Guard**: Protected login using Supabase Auth.
   - **Remote Master Kill Switch**: Enable or suspend bot activity instantly across all channels.
   - **Operational Scope Toggle**: Switch between *Private DMs Only* and *DMs & Groups (Mention & Quote-Reply)*.
   - **Scheduled Reminders Monitor**: View and manage upcoming group reminders.
   - **Knowledge Publisher**: Publish Q&A pairs, meeting transcripts, or course rules categorized by track.
   - **Log-on-Miss Synthesizer**: Review questions the bot couldn't resolve from the knowledge base and update answers with one click.

---

## 🛠️ Step-by-Step Setup Guides

### 1. Google Drive Service Account Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project named `PodPal-BOT` and enable the **Google Drive API** under **APIs & Services**.
3. Go to **IAM & Admin > Service Accounts**, create a service account named `podpal-bot-drive`.
4. Create a **JSON key** for the service account and download it.
5. Open your Google Drive, create a folder (e.g., `PodPal BOT Cohort Resources`), and share it with your Service Account email address giving **Editor** access.
6. Copy the Folder ID from the URL (`drive.google.com/drive/folders/FOLDER_ID`).
7. Fill `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, and `GOOGLE_DRIVE_FOLDER_ID` in your `.env`.

### 2. Render 24/7 Background Worker Setup
1. Sign up/Log in to [Render](https://render.com).
2. Create a new **Background Worker** (or **Web Service**).
3. Connect your repository containing `Dockerfile` / `render.yaml`.
4. Configure environment variables in the Render dashboard (`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_*`).
5. Deploy! Render will keep the container running 24/7. Pairing QR code will render in logs.

---

## 🚀 Environment Variables (`.env`)

```env
# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Supabase Credentials
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Drive Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=podpal-bot-drive@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_DRIVE_FOLDER_ID=your_shared_drive_folder_id
```
