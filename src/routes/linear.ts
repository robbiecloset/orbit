import { Router, Request, Response } from 'express';
import { getLinearIssues } from '../integrations/linear';

export const linearRouter = Router();

linearRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const { personal, work } = await getLinearIssues();
    res.json({
      personal: { issues: personal },
      work: { issues: work },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});
