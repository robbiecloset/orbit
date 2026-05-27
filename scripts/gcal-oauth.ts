/**
 * One-time helper to obtain a Google Calendar refresh token.
 * Run with: npm run oauth-gcal
 *
 * Set these env vars before running (or pass inline):
 *   GCAL_CLIENT_ID, GCAL_CLIENT_SECRET
 *
 * A browser tab will open (or print a URL to visit). After authorizing,
 * Google redirects to localhost and the script captures the code automatically.
 * Copy the printed refresh_token into your .env file.
 */

import 'dotenv/config';
import { google } from 'googleapis';
import * as http from 'http';
import * as url from 'url';

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const PORT = 3333;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/oauth2callback`;

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
  console.log('\nWaiting for Google to redirect back...\n');

  const code = await new Promise<string>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const parsed = url.parse(req.url ?? '', true);
      const code = parsed.query['code'];
      const error = parsed.query['error'];

      if (error) {
        res.end(`<h1>Authorization failed: ${error}</h1>`);
        server.close();
        reject(new Error(`OAuth error: ${error}`));
        return;
      }

      if (typeof code === 'string') {
        res.end('<h1>Authorization successful — you can close this tab.</h1>');
        server.close();
        resolve(code);
      }
    });

    server.listen(PORT, '127.0.0.1', () => {
      console.log(`Listening on ${REDIRECT_URI}`);
    });

    server.on('error', reject);
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
