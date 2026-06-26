import { describe, it, expect } from 'vitest';
import { getWeekBounds } from './gcal';

describe('getWeekBounds', () => {
  it('spans exactly 7 days', () => {
    const { timeMin, timeMax } = getWeekBounds();
    const diff = new Date(timeMax).getTime() - new Date(timeMin).getTime();
    expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('contains the current date', () => {
    const now = Date.now();
    const { timeMin, timeMax } = getWeekBounds();
    expect(new Date(timeMin).getTime()).toBeLessThanOrEqual(now);
    expect(new Date(timeMax).getTime()).toBeGreaterThan(now);
  });
});
