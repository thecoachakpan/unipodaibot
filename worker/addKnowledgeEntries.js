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
  YouTube: https://youtu.be/C9gaW26GfWw`
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
