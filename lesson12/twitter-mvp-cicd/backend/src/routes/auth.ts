import { Router } from 'express';
const router = Router();
router.post('/login', (_req, res) => res.json({ token: 'demo-token' }));
export default router;
