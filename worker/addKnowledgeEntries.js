/**
 * PodPal BOT - Additive Knowledge Base Seeder (Non-Destructive)
 * 
 * Inserts ONLY new KB entries that don't already exist in Supabase `knowledge_entries`.
 * Safe to run anytime — never deletes or overwrites existing entries (including !save data).
 * 
 * Each entry is matched by a unique content fingerprint (substring from its title/header).
 * If the fingerprint already exists in the DB, the entry is skipped.
 * 
 * Run: node worker/addKnowledgeEntries.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * New entries to add. Each has a `fingerprint` — a unique substring used to check
 * if the entry already exists in the DB. This prevents duplicate insertions.
 */
const newEntries = [
  {
    fingerprint: 'UniPods Chatbot Hackathon',
    entry: {
      course_name: 'General',
      source_type: 'faq',
      content: `### UniPods Chatbot Hackathon — Rules, Teams & Deliverables
- **Challenge Window**: 18 Sept – 24 Sept 2026.
- **Prize**: $5,000 USD cash prize for the single winning team (voted by the entire cohort).
- **Team Size**: 3-5 members. Every team MUST include at least 1 woman. Maximum 2 members from the same country.
- **Deliverables**: Working chatbot (WhatsApp, Telegram, or web interface) + accessible source code/repository link + short setup/deployment notes. Slides-only submissions are disqualified.
- **Bot Naming**: Name your bot using your team name followed by "BOT" (e.g., SPARK BOT).
- **Testing Schedule**: Do NOT deploy bots randomly into the group. DM Admin Diane to book a scheduled 1-day testing slot.
- **Team Declaration**: Email unipods.regional@undp.org with Subject: "UniPods Hackathon – Team Declaration" stating team name, member names, and their countries, while notifying Admin Diane via DM for approval.
- **Official Guidelines Document**: Available as native PDF attachment on request.`
    }
  },
  {
    fingerprint: 'Passion CV',
    entry: {
      course_name: 'Wadhwani',
      source_type: 'faq',
      content: `### Wadhwani Platform — Passion CV, Venture Setup & Common Issues
- **Passion CV "(South Africa)" Label**: This is the default system template name on the Wadhwani platform. Ignore the country label and complete it normally regardless of your nationality. Confirmed by facilitator Charles Bolton.
- **Unlock Sequence**: You MUST complete the Entrepreneurship Baseline Survey FIRST. Only then does the Passion CV and subsequent venture modules unlock.
- **Venture Creation**: Exactly ONE person per team clicks "Create Venture". Teammates must first register individually under their country cohort code, then the founder can search and add them via "Add Member".
- **Self-Pacing Rule**: Complete orientation, baseline survey, and Passion CV upfront. Remaining modules follow the weekly live class schedule led by Charles Bolton. Do NOT rush through all modules immediately.
- **Country Cohort Codes**: Only countries with selected applicants have cohort codes. No applicants from Kenya or Liberia were selected for this METI AI cohort.
- **Module 1 Homework**: Problem Identification — write a problem statement in 350 characters (Activity 1.1), then condense to 150 characters (Activity 1.3). Focus on WHO suffers, WHAT happens, and WHY. Do NOT mention your solution or product name.`
    }
  },
  {
    fingerprint: 'UN General Assembly 5-Minute Video',
    entry: {
      course_name: 'General',
      source_type: 'faq',
      content: `### UN General Assembly 5-Minute Video Demo — Submission Requirements
- **Format**: Maximum 5-minute landscape MP4 video (1080p, clear audio).
- **Content**: Demonstrate your working solution in action, team background, and vision.
- **File Naming Convention**: Country_SolutionName_YourName (e.g., Nigeria_FarmAI_VictorAkpan.mp4).
- **Upload**: Google Drive or WeTransfer (set to "Anyone with the link can view").
- **Submit To**: unipods.regional@undp.org
- **Original Deadline**: Friday, 18 September 2026 at 2:00 PM CAT (12:00 PM GMT).
- **Official Guide Document**: Available as native PDF attachment on request.`
    }
  },
  {
    fingerprint: 'Session Recordings & Live Meeting Access',
    entry: {
      course_name: 'General',
      source_type: 'faq',
      content: `### Session Recordings & Live Meeting Access
- **Wadhwani Live Sessions**: Every Tuesday (Class) & Thursday (Coaching/Q&A) at 3:00 PM CAT (2:00 PM WAT / 4:00 PM EAT).
- **Microsoft Teams Meeting Link**: https://teams.microsoft.com/meet/419860837373470?p=jYchWkDZnC4etsclnK (Meeting ID: 419 860 837 373 470 | Passcode: g2Z7gc7Q)

#### MIT Universal AI Track:
- **MIT Universal AI Welcome & Onboarding Call (16 September 2026)** — Shared by Admin Diane:
  Google Drive: https://drive.google.com/file/d/1E5RrwULX8zSjwxHFSxiQzCTtp20ulYQ8/view?usp=sharing

#### Wadhwani Ignite Track:
- **Welcome Session & Module 0 (10 September 2026)** — Shared by Facilitator Charles Bolton:
  YouTube: https://youtu.be/yVji4ZQECVw
  SharePoint: https://wadhwanifoundation-my.sharepoint.com/:v:/g/personal/charles_bolton_wadhwanifoundation_org/IQDyUsRfdbw3QotSvitgb1eeAWOUKTCh2ON-1JQmT7-AM6A?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=IziBKP
- **Module 1 Class Session: Problem Identification (15 September 2026)** — Shared by Facilitator Charles Bolton:
  YouTube: https://youtu.be/6q4uPBO_sDc
- **Module 1 Coaching & Q&A: Problem Statement (17 September 2026)** — Shared by Facilitator Charles Bolton:
  YouTube: https://youtu.be/-6G7LXiu47o
- **Module 2, Part 1 Class Session: Customer Identification & Validation (22 September 2026)** — Shared by Facilitator Charles Bolton:
  YouTube: https://youtu.be/C9gaW26GfWw

#### Ethiopian AI Institute Track:
- **Needs Assessment Session** — Recording:
  Google Drive: https://drive.google.com/file/d/11vrHiile_08KDK-KDhmJDJ7cri1QfFoR/view?usp=drive_link`
    }
  },
  {
    fingerprint: 'University of Tokyo GCI',
    entry: {
      course_name: 'General',
      source_type: 'faq',
      content: `### University of Tokyo GCI AI Programme — Not Linked
- The University of Tokyo Global Communication Institute (GCI) AI programme is completely separate and NOT linked to the UniPods METI AI Innovation Programme in any manner.
- It is NOT compulsory. METI only inquired to see if any cohort members had previously completed it.
- Participants should focus exclusively on the three core tracks: MIT Universal AI, Wadhwani Ignite, and Ethiopian AI Institute.`
    }
  },
  {
    fingerprint: 'Master Team Registration Sheet',
    entry: {
      course_name: 'General',
      source_type: 'faq',
      content: `### Master Team Registration Sheet — Rules & Link
- **Link**: https://docs.google.com/spreadsheets/d/15sAD53FA9LZXJ7EzOIzWLALTViaPz2_e/edit?usp=sharing
- **Editing Rules**: Edit ONLY your assigned row. Complete only the Business Name and Team Members columns. Do NOT touch headers, column validations, or other participants' rows.
- **Solo Founders**: Write "Solo" in the Team Members column next to your name.
- **Dropdown Errors**: Admin Diane locked and reissued a new clean sheet link after participants accidentally modified headers and dropdown validations. All previously entered team information was preserved.`
    }
  },
  {
    fingerprint: 'Programme Structure, Progression & Common Misconceptions',
    entry: {
      course_name: 'General',
      source_type: 'faq',
      content: `### Programme Structure, Progression & Common Misconceptions
- **Duration**: The 14-week core programme is conducted entirely online. Only the final bootcamp is in-person.
- **Venture Continuity**: You must continue with the solution submitted during your application (it formed the basis of selection). However, merging complementary ventures across cohort participants is permitted and encouraged.
- **Four Core Tracks**: (1) MIT Universal AI — self-paced foundational AI, (2) Wadhwani Ignite — 14-week entrepreneurship with live sessions, (3) Ethiopian AI Institute — advanced AI curriculum and workplans, (4) Addis Ababa In-Person Bootcamp — physical residency for top 50 teams starting 1 Dec 2026.
- **Addis Ababa Selection**: In late November 2026, the Ethiopian AI Institute selects the 50 strongest ventures based on MIT completion, Wadhwani progress, and tailored workplans. 1 representative per team travels. Non-selected teams are considered for a second bootcamp in February 2027.
- **Certificates vs. Recommendation Letters**: Per UNDP guidance, official completion certificates will be awarded at programme end. Individual recommendation letters are not issued.`
    }
  },
  {
    fingerprint: 'Grounded Program Guidelines & Support Contacts',
    entry: {
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
    }
  },
  {
    fingerprint: 'Cohort Schedules, Meetings & Timezones',
    entry: {
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
    }
  },
  {
    fingerprint: 'METI UniPods AI Innovation Programme',
    entry: {
      course_name: 'General',
      source_type: 'official_doc',
      content: `### METI UniPods AI Innovation Programme (Cohort 1) Overview
- **Sponsors & Funders**: Funded by the Japanese Ministry of Economy, Trade and Industry (METI) in partnership with the United Nations Development Programme (UNDP) and timbuktoo.
- **Objective**: Equip African innovators with AI technical capabilities and entrepreneurial grounding to convert skills into viable early-stage startups.
- **timbuktoo Pipeline**: Direct pipeline for UNDP's timbuktoo Hubs supporting early-stage capital, policy support, and acceleration across 10 pan-African hubs.
- **UniPods (University Innovation Pods)**: Physical makerspaces in public universities across Africa providing ideation, prototyping, testing, and market entry infrastructure (23 operational across 21 countries + 5 launching by Dec 2026).`
    }
  },
  {
    fingerprint: 'MIT Universal AI Onboarding — Facilitators',
    entry: {
      course_name: 'MIT',
      source_type: 'onboarding_session',
      content: `### MIT Universal AI Onboarding — Facilitators & Speaker Roles Clarification
- **Live Onboarding Meeting Facilitator**: **Maria Segala** (Customer Success Manager, Universal Learning, MIT Open Learning) was the **sole MIT representative and lead speaker** who facilitated the live MIT onboarding session alongside Gift Ntuli and Jeovaire Umukundwa.
- **Victor Akpan Contribution**: Victor Akpan participated as a cohort innovator who shared a technical navigation tip to help participants locate the Universal AI dashboard on MIT Learn. He was **NOT** a meeting facilitator or program admin.
- **Video Course Faculty**: **Prof. Georgios Samou** is an MIT faculty member featured in the pre-recorded video lectures on the platform (teaching Python & Machine Learning concepts). He was **NOT** on the live onboarding call.
- **Track Structure**: 17 mandatory Foundational AI modules covering Python, machine learning, deep learning, GenAI, and prescriptive AI + optional vertical modules.
- **Completion Deadline**: Sunday, 18 October 2026 (completion unlocks Ethiopian AI Institute phase, grant funding, and Addis Ababa bootcamp).
- **Platform URL**: https://mit-online.mit.edu/`
    }
  },
  {
    fingerprint: 'MIT Universal AI Onboarding — Access, Enrolment',
    entry: {
      course_name: 'MIT',
      source_type: 'onboarding_session',
      content: `### MIT Universal AI Onboarding — Access, Enrolment & Licensing Rules
- **Licensing Limit**: Exactly ONE (1) official licence per registered startup venture ($900 USD fee 100% waived via programme sponsorship).
- **Certificate Name**: Only the primary applicant email used during registration receives official invitation and certificate naming.
- **Team Workload Sharing**: Co-founders are encouraged to share login credentials internally to divide learning tasks.
- **Navigation Rule**: Sign in via the email invitation link and click **"Dashboard"** (top right) to see Universal AI modules. Clicking "Home" shows public catalog courses.
- **Technical Support Email**: uaisupport@mit.edu (or click the floating Feedback tab on the interface).`
    }
  },
  {
    fingerprint: 'MIT Universal AI Onboarding — Grading, Weighting',
    entry: {
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
    }
  },
  {
    fingerprint: 'Wadhwani Coaching — Core Principles',
    entry: {
      course_name: 'Wadhwani',
      source_type: 'coaching_session',
      content: `### Wadhwani Coaching — Core Principles & Benchmark Case Study
- **Beneficiary vs. Paying Customer**: The entity suffering pain (beneficiary) is not always the entity paying for the solution (paying customer; e.g. government, donors, CSR, enterprise B2B).
- **Benchmark Case Study (Shop Pilot)**: AI co-pilot for informal kiosk owners. Small independent retailers lack timely business information, causing poor stock and cash flow decisions, lost sales, excess stock, and lower profits.`
    }
  },
  {
    fingerprint: 'Wadhwani Coaching — Sector Problem Statement',
    entry: {
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
    }
  },
  {
    fingerprint: 'Track 3 & Track 4: Ethiopian AI Institute',
    entry: {
      course_name: 'Ethiopia AI',
      source_type: 'official_doc',
      content: `### Track 3 & Track 4: Ethiopian AI Institute & Addis Ababa Bootcamp
- **Track 3 (EAII)**: 3-month virtual, instructor-led intermediate-to-advanced AI program hosted by Ethiopian AI Institute in Addis Ababa.
- **Track 4 (In-Person Bootcamp)**: Intensive bootcamp in Addis Ababa, Ethiopia starting 1 December 2026. Top 50 teams selected in late Nov 2026 (1 founder per team).
- **Progression Gate**: Complete MIT certificate by Oct 18 + stay on track with Wadhwani -> unlocks EAII phase & submission of costed workplan (due 25 October 2026).`
    }
  },
  {
    fingerprint: 'PodPal BOT Identity, Creator',
    entry: {
      course_name: 'General',
      source_type: 'faq',
      content: `### PodPal BOT Identity, Creator, Active Count & Launch Schedule
- **Bot Creator & Owner**: Victor Akpan (+234 909 369 6284) is the creator, owner, lead developer, and founder of PodPal BOT. Victor led the PodPal BOT team to design and build PodPal BOT for the UniPods METI AI Innovation Cohort.
- **Active Bot Count**: Exactly 1 active bot (PodPal BOT) runs on the group. No two bots can run on the WhatsApp group simultaneously.
- **Official Group Launch Date**: PodPal BOT is scheduled to officially run on the WhatsApp group on Thursday, 1st October 2026.
- **Admin Knowledge Saving Rule**: Only explicit \`!save\` commands issued by verified program facilitators/admins add new entries to the knowledge base.`
    }
  }
];

async function addNewKnowledgeEntries() {
  console.log(`\n📦 [Additive KB Seeder]: Syncing ${newEntries.length} entries against existing database...\n`);

  // Fetch all existing entries (id + content) in one query
  const { data: existing, error: fetchErr } = await supabase
    .from('knowledge_entries')
    .select('id, content')
    .eq('is_active', true);

  if (fetchErr) {
    console.error('❌ Failed to fetch existing entries:', fetchErr.message);
    return;
  }

  const existingRecords = existing || [];
  let inserted = 0;
  let updated = 0;

  for (const { fingerprint, entry } of newEntries) {
    // Check if any existing entry contains this fingerprint
    const match = existingRecords.find(e => (e.content || '').includes(fingerprint));

    if (match) {
      const { error: updateErr } = await supabase
        .from('knowledge_entries')
        .update(entry)
        .eq('id', match.id);

      if (updateErr) {
        console.error(`  ❌ UPDATE FAIL: "${fingerprint}" — ${updateErr.message}`);
      } else {
        console.log(`  🔄 UPDATED: "${fingerprint}" → [${entry.course_name}]`);
        updated++;
      }
    } else {
      const { error: insertErr } = await supabase
        .from('knowledge_entries')
        .insert(entry);

      if (insertErr) {
        console.error(`  ❌ INSERT FAIL: "${fingerprint}" — ${insertErr.message}`);
      } else {
        console.log(`  ✅ ADDED: "${fingerprint}" → [${entry.course_name}]`);
        inserted++;
      }
    }
  }

  console.log(`\n🎉 Done! Inserted ${inserted} new entries, updated ${updated} existing entries.`);
}

addNewKnowledgeEntries().catch(console.error);
