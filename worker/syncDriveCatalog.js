/**
 * PodPal BOT - Dynamic Google Drive Document Catalog Sync Script
 * Lists all PDF files in the designated Google Drive folder and syncs/upserts them
 * into the Supabase `document_catalog` table so PodPal BOT can automatically match and serve them.
 *
 * Run: node worker/syncDriveCatalog.js
 */

import { listGoogleDriveFiles } from './googleDrive.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Extracts searchable keywords from a file name.
 * e.g., "METI_UniPods_Wadhwani_Onboarding_Summary.pdf" -> ['meti', 'unipods', 'wadhwani', 'onboarding', 'summary', 'pdf']
 */
function extractKeywords(fileName) {
  const baseName = fileName.replace(/\.[^/.]+$/, "");
  const words = baseName
    .toLowerCase()
    .split(/[\s_\-\.\,\/\(\)\[\]]+/)
    .filter(w => w.length >= 2);
  
  // Add common aliases
  const uniqueKeywords = Array.from(new Set([
    ...words,
    fileName.toLowerCase(),
    baseName.toLowerCase(),
    'pdf',
    'document',
    'file'
  ]));
  
  return uniqueKeywords;
}

/**
 * Derives a human-readable title from a file name.
 * e.g. "Wadhwani_Platform_Onboarding_Summary.pdf" -> "Wadhwani Platform Onboarding Summary"
 */
function deriveTitle(fileName) {
  const baseName = fileName.replace(/\.[^/.]+$/, "");
  return baseName
    .replace(/[_\-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

export async function syncGoogleDriveCatalog() {
  console.log('🔍 Querying Google Drive folder for available documents...');
  const driveFiles = await listGoogleDriveFiles();

  if (!driveFiles || driveFiles.length === 0) {
    console.log('⚠️ No files returned from Google Drive folder or credentials missing.');
    return [];
  }

  console.log(`📂 Discovered ${driveFiles.length} file(s) in Google Drive:`);

  const syncedDocs = [];

  for (const file of driveFiles) {
    const isPdf = file.mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const docKey = file.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const title = deriveTitle(file.name);
    const keywords = extractKeywords(file.name);

    let category = 'General';
    if (/wadhwani/i.test(file.name)) category = 'Wadhwani';
    else if (/mit/i.test(file.name)) category = 'MIT';
    else if (/ethiopia|eaii|addis/i.test(file.name)) category = 'Ethiopia AI';

    const catalogEntry = {
      doc_key: docKey,
      title: title,
      file_name: file.name,
      drive_file_id: file.id,
      keywords: keywords,
      category: category,
      is_available: true,
      description: `Google Drive PDF document: ${file.name}`
    };

    syncedDocs.push(catalogEntry);
    console.log(`   • [${category}] ${title} (File ID: ${file.id})`);

    // Upsert into Supabase document_catalog table if Supabase is connected
    if (supabase) {
      try {
        const { error } = await supabase.from('document_catalog').upsert(catalogEntry, { onConflict: 'doc_key' });
        if (error) {
          console.warn(`   ⚠️ Supabase upsert error for ${file.name}:`, error.message);
        }
      } catch (dbErr) {
        console.warn(`   ⚠️ Supabase connection warning:`, dbErr?.message || dbErr);
      }
    }
  }

  console.log(`✅ Successfully synced ${syncedDocs.length} document(s) from Google Drive into catalog!`);
  return syncedDocs;
}

// Run script directly if called from command line
if (process.argv[1]?.includes('syncDriveCatalog.js')) {
  syncGoogleDriveCatalog().catch(console.error);
}
