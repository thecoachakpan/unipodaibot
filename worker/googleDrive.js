/**
 * PodPal BOT - Google Drive Automated PDF & Document Uploader Module
 * Intercepts WhatsApp document attachments (<20MB), uploads to Google Drive,
 * sets public read permissions, and returns shareable web links.
 */

import { google } from 'googleapis';
import { Readable } from 'stream';

let driveClient = null;

function getDriveClient() {
  if (driveClient) return driveClient;

  // Option 1: Service Account (JWT)
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (email && rawKey) {
    const formattedKey = rawKey.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT(
      email,
      null,
      formattedKey,
      ['https://www.googleapis.com/auth/drive']
    );
    driveClient = google.drive({ version: 'v3', auth });
    return driveClient;
  }

  // Option 2: OAuth 2.0 Credentials (Client ID + Client Secret + Refresh Token)
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    driveClient = google.drive({ version: 'v3', auth: oauth2Client });
    return driveClient;
  }

  console.warn('[Google Drive] Credentials missing in environment variables.');
  return null;
}

/**
 * Uploads a decrypted attachment buffer directly to Google Drive.
 * @param {Buffer} fileBuffer - Decrypted file buffer
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File mimetype
 * @returns {Promise<string>} Shareable Google Drive web link
 */
export async function uploadToGoogleDrive(fileBuffer, fileName, mimeType) {
  const drive = getDriveClient();
  if (!drive) {
    throw new Error('Google Drive API client is not initialized.');
  }

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const fileMetadata = {
    name: fileName,
    parents: folderId ? [folderId] : []
  };

  const media = {
    mimeType: mimeType || 'application/pdf',
    body: Readable.from(fileBuffer)
  };

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, webViewLink'
  });

  const fileId = file.data.id;

  // Make file publicly readable by anyone with the link
  await drive.permissions.create({
    fileId: fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    }
  });

  console.log(`[Drive Upload Success] File ID: ${fileId}`);
  return file.data.webViewLink;
}

/**
 * Downloads a file buffer from Google Drive given a file ID or Drive link.
 * @param {string} fileIdOrUrl - Google Drive File ID or full view URL
 * @returns {Promise<Buffer>} File buffer
 */
export async function downloadFromGoogleDrive(fileIdOrUrl) {
  let fileId = fileIdOrUrl;
  if (fileIdOrUrl.includes('/d/')) {
    const match = fileIdOrUrl.match(/\/d\/([^\/]+)/);
    if (match) fileId = match[1];
  }

  const drive = getDriveClient();
  if (drive) {
    try {
      const res = await drive.files.get({ fileId: fileId, alt: 'media' }, { responseType: 'arraybuffer' });
      return Buffer.from(res.data);
    } catch (err) {
      console.warn('[Drive API Download Warning]:', err?.message || err);
    }
  }

  // Public download fallback
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const response = await fetch(downloadUrl);
  if (!response.ok) throw new Error(`Failed to download file from Drive: HTTP ${response.status}`);

  // Validate response is actual file content, not an HTML redirect/virus scan warning page
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('text/html')) {
    throw new Error(`Google Drive returned HTML page instead of file content (likely virus scan warning for large files). Use Drive API with service account credentials for reliable downloads.`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
