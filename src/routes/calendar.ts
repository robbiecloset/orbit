import { Router, Request, Response } from 'express';
import { getCalendarEvents } from '../integrations/gcal';

export const calendarRouter = Router();

calendarRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const events = await getCalendarEvents();
    res.json({ events });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});
