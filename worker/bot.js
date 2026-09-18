/**
 * PodPal BOT - WhatsApp AI Assistant Background Worker
 * Production Baileys WhatsApp client powered by Google Gemini 3.1 Flash-Lite,
 * Supabase Realtime config sync, Google Drive auto-uploader, computer vision
 * screenshot diagnostics, smart DM routing, and admin private scheduling.
 */

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  downloadMediaMessage
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

import qrcode from 'qrcode-terminal';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
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
  const { state, saveCreds } = await useMultiFileAuthState('auth_session');

  const sock = makeWASocket({
    auth: state,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n======================================================');
      console.log('📱 SCAN THIS QR CODE WITH YOUR WHATSAPP BOT PHONE');
      console.log('======================================================\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const reconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (reconnect) startBot();
    } else if (connection === 'open') {
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

      // Gemini 3.1 Flash-Lite Call
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: contentsPayload,
        config: {
          systemInstruction,
          temperature: 0.2,
        }
      });

      let replyText = response.text || 'Unable to generate response.';
      replyText = formatWhatsAppMarkdown(replyText);

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
