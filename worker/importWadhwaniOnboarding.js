/**
 * PodPal BOT - Wadhwani Platform Onboarding Knowledge Base Importer
 * Inserts structured, token-optimized knowledge entries and official recording links from the
 * Wadhwani Welcome Session into Supabase knowledge_entries.
 *
 * Run: node worker/importWadhwaniOnboarding.js
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

const recordingUrl = "https://wadhwanifoundation-my.sharepoint.com/personal/charles_bolton_wadhwanifoundation_org/_layouts/15/stream.aspx?id=%2Fpersonal%2Fcharles%5Fbolton%5Fwadhwanifoundation%5Forg%2FDocuments%2FRecordings%2FUNDP%20UniPod%20AI%20Program%20%2D%20Wadhwani%20Platform%20Onboarding%20%28Welcome%20Session%29%2D20260910%5F150209%2DMeeting%20Recording%2Emp4&nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0&ga=1&referrer=StreamWebApp%2EWeb&referrerScenario=AddressBarCopied%2Eview%2E1d92374b%2Df89e%2D42e7%2D810a%2D7edb8c9a3b41";

const entries = [
  {
    course_name: 'Wadhwani',
    source_type: 'onboarding_session',
    link_url: recordingUrl,
    content: `### Wadhwani Platform Onboarding Session — Overview & Official Recording
- **Track**: Wadhwani Foundation Ignite Full – Africa (12-Week AI Business Model Program).
- **Session Date**: Thursday, 10 September 2026.
- **Facilitators**: Charles Bolton (Regional Leader, Wadhwani Foundation Africa), Jeovaire Umukundwa (UNDP UniPod), Gift Ntuli (UNDP UniPod).
- **Core Focus**: Building a viable, profitable venture around an AI business model (not technical AI coding).
- **Program Distinction**: Completely separate from the previous 4-week generic Boot Camp. All participants must register on "Ignite Full Africa".
- **Official Session Recording**: [Watch Onboarding Video Recording](${recordingUrl})`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'onboarding_session',
    link_url: 'https://web.nen.wfglobal.org/en/login?mode=createAccount&source=student',
    content: `### Wadhwani Onboarding — Immediate Mandatory Tasks (Due before Tuesday, 15 September 2026)
- **1. LMS Enrollment**: Sign up at https://web.nen.wfglobal.org/en/login?mode=createAccount&source=student using your country cohort code.
- **2. Module 0 Orientation**: Review introductory slides and videos in Module 0.
- **3. Baseline Assessment**: Complete Entrepreneurship Baseline Survey in Module 0 / Lesson 1 (self-reflection on experience/motivation; no right/wrong answers).
- **4. Passion CV**: Complete Passion CV activity in Module 1. Disregard any "South Africa" template tag—it is a default system template used across all African cohorts.
- **5. Individual Registration Rule**: Register strictly as individuals first. DO NOT create ventures or add teams on the LMS yet; team creation will be guided together during live class on Tuesday, 15 September.`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'onboarding_session',
    link_url: 'https://teams.microsoft.com/meet/419860837373470?p=jYchWkDZnC4etsclnK',
    content: `### Wadhwani Live Sessions Schedule & Meeting Credentials
- **Live Class Schedule**: Twice weekly on Tuesdays & Thursdays @ 3:00 PM CAT (2:00 PM WAT / 4:00 PM EAT / 1:00 PM GMT).
- **Teams Join Link**: https://teams.microsoft.com/meet/419860837373470?p=jYchWkDZnC4etsclnK
- **Meeting ID**: 419 860 837 373 470
- **Passcode**: g2Z7gc7Q
- **Continuity**: The exact same Teams link, Meeting ID, and Passcode are used for every Tuesday and Thursday live session throughout the 12 weeks.
- **Official Session Video Recording**: [Watch Onboarding Video Recording](${recordingUrl})`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'onboarding_session',
    content: `### Wadhwani 12-Week AI Business Model Roadmap & Milestones
- **Weeks 1–3**: Problem Statement Definition, Customer Discovery, Competitor Benchmarking.
- **End of Week 3 (Milestone 1)**: First mandatory milestone submission for evaluator review & written feedback.
- **Weeks 4–6**: Opportunity Mapping, Value Proposition, MVP / Prototyping & Technical Feasibility.
- **Weeks 7–10**: Business Model Canvas, Go-to-Market Strategy, Financials & Unit Economics, Team & Talent.
- **Weeks 11–12**: Pitch Deck Refinement, Investor Readiness & Final Venture Pitching.`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'onboarding_session',
    content: `### Wadhwani Onboarding — Practical Teaching Case Studies
- **M-KOPA**: Combines smartphone financing with proprietary AI credit analytics to score micro-loans for unbanked daily earners, supporting ~3,000 staff and ~50,000 sales agents.
- **Zipline**: Autonomous drones and AI flight navigation delivering blood products and vaccines to rural African hospitals in minutes.
- **Shop Pilot**: Charles Bolton's live teaching case study—an AI assistant for informal shop owners that captures voice notes and receipts to optimize inventory and cash flow.`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'onboarding_session',
    link_url: recordingUrl,
    content: `### Wadhwani Onboarding — Frequently Asked Questions (FAQs)
- **Q: I completed the 4-week Boot Camp. Do I need to enroll in this 12-week program?**
  A: Yes! The boot camp was generic ideation. The 12-week Wadhwani Ignite program validates and builds your AI business model. Register under "Ignite Full Africa".
- **Q: What if the signup page says my account already exists?**
  A: Log in with your existing Wadhwani credentials, go to your dashboard, and add your country's cohort code to enroll in "Ignite Full Africa".
- **Q: Why does my Passion CV say "South Africa"?**
  A: It is a default platform template label. Disregard it; all African cohorts use the exact same module.
- **Q: Can co-founders share a single account?**
  A: No. Every co-founder must register an individual account and complete their own Baseline Survey and Passion CV. Teams are linked in class.
- **Q: Are solo founders supported?**
  A: Yes. Solopreneurs can complete the entire 12-week program individually.
- **Q: Is French supported?**
  A: Live sessions and LMS are in English for 2026; French participants should use AI translation tools. Official French version arrives in 2027.
- **Official Session Recording**: [Watch Onboarding Video Recording](${recordingUrl})`
  }
];

async function importWadhwaniOnboarding() {
  console.log(`🌱 Importing ${entries.length} Wadhwani Onboarding knowledge entries into Supabase...`);

  const { data, error } = await supabase.from('knowledge_entries').insert(entries).select();

  if (error) {
    console.error('❌ Failed to import Wadhwani onboarding entries:', error);
  } else {
    console.log(`✅ Successfully inserted ${data.length} Wadhwani Onboarding entries into Supabase knowledge_entries!`);
  }
}

importWadhwaniOnboarding().catch(console.error);
