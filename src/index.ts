import 'dotenv/config';
import express from 'express';
import { authMiddleware } from './middleware/auth';
import { linearRouter } from './routes/linear';
import { calendarRouter } from './routes/calendar';
import { contextRouter } from './routes/context';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(authMiddleware);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/linear', linearRouter);
app.use('/calendar', calendarRouter);
app.use('/context', contextRouter);

app.listen(PORT, () => {
  console.log(`Orbit running on port ${PORT}`);
});
