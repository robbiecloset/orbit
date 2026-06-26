# Orbit

A lightweight REST API that aggregates multi-account Linear and Google Calendar data for AI-assisted planning sessions.

## Stack

- TypeScript / Node.js
- Express
- Railway (deployment)
- dotenv

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness check |
| GET | `/linear` | Open issues assigned to you across both Linear accounts, organized by account |
| GET | `/calendar` | All events for the current week across both Google Calendar accounts, merged and sorted chronologically |
| GET | `/context` | Combined Linear + Calendar payload — the primary endpoint for planning sessions |

All endpoints require a `Authorization: Bearer <ORBIT_API_KEY>` header.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

```
ORBIT_API_KEY=          # any secret string you choose

LINEAR_PERSONAL_TOKEN=  # Linear: Settings → API → Personal API tokens
LINEAR_WORK_TOKEN=

GCAL_CLIENT_ID=          # shared by both accounts
GCAL_CLIENT_SECRET=

GCAL_PERSONAL_REFRESH_TOKEN=
GCAL_WORK_REFRESH_TOKEN=
```

### 3. Get Google Calendar refresh tokens

You only need **one** OAuth app — it can live in a personal Google Cloud
project and still authorize your work account. A refresh token is tied to
whichever account you sign in as during the consent flow, not to the project
that owns the OAuth app.

One-time setup:

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable the **Google Calendar API**
3. Create **OAuth 2.0 credentials** (Desktop app type), download the client ID and secret into `GCAL_CLIENT_ID` / `GCAL_CLIENT_SECRET`

Then, **for each account** (personal and work), run the helper script and sign
in as that account:

```bash
GCAL_CLIENT_ID=<your-client-id> GCAL_CLIENT_SECRET=<your-client-secret> npm run oauth-gcal
```

A browser tab opens; authorize, and the script captures the code automatically.
Copy the printed `refresh_token` into the matching env var
(`GCAL_PERSONAL_REFRESH_TOKEN` or `GCAL_WORK_REFRESH_TOKEN`).

> **Note:** if the OAuth consent screen is left in "Testing" mode, Google
> expires unverified refresh tokens after 7 days. Publish the app to
> "In production" to get long-lived tokens (no Google review is required for
> the `calendar.readonly` scope on your own accounts — just click through the
> unverified-app warning).

### 4. Run locally

```bash
npm run dev
```

## Deployment (Railway)

1. Connect this repo to a Railway project
2. Add all environment variables from `.env` in the Railway dashboard
3. Railway will build and start the app automatically using `railway.toml`

## Response shape — `/context`

```typescript
{
  generatedAt: string,
  linear: {
    personal: { issues: Issue[] },
    work: { issues: Issue[] }
  },
  calendar: {
    events: CalendarEvent[]  // merged, sorted chronologically
  }
}
```

Where `Issue` includes `id`, `title`, `url`, `priority`, `state`, `project`, `team`, `account`, and `updatedAt`; and `CalendarEvent` includes `id`, `title`, `start`, `end`, `isAllDay`, `calendar`, `account`, and optional `location` / `description`.
