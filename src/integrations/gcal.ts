import { google } from 'googleapis';
import { CalendarEvent, Account } from '../types';

function getOAuthClient(account: Account) {
  const clientId = process.env.GCAL_CLIENT_ID;
  const clientSecret = process.env.GCAL_CLIENT_SECRET;
  const refreshToken =
    account === 'personal'
      ? process.env.GCAL_PERSONAL_REFRESH_TOKEN
      : process.env.GCAL_WORK_REFRESH_TOKEN;

  if (!clientId || !clientSecret) {
    throw new Error('GCAL_CLIENT_ID and GCAL_CLIENT_SECRET must be set');
  }
  if (!refreshToken) {
    throw new Error(`Missing Google Calendar refresh token for ${account} account`);
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
  return auth;
}

export function getWeekBounds(): { timeMin: string; timeMax: string } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  return {
    timeMin: startOfWeek.toISOString(),
    timeMax: endOfWeek.toISOString(),
  };
}

async function fetchEvents(account: Account): Promise<CalendarEvent[]> {
  const auth = getOAuthClient(account);
  const calendar = google.calendar({ version: 'v3', auth });
  const { timeMin, timeMax } = getWeekBounds();

  const calListResponse = await calendar.calendarList.list();
  const calendarList = calListResponse.data.items ?? [];

  const allEvents: CalendarEvent[] = [];

  await Promise.all(
    calendarList.map(async (cal) => {
      if (!cal.id) return;

      const eventsResponse = await calendar.events.list({
        calendarId: cal.id,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250,
      });

      const events = eventsResponse.data.items ?? [];
      const calendarName = cal.summary ?? cal.id;

      for (const event of events) {
        if (!event.id) continue;

        const isAllDay = Boolean(event.start?.date && !event.start?.dateTime);
        const start = event.start?.dateTime ?? event.start?.date ?? '';
        const end = event.end?.dateTime ?? event.end?.date ?? '';

        allEvents.push({
          id: event.id,
          title: event.summary ?? '(No title)',
          start,
          end,
          isAllDay,
          calendar: calendarName,
          account,
          ...(event.location ? { location: event.location } : {}),
          ...(event.description ? { description: event.description } : {}),
        });
      }
    })
  );

  return allEvents;
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const [personalEvents, workEvents] = await Promise.all([
    fetchEvents('personal'),
    fetchEvents('work'),
  ]);

  const merged = [...personalEvents, ...workEvents];

  merged.sort((a, b) => {
    const aTime = new Date(a.start).getTime();
    const bTime = new Date(b.start).getTime();
    // All-day events sort by date string if timestamps are equal
    if (aTime === bTime) {
      return a.isAllDay ? -1 : b.isAllDay ? 1 : 0;
    }
    return aTime - bTime;
  });

  return merged;
}
