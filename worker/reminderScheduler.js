/**
 * PodPal BOT - Admin Private DM Scheduled Reminders Engine
 * Checks Supabase `scheduled_reminders` on a 1-minute ticker and posts
 * group reminders automatically (e.g. 30m & 5m before calls, 12h & 1h before deadlines).
 */

import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: { persistSession: false },
    realtime: { transport: WebSocket }
  }
);

let socketRef = null;
let tickerTimer = null;

export function setSchedulerSocket(sock) {
  socketRef = sock;
}

/**
 * Parses admin reminder input (e.g. `!remind 30m,5m "Wadhwani Call" at 2026-09-18T15:00:00Z`).
 */
export async function createScheduledReminder(creatorJid, title, eventTimeIso, offsets = [30, 5], groupJid = 'all') {
  const { data, error } = await supabase
    .from('scheduled_reminders')
    .insert({
      creator_jid: creatorJid,
      group_jid: groupJid,
      title: title,
      scheduled_for: eventTimeIso,
      offsets: offsets,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error('[Scheduler Error]:', error);
    throw error;
  }

  return data;
}

/**
 * 1-minute background ticker that evaluates pending reminders.
 */
async function checkAndSendReminders() {
  if (!socketRef) return;

  try {
    const { data: reminders, error } = await supabase
      .from('scheduled_reminders')
      .select('*')
      .eq('status', 'pending');

    if (error || !reminders || reminders.length === 0) return;

    const now = Date.now();

    for (const item of reminders) {
      const scheduledTime = new Date(item.scheduled_for).getTime();
      const diffMinutes = Math.round((scheduledTime - now) / (60 * 1000));
      const targetJid = item.group_jid === 'all' ? item.creator_jid : item.group_jid;

      // Handle Native WhatsApp Polls
      if (item.reminder_type === 'poll' && item.poll_options?.length > 0) {
        if (scheduledTime <= now) {
          await socketRef.sendMessage(targetJid, {
            poll: {
              name: item.title,
              values: item.poll_options,
              selectableCount: 1
            }
          });
          await supabase.from('scheduled_reminders').update({ status: 'completed' }).eq('id', item.id);
          continue;
        }
      }

      // Handle Instant / Daily Proactive Announcements
      if ((item.reminder_type === 'announcement' || item.reminder_type === 'daily_update') && scheduledTime <= now) {
        const updateHeader = item.reminder_type === 'daily_update' ? '📢 *DAILY COHORT UPDATE*' : '📢 *ANNOUNCEMENT*';
        const msgText = `${updateHeader}\n\n${item.title}`;
        await socketRef.sendMessage(targetJid, { text: msgText });
        await supabase.from('scheduled_reminders').update({ status: 'completed' }).eq('id', item.id);
        continue;
      }

      // Handle Timed Meeting / Event Reminders
      const offsets = item.offsets || [30, 5];
      const sentOffsets = item.sent_offsets || [];

      for (const offset of offsets) {
        // Trigger if within 1-minute window of offset
        if (diffMinutes <= offset && diffMinutes > offset - 2 && !sentOffsets.includes(offset)) {
          const formattedOffset = offset >= 60 ? `${Math.round(offset / 60)} hour(s)` : `${offset} minute(s)`;
          
          const reminderMsg = `🔔 *REMINDER: Upcoming Cohort Event*\n\n📌 *${item.title}*\n⏰ Starting in *${formattedOffset}*!\n\n*Timezones*: ${new Date(scheduledTime).toLocaleTimeString()} (CAT / WAT / EAT)`;

          await socketRef.sendMessage(targetJid, { text: reminderMsg });
          sentOffsets.push(offset);
          await supabase.from('scheduled_reminders').update({ sent_offsets: sentOffsets }).eq('id', item.id);
        }
      }

      // Mark as completed if all offsets sent or event passed
      if (sentOffsets.length >= offsets.length || diffMinutes < -30) {
        await supabase.from('scheduled_reminders').update({ status: 'completed' }).eq('id', item.id);
      }
    }
  } catch (err) {
    console.error('[Reminder Ticker Error]:', err);
  }
}

export function startReminderScheduler(sock) {
  setSchedulerSocket(sock);
  if (tickerTimer) clearInterval(tickerTimer);
  tickerTimer = setInterval(checkAndSendReminders, 60 * 1000); // 1-minute interval
  console.log('✅ Admin Scheduled Reminders Ticker running (60s check).');
}

export function stopReminderScheduler() {
  if (tickerTimer) clearInterval(tickerTimer);
}
