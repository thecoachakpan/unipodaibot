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
import { startReminderScheduler, stopReminderScheduler, createScheduledReminder } from './reminderScheduler.js';

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
    // Health check & keep-alive endpoint for Render deployment
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'PodPal Worker',
      connected: isConnectedToWA,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    }));
  }
});

/**
 * Zero-Sleep Self-Ping Engine for Render Free Tier 100% Uptime
 * Pings the application's external URL every 9 minutes to prevent Render from sleeping.
 */
function startSelfPing() {
  const externalUrl = process.env.RENDER_EXTERNAL_URL || process.env.SELF_PING_URL || process.env.APP_URL;
  if (!externalUrl) {
    console.log('ℹ️ [Keep-Alive Engine]: RENDER_EXTERNAL_URL is not set yet. Will listen for incoming HTTP pings at /health.');
    return;
  }

  const pingTarget = externalUrl.endsWith('/') ? `${externalUrl}health` : `${externalUrl}/health`;
  console.log(`🚀 [Keep-Alive Engine]: Self-Ping initialized for 100% Uptime targeting: ${pingTarget}`);

  // Ping every 9 minutes (540,000 ms) — Render free tier sleeps after 15 minutes of HTTP inactivity
  setInterval(async () => {
    try {
      const res = await fetch(pingTarget);
      console.log(`[Keep-Alive Heartbeat] 🟢 Pinged ${pingTarget} — HTTP ${res.status}`);
    } catch (err) {
      console.warn(`[Keep-Alive Heartbeat] ⚠️ Self-ping failed: ${err?.message || err}`);
    }
  }, 9 * 60 * 1000);
}

server.listen(port, () => {
  console.log(`✅ HTTP Health & Web QR Server running on port ${port}`);
  startSelfPing();
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
const FACILITATOR_MAP = [
  { name: 'diane', jid: '250788000000@s.whatsapp.net' },
  { name: 'charles', jid: '27793565520@s.whatsapp.net' },
  { name: 'bolton', jid: '27793565520@s.whatsapp.net' },
  { name: 'gift', jid: '27793565520@s.whatsapp.net' },
  { name: 'jeovaire', jid: '250785813700@s.whatsapp.net' },
  { name: 'munira', jid: '250781718040@s.whatsapp.net' }
];

const FACILITATOR_JIDS = FACILITATOR_MAP.map(f => f.jid);
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
 * Helper to invoke OpenAI API models (OpenAI Chat Completions format).
 */
async function callOpenAiModel(modelName, messagesPayload) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OpenAI_API_Key;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY / OpenAI_API_Key environment variable is missing');
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: modelName,
      messages: messagesPayload,
      temperature: 0.2
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API returned HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('OpenAI API returned empty message content');
  }

  return text;
}

/**
 * Helper to invoke Groq API models (OpenAI Chat Completions format).
 */
async function callGroqModel(modelName, messagesPayload) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is missing');
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: modelName,
      messages: messagesPayload,
      temperature: 0.2
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API returned HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('Groq API returned empty message content');
  }

  return text;
}

/**
 * Converts internal payload or chat history into OpenAI message objects format for Groq & OpenAI.
 */
function convertToOpenAiMessages(contentsPayload, systemInstruction) {
  const messages = [{ role: 'system', content: systemInstruction }];

  if (typeof contentsPayload === 'string') {
    messages.push({ role: 'user', content: contentsPayload });
  } else if (Array.isArray(contentsPayload)) {
    for (const turn of contentsPayload) {
      if (typeof turn === 'string') {
        messages.push({ role: 'user', content: turn });
      } else if (turn && typeof turn === 'object') {
        const role = (turn.role === 'model' || turn.role === 'assistant') ? 'assistant' : 'user';
        let textContent = '';
        if (typeof turn.parts === 'string') {
          textContent = turn.parts;
        } else if (Array.isArray(turn.parts)) {
          for (const part of turn.parts) {
            if (part.text) {
              textContent += (textContent ? '\n' : '') + part.text;
            }
          }
        } else if (turn.content) {
          textContent = turn.content;
        }

        if (textContent) {
          messages.push({ role, content: textContent });
        }
      }
    }
  }

  return messages;
}

/**
 * Executes AI inference using a 4-tier fallback chain:
 * 1. Primary: OpenAI API -> gpt-5.6-luna (or OPENAI_MODEL) with gpt-4o fallback
 * 2. 1st Fallback: Groq API -> llama-3.3-70b-versatile
 * 3. 2nd Fallback: Gemini API -> gemini-3.5-flash-lite
 * 4. 3rd Fallback: Gemini API -> gemini-3.1-flash-lite
 */
async function callAiWithFallbackChain(contentsPayload, systemInstruction) {
  const OPENAI_PRIMARY_MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-luna';
  const GROQ_MODEL = 'llama-3.3-70b-versatile';
  const FALLBACK_1_MODEL = 'gemini-3.5-flash-lite';
  const FALLBACK_2_MODEL = 'gemini-3.1-flash-lite';

  const openAiKey = process.env.OPENAI_API_KEY || process.env.OpenAI_API_Key;

  // --- Tier 1: Primary Model (OpenAI API) ---
  if (openAiKey) {
    const messages = convertToOpenAiMessages(contentsPayload, systemInstruction);
    try {
      console.log(`[AI Pipeline] Calling Primary Model: ${OPENAI_PRIMARY_MODEL} (OpenAI API)...`);
      const reply = await callOpenAiModel(OPENAI_PRIMARY_MODEL, messages);
      console.log(`[AI Pipeline] 🟢 Primary Model (${OPENAI_PRIMARY_MODEL}) succeeded!`);
      return reply;
    } catch (err) {
      console.warn(`[AI Pipeline] ⚠️ Primary Model (${OPENAI_PRIMARY_MODEL}) failed: ${err?.message || err}. Trying OpenAI fallback gpt-4o...`);
      if (OPENAI_PRIMARY_MODEL !== 'gpt-4o' && OPENAI_PRIMARY_MODEL !== 'gpt-4o-mini') {
        try {
          const fallbackReply = await callOpenAiModel('gpt-4o', messages);
          console.log(`[AI Pipeline] 🟢 OpenAI Fallback Model (gpt-4o) succeeded!`);
          return fallbackReply;
        } catch (fbErr) {
          console.warn(`[AI Pipeline] ⚠️ OpenAI Fallback Model (gpt-4o) failed: ${fbErr?.message || fbErr}. Transitioning to Groq...`);
        }
      }
    }
  } else {
    console.warn('[AI Pipeline] OPENAI_API_KEY / OpenAI_API_Key not set. Skipping OpenAI tier.');
  }

  // --- Tier 2: Groq Model (llama-3.3-70b-versatile) ---
  if (process.env.GROQ_API_KEY) {
    try {
      console.log(`[AI Pipeline] Calling Groq Model: ${GROQ_MODEL}...`);
      const messages = convertToOpenAiMessages(contentsPayload, systemInstruction);
      const reply = await callGroqModel(GROQ_MODEL, messages);
      console.log(`[AI Pipeline] 🟢 Groq Model (${GROQ_MODEL}) succeeded!`);
      return reply;
    } catch (err) {
      console.warn(`[AI Pipeline] ⚠️ Groq Model (${GROQ_MODEL}) failed: ${err?.message || err}. Transitioning to 1st Gemini fallback...`);
    }
  } else {
    console.warn('[AI Pipeline] GROQ_API_KEY not set. Skipping Groq model.');
  }

  // --- Tier 3: 1st Fallback Model (gemini-3.5-flash-lite via Gemini API) ---
  try {
    console.log(`[AI Pipeline] Calling 1st Fallback Model: ${FALLBACK_1_MODEL} (Gemini API)...`);
    const response = await ai.models.generateContent({
      model: FALLBACK_1_MODEL,
      contents: contentsPayload,
      config: {
        systemInstruction,
        temperature: 0.2,
      }
    });
    if (response?.text) {
      console.log(`[AI Pipeline] 🟢 1st Fallback Model (${FALLBACK_1_MODEL}) succeeded!`);
      return response.text;
    }
  } catch (err) {
    console.warn(`[AI Pipeline] ⚠️ 1st Fallback Model (${FALLBACK_1_MODEL}) failed: ${err?.message || err}. Transitioning to 2nd fallback...`);
  }

  // --- Tier 4: 2nd Fallback Model (gemini-3.1-flash-lite via Gemini API) ---
  try {
    console.log(`[AI Pipeline] Calling 2nd Fallback Model: ${FALLBACK_2_MODEL} (Gemini API)...`);
    const response = await ai.models.generateContent({
      model: FALLBACK_2_MODEL,
      contents: contentsPayload,
      config: {
        systemInstruction,
        temperature: 0.2,
      }
    });
    if (response?.text) {
      console.log(`[AI Pipeline] 🟢 2nd Fallback Model (${FALLBACK_2_MODEL}) succeeded!`);
      return response.text;
    }
  } catch (err) {
    console.error(`[AI Pipeline] ❌ 2nd Fallback Model (${FALLBACK_2_MODEL}) failed: ${err?.message || err}`);
    throw err;
  }

  throw new Error('All AI models in the fallback chain failed.');
}

let cachedStaticSystemInstruction = null;
let lastKbFetchTime = 0;

/**
 * Returns a static, 100% cacheable system instruction for Groq & Gemini prompt caching.
 * Caches knowledge base in memory to ensure prompt prefix remains identical across queries.
 */
async function getStaticSystemInstruction() {
  const now = Date.now();
  if (cachedStaticSystemInstruction && (now - lastKbFetchTime < 10 * 60 * 1000)) {
    return cachedStaticSystemInstruction;
  }

  const { data: entries } = await supabase
    .from('knowledge_entries')
    .select('course_name, content, link_url')
    .order('created_at', { ascending: false });

  const knowledgeContext = entries?.length
    ? entries.map(e => `### [Category: ${e.course_name}]\n${e.content}${e.link_url ? `\nLink: ${e.link_url}` : ''}`).join('\n\n---\n\n')
    : 'No active guidelines registered.';

  cachedStaticSystemInstruction = `
You are PodPal BOT, the official AI Assistant for the UniPods METI AI Innovation Cohort.

SUPPORTED TRACKS:
1. MIT Universal AI Track
2. Wadhwani Ignite Track
3. Ethiopia AI Institute Track

GROUNDED KNOWLEDGE BASE:
${knowledgeContext}

STRICT CONSTRAINTS & BEHAVIOR:
1. Ultra-Concise & Direct: Keep all responses brief, direct, and concise (2-4 sentences max, or short bullet points for multi-step guidance). Avoid wordy intros, long filler, or conversational fluff.
2. Grounded Accuracy: Answer only using facts in the knowledge base. If an event or meeting has concluded (date prior to current date), explicitly state that it has ended, provide any available recording/slides links, or refer the user to unipods.regional@undp.org.
3. Natural Queries: Participants ask questions naturally. Do NOT require exclamation commands (!deadlines, !links) from participants. Answer natural questions about deadlines, schedules, resources, or requirements immediately and directly.
4. Dynamic Per-Turn Language Switching: Automatically detect the language of the inbound prompt (English, French, Arabic, Amharic, etc.) on EACH turn and respond fluently in that exact same language.
5. Proactive Screenshot Request: When a user asks about a technical error, login issue, or platform bug on MIT, Wadhwani, or Ethiopia AI portals that lacks error codes or specific context, proactively prompt: "To give you exact, tailored step-by-step guidance, could you please reply with a screenshot of the error or screen you are seeing?"
6. Missed Meeting Assistance: When users inquire about past meetings, offer to provide executive summaries and key action items from the session transcript.
7. WhatsApp Formatting: Use *single asterisks* for bold. Do NOT output double asterisks (**).
8. Timezones: Always format call schedules and deadlines with explicit cohort timezones: CAT (UTC+2) / WAT (UTC+1) / EAT (UTC+3) / GMT.
9. Focus Shield & Off-Topic Filter: You are strictly the AI assistant for the UniPods METI AI Innovation Cohort. If a user prompt is completely UNRELATED to the METI AI program, cohort tracks, portals, schedules, assignments, deadlines, or technical platform issues (e.g. general trivia, random jokes, recipes, sports, weather, non-program coding homework), output EXACTLY: "[OFF_TOPIC]". Do NOT answer off-topic queries.
10. Unverified Facts: If an answer cannot be verified, inform the user in their language:
   - English: "I don't have verified information on this yet. Please contact the team at unipods.regional@undp.org."
   - French: "Je n'ai pas encore d'informations vérifiées à ce sujet. Veuillez contacter l'équipe à unipods.regional@undp.org."

CRITICAL DEADLINE COMPARISON INSTRUCTIONS:
- ONLY discuss or evaluate deadlines when the user explicitly asks about deadlines, schedules, submission dates, or upcoming milestones.
- DO NOT append unsolicited deadline notices, reminders, or countdowns to answers that are unrelated to deadlines (e.g., login issues, track FAQs).
- UN General Assembly Demo Video Deadline: Friday, 18 Sept 2026 @ 2:00 PM CAT (12:00 PM GMT / 1:00 PM WAT).
- If current LIVE time is past 2:00 PM CAT (12:00 PM GMT) on Friday, 18 Sept 2026 AND the user specifically asks about the UN GA deadline, inform them that the deadline HAS PASSED. Direct users with late submission questions to unipods.regional@undp.org.
`.trim();

  lastKbFetchTime = now;
  return cachedStaticSystemInstruction;
}

/**
 * Returns live timestamp string to append to user turn payload without invalidating static prompt cache.
 */
function getLiveTimestampContext() {
  const now = new Date();
  const catTime = new Date(now.getTime() + 2 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19) + ' CAT';
  const watTime = new Date(now.getTime() + 1 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19) + ' WAT';
  const eatTime = new Date(now.getTime() + 3 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19) + ' EAT';
  return `[System Time: ${catTime} / ${watTime} / ${eatTime}]`;
}

/**
 * Returns engaging welcome message template in user's language.
 */
function getWelcomeMessage(isFrench = false) {
  if (isFrench) {
    return `👋 *Bonjour et bienvenue dans la cohorte METI AI !* ✨

Je suis *PodPal BOT*, votre assistant 24/7 pour les parcours *MIT Universal AI*, *Wadhwani Ignite* et *Ethiopia AI Institute*.

💡 *Comment puis-je vous aider ?*
• Posez vos questions sur les cours, échéances ou réunions.
• Envoyez des captures d'écran de vos erreurs pour diagnostic.
• Envoyez une note vocale (<90s).

*Quelle est votre question aujourd'hui ?* 😊`;
  }

  return `👋 *Welcome to the UniPods METI AI Cohort!* ✨

I’m *PodPal BOT*, your 24/7 assistant for *MIT Universal AI*, *Wadhwani Ignite*, and *Ethiopia AI Institute* tracks.

💡 *How I can help*:
• Ask any question about schedules, deadlines, or requirements.
• Send screenshots of platform errors for quick step-by-step guidance.
• Send short voice notes (<90s).

*How can I help you today?* 😊`;
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
      stopReminderScheduler();

      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;
      const isReplaced = statusCode === DisconnectReason.connectionReplaced;

      if (isReplaced) {
        console.warn('⚠️ [WhatsApp Worker]: Connection replaced by another active session/instance (Conflict). Waiting 10s before reconnecting to prevent session thrashing...');
        setTimeout(() => startBot(), 10000);
      } else if (!isLoggedOut) {
        console.log(`🔄 [WhatsApp Worker]: Connection closed (${statusCode || 'Unknown'}). Reconnecting in 3s...`);
        setTimeout(() => startBot(), 3000);
      } else {
        console.error('❌ [WhatsApp Worker]: Logged out from WhatsApp. Please re-scan QR code.');
      }
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

    const cleanPrompt = rawText.replace(/@bot/gi, '').replace(/!ask/gi, '').trim();
    const wordCount = cleanPrompt.split(/\s+/).filter(Boolean).length;

    // Robust Bot JID and Number Extraction for WhatsApp Groups
    const rawBotId = sock.user?.id || '';
    const botNumber = rawBotId.replace(/[^0-9]/g, '');
    const quotedParticipantNumber = (contextInfo?.participant || '').replace(/[^0-9]/g, '');
    
    // Check if user is quote-replying to a message sent by PodPal BOT in groups
    const isQuotedBotReply = isGroup && (
      (botNumber && quotedParticipantNumber && (quotedParticipantNumber.includes(botNumber) || botNumber.includes(quotedParticipantNumber))) ||
      (botNumber && contextInfo?.participant?.includes(botNumber))
    );

    const mentionedJids = contextInfo?.mentionedJid || [];
    const isBotMentionedNative = mentionedJids.some(jid => jid.replace(/[^0-9]/g, '').includes(botNumber));

    const mentionedAdmin = FACILITATOR_MAP.find(a => cleanLower.includes(a.name));
    const mentionsAdmin = !!mentionedAdmin;
    const isTagged = isBotMentionedNative || cleanLower.includes('@bot') || cleanLower.includes('!ask') || cleanLower.includes('podpal') || cleanLower.includes('bot');

    // Program-Related Inquiry Detector for Groups (Triggers strictly on program keywords or portal queries)
    const isQuestionOrInquiry = /(mit|wadhwani|ethiopia|cohort|track|recording|link|schedule|deadline|meeting|call|session|portal|submission|assignment|hackathon|credential|account|score|certificate|help|support|login|register|resource|video|demo|project)/i.test(cleanPrompt);

    // Group Chat Scope Filtering (Processes quote-replies, mentions, tags, or any program inquiries)
    if (isGroup) {
      if (runtimeConfig.chat_scope === 'private_only') return;
      if (!isTagged && !mentionsAdmin && !isQuotedBotReply && !isQuestionOrInquiry) return;
    }

    // Per-user cooldown jitter (15s)
    const now = Date.now();
    const lastUserTime = userCooldowns.get(senderParticipant) || 0;
    if (isGroup && now - lastUserTime < 15000) return;
    userCooldowns.set(senderParticipant, now);

    // Vague Admin Mention Handler in Groups (Tags Admin & Asks Participant for Specific Details)
    if (isGroup && mentionedAdmin) {
      const isVague = wordCount < 6 || cleanLower.includes('help') || cleanLower.includes('please') || cleanLower.includes('question') || cleanLower.includes('can you');
      if (isVague && !cleanLower.includes('my account') && !cleanLower.includes('my credential')) {
        const adminName = mentionedAdmin.name.charAt(0).toUpperCase() + mentionedAdmin.name.slice(1);
        const adminJid = mentionedAdmin.jid;
        const participantNumber = senderParticipant.split('@')[0];

        const vagueText = `Hi @${participantNumber}! Please share the specific question or details you would like to ask @${adminName}. I'll do my best to resolve it for you right away, and I will alert @${adminName} if further assistance is needed! 😊`;

        await sock.sendPresenceUpdate('paused', senderJid);
        await sock.sendMessage(senderJid, {
          text: vagueText,
          mentions: [senderParticipant, adminJid]
        }, { quoted: msg });
        return;
      }
    }

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

    // First-Time DM Welcome Message Trigger (Only triggered on explicit greetings, skipping for actual program questions)
    const isGreeting = ['hi', 'hello', 'bonjour', 'salut', 'start', 'menu', 'hey'].includes(cleanPrompt.toLowerCase().trim());

    if (!isGroup && isGreeting && !isAudio && !isImage) {
      const isFrench = ['bonjour', 'salut'].includes(cleanPrompt.toLowerCase().trim());
      const welcome = getWelcomeMessage(isFrench);
      updateSessionHistory(senderJid, cleanPrompt, welcome);
      await sock.sendPresenceUpdate('composing', senderJid);
      await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
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

      const systemInstruction = await getStaticSystemInstruction();
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
              { text: `Analyze this screenshot sent by a cohort member. Identify error codes, UI elements, or platform issues on MIT, Wadhwani, or Ethiopia AI portals. Provide exact resolution steps based on grounded knowledge: ${userCaption}\n\n${getLiveTimestampContext()}` }
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
              { text: `Listen to this voice note. Detect the language, transcribe, and answer accurately in that same language.\n\n${getLiveTimestampContext()}` }
            ]
          }
        ];
      }
      // Group Context Single-Turn vs DM Sliding Window
      else if (isGroup) {
        contentsPayload = `${cleanPrompt}\n\n${getLiveTimestampContext()}`;
      } else {
        const pastTurns = getSessionHistory(senderJid);
        contentsPayload = [...pastTurns, { role: 'user', parts: [{ text: `${cleanPrompt}\n\n${getLiveTimestampContext()}` }] }];
      }

      // 4-Tier AI Pipeline Execution: Primary (OpenAI gpt-5.6-luna) -> Tier 2 (Groq Llama 3.3 70B) -> Tier 3 (Gemini 3.5 Flash) -> Tier 4 (Gemini 3.1 Flash)
      let replyText = await callAiWithFallbackChain(contentsPayload, systemInstruction);

      // Silent drop off-topic questions
      if (replyText && replyText.includes('[OFF_TOPIC]')) {
        console.log(`[Focus Shield]: Silently dropping off-topic query from ${senderParticipant}`);
        await sock.sendPresenceUpdate('paused', senderJid);
        return;
      }

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
      console.error('[Inference Error - Silent Retry Exceeded]:', err);
      await sock.sendPresenceUpdate('paused', senderJid);
      // Silent catch - no error message displayed to users on WhatsApp as requested
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

process.on('uncaughtException', (err) => {
  console.error('⚠️ [Uncaught Process Error]:', err?.message || err);
  if (err?.stack) console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ [Unhandled Promise Rejection]:', reason);
});

startBot();
