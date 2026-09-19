/**
 * Helper script to generate a Google Drive OAuth2 Refresh Token
 * 
 * Usage:
 * 1. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env
 * 2. Run: node worker/get_refresh_token.js
 */

import { google } from 'googleapis';
import readline from 'readline';
import dotenv from 'dotenv';
dotenv.config();

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = 'https://developers.google.com/oauthplayground'; // Standard redirect URI

if (!clientId || !clientSecret || clientId.includes('your-client-id')) {
  console.error('\n❌ Please paste your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET into your .env file first!\n');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri
);

const scopes = [
  'https://www.googleapis.com/auth/drive'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent'
});

console.log('\n=============================================================');
console.log('🔑 GOOGLE OAUTH 2.0 REFRESH TOKEN GENERATOR');
console.log('=============================================================\n');
console.log('1. Open this URL in your browser:\n');
console.log(authUrl);
console.log('\n2. Log in, grant permission, and copy the authorization code.');
console.log('3. Paste the code below:\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter authorization code: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code.trim());
    console.log('\n=============================================================');
    console.log('SUCCESS! Add this line to your .env and Render variables:');
    console.log('=============================================================\n');
    console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"\n`);
  } catch (error) {
    console.error('\n❌ Error getting refresh token:', error.message);
  } finally {
    rl.close();
  }
});
