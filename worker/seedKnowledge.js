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
- **Wadhwani Support Lead**: Charles Bolton (+27 79 356 5520).
- **Programme Leads & Facilitators**: Diane (Programme Team Rwanda), Gift Ntuli, Jeovaire Umukundwa, Munira Umugwaneza.
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
    content: `### MIT Universal AI Track Guidelines
- **Enrollment Limit**: Only 1 person per team (primary applicant email) receives official enrollment invite.
- **Team Credentials**: Co-founders may share credentials to review coursework, but final certificate displays enrolled applicant name.
- **Module Requirements**: Completing all 16 Universal AI Foundational Modules is mandatory by 18 October 2026 to remain eligible for subsequent program phases and grant funding. Vertical modules are optional.
- **Accessing Course**: Access MUST be made through personalized invitation link received via email; log in and navigate directly to the Dashboard tab (not Home).`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'course_guideline',
    content: `### Wadhwani Ignite Track Guidelines
- **Curriculum**: 14-week structured business model development curriculum.
- **Platform Name**: "Ignite Full - Africa".
- **Module 1 Deliverable**: Problem statement strictly under 350 characters (refined to 150 characters) identifying who faces the problem and its root cause without describing the solution.`
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
