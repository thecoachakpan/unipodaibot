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
    course_name: "MIT",
    source_type: "course_guideline",
    link_url: "https://mit-online.mit.edu/",
    content: "### MIT Online Courses & Certification Rules\n- **Platform Link**: https://mit-online.mit.edu/\n- **Requirements**: Complete all 16 foundational modules with an overall pass score of >= 60% (Assignments = 80%, Knowledge Checks = 20%).\n- **Navigation Rule**: Sign in via email invitation and click **Dashboard** (top right) to access Universal AI modules.\n- **Deadline**: Sunday, 18 October 2026.\n- **Support Email**: uaisupport@mit.edu"
  },
  {
    course_name: "Wadhwani",
    source_type: "course_guideline",
    link_url: "https://wadhwanifoundation-my.sharepoint.com/personal/charles_bolton_wadhwanifoundation_org/_layouts/15/stream.aspx?id=%2Fpersonal%2Fcharles%5Fbolton%5Fwadhwanifoundation%5Forg%2FDocuments%2FRecordings%2FUNDP%20UniPod%20AI%20Program%20%2D%20Wadhwani%20Platform%20Onboarding%20%28Welcome%20Session%29%2D20260910%5F150209%2DMeeting%20Recording%2Emp4&nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIicpbnJlZmVycmFsQXBwUGxhdGZvcm0iOiJXZWIiLCJyZWZlcnJhbE1vZGUiOiJ2aWV3In0sImdhIjoxLCJyZWZlcnJlciI6IlN0cmVhbVdlYkFwcC5XZWIiLCJyZWZlcnJlclNjZW5hcmlvIjoiQWRkcmVzc0JhckNvcGllZC52aWV3LjFkOTIzNzRiLWY4OWUtNDJlNy04MTBhLTdkZWI4YzlhM2I0MSJ9",
    content: "### Wadhwani AI Lifelong Learning Portal & Ignite Track\n- **Curriculum**: 12-week structured business model development.\n- **Weekly Lectures**: Tuesdays @ 3:00 PM CAT.\n- **Weekly Q&A / Coaching**: Thursdays @ 3:00 PM CAT (Meeting ID: 419 860 837 373 470, Passcode: g2Z7gc7Q).\n- **Official Onboarding Recording**: [Watch Video Recording](https://wadhwanifoundation-my.sharepoint.com/personal/charles_bolton_wadhwanifoundation_org/_layouts/15/stream.aspx?id=%2Fpersonal%2Fcharles%5Fbolton%5Fwadhwanifoundation%5Forg%2FDocuments%2FRecordings%2FUNDP%20UniPod%20AI%20Program%20%2D%20Wadhwani%20Platform%20Onboarding%20%28Welcome%20Session%29%2D20260910%5F150209%2DMeeting%20Recording%2Emp4&nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0&ga=1&referrer=StreamWebApp%2EWeb&referrerScenario=AddressBarCopied%2Eview%2E1d92374b%2Df89e%2D42e7%2D810a%2D7edb8c9a3b41)"
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
