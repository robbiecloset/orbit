/**
 * One-time helper to obtain a Google Calendar refresh token.
 * Run with: npm run oauth-gcal
 *
 * Set these env vars before running (or pass inline):
 *   GCAL_CLIENT_ID, GCAL_CLIENT_SECRET
 *
 * Follow the printed URL, authorize, paste the code back, and copy the
 * refresh_token into your .env file.
 */

import 'dotenv/config';
import { google } from 'googleapis';
import * as readline from 'readline';

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

async function main() {
  const clientId = process.env.GCAL_CLIENT_ID;
  const clientSecret = process.env.GCAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Set GCAL_CLIENT_ID and GCAL_CLIENT_SECRET before running.');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('\nOpen this URL in your browser:\n');
  console.log(authUrl);
  console.log();

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise<string>((resolve) => {
    rl.question('Paste the authorization code here: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  const { tokens } = await oauth2Client.getToken(code);
  console.log('\nTokens received:');
  console.log(JSON.stringify(tokens, null, 2));
  console.log('\nCopy the refresh_token value into your .env file.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
