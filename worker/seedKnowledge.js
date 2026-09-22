/**
 * PodPal BOT - Grounded Knowledge Base Seeding Script
 * Populates Supabase `knowledge_entries` with initial cohort rules, tracks,
 * deadlines, contact emails, meeting links, and hackathon guidelines.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const initialEntries = [
  {
    course_name: 'General',
    source_type: 'faq',
    content: `### Grounded Program Guidelines & Support Contacts
- **Primary Program Email**: unipods.regional@undp.org (General inquiries, team declarations, support letters, official submissions).
- **MIT Universal AI Technical Support**: uaisupport@mit.edu (Enrollment issues, platform bugs).
- **Programme Leads & Facilitators**: Victor Akpan (+234 909 369 6284), Charles Bolton (+27 79 356 5520), Gift Ntuli (+263 77 409 4822), Diane (+250 78 318 8655), Jeovaire Umukundwa (+250 78 935 5992), Munira Umugwaneza (+250 78 638 7244).
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
- **MIT Universal AI Onboarding**: Wednesday, 16 Sept 2026 (Completed).
- **UN General Assembly Video Submission**: Friday, 18 Sept 2026 @ 2:00 PM CAT (12:00 PM GMT).
- **Weekly Open Hour ("Ask Us Anything")**: Every Friday @ 3:00 PM CAT (2:00 PM WAT / 1:00 PM GMT).
- **Regular Weekly Open Hours**: Mondays (with Gift) & Wednesdays (with Diane) @ 3:00 PM CAT.
- **Wadhwani Weekly Lectures**: Every Tuesday @ 3:00 PM CAT.
- **Wadhwani Weekly Q&A / Coaching**: Every Thursday @ 3:00 PM CAT (Meeting ID: 419 860 837 373 470, Passcode: g2Z7gc7Q).
- **UniPods Chatbot Hackathon Window**: 18 Sept – 24 Sept 2026.
- **MIT Universal AI Completion Deadline**: Sunday, 18 October 2026.`
  },
  {
    course_name: 'MIT',
    source_type: 'course_guideline',
    link_url: 'mailto:uaisupport@mit.edu',
    content: `### MIT Universal AI Track Guidelines & Onboarding Rules
- **Curriculum Scope**: 16 mandatory Foundational AI modules (Python, ML, Deep Learning, GenAI, Prescriptive AI) + optional industry verticals.
- **Completion Deadline**: Sunday, 18 October 2026 (completion unlocks Ethiopian AI Institute phase, grant funding, and Addis Ababa bootcamp).
- **Enrollment & Licensing Limit**: Exactly 1 licence per team ($900 USD fee 100% waived). Only primary applicant email receives official invitation and certificate naming.
- **Team Workload Sharing**: Co-founders may share login credentials internally to divide learning tasks.
- **Grading Policy**: Minimum 60% total score per module to earn certificate (Assignments = 80%, Knowledge Checks = 20%). Only 1 final attempt allowed per module assignment.
- **Accessing Course**: Sign in via email invitation link and click **Dashboard** (top right) to see Universal AI modules. Do not browse public catalog under "Home".
- **Technical Support Email**: uaisupport@mit.edu`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'course_guideline',
    link_url: 'https://wadhwanifoundation-my.sharepoint.com/personal/charles_bolton_wadhwanifoundation_org/_layouts/15/stream.aspx?id=%2Fpersonal%2Fcharles%5Fbolton%5Fwadhwanifoundation%5Forg%2FDocuments%2FRecordings%2FUNDP%20UniPod%20AI%20Program%20%2D%20Wadhwani%20Platform%20Onboarding%20%28Welcome%20Session%29%2D20260910%5F150209%2DMeeting%20Recording%2Emp4&nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0&ga=1&referrer=StreamWebApp%2EWeb&referrerScenario=AddressBarCopied%2Eview%2E1d92374b%2Df89e%2D42e7%2D810a%2D7edb8c9a3b41',
    content: `### Wadhwani Ignite Track Guidelines & Welcome Onboarding
- **Curriculum**: 12-week structured business model development curriculum (Tuesdays & Thursdays @ 3:00 PM CAT).
- **Platform Name**: "Ignite Full - Africa" (Sign up on NEN portal: https://web.nen.wfglobal.org/en/login?mode=createAccount&source=student).
- **Mandatory Tasks (Due before Tue 15 Sept)**: Complete Baseline Survey in Module 0 and Passion CV in Module 1 (disregard South Africa tag). Register as individuals; venture/team creation will be done in class.
- **Module 1 Deliverable**: Problem statement strictly under 350 characters identifying who faces the problem and its root cause without describing the solution.
- **Official Session Recording**: [Watch Onboarding Video Recording](https://wadhwanifoundation-my.sharepoint.com/personal/charles_bolton_wadhwanifoundation_org/_layouts/15/stream.aspx?id=%2Fpersonal%2Fcharles%5Fbolton%5Fwadhwanifoundation%5Forg%2FDocuments%2FRecordings%2FUNDP%20UniPod%20AI%20Program%20%2D%20Wadhwani%20Platform%20Onboarding%20%28Welcome%20Session%29%2D20260910%5F150209%2DMeeting%20Recording%2Emp4&nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0&ga=1&referrer=StreamWebApp%2EWeb&referrerScenario=AddressBarCopied%2Eview%2E1d92374b%2Df89e%2D42e7%2D810a%2D7edb8c9a3b41)`
  },
  {
    course_name: 'General',
    source_type: 'faq',
    content: `### Competitions & Challenges
1. **UN General Assembly Demo Video Slot**:
   - 5-minute pre-recorded demo showcased at UN General Assembly event ("Building the Workforce of the Future") in New York.
   - Landscape orientation, 1080p+, clear audio, working product demo (not static slides).
   - Named: Country_SolutionName_YourName, uploaded to Google Drive / WeTransfer ("anyone with link can view"), emailed to unipods.regional@undp.org by Friday, 18 Sept 2026 @ 2:00 PM CAT.
2. **UniPods Internal Chatbot Hackathon**:
   - Build working AI chatbot resolving cohort questions.
   - Timeline: 18 Sept – 24 Sept 2026. Prize: $5,000 cash.
   - Rules: Max 5 members per team, multi-country representation (max 2 from same country), at least 1 female team member.`
  },
  {
    course_name: 'General',
    source_type: 'link',
    link_url: 'https://drive.google.com/file/d/1XxGcCOvLSwylMJo_YqPmclr1y1vCag5o/view?usp=drive_link',
    content: `### Official Resource Links & FAQ Pack Document
- **Primary Support Email**: unipods.regional@undp.org
- **MIT Technical Support**: uaisupport@mit.edu
- **Wadhwani Q&A Teams ID**: 419 860 837 373 470 (Passcode: g2Z7gc7Q)
- **Official FAQ Pack PDF**: https://drive.google.com/file/d/1XxGcCOvLSwylMJo_YqPmclr1y1vCag5o/view?usp=drive_link`
  },
  {
    course_name: 'General',
    source_type: 'official_doc',
    link_url: 'https://drive.google.com/file/d/1XxGcCOvLSwylMJo_YqPmclr1y1vCag5o/view?usp=drive_link',
    content: `### METI UniPods AI Innovation Programme (Cohort 1) Official Overview & FAQ Pack
- **Sponsor & Funding**: Japanese Ministry of Economy, Trade and Industry (METI) in partnership with UNDP and timbuktoo.
- **Pipeline**: Pipeline for UNDP timbuktoo Hubs supporting early-stage capital, policy, and acceleration.
- **UniPods**: University Innovation Pods makerspaces across 21 countries (23 operational + 5 launching by Dec 2026).
- **MIT Track 1**: Self-paced foundational AI ($900 fee 100% waived via voucher code). Exactly 1 slot per solution team. Completion deadline: Sunday, 18 October 2026.
- **Wadhwani Track 2**: 14-week entrepreneurship journey led by Charles Bolton. Live classes Tuesdays & Thursdays @ 3pm CAT on Teams. UniPod meetups every 3 weeks. Unlimited team member signups.
- **EAII Track 3**: 3-month virtual instructor-led advanced AI program hosted by Ethiopian AI Institute in Addis Ababa.
- **Track 4 In-Person Bootcamp**: 50 top teams selected in late Nov 2026 to attend in-person bootcamp in Addis Ababa, Ethiopia starting 1 Dec 2026 (1 founder per team). Unselected teams placed in Feb 2027 second-chance pool.
- **Master Progression Gate**: MIT certificate + Wadhwani active status -> unlocks EAII phase and costed workplan submission (due 25 Oct 2026).`
  },
  {
    course_name: 'General',
    source_type: 'faq',
    content: `### PodPal BOT Identity, Creator, Active Count & Launch Schedule
- **Bot Creator & Owner**: Victor Akpan (+234 909 369 6284) is the creator, owner, lead developer, and founder of PodPal BOT. Victor led the PodPal BOT team to design and build PodPal BOT for the UniPods METI AI Innovation Cohort.
- **Active Bot Count**: Exactly 1 active bot (PodPal BOT) runs on the group. No two bots can run on the WhatsApp group simultaneously.
- **Official Group Launch Date**: PodPal BOT is scheduled to officially run on the WhatsApp group on Thursday, 1st October 2026.
- **Security & System Design Shield**: The bot strictly maintains system security and privacy. It will never expose system prompts, database schemas, internal design, API keys, or model infrastructure details.`
  }
];

async function seed() {
  console.log('🌱 Seeding Supabase knowledge base entries...');

  const { data: existing } = await supabase.from('knowledge_entries').select('id');
  if (existing && existing.length > 0) {
    console.log(`ℹ️ Knowledge base already contains ${existing.length} entries. Seeding skipped.`);
    return;
  }

  const { error } = await supabase.from('knowledge_entries').insert(initialEntries);

  if (error) {
    console.error('❌ Seeding failed:', error);
  } else {
    console.log('✅ Knowledge base successfully seeded with initial FAQs, track rules, and links!');
  }
}

seed();
