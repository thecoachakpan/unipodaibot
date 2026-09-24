/**
 * PodPal BOT - MIT Universal AI Onboarding Knowledge Base Importer
 * Inserts structured, token-optimized knowledge entries from the MIT Universal AI
 * Welcome & Onboarding Session into Supabase knowledge_entries.
 *
 * Run: node worker/importMitOnboarding.js
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

const entries = [
  {
    course_name: 'MIT',
    source_type: 'onboarding_session',
    link_url: 'https://mit-online.mit.edu/',
    content: `### MIT Universal AI Onboarding — Track Structure & Completion Deadline
- **Core Curriculum**: 17 mandatory Foundational AI modules covering Python programming, data analytics, machine learning algorithms, deep learning, generative AI, and prescriptive AI.
- **Optional Vertical Modules**: Industry-specific deep dives in Precision Medicine, Holistic AI in Healthcare, Sustainable Energy, Transportation, and Finance.
- **Completion Deadline**: Sunday, 18 October 2026. Earning the foundational certificate unlocks downstream stages (Ethiopian AI Institute phase, grant funding, Addis Ababa bootcamp).
- **Platform URL**: https://mit-online.mit.edu/`
  },
  {
    course_name: 'MIT',
    source_type: 'onboarding_session',
    link_url: 'mailto:uaisupport@mit.edu',
    content: `### MIT Universal AI Onboarding — Access, Enrolment & Licensing Rules
- **Licensing Limit**: Exactly ONE (1) official licence per registered startup venture ($900 USD fee 100% waived via programme sponsorship).
- **Certificate Name**: Only the primary applicant email used during registration receives official invitation and certificate naming.
- **Team Workload Sharing**: Co-founders are encouraged to share login credentials internally to divide learning tasks.
- **Navigation Rule**: Sign in via the email invitation link and click **"Dashboard"** (top right) to see Universal AI modules. Clicking "Home" shows public catalog courses.
- **Technical Support Email**: uaisupport@mit.edu (or click the floating Feedback tab on the interface).`
  },
  {
    course_name: 'MIT',
    source_type: 'onboarding_session',
    content: `### MIT Universal AI Onboarding — Grading, Weighting & Attempts Policy
- **Minimum Passing Score**: Minimum **60% total score** per module to earn an official certificate.
- **Grade Weighting**:
  - **Graded Assignments**: 80% of overall module score.
  - **Knowledge Checks**: 20% of overall module score (quizzes within video lectures).
  - **Lecture Videos & Recitations**: Not scored or required for certification.
- **Attempts Policy**: Multiple attempts allowed for Knowledge Check questions. Only **1 final attempt** permitted per module assignment.
- **Certificate Issuance**: Certificates generate automatically and appear under module titles within 1 to 2 hours after reaching 60%.`
  },
  {
    course_name: 'MIT',
    source_type: 'onboarding_session',
    content: `### MIT Universal AI Onboarding — Learning Tools & Jupyter Notebooks
- **Video Lectures**: Taught by MIT faculty (e.g. Prof. Georgios Samou) with downloadable transcripts and slide decks.
- **Video Recitations**: Deep-dive sessions led by MIT Teaching Assistants.
- **Ask Tim (AI Tutor)**: Integrated AI tutor assisting with lecture concepts and problem hints without revealing direct answers.
- **Jupyter Notebooks**: Pre-configured Python environments pre-loaded with dataset code and outputs. Coding background is not mandatory to complete modules.`
  },
  {
    course_name: 'MIT',
    source_type: 'onboarding_session',
    link_url: 'mailto:uaisupport@mit.edu',
    content: `### MIT Universal AI Onboarding — Frequently Asked Questions (FAQs)
- **Q: Why does my dashboard show generic CS intro courses instead of Universal AI?**
  A: Do not browse the public catalog. Click **"Dashboard"** at the top right of your screen after logging in via your invite email.
- **Q: Can we swap registered emails or get extra licences for teammates?**
  A: No. Email swaps cannot be processed due to strict grant limits across 242 teams. Share account credentials internally.
- **Q: Can experienced coders skip or fast-forward lecture videos?**
  A: Yes. Video watch time is not scored. Grades depend strictly on Assignments (80%) and Knowledge Checks (20%).
- **Q: How long do we have platform access?**
  A: Learners retain full platform access for **12 months** (one full calendar year).
- **Q: Are vertical modules mandatory?**
  A: No. Completing 16 foundational modules earns the Programme Certificate. Verticals are optional industry additions.`
  },
  {
    course_name: 'General',
    source_type: 'onboarding_session',
    content: `### Programme Support & Community Open Hours
- **Weekly Open Hours ("Ask Us Anything")**:
  - **Mondays**: Facilitated by Gift Ntuli @ 3:00 PM CAT.
  - **Wednesdays**: Facilitated by Diane @ 3:00 PM CAT.
  - **Fridays**: Regional Open Hour @ 3:00 PM CAT.
- **Local UniPod Meetups ("Open Pod")**: In-person cohort meetups at your country's local UniPod. Starting October onwards, road transport and overnight accommodation costs for out-of-city participants will be covered by the programme.`
  }
];

async function importMitOnboarding() {
  console.log(`🌱 Importing ${entries.length} MIT Universal AI Onboarding knowledge entries into Supabase...`);

  const { data, error } = await supabase.from('knowledge_entries').insert(entries).select();

  if (error) {
    console.error('❌ Failed to import MIT onboarding entries:', error);
  } else {
    console.log(`✅ Successfully inserted ${data.length} MIT Universal AI Onboarding entries into Supabase knowledge_entries!`);
  }
}

importMitOnboarding().catch(console.error);
