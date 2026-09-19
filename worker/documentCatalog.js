/**
 * PodPal BOT - Dynamic Document Catalog & Context Matcher Module
 * Maintains the registry of available/unavailable cohort documents in Supabase,
 * matches requested files against keywords and active conversation context,
 * and prevents uploading wrong files when an unavailable document is requested.
 */

// Default Fallback Document Registry
export const DEFAULT_DOCUMENT_CATALOG = [
  {
    doc_key: 'faq_pack',
    title: 'METI UniPods AI Innovation Programme (Cohort 1) — Official FAQ Pack',
    file_name: 'METI_UniPods_AI_Innovation_Programme_FAQ_Pack.pdf',
    drive_file_id: '1XxGcCOvLSwylMJo_YqPmclr1y1vCag5o',
    keywords: ['faq', 'info pack', 'information pack', 'faq pack', 'cohort 1', 'programme guide', 'official doc', 'official faq', 'overview', 'handbook', 'general rules', 'faq document'],
    category: 'General',
    is_available: true,
    description: 'Official METI UniPods AI Innovation Programme rules, timelines, track details, and FAQs.'
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
 * Fetches current catalog entries from Supabase `document_catalog` table.
 */
export async function getDocumentCatalog(supabase) {
  try {
    const { data, error } = await supabase
      .from('document_catalog')
      .select('*')
      .order('is_available', { ascending: false });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('[DocumentCatalog] Supabase catalog fetch warning, using default registry:', err?.message || err);
  }
  return DEFAULT_DOCUMENT_CATALOG;
}

/**
 * Matches a user's prompt and conversation context against the document catalog.
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

  // 1. Direct Keyword Matching on Inbound Prompt
  for (const doc of catalog) {
    const matchesKeyword = doc.keywords.some(kw => promptLower.includes(kw));
    if (matchesKeyword) {
      if (doc.is_available && doc.drive_file_id) {
        return {
          status: 'MATCHED_AVAILABLE',
          doc,
          matchedKeyword: true
        };
      } else {
        return {
          status: 'MATCHED_UNAVAILABLE',
          doc,
          requestedTitle: doc.title,
          availableDocs
        };
      }
    }
  }

  // 2. Check if user explicitly asked for an unavailable document by name/category
  if (promptLower.includes('wadhwani') && (promptLower.includes('template') || promptLower.includes('canvas') || promptLower.includes('doc'))) {
    const wDoc = catalog.find(d => d.doc_key === 'wadhwani_template') || { title: 'Wadhwani Business Model Template' };
    return { status: 'MATCHED_UNAVAILABLE', doc: wDoc, requestedTitle: wDoc.title, availableDocs };
  }

  if (promptLower.includes('mit') && (promptLower.includes('syllabus') || promptLower.includes('curriculum') || promptLower.includes('pdf'))) {
    const mDoc = catalog.find(d => d.doc_key === 'mit_syllabus') || { title: 'MIT Universal AI Syllabus' };
    return { status: 'MATCHED_UNAVAILABLE', doc: mDoc, requestedTitle: mDoc.title, availableDocs };
  }

  if ((promptLower.includes('workplan') || promptLower.includes('budget')) && (promptLower.includes('template') || promptLower.includes('doc'))) {
    const eDoc = catalog.find(d => d.doc_key === 'workplan_template') || { title: 'Addis Ababa Costed Workplan Template' };
    return { status: 'MATCHED_UNAVAILABLE', doc: eDoc, requestedTitle: eDoc.title, availableDocs };
  }

  // 3. Conversational Context Match for Generic Follow-Ups (e.g. "send me the document", "show me the source")
  const isGenericDocumentRequest = /(send|upload|get|download|share|give|need|attach|see|show).*(pdf|doc|document|file|handbook|guide|source)/i.test(promptLower) ||
                                   /(pdf|document|handbook|source)\b/i.test(promptLower);

  if (isGenericDocumentRequest && conversationContext) {
    // If context discusses general cohort rules, timelines, FAQs, or METI programme overview:
    const isFaqContext = /(mit|wadhwani|ethiopia|cohort|track|deadline|rule|faq|program|schedule|bootcamp|unipod|general|overview)/i.test(contextLower);
    if (isFaqContext) {
      const faqDoc = availableDocs.find(d => d.doc_key === 'faq_pack') || availableDocs[0];
      if (faqDoc) {
        return {
          status: 'MATCHED_AVAILABLE',
          doc: faqDoc,
          matchedContext: true
        };
      }
    }
  }

  // 4. Cold, Vague Request (No explicit keywords matched and no active program context)
  return {
    status: 'VAGUE_COLD_REQUEST',
    availableDocs
  };
}
