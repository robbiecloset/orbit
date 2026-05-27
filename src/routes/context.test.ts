import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { getLinearIssues } from '../integrations/linear';
import { getCalendarEvents } from '../integrations/gcal';
import type { Issue, CalendarEvent } from '../types';

vi.mock('../integrations/linear');
vi.mock('../integrations/gcal');

const mockIssue = (account: Issue['account']): Issue => ({
  id: 'issue-1',
  title: 'Test issue',
  url: 'https://linear.app/test/issue/1',
  priority: 1,
  priorityLabel: 'Urgent',
  state: 'Todo',
  project: null,
  team: 'Engineering',
  account,
  updatedAt: '2024-01-01T00:00:00.000Z',
});

const mockEvent = (account: CalendarEvent['account']): CalendarEvent => ({
  id: 'event-1',
  title: 'Standup',
  start: '2024-01-10T09:00:00.000Z',
  end: '2024-01-10T09:30:00.000Z',
  isAllDay: false,
  calendar: 'Work',
  account,
});

describe('GET /context', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.ORBIT_API_KEY = 'test-secret';
  });

  afterEach(() => {
    delete process.env.ORBIT_API_KEY;
  });

  it('returns 401 without auth', async () => {
    const res = await request(createApp()).get('/context');
    expect(res.status).toBe(401);
  });

  it('returns combined linear and calendar payload', async () => {
    vi.mocked(getLinearIssues).mockResolvedValue({
      personal: [mockIssue('personal')],
      work: [mockIssue('work')],
    });
    vi.mocked(getCalendarEvents).mockResolvedValue([mockEvent('personal')]);

    const res = await request(createApp())
      .get('/context')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(200);
    expect(res.body.generatedAt).toBeDefined();
    expect(res.body.linear.personal.issues).toHaveLength(1);
    expect(res.body.linear.work.issues).toHaveLength(1);
    expect(res.body.calendar.events).toHaveLength(1);
  });

  it('returns 500 when either integration throws', async () => {
    vi.mocked(getLinearIssues).mockRejectedValue(new Error('Linear down'));
    vi.mocked(getCalendarEvents).mockResolvedValue([]);

    const res = await request(createApp())
      .get('/context')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Linear down');
  });
});
