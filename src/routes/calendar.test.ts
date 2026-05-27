import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { getCalendarEvents } from '../integrations/gcal';
import type { CalendarEvent } from '../types';

vi.mock('../integrations/gcal');

const mockEvent = (account: CalendarEvent['account']): CalendarEvent => ({
  id: 'event-1',
  title: 'Test Event',
  start: '2024-01-10T10:00:00.000Z',
  end: '2024-01-10T11:00:00.000Z',
  isAllDay: false,
  calendar: 'Test Calendar',
  account,
});

describe('GET /calendar', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.ORBIT_API_KEY = 'test-secret';
  });

  afterEach(() => {
    delete process.env.ORBIT_API_KEY;
  });

  it('returns 401 without auth', async () => {
    const res = await request(createApp()).get('/calendar');
    expect(res.status).toBe(401);
  });

  it('returns merged events array', async () => {
    vi.mocked(getCalendarEvents).mockResolvedValue([
      mockEvent('personal'),
      mockEvent('work'),
    ]);

    const res = await request(createApp())
      .get('/calendar')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(2);
    expect(res.body.events[0].account).toBe('personal');
  });

  it('returns 500 when integration throws', async () => {
    vi.mocked(getCalendarEvents).mockRejectedValue(new Error('GCal down'));

    const res = await request(createApp())
      .get('/calendar')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('GCal down');
  });
});
