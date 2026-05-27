import 'dotenv/config';
import express from 'express';
import { authMiddleware } from './middleware/auth';
import { linearRouter } from './routes/linear';
import { calendarRouter } from './routes/calendar';
import { contextRouter } from './routes/context';

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use(authMiddleware);

  app.use('/linear', linearRouter);
  app.use('/calendar', calendarRouter);
  app.use('/context', contextRouter);

  return app;
}
