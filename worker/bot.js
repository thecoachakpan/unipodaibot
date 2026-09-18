/**
 * PodPal BOT - WhatsApp AI Assistant Background Worker
 * Production Baileys WhatsApp client powered by Google Gemini 3.1 Flash-Lite,
 * Supabase Realtime config sync, Google Drive auto-uploader, computer vision
 * screenshot diagnostics, smart DM routing, and admin private scheduling.
 */

import http from 'http';
import QRCode from 'qrcode';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  downloadMediaMessage,
  initAuthCreds,
  BufferJSON
} from '@whiskeysockets/baileys';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import {
  getSessionHistory,
  updateSessionHistory,
  clearSessionHistory,
  hasActiveDMSession,
  stopCleanupTimer
} from './sessionManager.js';
import { uploadToGoogleDrive } from './googleDrive.js';
import { startReminderScheduler, createScheduledReminder } from './reminderScheduler.js';

import WebSocket from 'ws';
import qrcode from 'qrcode-terminal';

dotenv.config();

let latestQrString = null;
let isConnectedToWA = false;

// HTTP Health Check & Web QR Code Server for Render Deployment
const port = process.env.PORT || 10000;
const server = http.createServer(async (req, res) => {
  const url = req.url || '/';
  if (url === '/qr' || url === '/qr/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    if (isConnectedToWA) {
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>PodPal BOT - Status</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
            .card { background: #1e293b; padding: 35px; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); max-width: 420px; width: 100%; border: 1px solid #334155; }
            .status { display: inline-block; padding: 10px 24px; border-radius: 9999px; font-weight: 700; font-size: 15px; margin-top: 20px; background: #10b98122; color: #34d399; border: 1px solid #10b98144; }
            h2 { margin-top: 0; color: #38bdf8; font-size: 24px; }
            p { color: #94a3b8; font-size: 15px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>🤖 PodPal BOT is Online!</h2>
            <p>WhatsApp client is fully authenticated and actively listening for cohort queries 24/7.</p>
            <div class="status">✅ Connected to WhatsApp</div>
          </div>
        </body>
        </html>
      `);
      return;
    }

    if (!latestQrString) {
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>PodPal BOT - Generating QR</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta http-equiv="refresh" content="4">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
            .card { background: #1e293b; padding: 35px; border-radius: 20px; max-width: 420px; width: 100%; border: 1px solid #334155; }
            h2 { color: #f59e0b; margin-top: 0; }
            p { color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>⏳ Initializing WhatsApp Engine...</h2>
            <p>Generating your fresh QR Code. Page will refresh automatically in 4 seconds...</p>
          </div>
        </body>
        </html>
      `);
      return;
    }

    try {
      const dataUrl = await QRCode.toDataURL(latestQrString, { width: 340, margin: 2 });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>PodPal BOT - Scan QR Code</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta http-equiv="refresh" content="8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
            .card { background: #1e293b; padding: 32px; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); max-width: 420px; width: 100%; border: 1px solid #334155; }
            img { width: 280px; height: 280px; border-radius: 16px; background: white; padding: 14px; margin: 20px 0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); }
            .badge { display: inline-block; padding: 6px 16px; border-radius: 9999px; font-weight: 600; font-size: 13px; background: #f59e0b22; color: #fbbf24; border: 1px solid #f59e0b44; }
            p { color: #cbd5e1; font-size: 15px; line-height: 1.5; margin: 10px 0 0 0; }
            h2 { margin: 0 0 8px 0; color: #f8fafc; font-size: 22px; }
            .instructions { font-size: 13px; color: #94a3b8; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>📱 Scan WhatsApp QR Code</h2>
            <p class="instructions">Open WhatsApp ➔ Linked Devices ➔ Link a Device, then point camera at image below:</p>
            <img src="${dataUrl}" alt="WhatsApp QR Code" />
            <div><span class="badge">⏳ Auto-refreshes every 8 seconds</span></div>
          </div>
        </body>
        </html>
      `);
    } catch (err) {
      res.end('Error generating QR code image');
    }
  } else {
    // Health check endpoint for Render deployment port detector
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'PodPal Worker', connected: isConnectedToWA }));
  }
});

server.listen(port, () => {
  console.log(`✅ HTTP Health & Web QR Server running on port ${port}`);
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: { persistSession: false },
    realtime: { transport: WebSocket }
  }
);

// Verified cohort facilitator WhatsApp JIDs (Diane, Gift, Jeovaire, Munira, Charles Bolton)
const FACILITATOR_JIDS = [
  '250788000000@s.whatsapp.net', // Diane JID
  '27793565520@s.whatsapp.net',  // Charles Bolton JID
  '250785813700@s.whatsapp.net', // Jeovaire JID
  '250781718040@s.whatsapp.net'  // Munira JID
];

const FACILITATOR_NAMES = ['diane', 'gift', 'jeovaire', 'munira', 'charles', 'bolton'];

let runtimeConfig = { is_active: true, chat_scope: 'both' };
const userCooldowns = new Map();

/**
 * Converts standard Markdown (e.g. **bold**, ### headers) to WhatsApp Markdown (*bold*).
 */
function formatWhatsAppMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/gs, '*$1*') // Convert multiline **bold** to *bold*
    .replace(/\*\*/g, '*')              // Clean up any remaining double asterisks
    .replace(/^### (.*?)$/gm, '*$1*')   // Convert ### header to *header*
    .replace(/^## (.*?)$/gm, '*$1*')    // Convert ## header to *header*
    .replace(/^# (.*?)$/gm, '*$1*');    // Convert # header to *header*
}

/**
 * Zero-cost persistent Baileys authentication state stored in Supabase database (whatsapp_auth table).
 * Ensures WhatsApp sessions survive container restarts and redeployments without re-scanning QR code!
 */
async function useSupabaseAuthState(supabaseClient) {
  const { data: credsRow } = await supabaseClient
    .from('whatsapp_auth')
    .select('value')
    .eq('key', 'creds')
    .single();

  const creds = credsRow?.value
    ? JSON.parse(JSON.stringify(credsRow.value), BufferJSON.reviver)
    : initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          const keysToFetch = ids.map(id => `${type}-${id}`);
          const { data: rows } = await supabaseClient
            .from('whatsapp_auth')
            .select('key, value')
            .in('key', keysToFetch);

          if (rows) {
            for (const row of rows) {
              const value = JSON.parse(JSON.stringify(row.value), BufferJSON.reviver);
              const id = row.key.replace(`${type}-`, '');
              data[id] = value;
            }
          }
          return data;
        },
        set: async (data) => {
          const upserts = [];
          const deletes = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              if (value) {
                upserts.push({
                  key,
                  value: JSON.parse(JSON.stringify(value, BufferJSON.replacer)),
                  updated_at: new Date().toISOString()
                });
              } else {
                deletes.push(key);
              }
            }
          }
          if (upserts.length > 0) {
            await supabaseClient.from('whatsapp_auth').upsert(upserts);
          }
          if (deletes.length > 0) {
            await supabaseClient.from('whatsapp_auth').delete().in('key', deletes);
          }
        }
      }
    },
    saveCreds: async () => {
      await supabaseClient.from('whatsapp_auth').upsert({
        key: 'creds',
        value: JSON.parse(JSON.stringify(creds, BufferJSON.replacer)),
        updated_at: new Date().toISOString()
      });
    }
  };
}

/**
 * Executes Gemini generateContent with automatic retry and model fallback for 503 high-demand spikes.
 */
async function callGeminiWithRetry(contentsPayload, systemInstruction) {
  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash'];
  let lastError = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contentsPayload,
          config: {
            systemInstruction,
            temperature: 0.2,
          }
        });
        if (response?.text) return response.text;
      } catch (err) {
        lastError = err;
        console.warn(`[Gemini Retry] Model ${modelName} (attempt ${attempt}) warning:`, err?.message || err);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  throw lastError;
}

/**
 * Dynamically builds system instruction from Supabase knowledge base with live multi-timezone timestamps.
 */
async function getDynamicSystemInstruction() {
  const { data: entries } = await supabase
    .from('knowledge_entries')
    .select('course_name, content, link_url')
    .order('created_at', { ascending: false });

  const knowledgeContext = entries?.length
    ? entries.map(e => `### [Category: ${e.course_name}]\n${e.content}${e.link_url ? `\nLink: ${e.link_url}` : ''}`).join('\n\n---\n\n')
    : 'No active guidelines registered.';

  const now = new Date();
  const nowIso = now.toISOString();
  // Calculate live cohort timezones
  const catTime = new Date(now.getTime() + 2 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19) + ' CAT (UTC+2)';
  const watTime = new Date(now.getTime() + 1 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19) + ' WAT (UTC+1)';
  const eatTime = new Date(now.getTime() + 3 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19) + ' EAT (UTC+3)';
  const gmtTime = now.toISOString().replace('T', ' ').substring(0, 19) + ' GMT/UTC';

  return `
You are PodPal BOT, the official AI Assistant for the UniPods METI AI Innovation Cohort.

CURRENT LIVE SYSTEM TIMESTAMP (RIGHT NOW):
- ISO Timestamp: ${nowIso}
- CAT (Central Africa Time / Rwanda): ${catTime}
- WAT (West Africa Time / Nigeria): ${watTime}
- EAT (East Africa Time / Ethiopia): ${eatTime}
- GMT / UTC: ${gmtTime}

CRITICAL DEADLINE COMPARISON INSTRUCTIONS:
- Compare the current LIVE timestamp against event dates before answering:
- UN General Assembly Demo Video Deadline: Friday, 18 Sept 2026 @ 2:00 PM CAT (12:00 PM GMT / 1:00 PM WAT).
- If current LIVE time is past 2:00 PM CAT (12:00 PM GMT) on Friday, 18 Sept 2026, YOU MUST explicitly inform the user that the deadline HAS PASSED today at 2:00 PM CAT. Never say the UN GA deadline is close or approaching if the current time is after 2:00 PM CAT. Direct users with late submission questions to unipods.regional@undp.org.

SUPPORTED TRACKS:
1. MIT Universal AI Track
2. Wadhwani Ignite Track
3. Ethiopia AI Institute Track

GROUNDED KNOWLEDGE BASE:
${knowledgeContext}

STRICT CONSTRAINTS & BEHAVIOR:
1. Grounded Accuracy: Answer only using facts in the knowledge base. If an event or meeting has concluded (date prior to current date), explicitly state that it has ended, provide any available recording/slides links, or refer the user to unipods.regional@undp.org.
2. Dynamic Per-Turn Language Switching: Automatically detect the language of the inbound prompt (English, French, Arabic, Amharic, etc.) on EACH turn and respond fluently in that exact same language. If a user switches languages mid-conversation, switch seamlessly with them!
3. Proactive Screenshot Request: When a user asks about a technical error, login issue, or platform bug on MIT, Wadhwani, or Ethiopia AI portals that lacks error codes or specific context, proactively prompt: "To give you exact, tailored step-by-step guidance, could you please reply with a screenshot of the error or screen you are seeing?"
4. Missed Meeting Assistance: When users inquire about past meetings, offer to provide executive summaries and key action items from the session transcript.
5. WhatsApp Formatting: Use *single asterisks* for bold. Do NOT output double asterisks (**).
6. Timezones: Always format call schedules and deadlines with explicit cohort timezones: CAT (UTC+2) / WAT (UTC+1) / EAT (UTC+3) / GMT.
7. Focus Shield: Politely decline off-topic requests (e.g., cat poems, general non-program homework) stating your specific setup as the METI AI Cohort helper.
8. Unverified Facts: If an answer cannot be verified, inform the user in their language:
   - English: "I don't have verified information on this yet. Please contact the team at unipods.regional@undp.org."
   - French: "Je n'ai pas encore d'informations vérifiées à ce sujet. Veuillez contacter l'équipe à unipods.regional@undp.org."
`;
}

/**
 * Returns engaging welcome message template in user's language.
 */
function getWelcomeMessage(isFrench = false) {
  if (isFrench) {
    return `👋 *Bonjour et bienvenue dans la cohorte d'innovation UniPods METI AI !* ✨

Je suis **PodPal BOT**, votre co-pilote 24/7 ! Je suis là pour vous accompagner tout au long des 3 parcours (**MIT Universal AI**, **Wadhwani Ignite** et **Ethiopia AI Institute**). 🚀

💡 *Voici ce que je peux faire pour vous* :
📌 *Répondre aux questions* — Posez vos questions sur les calendriers, exigences ou soumissions !
📸 *Diagnostiquer les erreurs* — Envoyez une capture d'écran d'une erreur et je l'analyserai !
🎙️ *Traiter les notes vocales* — Envoyez une note vocale (moins de 90s) dans n'importe quelle langue !
📅 *Échéances & Liens* — Tapez \`!deadlines\` pour les compte à rebours ou \`!links\` pour les ressources.
📝 *Résumés de réunions* — Vous avez manqué un appel ? Demandez-moi les points clés !

🛡️ *Bouclier Programme* : Je suis concentré à 100 % sur la réussite de votre cohorte !

*Comment puis-je vous aider aujourd'hui ?* 😊`;
  }

  return `👋 *Hey there! Welcome to the UniPods METI AI Innovation Cohort!* ✨

I’m **PodPal BOT**, your 24/7 cohort companion! I'm here to support your journey across our 3 tracks (**MIT Universal AI**, **Wadhwani Ignite**, and **Ethiopia AI Institute**). 🚀

💡 *Here is what I can do for you*:
📌 *Answer Track FAQs* — Ask me about schedules, requirements, or submission guidelines!
📸 *Diagnose Errors* — Got a platform error? Send a screenshot and I'll analyze it!
🎙️ *Listen to Voice Notes* — Drop a quick voice note (under 90s) in any language!
📅 *Milestones & Links* — Type \`!deadlines\` for countdowns or \`!links\` for official resources.
📝 *Meeting Summaries* — Missed a live call? Ask me for the key action points!

🛡️ *Program Focus Guard*: I'm laser-focused on your cohort success, so while I can't write poems about cats or solve unrelated homework, I'm here 24/7 for everything METI AI!

*What can I help you build or resolve today?* 😊`;
}

let realtimeInitialized = false;

/**
 * Realtime configuration listener for master kill-switch & scope selector.
 */
async function setupConfigRealtime() {
  const { data } = await supabase.from('bot_config').select('is_active, chat_scope').eq('id', 1).single();
  if (data) runtimeConfig = data;

  if (realtimeInitialized) return;
  realtimeInitialized = true;

  supabase
    .channel('bot_runtime_sync')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bot_config', filter: 'id=eq.1' }, payload => {
      runtimeConfig = { is_active: payload.new.is_active, chat_scope: payload.new.chat_scope };
      console.log('[Config Updated Live]:', runtimeConfig);
    })
    .subscribe();
}

/**
 * Starts the Baileys WhatsApp client background worker.
 */
async function startBot() {
  await setupConfigRealtime();
  const { state, saveCreds } = await useSupabaseAuthState(supabase);

  const sock = makeWASocket({
    auth: state,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      latestQrString = qr;
      isConnectedToWA = false;
      console.log('\n======================================================');
      console.log('📱 SCAN THIS QR CODE WITH YOUR WHATSAPP BOT PHONE');
      console.log('======================================================\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      isConnectedToWA = false;
      const reconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (reconnect) startBot();
    } else if (connection === 'open') {
      isConnectedToWA = true;
      latestQrString = null;
      console.log('✅ PodPal BOT WhatsApp Worker online.');
      startReminderScheduler(sock);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    if (!runtimeConfig.is_active) return; // Master Kill Switch

    const senderJid = msg.key.remoteJid;
    const senderParticipant = msg.key.participant || senderJid;
    const isGroup = senderJid.endsWith('@g.us');
    const isFacilitator = FACILITATOR_JIDS.includes(senderParticipant);

    const messageType = Object.keys(msg.message || {})[0];
    const isAudio = messageType === 'audioMessage';
    const isImage = messageType === 'imageMessage';
    const isDocument = messageType === 'documentMessage';

    // ----------------------------------------------------
    // PIPELINE 0: MESSAGE REVOCATION ENGINE (!delete / !revoke)
    // ----------------------------------------------------
    const contextInfo = msg.message.extendedTextMessage?.contextInfo ||
                        msg.message.conversation?.contextInfo;
    const quotedMsgKey = contextInfo?.stanzaId;
    const rawText = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || '';
    const cleanLower = rawText.trim().toLowerCase();

    if (isFacilitator && (cleanLower === '!delete' || cleanLower === '!revoke') && quotedMsgKey) {
      try {
        await sock.sendMessage(senderJid, {
          delete: {
            remoteJid: senderJid,
            fromMe: true,
            id: quotedMsgKey
          }
        });
        console.log(`[Message Revoked] Deleted bot message ${quotedMsgKey} by facilitator request.`);
        return;
      } catch (err) {
        console.error('[Message Revocation Error]:', err);
      }
    }

    // ----------------------------------------------------
    // PIPELINE 1: GOOGLE DRIVE DOCUMENT UPLOAD
    // ----------------------------------------------------
    if (isDocument) {
      const docMsg = msg.message.documentMessage;
      const caption = docMsg.caption || '';
      const fileSize = parseInt(docMsg.fileLength || '0');

      if (fileSize <= 20971520) { // Max 20MB
        const isTriggered = caption.toLowerCase().includes('!save') || caption.toLowerCase().includes('!resource');
        if (isFacilitator || isTriggered) {
          try {
            await sock.sendPresenceUpdate('composing', senderJid);
            const fileBuffer = await downloadMediaMessage(msg, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
            const fileName = docMsg.fileName || 'Cohort_Resource.pdf';
            const mimeType = docMsg.mimetype || 'application/pdf';

            const driveLink = await uploadToGoogleDrive(fileBuffer, fileName, mimeType);
            const category = fileName.toLowerCase().includes('mit') ? 'MIT' :
                             fileName.toLowerCase().includes('wadhwani') ? 'Wadhwani' : 'General';

            await supabase.from('knowledge_entries').insert({
              course_name: category,
              source_type: 'whatsapp_qa',
              content: `### Document: ${fileName}\nOfficial resource available on drive: [Download ${fileName}](${driveLink})`,
              link_url: driveLink
            });

            const confirmText = `✅ *Official Document Uploaded to Google Drive*:\n\n*Name*: ${fileName}\n*Link*: ${driveLink}\n\nAdded to knowledge base and searchable!`;
            await sock.sendPresenceUpdate('paused', senderJid);
            await sock.sendMessage(senderJid, { text: confirmText }, { quoted: msg });
            return;
          } catch (error) {
            console.error('[Document Upload Error]:', error);
          }
        }
      }
    }

    // Voice note group guardrail
    if (isGroup && isAudio) return;

    // Check quote-reply to PodPal BOT in groups
    const isQuotedBotReply = isGroup && contextInfo?.participant?.includes(sock.user?.id?.split(':')[0]);
    const mentionsAdmin = FACILITATOR_NAMES.some(admin => cleanLower.includes(admin));
    const isTagged = cleanLower.includes('@bot') || cleanLower.includes('!ask');

    // Group Chat Scope Filtering
    if (isGroup) {
      if (runtimeConfig.chat_scope === 'private_only') return;
      if (!isTagged && !mentionsAdmin && !isQuotedBotReply) return;
    }

    // Per-user cooldown jitter (15s)
    const now = Date.now();
    const lastUserTime = userCooldowns.get(senderParticipant) || 0;
    if (isGroup && now - lastUserTime < 15000) return;
    userCooldowns.set(senderParticipant, now);

    const cleanPrompt = rawText.replace(/@bot/gi, '').replace(/!ask/gi, '').trim();

    // ----------------------------------------------------
    // PIPELINE 2: COMMANDS & WELCOME ROUTING
    // ----------------------------------------------------

    // Reset Command
    if (!isGroup && (cleanPrompt.toLowerCase() === '!reset' || cleanPrompt.toLowerCase() === '!clear')) {
      clearSessionHistory(senderJid);
      await sock.sendMessage(senderJid, { text: '🧹 Conversation turns reset. How can I help you?' }, { quoted: msg });
      return;
    }

    // Links Command
    if (cleanPrompt.toLowerCase() === '!links') {
      const { data: linkEntries } = await supabase.from('knowledge_entries').select('content, link_url').not('link_url', 'is', null);
      let linksText = `📌 *Official UniPods METI AI Cohort Resource Links*:\n\n`;
      if (linkEntries?.length) {
        linkEntries.forEach((l, idx) => { linksText += `${idx + 1}. ${l.content}\n🔗 ${l.link_url}\n\n`; });
      } else {
        linksText += `• Primary Email: unipods.regional@undp.org\n• MIT Support: uaisupport@mit.edu`;
      }
      await sock.sendMessage(senderJid, { text: linksText }, { quoted: msg });
      return;
    }

    // Deadlines Command
    if (cleanPrompt.toLowerCase() === '!deadlines' || cleanPrompt.toLowerCase() === '!schedule') {
      const deadlinesText = `⏳ *Upcoming Cohort Milestones & Deadlines*:\n\n1. 🎬 *UN General Assembly Demo Video*: Friday, 18 Sept 2026 @ 2:00 PM CAT (12:00 PM GMT)\n2. 🏆 *UniPods Chatbot Hackathon*: 18 Sept – 24 Sept 2026 ($5,000 Prize)\n3. 🎓 *MIT Universal AI Foundational Deadline*: Sunday, 18 October 2026\n4. 💡 *Weekly Open Hour*: Every Friday @ 3:00 PM CAT\n\nAll times formatted in CAT (UTC+2) / WAT (UTC+1) / EAT (UTC+3) / GMT.`;
      await sock.sendMessage(senderJid, { text: deadlinesText }, { quoted: msg });
      return;
    }

    // Admin Private DM Reminder Command (!remind)
    if (!isGroup && isFacilitator && cleanPrompt.toLowerCase().startsWith('!remind')) {
      try {
        await createScheduledReminder(senderJid, cleanPrompt.replace('!remind', '').trim(), new Date(Date.now() + 30 * 60 * 1000).toISOString(), [30, 5]);
        await sock.sendMessage(senderJid, { text: '✅ Scheduled group reminder created and saved to database!' }, { quoted: msg });
        return;
      } catch (err) {
        await sock.sendMessage(senderJid, { text: '⚠️ Failed to schedule reminder. Ensure date/time format is valid.' }, { quoted: msg });
        return;
      }
    }

    // First-Time DM Welcome Message Trigger
    const isGreeting = ['hi', 'hello', 'bonjour', 'salut', 'start', 'menu', 'hey'].includes(cleanPrompt.toLowerCase());
    const hasHistory = hasActiveDMSession(senderJid);

    if (!isGroup && (isGreeting || !hasHistory) && !isAudio && !isImage) {
      const isFrench = ['bonjour', 'salut'].includes(cleanPrompt.toLowerCase());
      const welcome = getWelcomeMessage(isFrench);
      updateSessionHistory(senderJid, cleanPrompt, welcome);
      await sock.sendPresenceUpdate('composing', senderJid);
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000));
      await sock.sendPresenceUpdate('paused', senderJid);
      await sock.sendMessage(senderJid, { text: welcome }, { quoted: msg });
      return;
    }

    // ----------------------------------------------------
    // PIPELINE 3: AI INFERENCE & MULTIMODAL PROCESSING
    // ----------------------------------------------------
    try {
      await sock.sendPresenceUpdate('composing', senderJid);
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1500));

      const systemInstruction = await getDynamicSystemInstruction();
      let contentsPayload;

      // Vision (Screenshot) Processing
      if (isImage) {
        const imageBuffer = await downloadMediaMessage(msg, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
        const mimeType = msg.message.imageMessage?.mimetype || 'image/jpeg';
        const userCaption = msg.message.imageMessage?.caption || cleanPrompt || 'Analyze this screenshot error.';

        contentsPayload = [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: mimeType, data: imageBuffer.toString('base64') } },
              { text: `Analyze this screenshot sent by a cohort member. Identify error codes, UI elements, or platform issues on MIT, Wadhwani, or Ethiopia AI portals. Provide exact resolution steps based on grounded knowledge: ${userCaption}` }
            ]
          }
        ];
      }
      // Audio (Voice Note) Processing
      else if (isAudio) {
        if (msg.message.audioMessage?.seconds > 90) {
          await sock.sendPresenceUpdate('paused', senderJid);
          await sock.sendMessage(senderJid, { text: '⚠️ Please keep voice notes under 90 seconds so I can process them quickly.' }, { quoted: msg });
          return;
        }

        const audioBuffer = await downloadMediaMessage(msg, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
        contentsPayload = [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: 'audio/ogg', data: audioBuffer.toString('base64') } },
              { text: 'Listen to this voice note. Detect the language, transcribe, and answer accurately in that same language.' }
            ]
          }
        ];
      }
      // Group Context Single-Turn vs DM Sliding Window
      else if (isGroup) {
        contentsPayload = cleanPrompt;
      } else {
        const pastTurns = getSessionHistory(senderJid);
        contentsPayload = [...pastTurns, { role: 'user', parts: [{ text: cleanPrompt }] }];
      }

      // Gemini Call with automatic 503 retry & fallback models
      let replyText = await callGeminiWithRetry(contentsPayload, systemInstruction);
      replyText = formatWhatsAppMarkdown(replyText || 'Unable to generate response.');

      // ----------------------------------------------------
      // PIPELINE 4: SMART GROUP-TO-DM ROUTING EVALUATION
      // ----------------------------------------------------
      const isParticipantSpecific = cleanPrompt.toLowerCase().includes('my account') ||
                                     cleanPrompt.toLowerCase().includes('my credential') ||
                                     cleanPrompt.toLowerCase().includes('my score');

      if (isGroup && isParticipantSpecific) {
        const userHasDM = hasActiveDMSession(senderParticipant);

        if (userHasDM) {
          // Route detailed response to DM
          await sock.sendMessage(senderParticipant, { text: replyText });
          await sock.sendPresenceUpdate('paused', senderJid);
          await sock.sendMessage(senderJid, { text: `Hi @${senderParticipant.split('@')[0]}, check your DM! I've responded to your message.` }, { quoted: msg, mentions: [senderParticipant] });
          return;
        } else {
          // Prompt user to initiate DM
          const dmPrompt = `Hi @${senderParticipant.split('@')[0]}, for your personal account query, please send me 'Hi' in a private DM so I can send your tailored steps!`;
          await sock.sendPresenceUpdate('paused', senderJid);
          await sock.sendMessage(senderJid, { text: dmPrompt }, { quoted: msg, mentions: [senderParticipant] });
          return;
        }
      }

      // Log on miss entry
      if (replyText.toLowerCase().includes("don't have verified information") || replyText.toLowerCase().includes("pas encore d'informations")) {
        await supabase.from('unresolved_queries').insert({
          question: isAudio ? '[Voice Note]' : isImage ? '[Screenshot Query]' : cleanPrompt,
          sender_jid: senderJid
        });
      }

      if (!isGroup && !isAudio && !isImage) {
        updateSessionHistory(senderJid, cleanPrompt, replyText);
      }

      await sock.sendPresenceUpdate('paused', senderJid);
      await sock.sendMessage(senderJid, { text: replyText }, { quoted: msg });

    } catch (err) {
      console.error('[Inference Error]:', err);
      await sock.sendPresenceUpdate('paused', senderJid);
      await sock.sendMessage(senderJid, { text: '⚠️ Service error. Please try again shortly.' }, { quoted: msg });
    }
  });
}

function shutdown() {
  console.log('Shutting down PodPal BOT worker safely...');
  stopCleanupTimer();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startBot();
