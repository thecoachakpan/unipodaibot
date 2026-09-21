import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log('GEMINI_API_KEY:', apiKey ? `${apiKey.slice(0, 8)}...` : 'NOT FOUND IN .env');

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

async function testModel(label, modelName) {
  try {
    console.log(`\n[${label}] Testing model: "${modelName}"...`);
    const response = await ai.models.generateContent({
      model: modelName,
      contents: 'Respond with "Hello from PodPal BOT!"',
    });
    console.log(`🟢 SUCCESS (${modelName}):`, response.text?.trim());
    return true;
  } catch (err) {
    console.error(`🔴 FAILED (${modelName}):`, err.message || err);
    return false;
  }
}

async function runFallbackChainTest() {
  console.log('====================================================');
  console.log('  Testing PodPal BOT Gemini Fallback Chain');
  console.log('====================================================');

  const primary = await testModel('Tier 1 Primary', 'gemini-3.1-flash-lite');
  if (primary) return;

  const fallback1 = await testModel('Tier 2 Fallback', 'gemini-3.5-flash-lite');
  if (fallback1) return;

  console.log('\n❌ ALL MODELS IN THE FALLBACK CHAIN FAILED!');
}

runFallbackChainTest();
