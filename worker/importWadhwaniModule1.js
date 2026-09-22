/**
 * PodPal BOT - Wadhwani Module 1 Class Session Knowledge Base Importer
 * Inserts structured, token-optimized knowledge entries from Wadhwani Ignite Module 1
 * (Problem Identification, Statement Formulation & Venture Creation) into Supabase knowledge_entries.
 *
 * Run: node worker/importWadhwaniModule1.js
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
    course_name: 'Wadhwani',
    source_type: 'live_class',
    content: `### Wadhwani Module 1 — Problem Identification & The Solution-First Trap
- **Problem Before Solution**: Entrepreneurs must avoid the "solution-first trap." Set your AI prototype or solution aside first and analyze the root problem.
- **Definition of a Problem**: The gap between the customer's current painful experience and their desired outcome, for which they are actively seeking a remedy and willing to pay.
- **Problem vs. Opportunity**: An opportunity is not the technology (e.g. "AI for retail"); it is the measurable value created by eliminating the customer's pain (e.g. "Helping retailers eliminate stockouts and cash flow losses").
- **Teaching Case Study (Shop Pilot)**: AI co-pilot for informal kiosk owners. The root problem is not a lack of AI; it is that owners lack timely inventory/cash flow visibility, causing stockouts and dead capital.`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'live_class',
    link_url: 'https://web.nen.wfglobal.org/en/login?mode=createAccount&source=student',
    content: `### Wadhwani Module 1 — Venture Creation & Team Linking Rules
- **Individual Signup Required**: Every team member must first sign up individually on the Wadhwani platform using their country cohort code.
- **Creating a Venture**:
  1. Only ONE founder per team clicks **"My Venture"** / **"Create My Venture"** at the top right of the dashboard.
  2. Input business name, industry, brief description, country, and nearest city.
  3. That same founder then clicks **"Add Member"** to search for and link enrolled teammates.
- **Team Size Limit**: Maximum team size is strictly capped at **5 to 6 members** (aligned with UNDP rules). Do not add unfamiliar participants.
- **Synchronized Dashboards**: Linked teammates' dashboards synchronize automatically. Shared venture activities reflect across all members' accounts.
- **Solo Founders**: Solopreneurs create their venture independently and write "Solo" on program declaration sheets.`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'live_class',
    content: `### Wadhwani Module 1 — Activity 1.1: Core Problem Statement Rules
- **Problem Statement Rules (Max 350 characters)**: State the precise problem your startup solves. Focus strictly on WHO suffers, WHAT happens, and WHY.
- **STRICT PROHIBITION**: Do NOT mention your solution, product name, or AI features in the problem statement.
- **Validation Data & Source Citation**: Provide verified third-party statistics or research data proving the problem exists (e.g., industry survey percentages) and cite the exact source/publication year.
- **Program Institution Name**: Enter \`UNDP UniPod AI Program\`.`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'live_class',
    content: `### Wadhwani Module 1 — Activity 1.3: Stakeholder Impact & Problem Restatement
- **Affected Stakeholders**: Identify primary customers suffering directly and secondary stakeholders (suppliers, employees) facing ripple effects.
- **Negative Impact**: Detail specific measurable losses (lost revenue, cash flow pressure, inventory waste).
- **Root Causes**: List structural reasons the problem persists (manual tracking, fragmented records).
- **Team Passion Connection**: Articulate why your team is uniquely committed to solving this challenge.
- **Condensed Restatement (Max 150 characters)**: Sharpen and condense the 350-character problem statement into a high-impact statement under 150 characters.`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'live_class',
    content: `### Wadhwani Module 1 — Activity 1.2: Sector Classification Mapping
- **Sector Mapping**: Select the area, macro-industry, and functional domain that best align with your startup venture (e.g., Area: *Business Services*, Industry: *Professional Business Services*, Domain: *Accounting & Financial Services*).`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'live_class',
    content: `### Wadhwani Module 1 — Class Session FAQs & Guidance
- **Q: Does every team member need to do all exercises individually?**
  A: Mindset surveys (Baseline Survey, Passion CV) are done individually. Venture activities on the Venture Journey tab are shared and update across all linked teammates' dashboards.
- **Q: Why don't my teammates appear when I click "Add Member"?**
  A: Teammates must first register their own individual accounts on the platform using the correct country cohort code before they become searchable.
- **Q: Can a non-technical founder do Wadhwani while the CTO focuses on MIT?**
  A: Yes. Teams can divide responsibilities between MIT technical coursework and Wadhwani business model development.
- **Q: Are there daily deadline penalties?**
  A: No. Routine coursework is self-paced. Firm evaluation deadlines apply to the 3 major **Milestone Submissions** (Milestone 1 occurs at the end of Week 3).
- **Q: Can we revise our problem statement after submitting?**
  A: Yes. Venture activities can be edited and refined as many times as needed throughout the program.`
  }
];

async function importWadhwaniModule1() {
  console.log(`🌱 Importing ${entries.length} Wadhwani Module 1 knowledge entries into Supabase...`);

  const { data, error } = await supabase.from('knowledge_entries').insert(entries).select();

  if (error) {
    console.error('❌ Failed to import Wadhwani Module 1 entries:', error);
  } else {
    console.log(`✅ Successfully inserted ${data.length} Wadhwani Module 1 entries into Supabase knowledge_entries!`);
  }
}

importWadhwaniModule1().catch(console.error);
