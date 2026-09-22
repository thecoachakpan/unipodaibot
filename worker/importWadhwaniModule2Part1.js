/**
 * PodPal BOT - Wadhwani Module 2 (Part 1) Knowledge Base Importer
 * Inserts structured, token-optimized knowledge entries from Wadhwani Ignite Module 2 (Part 1)
 * (Customer Identification, Segmentation & Initial Persona Creation) into Supabase knowledge_entries.
 *
 * Run: node worker/importWadhwaniModule2Part1.js
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

export const wadhwaniModule2Entries = [
  {
    course_name: 'Wadhwani',
    source_type: 'live_class',
    content: `### Wadhwani Module 2 (Part 1) — Overview & Curriculum Structure
- **Session Focus**: Customer Identification, Segmentation & Initial Persona Creation (Facilitated by Charles Bolton on Tuesday, 22 September 2026).
- **Core Purpose**: Transition from Module 1 (Problem Statement) to identifying and validating the specific economic customer experiencing the problem, preventing building tech for an audience that won't/can't pay.
- **Module Structure (6 Lessons Split)**:
  - **Part 1 (Lessons 1-3)**: High-level segmentation (B2C, B2B, B2G), End User vs Buyer rules, Jobs to be Done (JTBD), and Initial Customer Persona development.
  - **Part 2 (Lessons 4-6)**: Customer problem validation, hypothetical problem interviews, problem-solution fit, and feasibility pivoting.`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'live_class',
    content: `### Wadhwani Module 2 — End User vs. Economic Buyer Distinction & Core Rule
- **End User (Beneficiary)**: The person/entity directly using or operating the solution.
- **Economic Buyer (Customer)**: The individual, corporate entity, or institution controlling the budget and making the purchasing decision.
- **CORE RULE**: Your customer persona MUST represent the paying economic buyer. If end users are not paying, identify the commercial or institutional entity subsidizing or purchasing the solution.
- **Teaching Case Study (Satellite LNB)**: An inventor created a wireless satellite dish receiver powered by solar cells. Consumers praised it but refused to pay retail price because MultiChoice subsidized traditional dishes. MultiChoice rejected the unit due to higher manufacturing cost. The venture failed because the founder surveyed consumers instead of validating willingness to pay with the true buyer (MultiChoice).`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'live_class',
    content: `### Wadhwani Module 2 — Micro-Segmentation & Jobs to be Done (JTBD)
- **3 Macro Segments**: B2C (Business-to-Consumer), B2B (Business-to-Business), B2G (Business-to-Government).
- **4 Layers of Micro-Segmentation**:
  1. *Demographic*: Age, gender, education, role, business size, revenue, industry.
  2. *Psychographic*: Values, lifestyle, attitudes, risk orientation, operational aspirations.
  3. *Behavioral*: Purchasing patterns, tech adoption level (low/med/high tech), usage frequency.
  4. *Geographic*: Location, country, density (urban, peri-urban, rural, industrial).
- **Jobs to be Done (JTBD) Framework**:
  - *Functional Jobs*: Concrete operational tasks (e.g. tracking stock, forecasting reorders, managing cash flow).
  - *Emotional Jobs*: Psychological feelings desired (e.g. feeling in control, reducing stockout anxiety, peace of mind).
  - *Social Jobs*: How customer wishes to be perceived by peers/community (e.g. dependable, respected, professional business owner).
- **Simulation Rule**: Founders construct a hypothetical, simulated customer persona based on current industry knowledge and reasonable assumptions; exhaustive multi-week field interviews are not required prior to platform deliverables.`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'live_class',
    content: `### Wadhwani Module 2 — Shop Pilot Case Study (Activities 2.1 & 2.2)
- **Activity 2.1 (Customer Segmentation)**: Shop Pilot primary segment = B2B informal/small retail shop owners in semi-urban/peri-urban African markets, low-tech (operates via mobile smartphone), low-to-medium revenue.
- **Activity 2.2 (Customer Persona - Amina)**:
  - *Demographics*: Amina, 38-year-old female, peri-urban location, high school education, self-employed owner-manager.
  - *Functional JTBD*: Track shelf stock, forecast reorder dates, prevent stockouts, preserve working capital.
  - *Emotional JTBD*: Feel in control, gain financial peace of mind.
  - *Social JTBD*: Be perceived as dependable and respected by neighborhood customers and suppliers.
  - *Current Alternatives*: Memory, paper receipts, simple calculator; manual and error-prone, causing delayed reorders.`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'live_class',
    content: `### Wadhwani Module 2 — FAQs & Customer Persona Guidance
- **Q: Does every team member submit Venture Journey activities?**
  A: Course lessons/quizzes are done individually. Venture Journey activities submitted by ONE team member auto-sync across all linked team dashboards.
- **Q: HealthTech (patients benefit, hospitals pay)?**
  A: Customer persona MUST be modeled on the hospital decision-maker (Medical Director, Procurement Lead) who controls budget and ROI evaluation.
- **Q: B2G / NGO (citizens benefit, government pays)?**
  A: Persona MUST represent the public official managing the portfolio (Director of Social Development, Procurement Lead).
- **Q: Free for end users?**
  A: Identify who finances the infrastructure (corporate sponsors, donor agencies, advertisers) — that paying entity is your economic customer.
- **Q: Low-income beneficiaries who cannot pay?**
  A: Re-engineer delivery model to ultra-affordable costs OR attract institutional buyers (NGOs, governments) to subsidize/pay on their behalf.`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'live_class',
    content: `### Wadhwani Module 2 — Deliverables & Milestone 1 Timeline
- **Action Items**:
  1. Complete Lessons 1, 2, and 3 quizzes in Module 2.
  2. Review Kula case study in Lesson 1.
  3. Submit Activity 2.1 (Customer Segmentation) and Activity 2.2 (Customer Persona with image < 1 MB) on venture dashboard.
  4. Do NOT start Activity 2.3 (Interviews & Validation) until after Thursday's session.
- **Milestone 1 Notice**: Milestone 1 submission opens in ~2-3 weeks (around Week 4). Facilitators formally review pitch deck slides on the venture dashboard and issue written feedback.`
  }
];

async function importWadhwaniModule2Part1() {
  console.log(`🌱 Importing ${wadhwaniModule2Entries.length} Wadhwani Module 2 (Part 1) knowledge entries into Supabase...`);

  const { data, error } = await supabase.from('knowledge_entries').insert(wadhwaniModule2Entries).select();

  if (error) {
    console.error('❌ Failed to import Wadhwani Module 2 (Part 1) entries:', error);
  } else {
    console.log(`✅ Successfully inserted ${data.length} Wadhwani Module 2 (Part 1) entries into Supabase knowledge_entries!`);
  }
}

// Execute if run directly via node
if (process.argv[1]?.endsWith('importWadhwaniModule2Part1.js')) {
  importWadhwaniModule2Part1().catch(console.error);
}
