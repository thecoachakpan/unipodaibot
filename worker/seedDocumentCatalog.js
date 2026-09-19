/**
 * PodPal BOT - Document Catalog Seeding Script
 * Populates Supabase `document_catalog` table with initial document definitions.
 *
 * Run: node worker/seedDocumentCatalog.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { DEFAULT_DOCUMENT_CATALOG } from './documentCatalog.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDocumentCatalog() {
  console.log('🌱 Seeding Supabase `document_catalog` table...');

  // Try creating table if not exists via RPC / insert fallback
  for (const doc of DEFAULT_DOCUMENT_CATALOG) {
    const { error } = await supabase
      .from('document_catalog')
      .upsert(doc, { onConflict: 'doc_key' });

    if (error) {
      console.warn(`⚠️ Warning upserting doc ${doc.doc_key}:`, error.message);
    } else {
      console.log(`✅ Registered catalog document: ${doc.title} [Available: ${doc.is_available}]`);
    }
  }

  console.log('✅ Document Catalog seeding completed successfully!');
}

seedDocumentCatalog().catch(console.error);
