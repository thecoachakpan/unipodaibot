/**
 * PodPal BOT - Admin & Participant Private DM Scheduled Reminders Engine
 * Checks Supabase `scheduled_reminders` on a 1-minute ticker and delivers
 * scheduled reminders directly to user DMs or group chats.
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
 * Creates a scheduled reminder entry in Supabase database.
 * Default offsets: [0] (remind at exact scheduled time, no hardcoded [30, 5]).
 */
export async function createScheduledReminder(creatorJid, title, eventTimeIso, offsets = [0], groupJid = 'all') {
  const finalOffsets = (Array.isArray(offsets) && offsets.length > 0) ? offsets : [0];
  const { data, error } = await supabase
    .from('scheduled_reminders')
    .insert({
      creator_jid: creatorJid,
      group_jid: groupJid,
      title: title,
      scheduled_for: eventTimeIso,
      offsets: finalOffsets,
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
 * Triggers as soon as current time reaches or passes the trigger threshold (scheduled_time - offset).
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
      if (isNaN(scheduledTime)) continue;

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

      // Handle Timed Reminders & Event Alerts
      const offsets = (Array.isArray(item.offsets) && item.offsets.length > 0) ? item.offsets : [0];
      const sentOffsets = item.sent_offsets || [];

      for (const offset of offsets) {
        // Trigger threshold: scheduledTime - (offset in minutes * 60 * 1000)
        const triggerTime = scheduledTime - (offset * 60 * 1000);

        if (now >= triggerTime && !sentOffsets.includes(offset)) {
          const isExactTime = (offset === 0);
          const formattedOffset = offset >= 60 ? `${Math.round(offset / 60)} hour(s)` : `${offset} minute(s)`;
          
          const reminderHeader = isExactTime ? '🔔 *REMINDER*' : '🔔 *UPCOMING EVENT REMINDER*';
          const timeDetail = isExactTime ? '⏰ It\'s time!' : `⏰ Starting in *${formattedOffset}*!`;

          const reminderMsg = `${reminderHeader}\n\n📌 *${item.title}*\n${timeDetail}\n\n*Time*: ${new Date(scheduledTime).toLocaleTimeString()} (CAT / WAT / EAT)`;

          try {
            await socketRef.sendMessage(targetJid, { text: reminderMsg });
            console.log(`[Reminder Sent] Triggered offset ${offset}m for "${item.title}" to ${targetJid}`);
          } catch (sendErr) {
            console.error(`[Reminder Send Error]:`, sendErr);
          }

          sentOffsets.push(offset);
          await supabase.from('scheduled_reminders').update({ sent_offsets: sentOffsets }).eq('id', item.id);
        }
      }

      // Mark as completed if all requested offsets have been sent OR if 15 minutes past scheduled time
      if (sentOffsets.length >= offsets.length || now >= scheduledTime + (15 * 60 * 1000)) {
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
  tickerTimer = setInterval(checkAndSendReminders, 30 * 1000); // Check every 30 seconds for precise delivery
  console.log('✅ Scheduled Reminders Ticker running (30s check).');
}

export function stopReminderScheduler() {
  if (tickerTimer) clearInterval(tickerTimer);
}

