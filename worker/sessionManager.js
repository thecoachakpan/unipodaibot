/**
 * PodPal BOT - Session Memory, DM Session Tracker & Garbage Collector
 * Maintains sliding-window conversation turns (3 Q&A pairs / 6 messages) for DMs
 * and tracks DM session existence for Smart Group-to-DM Response Routing.
 *
 * DM session existence is persisted to Supabase (dm_sessions table) to survive
 * Render free-tier spin-downs and process restarts. Conversation history remains
 * in-memory only (ephemeral by design).
 */

export const userSessions = new Map();
export const summaryQueue = [];

/**
 * Normalizes a JID by stripping WhatsApp device suffixes (e.g. ":5").
 * "2349093696284:5@s.whatsapp.net" → "2349093696284@s.whatsapp.net"
 * This ensures DM-side and group-side lookups resolve to the same session key.
 */
function normalizeSessionJid(jid) {
  if (!jid || typeof jid !== 'string') return '';
  return jid.replace(/:\d+@/, '@');
}

const MAX_TURNS = 3; // Retains last 3 Q&A pairs (6 messages)
const MAX_TURN_CHARS = 500; // Truncate individual turn text to prevent token inflation
const SESSION_TTL_MS = 30 * 60 * 1000; // 30-minute inactivity limit (in-memory conversation history)
const DM_SESSION_TTL_MS = 48 * 60 * 60 * 1000; // 48-hour DM session existence TTL (persisted in Supabase)
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // Sweep every 10 minutes
const MAX_TOTAL_SESSIONS = 1000; // Hard cap

// Supabase client reference — set via initSessionSupabase()
let supabaseClient = null;

/**
 * Initialize Supabase client for DM session persistence.
 * Must be called once at bot startup with the Supabase client instance.
 */
export function initSessionSupabase(supabase) {
  supabaseClient = supabase;
}

/**
 * Records that a user has an active DM session with the bot.
 * Persists to Supabase so it survives process restarts and Render spin-downs.
 *
 * @param {string} phoneJid - Phone-based JID for lookup (e.g. "2349093696284@s.whatsapp.net")
 * @param {string} [transportJid] - Raw transport JID used by Baileys (could be @lid or @s.whatsapp.net).
 *   This is the JID that sock.sendMessage must use to avoid Signal session ratchet corruption.
 */
export async function recordDMSession(phoneJid, transportJid) {
  const key = normalizeSessionJid(phoneJid);
  if (!key || key.includes('@g.us')) return;

  // If phoneJid is an @lid and no separate phone JID was provided, still record it
  // so the session exists. Group-side lookups will use the phone JID from group metadata.
  const isLidOnly = key.includes('@lid');
  if (isLidOnly && !transportJid) {
    // @lid-only session (no phone resolution available) — store under @lid key
    // This allows hasActiveDMSession to find it when queried with the same @lid
  }

  // Determine the actual transport JID to persist
  const rawTransport = transportJid ? normalizeSessionJid(transportJid) : key;

  if (supabaseClient) {
    try {
      const upsertData = {
        jid: key,
        last_dm_at: new Date().toISOString()
      };
      // Store transport_jid if different from the lookup key (gracefully skip if column doesn't exist yet)
      if (rawTransport !== key) {
        upsertData.transport_jid = rawTransport;
      }

      const { error } = await supabaseClient.from('dm_sessions').upsert(
        upsertData,
        { onConflict: 'jid' }
      );

      if (error) {
        // If transport_jid column doesn't exist yet, retry without it
        if (error.message?.includes('transport_jid')) {
          const { error: retryErr } = await supabaseClient.from('dm_sessions').upsert({
            jid: key,
            last_dm_at: new Date().toISOString()
          }, { onConflict: 'jid' });
          if (retryErr) {
            console.error(`[DM Session Persist Error]: ${retryErr.message}`);
          } else {
            console.log(`[DM Session] 💾 Persisted DM session for ${key} (no transport_jid column)`);
          }
        } else {
          console.error(`[DM Session Persist Error]: ${error.message} (code: ${error.code})`);
        }
      } else {
        const transportLabel = rawTransport !== key ? ` (transport: ${rawTransport})` : '';
        console.log(`[DM Session] 💾 Persisted DM session for ${key}${transportLabel}`);
      }
    } catch (err) {
      console.error('[DM Session Persist Exception]:', err?.message || err);
    }
  } else {
    console.warn('[DM Session] ⚠️ supabaseClient is null — cannot persist DM session');
  }
}

/**
 * Retrieves the actual transport JID for cross-context DM delivery.
 * When sending a DM from group context, we must use the JID that matches
 * the user's active Signal encryption session (often @lid, not @s.whatsapp.net).
 *
 * @param {string} phoneJid - Phone-based JID to look up
 * @returns {Promise<string|null>} The transport JID to use with sock.sendMessage, or null if not found
 */
export async function getTransportJidForDM(phoneJid) {
  const key = normalizeSessionJid(phoneJid);
  if (!key || !supabaseClient) return null;

  try {
    const cutoff = new Date(Date.now() - DM_SESSION_TTL_MS).toISOString();
    const { data, error } = await supabaseClient
      .from('dm_sessions')
      .select('jid, transport_jid, last_dm_at')
      .eq('jid', key)
      .gt('last_dm_at', cutoff)
      .maybeSingle();

    if (error) {
      // If transport_jid column doesn't exist, fall back to jid
      if (error.message?.includes('transport_jid')) {
        return phoneJid; // Column doesn't exist yet, use phone JID
      }
      console.error(`[DM Transport Lookup Error]: ${error.message}`);
      return null;
    }

    if (data) {
      // Prefer transport_jid (the actual @lid or @s.whatsapp.net the user DMs from)
      const transport = data.transport_jid || data.jid;
      console.log(`[DM Transport] Found transport JID for ${key}: ${transport}`);
      return transport;
    }
  } catch (err) {
    console.error('[DM Transport Lookup Exception]:', err?.message || err);
  }

  return null;
}

/**
 * Checks if a user has an active DM conversation with the bot.
 * First checks in-memory Map, then falls back to Supabase for persistence across restarts.
 */
export async function hasActiveDMSession(senderJid) {
  const key = normalizeSessionJid(senderJid);

  // Fast path: check in-memory Map first
  const session = userSessions.get(key);
  if (session && Date.now() - session.lastActive <= SESSION_TTL_MS) {
    console.log(`[DM Session] ✅ In-memory session found for ${key}`);
    return true;
  }

  // Slow path: check Supabase for persisted DM session
  if (supabaseClient) {
    try {
      const cutoff = new Date(Date.now() - DM_SESSION_TTL_MS).toISOString();
      const { data, error } = await supabaseClient
        .from('dm_sessions')
        .select('last_dm_at')
        .eq('jid', key)
        .gt('last_dm_at', cutoff)
        .maybeSingle();

      if (error) {
        console.error(`[DM Session Lookup Error]: ${error.message} (code: ${error.code})`);
        return false;
      }

      if (data) {
        console.log(`[DM Session] ✅ Found persisted DM session for ${key} (last: ${data.last_dm_at})`);
        return true;
      }

      console.log(`[DM Session] ❌ No persisted DM session for ${key}`);
    } catch (err) {
      console.error('[DM Session Lookup Exception]:', err?.message || err);
    }
  } else {
    console.warn('[DM Session] ⚠️ supabaseClient is null — cannot check DM session');
  }

  return false;
}

/**
 * Gets sliding window session turns for a user.
 */
export function getSessionHistory(senderJid) {
  const key = normalizeSessionJid(senderJid);
  const now = Date.now();
  const session = userSessions.get(key);

  if (!session || (now - session.lastActive > SESSION_TTL_MS)) {
    userSessions.set(key, { lastActive: now, messages: [] });
    return [];
  }

  session.lastActive = now;
  return session.messages;
}

/**
 * Updates session turn history.
 */
export function updateSessionHistory(senderJid, userText, modelText) {
  const key = normalizeSessionJid(senderJid);
  let session = userSessions.get(key);
  if (!session) {
    session = { lastActive: Date.now(), messages: [] };
    userSessions.set(key, session);
  }

  // Truncate individual turn text to prevent token inflation from verbose responses
  const trimmedUser = userText && userText.length > MAX_TURN_CHARS
    ? userText.substring(0, MAX_TURN_CHARS) + '…'
    : userText;
  const trimmedModel = modelText && modelText.length > MAX_TURN_CHARS
    ? modelText.substring(0, MAX_TURN_CHARS) + '…'
    : modelText;

  session.messages.push(
    { role: 'user', parts: [{ text: trimmedUser }] },
    { role: 'model', parts: [{ text: trimmedModel }] }
  );

  if (session.messages.length > MAX_TURNS * 2) {
    session.messages = session.messages.slice(-MAX_TURNS * 2);
  }

  session.lastActive = Date.now();
}

/**
 * Clears session turns for a user.
 */
export function clearSessionHistory(senderJid) {
  userSessions.delete(normalizeSessionJid(senderJid));
}

/**
 * Background garbage collector purging expired sessions.
 */
function purgeExpiredSessions() {
  const now = Date.now();
  let purgedCount = 0;

  for (const [jid, session] of userSessions.entries()) {
    if (now - session.lastActive > SESSION_TTL_MS) {
      userSessions.delete(jid);
      purgedCount++;
    }
  }

  if (userSessions.size > MAX_TOTAL_SESSIONS) {
    const sorted = [...userSessions.entries()].sort((a, b) => a[1].lastActive - b[1].lastActive);
    const overflow = userSessions.size - MAX_TOTAL_SESSIONS;
    for (let i = 0; i < overflow; i++) {
      userSessions.delete(sorted[i][0]);
      purgedCount++;
    }
  }

  if (purgedCount > 0) {
    console.log(`[SessionSweeper] Evicted ${purgedCount} expired sessions. Active: ${userSessions.size}`);
  }
}

const cleanupTimer = setInterval(purgeExpiredSessions, CLEANUP_INTERVAL_MS);
cleanupTimer.unref();

export function stopCleanupTimer() {
  clearInterval(cleanupTimer);
}
