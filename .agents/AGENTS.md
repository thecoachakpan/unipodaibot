# Workspace AI Rules & Constraints - PodPal BOT

## ⚠️ CRITICAL CONSTRAINTS - DO NOT MODIFY WITHOUT EXPLICIT PERMISSION

### 1. Gemini Fallback Chain Configuration
- The active Gemini Fallback Chain configuration is set to: Primary Model `gemini-3.1-flash-lite` and Fallback Model `gemini-3.5-flash-lite` in `worker/bot.js`.
- **NEVER** modify, alter, replace, or update these Gemini Fallback Chain model names or tier configuration in `worker/bot.js`, documentation, or specifications without **explicit, prior written permission from the user**.

### 2. Google Drive Privacy Shield & Support Contact Fallback Rule
- **NO Public Google Drive Folder**: There is NO official public Google Drive folder for participants. The internal Google Drive folder is strictly a backend technical storage area and MUST NEVER be exposed, mentioned, or shared.
- **NEVER Share Drive Folder Links or Claim Drive Assistance**:
  - **NEVER** output, mention, or share any Google Drive folder URLs, web links, or claim that an official Google Drive folder exists for participants.
  - **NEVER** tell participants that you can assist them in finding specific files, slides, or documents in an "official Google Drive folder".
- **Native Document Attachments Only**: When a document (e.g. PDF) is available in the catalog, download the binary buffer and send the actual native document attachment (`.pdf`) directly to WhatsApp.
- **Support Contact Fallback**: If a requested document cannot be dispatched as a native file attachment or is unavailable, direct the participant to contact the official program support email (`unipods.regional@undp.org` for general/Wadhwani cohort issues, `uaisupport@mit.edu` for MIT track) or reach out to the respective program admins (@Diane for general issues, @Gift for meetings).
- **Group vs DM Delivery**: When a file attachment is sent in a group chat, check if the participant has an active DM session (`hasActiveDMSession`). Deliver to private DM if active; if not or if DM fails, upload directly in group.

### 3. WhatsApp LID Identity Guard & PushName Admin Fallback Rule
- **NEVER** output, log, or use Linked Identity (`@lid`) numbers or raw strings longer than 15 digits in `@mention` tags, group confirmation receipts, or user phone logging. All phone numbers and mentions MUST be valid E.164 phone numbers (<=15 digits).
- **ALWAYS** check `validPushName` against `FACILITATOR_MAP` if JID resolution returns an unmapped or `@lid` identity to guarantee System Admin recognition for program facilitators (Victor Akpan, Diane, Gift, Jeovaire, Munira, Charles Bolton).

