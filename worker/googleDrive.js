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

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !rawKey) {
    console.warn('[Google Drive] Credentials missing in environment variables.');
    return null;
  }

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
