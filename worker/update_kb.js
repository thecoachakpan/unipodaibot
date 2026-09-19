/**
 * One-time Knowledge Base Update Script
 * Inserts all extracted links, schedules, and program info from Sept 15-18 group chat
 * into the Supabase knowledge_entries table.
 *
 * Run: node worker/update_kb.js
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const entries = [
  {
    course_name: "General",
    source_type: "link",
    link_url: "https://teams.microsoft.com/l/meetup-join/19%3ameeting_MmNmZTM5MGEtYzk0OC00NzA3LWJmOGEtZDUwMWE2YjMzZDBh%40thread.v2/0?context=%7b%22Tid%22%3a%22ca00be73-61fb-4299-8e41-db10438ec6cf%22%2c%22Oid%22%3a%22aa18ed52-f5bf-404c-bbbc-4340798be1fb%22%7d",
    content: "### Official Microsoft Teams Meeting Link for Daily Live Sessions & Webinars\n- **Teams Meeting Link**: https://teams.microsoft.com/l/meetup-join/19%3ameeting_MmNmZTM5MGEtYzk0OC00NzA3LWJmOGEtZDUwMWE2YjMzZDBh%40thread.v2/0?context=%7b%22Tid%22%3a%22ca00be73-61fb-4299-8e41-db10438ec6cf%22%2c%22Oid%22%3a%22aa18ed52-f5bf-404c-bbbc-4340798be1fb%22%7d\n- **Passcode**: 3v0hF3\n- **Details**: Used for all daily UNIPOD METI AI Program live sessions, open hours, and webinars."
  },
  {
    course_name: "General",
    source_type: "link",
    link_url: "https://drive.google.com/drive/folders/17B80XQ78XzC99gqR7G59mS0_fll9k9aW",
    content: "### Official Google Drive Folder for Recorded Live Sessions & Slides\n- **Google Drive Folder Link**: https://drive.google.com/drive/folders/17B80XQ78XzC99gqR7G59mS0_fll9k9aW\n- **Details**: Contains video recordings and slide decks of all past live sessions, webinars, and orientation presentations."
  },
  {
    course_name: "MIT",
    source_type: "course_guideline",
    link_url: "https://mit-online.mit.edu/",
    content: "### MIT Online Courses & Certification Rules\n- **Platform Link**: https://mit-online.mit.edu/\n- **Requirements**: Complete all 16 foundational modules with a pass score of >= 70%.\n- **Deadline**: Sunday, 18 October 2026.\n- **Certificate**: Verified MIT Certificate issued to enrolled primary applicant upon completion."
  },
  {
    course_name: "Wadhwani",
    source_type: "course_guideline",
    content: "### Wadhwani AI Lifelong Learning Portal & Ignite Track\n- **Curriculum**: 14-week structured business model development.\n- **Weekly Lectures**: Tuesdays @ 3:00 PM CAT.\n- **Weekly Q&A / Coaching**: Thursdays @ 3:00 PM CAT (Meeting ID: 419 860 837 373 470, Passcode: g2Z7gc7Q)."
  },
  {
    course_name: "General",
    source_type: "faq",
    content: "### UNIPOD Chatbot Hackathon Rules & Deliverables\n- **Dates**: 18 Sept – 24 Sept 2026.\n- **Prize**: $5,000 cash.\n- **Team Constraints**: 3 to 5 members per team, max 2 from same country, at least 1 female team member.\n- **Submission Requirements**: GitHub Repo URL + Deployed Web App/Bot Link + 3-minute Video Pitch (Loom/YouTube).\n- **Judging Criteria**: Problem alignment, technical execution depth, prompt safety, and UI quality."
  }
];

async function updateKnowledgeBase() {
  console.log(`Inserting ${entries.length} new knowledge base entries into Supabase...`);

  const { error } = await supabase.from('knowledge_entries').insert(entries);

  if (error) {
    console.error('Error inserting entries:', error);
  } else {
    console.log('Successfully inserted 5 new knowledge base entries with links & guidelines!');
  }
}

updateKnowledgeBase().catch(console.error);
