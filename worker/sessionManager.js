/**
 * PodPal BOT - Session Memory, DM Session Tracker & Garbage Collector
 * Maintains sliding-window conversation turns (3 Q&A pairs / 6 messages) for DMs
 * and tracks DM session existence for Smart Group-to-DM Response Routing.
 */

export const userSessions = new Map();
export const summaryQueue = [];

const MAX_TURNS = 3; // Retains last 3 Q&A pairs (6 messages)
const SESSION_TTL_MS = 30 * 60 * 1000; // 30-minute inactivity limit
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // Sweep every 10 minutes
const MAX_TOTAL_SESSIONS = 1000; // Hard cap

/**
 * Checks if a user has an active DM conversation history with the bot.
 * Used for Meta anti-ban safe Smart Group-to-DM Routing.
 */
export function hasActiveDMSession(senderJid) {
  const session = userSessions.get(senderJid);
  if (!session) return false;
  return Date.now() - session.lastActive <= SESSION_TTL_MS;
}

/**
 * Gets sliding window session turns for a user.
 */
export function getSessionHistory(senderJid) {
  const now = Date.now();
  const session = userSessions.get(senderJid);

  if (!session || (now - session.lastActive > SESSION_TTL_MS)) {
    userSessions.set(senderJid, { lastActive: now, messages: [] });
    return [];
  }

  session.lastActive = now;
  return session.messages;
}

/**
 * Updates session turn history.
 */
export function updateSessionHistory(senderJid, userText, modelText) {
  let session = userSessions.get(senderJid);
  if (!session) {
    session = { lastActive: Date.now(), messages: [] };
    userSessions.set(senderJid, session);
  }

  session.messages.push(
    { role: 'user', parts: [{ text: userText }] },
    { role: 'model', parts: [{ text: modelText }] }
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
  userSessions.delete(senderJid);
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
