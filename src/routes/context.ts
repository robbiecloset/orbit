import { Router, Request, Response } from 'express';
import { getLinearIssues } from '../integrations/linear';
import { getCalendarEvents } from '../integrations/gcal';
import { ContextResponse } from '../types';

export const contextRouter = Router();

contextRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const [{ personal, work }, events] = await Promise.all([
      getLinearIssues(),
      getCalendarEvents(),
    ]);

    const payload: ContextResponse = {
      generatedAt: new Date().toISOString(),
      linear: {
        personal: { issues: personal },
        work: { issues: work },
      },
      calendar: { events },
    };

    res.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});
