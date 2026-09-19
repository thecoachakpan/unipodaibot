/**
 * PodPal BOT - Official Information & FAQ Pack Importer
 * Inserts the official METI UniPods AI Innovation Programme (Cohort 1) FAQ Pack into Supabase knowledge_entries.
 *
 * Run: node worker/importOfficialFaqPack.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const docDriveLink = 'https://drive.google.com/file/d/1XxGcCOvLSwylMJo_YqPmclr1y1vCag5o/view?usp=drive_link';

const entries = [
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
  {
    course_name: 'MIT',
    source_type: 'official_doc',
    link_url: 'https://learn.mit.edu/universal-learning/ai',
    content: `### Track 1: Foundational AI — Massachusetts Institute of Technology (MIT)
- **Focus**: Core AI concepts, Python programming, data analytics, and sector applications in healthcare/medicine, sustainable energy, transportation, and entrepreneurship.
- **Format**: Completely self-paced online coursework.
- **Cost**: $900 USD fee is 100% COVERED via a voucher fee waiver code provided by the programme.
- **Registration Limit**: Exactly ONE (1) person per registered solution team is allocated an official enrollment slot.
- **Support**: Optional weekly office hours available for live technical assistance.
- **Completion Deadline**: Sunday, 18 October 2026. Earning this certificate is required to unlock the Ethiopian AI Institute phase.
- **URL**: https://learn.mit.edu/universal-learning/ai`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'official_doc',
    link_url: 'https://wadhwanifoundation.org/our-programs/ignite/',
    content: `### Track 2: Entrepreneurship & Innovation — Wadhwani Foundation (Ignite)
- **Focus**: 14-week experiential venture development journey taking teams from concept through to validated business model.
- **Lead Facilitator & Coach**: Charles Bolton.
- **Format**: Instructor-led with 2 weekly live MS Teams sessions:
  - **Tuesdays**: Core Ignite curriculum, business modeling, active venture development (@ 3:00 PM CAT).
  - **Thursdays**: Live coaching, practical application, venture Q&A (@ 3:00 PM CAT).
- **Local Community**: Physical in-person meetups hosted at your country's local UniPod every 3 weeks.
- **Team Participation**: NO signup limit — as many team members as desired may join Wadhwani Ignite, provided at least 1 member completes the 14-week program.
- **URL**: https://wadhwanifoundation.org/our-programs/ignite/`
  },
  {
    course_name: 'Ethiopia AI',
    source_type: 'official_doc',
    link_url: 'https://aii.et/',
    content: `### Track 3: Intermediate to Advanced AI — Ethiopian AI Institute (EAII)
- **Focus**: Advanced AI theory and applied engineering building directly upon the foundational MIT curriculum.
- **Format**: 3-month virtual, instructor-led program with structured assignments and coursework.
- **Anchor**: Hosted and facilitated by the Ethiopian AI Institute in Addis Ababa.
- **Progression Gate**: Unlocked after completing the MIT certificate and remaining on-track with Wadhwani.
- **URL**: https://aii.et/`
  },
  {
    course_name: 'Ethiopia AI',
    source_type: 'official_doc',
    link_url: docDriveLink,
    content: `### Track 4: In-Person AI Bootcamp (Addis Ababa, Ethiopia)
- **Location**: Addis Ababa, Ethiopia.
- **Selection**: In late November 2026, the 50 strongest teams will be selected for an intensive in-person bootcamp opening 1 December 2026.
- **Representation**: Exactly ONE (1) founder per selected team travels to Ethiopia.
- **Second Chance Pool**: Teams not selected for the December 2026 cohort are automatically placed in consideration for a second bootcamp in February 2027.
- **Next Steps**: Top emerging ventures receive ongoing funding pathways and transition into pan-African timbuktoo Hub acceleration networks.`
  },
  {
    course_name: 'General',
    source_type: 'official_doc',
    link_url: docDriveLink,
    content: `### Progression Rules & Progression Gate
- **Starting Cohort**: 250 selected startup solutions (individual founders and teams).
- **MIT Rule**: 1 person per solution enrolled in MIT course, completed by 18 October 2026.
- **Wadhwani Rule**: Unlimited team member signups; at least 1 member must complete 14 weeks.
- **Progression Gate**: Finish MIT certificate + stay on track with Wadhwani -> unlocks EAII phase & submission of 1 costed workplan per venture (due 25 October 2026).`
  },
  {
    course_name: 'General',
    source_type: 'official_doc',
    link_url: docDriveLink,
    content: `### Master Programme Timeline (2026 – 2027)
- **Tue 8 Sep 2026**: Programme Welcome & Onboarding Call (3:00 PM CAT).
- **Thu 10 Sep 2026**: Wadhwani Welcome Session (3:00 PM CAT / 4:00 PM EAT / 2:00 PM WAT).
- **Mon 14 Sep 2026**: MIT Foundational AI Course Opens (self-paced access).
- **Tue 15 Sep 2026**: Wadhwani 14-Week Journey Begins (Tue/Thu live classes, UniPod meetups every 3 wks).
- **Sun 18 Oct 2026**: Expected MIT Course Completion Deadline (Certificate unlocks Addis Ababa stage).
- **Sun 25 Oct 2026**: Workplan Submission Deadline (1 costed workplan per venture).
- **Mon 26 Oct 2026**: Addis Ababa AI Institute Online Phase Begins (3-month instructor-led coursework).
- **Week of 23 Nov 2026**: Bootcamp Selection Announcement (50 teams chosen for Addis Ababa).
- **Tue 1 Dec 2026**: Addis Ababa Bootcamp Opens in Ethiopia (1 founder per team).
- **Thu 17 Dec 2026**: Wadhwani Programme Concludes (Week 14 final venture review).`
  },
  {
    course_name: 'General',
    source_type: 'official_doc',
    link_url: docDriveLink,
    content: `### Frequently Asked Questions (Official FAQ Pack)
- **Q: Who sponsors and funds the UniPods AI Innovation Programme?**
  A: Funded by the Japanese Ministry of Economy, Trade and Industry (METI) in partnership with UNDP and timbuktoo.
- **Q: Who do I contact if I am stuck or have questions?**
  A: Ask in the official WhatsApp community or email unipods.regional@undp.org.
- **Q: Do I have to pay for the MIT Universal AI course?**
  A: No! The standard $900 USD fee is 100% waived via a voucher fee waiver code provided by the programme.
- **Q: How many team members can enroll in the MIT course vs Wadhwani?**
  A: MIT: Exactly 1 person per registered solution. Wadhwani: Unlimited team members can enroll.
- **Q: How do teams qualify for the in-person Addis Ababa Bootcamp?**
  A: Complete MIT course by Oct 18, stay on track with Wadhwani, submit costed workplan by Oct 25, perform well in EAII online phase. Top 50 teams travel to Ethiopia (1 founder per team).
- **Q: What happens if our team is not selected in November?**
  A: Unselected teams are automatically pooled into consideration for a second bootcamp in February 2027.
- **Official FAQ PDF Link**: [Download FAQ Pack](${docDriveLink})`
  }
];

async function importFaqPack() {
  console.log(`🌱 Importing ${entries.length} official FAQ & Information Pack entries into Supabase...`);

  const { data, error } = await supabase.from('knowledge_entries').insert(entries).select();

  if (error) {
    console.error('❌ Failed to import FAQ pack:', error);
  } else {
    console.log(`✅ Successfully imported ${data.length} official FAQ pack knowledge entries!`);
    console.log('Gemini will now retrieve these official rules, dates, and FAQs on every user query.');
  }
}

importFaqPack().catch(console.error);
