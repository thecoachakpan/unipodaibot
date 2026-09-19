/**
 * PodPal BOT - Facilitator AI Auto-Summarizer & Retroactive Resolution Pipeline
 * Automatically parses group messages from facilitators/admins, extracts program knowledge,
 * inserts into Supabase knowledge_entries, reacts with contextual emojis, and resolves past unanswered queries.
 */

/**
 * Processes messages sent by verified facilitators/admins.
 */
export async function processFacilitatorMessage(sock, msg, supabase, ai, callAiFallback) {
  try {
    const senderJid = msg.key.remoteJid;
    const rawText = msg.message?.conversation ||
                    msg.message?.extendedTextMessage?.text ||
                    msg.message?.imageMessage?.caption ||
                    msg.message?.documentMessage?.caption || '';

    if (!rawText || rawText.trim().length < 8) return;

    // Extract Quoted Message Context (if facilitator is replying to a participant)
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo ||
                        msg.message?.conversation?.contextInfo;
    const quotedText = contextInfo?.quotedMessage?.conversation ||
                       contextInfo?.quotedMessage?.extendedTextMessage?.text ||
                       contextInfo?.quotedMessage?.imageMessage?.caption || '';
    const quotedParticipant = contextInfo?.participant ? `@${contextInfo.participant.split('@')[0]}` : '';

    let quotedContextStr = '';
    if (quotedText) {
      quotedContextStr = `FACILITATOR WAS QUOTE-REPLYING TO THIS PARTICIPANT (${quotedParticipant}) MESSAGE:\n"${quotedText}"`;
    }

    const prompt = `
You are analyzing a WhatsApp message posted by a Cohort Facilitator/Admin in a UniPods METI AI cohort group chat.

FACILITATOR MESSAGE CONTENT:
"${rawText}"

${quotedContextStr}

TASK:
1. Determine if this message contains program-relevant information (deadlines, schedules, links, portal rules, track details, assignment instructions, debunks of misleading claims, or official advice).
   - If NOT program-related (e.g. casual greeting, personal update, simple logistics like "brb", "good morning"), set "is_program_related": false.
2. If program-related ("is_program_related": true):
   - "course_name": "MIT" | "Wadhwani" | "Ethiopia AI" | "General"
   - "summary_content": A clean, structured Markdown Q&A or official guideline snippet summarizing what was communicated or debunked.
   - "link_url": Extract any URL found in the message (or null if none).
   - "emoji_reaction": Choose the best single emoji reaction:
     - "📌" for announcements, schedules, links, or documents.
     - "🧠" for Q&As, platform guidance, or track instructions.
     - "✅" for debunking misconceptions, clarifying rumors, or confirming correct rules.
     - "💡" for tips, advice, or coaching insights.
   - "verifies_previous_info": boolean (true if this corrects or updates previously communicated info).
   - "verification_note": Brief text if it updates past info (e.g., "Updated UN GA demo deadline to Sept 20.").

Return STRICT JSON only matching this exact schema:
{
  "is_program_related": boolean,
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
    if (!result || !result.is_program_related || !result.summary_content) return;

    console.log(`[Facilitator AI Pipeline] 🧠 Auto-extracted knowledge entry (${result.course_name}): ${result.summary_content.substring(0, 80)}...`);

    // 1. Insert into Supabase knowledge_entries
    const { data: inserted, error: dbErr } = await supabase.from('knowledge_entries').insert({
      course_name: result.course_name || 'General',
      source_type: 'facilitator_broadcast',
      content: result.summary_content,
      link_url: result.link_url || null
    }).select().single();

    if (dbErr) console.error('[Facilitator AI Pipeline] Supabase Insert Error:', dbErr);

    // 2. React to facilitator's WhatsApp message with appropriate emoji
    const reactionEmoji = result.emoji_reaction || '🧠';
    try {
      await sock.sendMessage(senderJid, {
        react: {
          text: reactionEmoji,
          key: msg.key
        }
      });
      console.log(`[Facilitator AI Pipeline] 🎭 Reacted with ${reactionEmoji} to facilitator message.`);
    } catch (reactErr) {
      console.warn('[Facilitator AI Pipeline] Reaction error:', reactErr?.message || reactErr);
    }

    // 3. Verification Notice (If facilitator corrected/updated previous info)
    if (result.verifies_previous_info && result.verification_note) {
      try {
        await sock.sendMessage(senderJid, {
          text: `ℹ️ *Official Facilitator Update Verified*:\n${result.verification_note}\n\n*Updated Knowledge Base Context*: ${result.summary_content}`
        }, { quoted: msg });
      } catch (verErr) {
        console.warn('[Facilitator AI Pipeline] Verification note error:', verErr?.message || verErr);
      }
    }

    // 4. Retroactive Unresolved Queries Resolution
    resolvePastUnansweredQueries(sock, supabase, callAiFallback, result.summary_content);

  } catch (err) {
    console.error('[Facilitator AI Pipeline Error]:', err?.message || err);
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
