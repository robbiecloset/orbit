import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { getLinearIssues } from '../integrations/linear';
import type { Issue } from '../types';

vi.mock('../integrations/linear');

const mockIssue = (account: Issue['account']): Issue => ({
  id: 'issue-1',
  title: 'Test issue',
  url: 'https://linear.app/test/issue/1',
  priority: 2,
  priorityLabel: 'Medium',
  state: 'In Progress',
  project: 'Test Project',
  team: 'Engineering',
  account,
  updatedAt: '2024-01-01T00:00:00.000Z',
});

describe('GET /linear', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.ORBIT_API_KEY = 'test-secret';
  });

  afterEach(() => {
    delete process.env.ORBIT_API_KEY;
  });

  it('returns 401 without auth', async () => {
    const res = await request(createApp()).get('/linear');
    expect(res.status).toBe(401);
  });

  it('returns issues grouped by account', async () => {
    vi.mocked(getLinearIssues).mockResolvedValue({
      personal: [mockIssue('personal')],
      work: [mockIssue('work')],
    });

    const res = await request(createApp())
      .get('/linear')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(200);
    expect(res.body.personal.issues).toHaveLength(1);
    expect(res.body.work.issues).toHaveLength(1);
    expect(res.body.personal.issues[0].account).toBe('personal');
  });

  it('returns 500 when integration throws', async () => {
    vi.mocked(getLinearIssues).mockRejectedValue(new Error('Linear down'));

    const res = await request(createApp())
      .get('/linear')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Linear down');
  });
});
