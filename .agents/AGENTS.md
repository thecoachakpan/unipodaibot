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
