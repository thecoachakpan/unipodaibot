/**
 * PodPal BOT - Dynamic Document Catalog & Context Matcher Module
 * Maintains the registry of available/unavailable cohort documents in Supabase and Google Drive,
 * matches requested files against keywords, actual file names, and active conversation context,
 * and prevents uploading wrong files when an unavailable document is requested.
 */

import { listGoogleDriveFiles } from './googleDrive.js';

// Default Fallback Document Registry
export const DEFAULT_DOCUMENT_CATALOG = [
  {
    doc_key: 'faq_pack',
    title: 'METI UniPods AI Innovation Programme (Cohort 1) — Official FAQ Pack',
    file_name: 'METI_UniPods_AI_Innovation_Programme_FAQ_Pack.pdf',
    drive_file_id: '1XxGcCOvLSwylMJo_YqPmclr1y1vCag5o',
    keywords: ['faq', 'info pack', 'information pack', 'faq pack', 'cohort 1', 'programme guide', 'official doc', 'official faq', 'overview', 'handbook', 'general rules', 'faq document', 'program pdf', 'programme pdf', 'program doc', 'programme doc', 'program document', 'programme document', 'cohort pdf', 'meti pdf', 'unipod pdf', 'pdf', 'program file', 'programme file', 'program guide', 'the pdf', 'the document', 'the file', 'the handbook'],
    category: 'General',
    is_available: true,
    description: 'Official METI UniPods AI Innovation Programme rules, timelines, track details, and FAQs.'
  },
  {
    doc_key: 'wadhwani_onboarding_recording',
    title: 'Wadhwani Platform Onboarding Welcome Session Stream Recording',
    file_name: 'Wadhwani_Platform_Onboarding_Session_Recording.link',
    drive_file_id: null,
    keywords: ['wadhwani onboarding recording', 'wadhwani welcome recording', 'wadhwani session recording', 'wadhwani recording link', 'wadhwani video link', 'wadhwani onboarding video'],
    category: 'Wadhwani',
    is_available: true,
    description: 'Official video recording stream link for the Wadhwani Platform Onboarding Welcome Session.'
  },
  {
    doc_key: 'wadhwani_module1_summary',
    title: 'Wadhwani Ignite Module 1 Class Session — Problem Statement & Venture Creation',
    file_name: 'Wadhwani_Ignite_Module_1_Class_Session.md',
    drive_file_id: null,
    keywords: ['wadhwani module 1', 'problem statement rules', '350 characters', '150 characters', 'venture creation', 'add member', 'problem statement guide', 'module 1 summary'],
    category: 'Wadhwani',
    is_available: true,
    description: 'Official overview, problem statement rules, venture creation steps, and FAQs for Wadhwani Module 1.'
  },
  {
    doc_key: 'wadhwani_module1_transcript',
    title: 'Wadhwani Ignite Module 1 Class Session Cleaned Verbatim Transcript',
    file_name: 'Wadhwani_Module_1_Class_Session_Clean_Transcript.md',
    drive_file_id: null,
    keywords: ['wadhwani module 1 transcript', 'problem statement transcript', 'module 1 class transcript', 'charles bolton module 1'],
    category: 'Wadhwani',
    is_available: true,
    description: 'Clean, filler-free verbatim speaker transcript of Wadhwani Module 1 class session.'
  },
  {
    doc_key: 'wadhwani_coaching_summary',
    title: 'Wadhwani Ignite Module 1 Problem Statement Coaching & Live Founder Q&A Summary',
    file_name: 'Wadhwani_Problem_Statement_Coaching_Summary.md',
    drive_file_id: null,
    keywords: ['wadhwani coaching', 'problem statement coaching', 'beneficiary vs paying customer', 'shop pilot statement', 'coaching summary', 'pitch critique'],
    category: 'Wadhwani',
    is_available: true,
    description: 'Official coaching guide, character limit rules, beneficiary vs paying customer rules, Shop Pilot benchmark, and 19 live founder pitch reviews.'
  },
  {
    doc_key: 'wadhwani_coaching_transcript',
    title: 'Wadhwani Ignite Problem Statement Coaching Cleaned Verbatim Transcript',
    file_name: 'Wadhwani_Problem_Statement_Coaching_Clean_Transcript.md',
    drive_file_id: null,
    keywords: ['wadhwani coaching transcript', 'problem statement coaching transcript', 'coaching transcript', 'charles bolton coaching'],
    category: 'Wadhwani',
    is_available: true,
    description: 'Clean, filler-free verbatim speaker transcript of Wadhwani Problem Statement Coaching session.'
  },
  {
    doc_key: 'wadhwani_module2_part1_summary',
    title: 'Wadhwani Ignite Module 2 (Part 1) — Customer Identification, Segmentation & Initial Persona Creation',
    file_name: 'Wadhwani_Module_2_Part1_Customer_Identification_Segmentation_Persona.md',
    drive_file_id: null,
    keywords: ['wadhwani module 2', 'customer identification', 'customer segmentation', 'initial persona', 'b2c b2b b2g', 'end user vs buyer', 'jobs to be done', 'jtbd', 'amina persona', 'satellite lnb case study', 'module 2 summary', 'module 2 part 1', 'customer persona'],
    category: 'Wadhwani',
    is_available: true,
    description: 'Official summary of Wadhwani Module 2 (Part 1) covering B2C/B2B/B2G segmentation, End User vs Buyer rules, Satellite LNB case study, JTBD, and initial customer persona creation.'
  },

  {
    doc_key: 'wadhwani_template',
    title: 'Wadhwani Business Model & Venture Canvas Template',
    file_name: 'Wadhwani_Business_Model_Template.pdf',
    drive_file_id: null,
    keywords: ['wadhwani template', 'wadhwani business model', 'ignite template', 'venture canvas', 'business model template', 'ignite deliverable', 'wadhwani guide'],
    category: 'Wadhwani',
    is_available: false,
    description: 'Wadhwani Ignite 14-week business model development template.'
  },
  {
    doc_key: 'mit_onboarding_summary',
    title: 'MIT Universal AI Welcome & Onboarding Overview',
    file_name: 'MIT_Universal_AI_Onboarding_Summary.md',
    drive_file_id: null,
    keywords: ['mit onboarding', 'universal ai onboarding', 'mit welcome session', 'mit onboarding summary', 'mit grading rules', 'mit rules', 'mit orientation'],
    category: 'MIT',
    is_available: true,
    description: 'Official overview, grading rules, platform access policies, and FAQs for the MIT Universal AI track.'
  },
  {
    doc_key: 'mit_onboarding_transcript',
    title: 'MIT Universal AI Welcome Session Cleaned Verbatim Transcript',
    file_name: 'MIT_Universal_AI_Onboarding_Clean_Transcript.md',
    drive_file_id: null,
    keywords: ['mit transcript', 'mit onboarding transcript', 'mit welcome transcript', 'universal ai transcript', 'mit video transcript', 'mit recording text'],
    category: 'MIT',
    is_available: true,
    description: 'Clean, filler-free verbatim speaker transcript of the MIT Universal AI onboarding call.'
  },
  {
    doc_key: 'mit_syllabus',
    title: 'MIT Universal AI Foundational Course Syllabus',
    file_name: 'MIT_Universal_AI_Syllabus.pdf',
    drive_file_id: null,
    keywords: ['mit syllabus', 'mit course guide', 'mit module syllabus', 'mit foundational guide', 'mit curriculum pdf'],
    category: 'MIT',
    is_available: false,
    description: 'Detailed syllabus and module breakdown for the MIT Universal AI track.'
  },
  {
    doc_key: 'workplan_template',
    title: 'Addis Ababa EAII Costed Workplan Template',
    file_name: 'Addis_Costed_Workplan_Template.pdf',
    drive_file_id: null,
    keywords: ['costed workplan', 'workplan template', 'ethiopia workplan', 'addis workplan', 'workplan doc'],
    category: 'Ethiopia AI',
    is_available: false,
    description: 'Official costed workplan submission template for the Ethiopian AI Institute phase.'
  }
];

/**
 * Fetches current catalog entries from Supabase `document_catalog` table AND live Google Drive folder files.
 */
export async function getDocumentCatalog(supabase) {
  let catalog = [];
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('document_catalog')
        .select('*')
        .order('is_available', { ascending: false });

      if (!error && data && data.length > 0) {
        catalog = [...data];
      }
    } catch (err) {
      console.warn('[DocumentCatalog] Supabase catalog fetch warning, using default registry:', err?.message || err);
    }
  }

  if (!catalog || catalog.length === 0) {
    catalog = [...DEFAULT_DOCUMENT_CATALOG];
  }

  // Live Google Drive Discovery: Fetch live files from Google Drive folder
  try {
    const driveFiles = await listGoogleDriveFiles();
    if (driveFiles && driveFiles.length > 0) {
      for (const file of driveFiles) {
        const fileKey = file.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        const existsIndex = catalog.findIndex(d => d.drive_file_id === file.id || d.doc_key === fileKey);

        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const cleanTitle = baseName.replace(/[_\-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const fileKeywords = Array.from(new Set([
          ...baseName.toLowerCase().split(/[\s_\-\.\,]+/).filter(w => w.length >= 2),
          file.name.toLowerCase(),
          baseName.toLowerCase()
        ]));

        const driveEntry = {
          doc_key: fileKey,
          title: cleanTitle,
          file_name: file.name,
          drive_file_id: file.id,
          keywords: fileKeywords,
          category: /wadhwani/i.test(file.name) ? 'Wadhwani' : (/mit/i.test(file.name) ? 'MIT' : 'General'),
          is_available: true,
          description: `Google Drive Document: ${file.name}`
        };

        if (existsIndex >= 0) {
          // Update drive_file_id and is_available status for existing entry
          catalog[existsIndex].drive_file_id = file.id;
          catalog[existsIndex].is_available = true;
          catalog[existsIndex].file_name = file.name;
          catalog[existsIndex].keywords = Array.from(new Set([...catalog[existsIndex].keywords, ...fileKeywords]));
        } else {
          // Add newly discovered Google Drive file to catalog
          catalog.unshift(driveEntry);
        }
      }
    }
  } catch (driveErr) {
    console.warn('[DocumentCatalog] Live Drive folder scan warning:', driveErr?.message || driveErr);
  }

  return catalog;
}

/**
 * Matches a user's prompt and conversation context against the dynamic document catalog & Google Drive files.
 *
 * @param {string} promptText - Inbound user prompt
 * @param {string} conversationContext - Preceding chat turns text
 * @param {object} supabase - Supabase client instance
 * @returns {Promise<object>} Match result { status, doc, availableDocs, requestedTitle }
 */
export async function matchRequestedDocument(promptText, conversationContext = '', supabase) {
  const catalog = await getDocumentCatalog(supabase);
  const promptLower = (promptText || '').toLowerCase().trim();
  const contextLower = (conversationContext || '').toLowerCase().trim();
  const fullText = `${promptLower} ${contextLower}`;

  const availableDocs = catalog.filter(d => d.is_available && d.drive_file_id);
  const unavailableDocs = catalog.filter(d => !d.is_available);

  // 1. Specific Title / File-Name Search Engine (Score each document based on matching keywords)
  let bestMatchDoc = null;
  let highestScore = 0;

  for (const doc of catalog) {
    let score = 0;
    const titleLower = (doc.title || '').toLowerCase();
    const fileNameLower = (doc.file_name || '').toLowerCase();

    // Check key word matches in prompt
    for (const kw of doc.keywords) {
      if (kw.length >= 3 && promptLower.includes(kw)) {
        score += (kw === titleLower || kw === fileNameLower) ? 10 : 3;
      }
    }

    // Direct substring match on document title or file name
    const titleWords = titleLower.split(/[\s_\-\.]+/).filter(w => w.length >= 3 && !['pdf', 'doc', 'file', 'the', 'and', 'for'].includes(w));
    let matchingTitleWords = 0;
    for (const tw of titleWords) {
      if (promptLower.includes(tw)) {
        matchingTitleWords++;
      }
    }

    if (matchingTitleWords > 0) {
      score += matchingTitleWords * 5;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatchDoc = doc;
    }
  }

  // If a specific document scored high (Score >= 5), return it directly!
  if (bestMatchDoc && highestScore >= 5) {
    if (bestMatchDoc.is_available && bestMatchDoc.drive_file_id) {
      return {
        status: 'MATCHED_AVAILABLE',
        doc: bestMatchDoc,
        score: highestScore,
        matchedKeyword: true
      };
    } else {
      return {
        status: 'MATCHED_UNAVAILABLE',
        doc: bestMatchDoc,
        requestedTitle: bestMatchDoc.title,
        availableDocs
      };
    }
  }

  // 2. Fallback check for explicit unavailable requests by name/category
  if (promptLower.includes('wadhwani') && (promptLower.includes('template') || promptLower.includes('canvas'))) {
    const wDoc = catalog.find(d => d.doc_key === 'wadhwani_template') || { title: 'Wadhwani Business Model Template' };
    return { status: 'MATCHED_UNAVAILABLE', doc: wDoc, requestedTitle: wDoc.title, availableDocs };
  }

  if (promptLower.includes('mit') && (promptLower.includes('syllabus') || promptLower.includes('curriculum'))) {
    const mDoc = catalog.find(d => d.doc_key === 'mit_syllabus') || { title: 'MIT Universal AI Syllabus' };
    return { status: 'MATCHED_UNAVAILABLE', doc: mDoc, requestedTitle: mDoc.title, availableDocs };
  }

  if ((promptLower.includes('workplan') || promptLower.includes('budget')) && (promptLower.includes('template'))) {
    const eDoc = catalog.find(d => d.doc_key === 'workplan_template') || { title: 'Addis Ababa Costed Workplan Template' };
    return { status: 'MATCHED_UNAVAILABLE', doc: eDoc, requestedTitle: eDoc.title, availableDocs };
  }

  // 3. Generic Document Request (e.g. "send me the PDF" / "download document")
  const isGenericDocumentRequest = /(send|upload|get|download|share|give|need|attach|see|show|provide|drop|pass).*(pdf|doc|document|file|handbook|guide|source)/i.test(promptLower) ||
                                   /(pdf|document|handbook|source)\b/i.test(promptLower);

  if (isGenericDocumentRequest) {
    // Check if prompt or context mentions specific track keywords
    if (/wadhwani/i.test(fullText)) {
      const wadhwaniDoc = availableDocs.find(d => /wadhwani/i.test(d.title) || /wadhwani/i.test(d.file_name));
      if (wadhwaniDoc) {
        return { status: 'MATCHED_AVAILABLE', doc: wadhwaniDoc, matchedContext: true };
      }
    }

    if (/mit/i.test(fullText)) {
      const mitDoc = availableDocs.find(d => /mit/i.test(d.title) || /mit/i.test(d.file_name));
      if (mitDoc) {
        return { status: 'MATCHED_AVAILABLE', doc: mitDoc, matchedContext: true };
      }
    }

    // Default to first available document (or FAQ pack)
    const fallbackDoc = availableDocs.find(d => d.doc_key === 'faq_pack') || availableDocs[0];
    if (fallbackDoc) {
      return {
        status: 'MATCHED_AVAILABLE',
        doc: fallbackDoc,
        matchedContext: true
      };
    }
  }

  // 4. Cold, Vague Request
  return {
    status: 'VAGUE_COLD_REQUEST',
    availableDocs
  };
}
