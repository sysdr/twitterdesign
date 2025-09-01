import { Router } from 'express';
const router = Router();
router.get('/me', (_req, res) => res.json({ id: 1, name: 'Demo User' }));
export default router;
