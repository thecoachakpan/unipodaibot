/**
 * PodPal BOT - Wadhwani Problem Statement Coaching Knowledge Base Importer
 * Inserts structured, token-optimized knowledge entries from the Wadhwani Ignite
 * Problem Statement Coaching & Live Founder Q&A Session into Supabase knowledge_entries.
 *
 * Run: node worker/importWadhwaniCoaching.js
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
    source_type: 'coaching_session',
    content: `### Wadhwani Coaching — Core Problem Statement Rules & Limits
- **Strictly Problem First — No Solution**: A problem statement describes the customer's difficulty and root cause ONLY. It must NEVER reveal your product name, algorithm, app, or features.
- **Activity 1.1 Limit (350 characters)**: State who experiences the problem, what happens, and the root cause.
- **Activity 1.3 Condensation Limit (150 characters)**: Condense the 350-character statement into a focused statement under 150 characters.
- **AI Condensation Tip**: Draft your full problem in plain language, then use tools like ChatGPT to condense it within exact platform character limits.`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'coaching_session',
    content: `### Wadhwani Coaching — Beneficiary vs. Paying Customer & Customer Segments
- **Beneficiary vs. Paying Customer**: The entity suffering from the pain (beneficiary) is not always the entity paying for the solution (paying customer). Identify who pays (government, donor agencies, CSR departments, private healthcare) versus who receives the service.
- **Primary vs. Secondary Customer Segments**: When multiple stakeholders suffer (e.g. students and employers, or patients and hospitals), focus your initial problem statement on the **primary customer segment** (the largest, most directly impacted group).`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'coaching_session',
    content: `### Wadhwani Coaching — Benchmark Case Study: Shop Pilot
- **Venture Name**: Shop Pilot (AI Co-pilot for Informal Retailers / Spaza Shops).
- **Problem Statement (350 chars)**: Small independent retailers struggle to make reliable stock purchasing and cash flow decisions because they lack timely usable business information, leading to stockouts, overstocking, wasted working capital, and reduced profitability.
- **Condensed Restatement (150 chars)**: Small independent retailers lack timely business information, causing poor stock and cash flow decisions, lost sales, excess stock, and lower profits.
- **Supporting Data**: 82% of surveyed South African spaza shop owners reported losses from inventory and stock problems (Source: *South African Journal of Economics and Management Services*, 2010).`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'coaching_session',
    content: `### Wadhwani Coaching — Founder Pitch Reviews (Healthcare & Agriculture)
- **Maternal Care (Adunni)**: Healthcare providers struggle to deliver timely maternal care due to specialist shortages and high patient volume, leading to delayed complication detection and preventable mortality.
- **Emergency Blood Matching (Sabrien/Cyprian)**: Families and hospitals in Nigeria struggle to find compatible blood quickly during emergencies due to the lack of a real-time system connecting eligible donors with patients.
- **Ambulance Clinical Data (Brooke)**: Critically ill and trauma patients face preventable clinical deterioration because ambulances cannot transmit real-time clinical data to hospital emergency departments prior to arrival.
- **Maize Crop Disease (Zina)**: 80% of maize smallholder farmers in South Sudan face recurring crop disease outbreaks, resulting in up to 75% annual yield loss due to unmanaged environmental factors.`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'coaching_session',
    content: `### Wadhwani Coaching — Founder Pitch Reviews (Fintech, EdTech, Retail & Services)
- **SME Tax & Bookkeeping (Oruru Edwin)**: Small business owners struggle to maintain accurate financial records and meet tax obligations because existing accounting tools are overly complex, leading to penalties and poor financial visibility.
- **Technical Founder Distribution Trap (Yusuf)**: Homogeneous technical founding teams struggle to distribute and market their products due to operational over-focus, leading to low traction and business failure.
- **Indigenous Language Exclusion (Ismaila)**: Millions of non-English/French speaking Africans are locked out of digital goods and services because digital platforms require European text literacy.
- **Youth Tech Pathways (Haruna)**: Young Africans seeking high-income tech careers face expensive training or fragmented free resources, leaving them without structured pathways needed to convert skills into income.`
  },
  {
    course_name: 'Wadhwani',
    source_type: 'coaching_session',
    content: `### Wadhwani Coaching — Evaluation Cadence & Milestone Feedback
- **Routine Platform Exercises**: Routine coursework and exercises are self-paced to maintain weekly momentum.
- **Milestone 1 Feedback Cadence**: Formal written evaluations occur at **Milestone 1** (Week 3/4), where facilitators formally evaluate all submitted Venture Journey slides directly on each venture's dashboard.
- **Revising Submissions**: Venture activities on the platform can be reopened, edited, and refined as many times as needed throughout the program.`
  }
];

async function importWadhwaniCoaching() {
  console.log(`🌱 Importing ${entries.length} Wadhwani Problem Statement Coaching knowledge entries into Supabase...`);

  const { data, error } = await supabase.from('knowledge_entries').insert(entries).select();

  if (error) {
    console.error('❌ Failed to import Wadhwani coaching entries:', error);
  } else {
    console.log(`✅ Successfully inserted ${data.length} Wadhwani Coaching entries into Supabase knowledge_entries!`);
  }
}

importWadhwaniCoaching().catch(console.error);
