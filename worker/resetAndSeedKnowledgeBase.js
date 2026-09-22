/**
 * PodPal BOT - Master Knowledge Base Reset & Re-Seeding Script
 * 
 * Purges all existing records in Supabase `knowledge_entries` (including unvetted admin messages)
 * and re-populates the database with 100% verified, curated knowledge base entries.
 *
 * Explicitly clarifies that Maria Segala was the sole MIT representative/speaker on the MIT onboarding session,
 * while Prof. Georgios Samou is an MIT course video instructor.
 *
 * Run: node worker/resetAndSeedKnowledgeBase.js
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

const docDriveLink = 'https://drive.google.com/file/d/1XxGcCOvLSwylMJo_YqPmclr1y1vCag5o/view?usp=drive_link';
const wadhwaniRecordingUrl = "https://wadhwanifoundation-my.sharepoint.com/personal/charles_bolton_wadhwanifoundation_org/_layouts/15/stream.aspx?id=%2Fpersonal%2Fcharles%5Fbolton%5Fwadhwanifoundation%5Forg%2FDocuments%2FRecordings%2FUNDP%20UniPod%20AI%20Program%20%2D%20Wadhwani%20Platform%20Onboarding%20%28Welcome%20Session%29%2D20260910%5F150209%2DMeeting%20Recording%2Emp4&nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0&ga=1&referrer=StreamWebApp%2EWeb&referrerScenario=AddressBarCopied%2Eview%2E1d92374b%2Df89e%2D42e7%2D810a%2D7edb8c9a3b41";

const cleanMasterEntries = [
  // --- GENERAL PROGRAMME FAQs & CONSTRAINTS ---
  {
    course_name: 'General',
    source_type: 'faq',
    content: `### Grounded Program Guidelines & Support Contacts
- **Primary Program Email**: unipods.regional@undp.org (General inquiries, team declarations, support letters, official submissions).
- **MIT Universal AI Technical Support**: uaisupport@mit.edu (Enrollment issues, platform bugs).
- **Programme Facilitators & Leads**: Charles Bolton (+27 79 356 5520), Gift Ntuli (+263 77 409 4822), Diane (+250 78 318 8655), Jeovaire Umukundwa (+250 78 935 5992), Munira Umugwaneza (+250 78 638 7244).
- **Bot Technical Creator & Owner**: Victor Akpan (+234 909 369 6284 — Creator/Lead Developer of PodPal BOT; has full bot admin permissions for system commands like !save, but is NOT a program admin or meeting facilitator).
- **Overall Duration**: 14 weeks.
- **Language of Instruction**: 100% in English for the 2026 cohort.
- **Venture Continuity**: Build the venture applied with; co-founder venture merging across cohort participants is permitted.`
  },
  {
    course_name: 'General',
    source_type: 'faq',
    content: `### Cohort Schedules, Meetings & Timezones
Note: Always reference timezones: CAT (UTC+2), WAT (UTC+1), EAT (UTC+3), GMT.
- **Welcome & Onboarding Call**: Tuesday, 8 Sept 2026 (Completed).
- **Wadhwani Ignite Onboarding**: Thursday, 10 Sept 2026 (Completed).
- **MIT Universal AI Onboarding**: Wednesday, 16 Sept 2026 (Facilitated by Maria Segala from MIT Open Learning, Gift Ntuli & Jeovaire Umukundwa; Victor Akpan contributed as an innovator with a dashboard fix tip).
- **UN General Assembly Video Submission**: Friday, 18 Sept 2026 @ 2:00 PM CAT (12:00 PM GMT).
- **Weekly Open Hour ("Ask Us Anything")**: Every Friday @ 3:00 PM CAT (2:00 PM WAT / 1:00 PM GMT).
- **Regular Weekly Open Hours**: Mondays (with Gift) & Wednesdays (with Diane) @ 3:00 PM CAT.
- **Wadhwani Weekly Lectures**: Every Tuesday @ 3:00 PM CAT.
- **Wadhwani Weekly Q&A / Coaching**: Every Thursday @ 3:00 PM CAT (Meeting ID: 419 860 837 373 470, Passcode: g2Z7gc7Q).
- **UniPods Chatbot Hackathon Window**: 18 Sept – 24 Sept 2026.
- **MIT Universal AI Completion Deadline**: Sunday, 18 October 2026.`
  },
  {
    course_name: 'General',
    source_type: 'official_doc',
    link_url: docDriveLink,
    content: `### METI UniPods AI Innovation Programme (Cohort 1) Overview
- **Sponsors & Funders**: Funded by the Japanese Ministry of Economy, Trade and Industry (METI) in partnership with the United Nations Development Programme (UNDP) and timbuktoo.
- **Objective**: Equip African innovators with AI technical capabilities and entrepreneurial grounding to convert skills into viable early-stage startups.
- **timbuktoo Pipeline**: Direct pipeline for UNDP's timbuktoo Hubs supporting early-stage capital, policy support, and acceleration across 10 pan-African hubs.
- **UniPods (University Innovation Pods)**: Physical makerspaces in public universities across Africa providing ideation, prototyping, testing, and market entry infrastructure (23 operational across 21 countries + 5 launching by Dec 2026).
- **Official FAQ Pack Document**: [Download Official PDF](${docDriveLink})`
  },

  // --- MIT TRACK & FACILITATOR CLARIFICATION ---
  {
    course_name: 'MIT',
    source_type: 'onboarding_session',
    link_url: 'https://mit-online.mit.edu/',
    content: `### MIT Universal AI Onboarding — Facilitators & Speaker Roles Clarification
- **Live Onboarding Meeting Facilitator**: **Maria Segala** (Customer Success Manager, Universal Learning, MIT Open Learning) was the **sole MIT representative and lead speaker** who facilitated the live MIT onboarding session alongside Gift Ntuli and Jeovaire Umukundwa.
- **Victor Akpan Contribution**: Victor Akpan participated as a cohort innovator who shared a technical navigation tip to help participants locate the Universal AI dashboard on MIT Learn. He was **NOT** a meeting facilitator or program admin.
- **Video Course Faculty**: **Prof. Georgios Samou** is an MIT faculty member featured in the pre-recorded video lectures on the platform (teaching Python & Machine Learning concepts). He was **NOT** on the live onboarding call.
- **Track Structure**: 16 mandatory Foundational AI modules covering Python, machine learning, deep learning, GenAI, and prescriptive AI + optional vertical modules.
- **Completion Deadline**: Sunday, 18 October 2026 (completion unlocks Ethiopian AI Institute phase, grant funding, and Addis Ababa bootcamp).
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

  // --- WADHWANI TRACK & COACHING ---
  {
    course_name: 'Wadhwani',
    source_type: 'onboarding_session',
    link_url: wadhwaniRecordingUrl,
    content: `### Wadhwani Platform Onboarding Session — Overview & Official Recording
- **Track**: Wadhwani Foundation Ignite Full – Africa (12-Week AI Business Model Program).
- **Session Date**: Thursday, 10 September 2026.
- **Facilitators & Coaches**: Charles Bolton (Lead Facilitator & Regional Leader, Wadhwani Foundation Africa), Jeovaire Umukundwa (UNDP UniPod), Gift Ntuli (UNDP UniPod).
- **Core Focus**: Building a viable, profitable venture around an AI business model.
- **Official Session Recording**: [Watch Onboarding Video Recording](${wadhwaniRecordingUrl})`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'live_class',
    content: `### Wadhwani Module 1 — Problem Identification & Statement Rules
- **Problem Before Solution**: Focus strictly on WHO suffers, WHAT happens, and WHY. Do NOT mention your solution, product name, or AI features in the problem statement.
- **Activity 1.1 Limit**: Max 350 characters.
- **Activity 1.3 Condensation Limit**: Max 150 characters.
- **Team Creation**: Exactly ONE founder creates venture under "My Venture" and adds enrolled teammates (max 5-6 team members). Dashboards synchronize automatically.`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'coaching_session',
    content: `### Wadhwani Coaching — Core Principles & Benchmark Case Study
- **Beneficiary vs. Paying Customer**: The entity suffering pain (beneficiary) is not always the entity paying for the solution (paying customer; e.g. government, donors, CSR, enterprise B2B).
- **Benchmark Case Study (Shop Pilot)**: AI co-pilot for informal kiosk owners. Small independent retailers lack timely business information, causing poor stock and cash flow decisions, lost sales, excess stock, and lower profits.`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'coaching_session',
    content: `### Wadhwani Coaching — Sector Problem Statement Benchmarks
- **Maternal Care**: Healthcare providers struggle to deliver timely maternal care due to specialist shortages and high patient volume, leading to delayed complication detection and preventable mortality.
- **Emergency Blood Matching**: Families and hospitals in Nigeria struggle to find compatible blood quickly during emergencies due to the lack of a real-time system connecting eligible donors with patients.
- **Ambulance Clinical Data**: Critically ill and trauma patients face preventable clinical deterioration because ambulances cannot transmit real-time clinical data to hospital emergency departments prior to arrival.
- **Maize Crop Disease**: 80% of maize smallholder farmers in South Sudan face recurring crop disease outbreaks, resulting in up to 75% annual yield loss due to unmanaged environmental factors.
- **SME Tax & Bookkeeping**: Small business owners struggle to maintain accurate financial records and meet tax obligations because existing accounting tools are overly complex, leading to penalties and poor financial visibility.
- **Technical Founder Distribution Trap**: Homogeneous technical founding teams struggle to distribute and market their products due to operational over-focus, leading to low traction and business failure.
- **Indigenous Language Exclusion**: Millions of non-English/French speaking Africans are locked out of digital goods and services because digital platforms require European text literacy.
- **Youth Tech Pathways**: Young Africans seeking high-income tech careers face expensive training or fragmented free resources, leaving them without structured pathways needed to convert skills into income.`
  },

  // --- ETHIOPIA AI & PROGRESSION ---
  {
    course_name: 'Ethiopia AI',
    source_type: 'official_doc',
    link_url: 'https://aii.et/',
    content: `### Track 3 & Track 4: Ethiopian AI Institute & Addis Ababa Bootcamp
- **Track 3 (EAII)**: 3-month virtual, instructor-led intermediate-to-advanced AI program hosted by Ethiopian AI Institute in Addis Ababa.
- **Track 4 (In-Person Bootcamp)**: Intensive bootcamp in Addis Ababa, Ethiopia starting 1 December 2026. Top 50 teams selected in late Nov 2026 (1 founder per team).
- **Progression Gate**: Complete MIT certificate by Oct 18 + stay on track with Wadhwani -> unlocks EAII phase & submission of costed workplan (due 25 October 2026).`
  },

  // --- BOT IDENTITY & SECURITY ---
  {
    course_name: 'General',
    source_type: 'faq',
    content: `### PodPal BOT Identity, Creator, Active Count & Launch Schedule
- **Bot Creator & Owner**: Victor Akpan (+234 909 369 6284) is the creator, owner, lead developer, and founder of PodPal BOT. Victor led the PodPal BOT team to design and build PodPal BOT for the UniPods METI AI Innovation Cohort.
- **Active Bot Count**: Exactly 1 active bot (PodPal BOT) runs on the group. No two bots can run on the WhatsApp group simultaneously.
- **Official Group Launch Date**: PodPal BOT is scheduled to officially run on the WhatsApp group on Thursday, 1st October 2026.
- **Admin Knowledge Saving Rule**: Only explicit \`!save\` commands issued by verified program facilitators/admins add new entries to the knowledge base.`
  }
];

async function resetAndSeedKnowledgeBase() {
  console.log("🧹 [Knowledge Base Reset]: Purging all old/unvetted records from Supabase `knowledge_entries`...");

  // Delete all existing records
  const { error: deleteErr } = await supabase
    .from('knowledge_entries')
    .delete()
    .neq('course_name', 'NON_EXISTENT_CATEGORY_FORCE_ALL');

  if (deleteErr) {
    console.error("❌ Failed to clear knowledge_entries table:", deleteErr);
    return;
  }

  console.log("✅ Successfully purged old knowledge base records.");
  console.log(`🌱 [Re-Seeding]: Inserting ${cleanMasterEntries.length} 100% verified, curated knowledge base entries into Supabase...`);

  const { data, error: insertErr } = await supabase
    .from('knowledge_entries')
    .insert(cleanMasterEntries)
    .select();

  if (insertErr) {
    console.error("❌ Failed to re-seed knowledge_entries table:", insertErr);
  } else {
    console.log(`🎉 SUCCESS! Re-seeded ${data.length} clean knowledge entries into Supabase knowledge_entries!`);
  }
}

resetAndSeedKnowledgeBase().catch(console.error);
