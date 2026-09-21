# Workspace AI Rules & Constraints - PodPal BOT

## ⚠️ CRITICAL CONSTRAINTS - DO NOT MODIFY WITHOUT EXPLICIT PERMISSION

### 1. Gemini Fallback Chain Configuration
- The active Gemini Fallback Chain configuration is set to: Primary Model `gemini-3.1-flash-lite` and Fallback Model `gemini-3.5-flash-lite` in `worker/bot.js`.
- **NEVER** modify, alter, replace, or update these Gemini Fallback Chain model names or tier configuration in `worker/bot.js`, documentation, or specifications without **explicit, prior written permission from the user**.

### 2. Google Drive File Delivery & DM Upload Rule
- **NEVER** share, output, or send raw Google Drive links or web URLs when a file or document is requested from the Drive folder.
- **ALWAYS** download the file buffer and upload the actual native document attachment (`.pdf`, etc.) directly to WhatsApp.
- **NEVER** output text confirming or claiming that a file was sent to a private DM if no file attachment was physically dispatched and delivered.
- When a file is requested in a group chat, check if the participant has an active DM session (`hasActiveDMSession`). If the user has an active DM thread, deliver the document to their private DM. If they do not have an active DM session or if DM delivery fails, upload the file attachment directly in the group chat to ensure document delivery NEVER fails.

### 3. WhatsApp LID Identity Guard & PushName Admin Fallback Rule
- **NEVER** output, log, or use Linked Identity (`@lid`) numbers or raw strings longer than 15 digits in `@mention` tags, group confirmation receipts, or user phone logging. All phone numbers and mentions MUST be valid E.164 phone numbers (<=15 digits).
- **ALWAYS** check `validPushName` against `FACILITATOR_MAP` if JID resolution returns an unmapped or `@lid` identity to guarantee System Admin recognition for program facilitators (Victor Akpan, Diane, Gift, Jeovaire, Munira, Charles Bolton).

