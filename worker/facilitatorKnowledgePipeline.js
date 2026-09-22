/**
 * PodPal BOT - Facilitator AI Auto-Summarizer & Retroactive Resolution Pipeline
 * Automatically parses group messages from facilitators/admins, extracts program knowledge,
 * inserts into Supabase knowledge_entries, reacts with contextual emojis, and resolves past unanswered queries.
 */

/**
 * Processes explicit !save commands sent by verified facilitators/admins.
 */
export async function processFacilitatorMessage(sock, msg, supabase, ai, callAiFallback) {
  try {
    const senderJid = msg.key.remoteJid;
    const rawText = msg.message?.conversation ||
                    msg.message?.extendedTextMessage?.text ||
                    msg.message?.imageMessage?.caption ||
                    msg.message?.documentMessage?.caption || '';

    // Strip !save, !savekb, !kb command prefix
    const cleanContent = rawText.replace(/^!(savekb|save|kb)\s*/i, '').trim();

    // Extract Quoted Message Context (if facilitator is replying to a participant or previous announcement)
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo ||
                        msg.message?.conversation?.contextInfo;
    const quotedText = contextInfo?.quotedMessage?.conversation ||
                       contextInfo?.quotedMessage?.extendedTextMessage?.text ||
                       contextInfo?.quotedMessage?.imageMessage?.caption ||
                       contextInfo?.quotedMessage?.documentMessage?.caption || '';
    const quotedParticipant = contextInfo?.participant ? `@${contextInfo.participant.split('@')[0]}` : '';

    let contentToProcess = cleanContent;
    if (quotedText) {
      contentToProcess = cleanContent
        ? `[Referenced Message (${quotedParticipant}): "${quotedText}"]\nFacilitator Note: "${cleanContent}"`
        : `[Referenced Message (${quotedParticipant}): "${quotedText}"]`;
    }

    if (!contentToProcess || contentToProcess.trim().length === 0) {
      await sock.sendMessage(senderJid, {
        text: '⚠️ *Usage*: Type `!save <information to save>` or quote-reply to an announcement/question with `!save`.'
      }, { quoted: msg });
      return { success: false, reason: 'empty_content' };
    }

    const prompt = `
You are a Knowledge Base Content Formatter for the UniPods METI AI cohort.
An Admin/Facilitator explicitly executed a !save command to add official cohort knowledge to the bot's Knowledge Base.

TARGET CONTENT TO SAVE:
"${contentToProcess}"

TASK:
1. Format this into a clean, structured Markdown knowledge entry.
2. Determine:
   - "course_name": "MIT" | "Wadhwani" | "Ethiopia AI" | "General"
   - "summary_content": A structured Markdown Q&A or official guideline snippet summarizing the rule, deadline, or answer.
   - "link_url": Extract any URL found in the text (or null if none).
   - "emoji_reaction": "📌" (for announcements/deadlines) or "🧠" (for FAQs/guidelines).
   - "verifies_previous_info": boolean (true if this corrects/updates previously saved info).
   - "verification_note": Brief text if it updates past info (or null).

Return STRICT JSON only matching this exact schema:
{
  "course_name": string,
  "summary_content": string,
  "link_url": string | null,
  "emoji_reaction": string,
  "verifies_previous_info": boolean,
  "verification_note": string | null
}
`.trim();

    const systemInstruction = 'You are a precise JSON extractor. Output valid JSON only without markdown code blocks.';
    const rawAiResponse = await callAiFallback(prompt, systemInstruction);

    let cleanJson = rawAiResponse.trim();
    if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '').trim();
    if (cleanJson.startsWith('```')) cleanJson = cleanJson.replace(/```/g, '').trim();

    const result = JSON.parse(cleanJson);
    if (!result || !result.summary_content) {
      await sock.sendMessage(senderJid, { text: '❌ Failed to parse knowledge entry. Please try again.' }, { quoted: msg });
      return { success: false };
    }

    console.log(`[Facilitator KB Pipeline] 🧠 Saved knowledge entry (${result.course_name}): ${result.summary_content.substring(0, 80)}...`);

    // 1. Insert into Supabase knowledge_entries
    const { data: inserted, error: dbErr } = await supabase.from('knowledge_entries').insert({
      course_name: result.course_name || 'General',
      source_type: 'facilitator_broadcast',
      content: result.summary_content,
      link_url: result.link_url || null
    }).select().single();

    if (dbErr) {
      console.error('[Facilitator KB Pipeline] Supabase Insert Error:', dbErr);
      await sock.sendMessage(senderJid, { text: `❌ Database insert error: ${dbErr.message}` }, { quoted: msg });
      return { success: false };
    }

    // 2. React to facilitator's WhatsApp message with emoji
    const reactionEmoji = result.emoji_reaction || '📌';
    try {
      await sock.sendMessage(senderJid, {
        react: { text: reactionEmoji, key: msg.key }
      });
    } catch (reactErr) {}

    // 3. Post confirmation receipt on WhatsApp
    const receiptText = '📌 *Noted!*';
    try {
      await sock.sendMessage(senderJid, { text: receiptText }, { quoted: msg });
    } catch (sendErr) {}

    // 4. Retroactive Unresolved Queries Resolution
    resolvePastUnansweredQueries(sock, supabase, callAiFallback, result.summary_content);

    return { success: true, summaryContent: result.summary_content };

  } catch (err) {
    console.error('[Facilitator KB Pipeline Error]:', err?.message || err);
    try {
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error saving knowledge entry: ${err?.message || err}` }, { quoted: msg });
    } catch (_) {}
    return { success: false, error: err?.message };
  }
}

/**
 * Checks pending unresolved queries in Supabase and answers them if newly learned knowledge provides the answer.
 */
async function resolvePastUnansweredQueries(sock, supabase, callAiFallback, newKnowledgeText) {
  try {
    const { data: pendingQueries, error } = await supabase
      .from('unresolved_queries')
      .select('*')
      .eq('is_resolved', false)
      .order('asked_at', { ascending: false })
      .limit(10);

    if (error || !pendingQueries || pendingQueries.length === 0) return;

    console.log(`[Retroactive Resolution] Checking ${pendingQueries.length} pending unresolved queries against newly learned knowledge...`);

    for (const item of pendingQueries) {
      const matchPrompt = `
A facilitator just posted new verified cohort information:
"${newKnowledgeText}"

UNRESOLVED QUESTION ASKED BY PARTICIPANT:
"${item.question}"

TASK:
1. Does the new facilitator information answer this unresolved question?
2. If YES:
   - "can_answer": true
   - "answer_text": "Write a friendly, ultra-concise answer in WhatsApp markdown addressing their question based on the new information."
3. If NO:
   - "can_answer": false
   - "answer_text": null

Return JSON:
{
  "can_answer": boolean,
  "answer_text": string | null
}
`.trim();

      const systemInstruction = 'You are a precise JSON evaluator. Output valid JSON only.';
      const res = await callAiFallback(matchPrompt, systemInstruction);

      let clean = res.trim();
      if (clean.startsWith('```json')) clean = clean.replace(/```json/g, '').replace(/```/g, '').trim();
      if (clean.startsWith('```')) clean = clean.replace(/```/g, '').trim();

      const matchResult = JSON.parse(clean);

      if (matchResult && matchResult.can_answer && matchResult.answer_text) {
        console.log(`[Retroactive Resolution] 🎯 Found answer for pending query ID ${item.id} (${item.sender_jid}): ${matchResult.answer_text}`);

        // Post answer to the participant / group
        const targetJid = item.sender_jid;
        const answerPayload = `📢 *Update regarding your earlier question*:\n\n${matchResult.answer_text}`;

        try {
          await sock.sendMessage(targetJid, { text: answerPayload });
          // Mark query as resolved in database
          await supabase.from('unresolved_queries').update({ is_resolved: true }).eq('id', item.id);
          console.log(`[Retroactive Resolution] ✅ Marked query ${item.id} as resolved in database.`);
        } catch (sendErr) {
          console.warn(`[Retroactive Resolution] Failed to send answer to ${targetJid}:`, sendErr?.message || sendErr);
        }
      }
    }
  } catch (err) {
    console.error('[Retroactive Resolution Error]:', err?.message || err);
  }
}
