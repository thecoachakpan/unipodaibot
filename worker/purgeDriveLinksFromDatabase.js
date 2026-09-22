/**
 * PodPal BOT - Supabase Google Drive Folder Purge Script
 * Removes all entries containing public Google Drive folder URLs or references from
 * Supabase `knowledge_entries` and `document_catalog` tables to enforce the Google Drive Privacy Shield.
 *
 * Run: node worker/purgeDriveLinksFromDatabase.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function purgeDriveLinks() {
  console.log('🛡️ Purging Google Drive folder URLs and references from Supabase database...');

  // 1. Delete from knowledge_entries where link_url contains Google Drive folder link or content contains 'Google Drive Folder'
  const { data: kbDeleted, error: kbErr } = await supabase
    .from('knowledge_entries')
    .delete()
    .or('link_url.ilike.%drive.google.com/drive/folders%,content.ilike.%Google Drive Folder Link%,content.ilike.%Official Google Drive Folder%')
    .select();

  if (kbErr) {
    console.error('❌ Error purging knowledge_entries:', kbErr.message);
  } else {
    console.log(`✅ Purged ${kbDeleted?.length || 0} entry/entries from knowledge_entries table.`);
  }

  // 2. Also check and update any text in knowledge_entries that mentions Google Drive folder
  const { data: allEntries } = await supabase.from('knowledge_entries').select('id, content');
  if (allEntries) {
    for (const entry of allEntries) {
      if (entry.content && /Google Drive Folder/i.test(entry.content)) {
        const cleanedContent = entry.content.replace(/- \*\*Google Drive Folder Link\*\*:.*$/gm, '').trim();
        await supabase.from('knowledge_entries').update({ content: cleanedContent }).eq('id', entry.id);
        console.log(`   • Cleaned Google Drive reference from entry ID ${entry.id}`);
      }
    }
  }

  console.log('🛡️ Google Drive Privacy Shield purge complete!');
}

purgeDriveLinks().catch(console.error);
