import { Router } from 'express';
const router = Router();
router.get('/', (_req, res) => res.json([{ id: 1, text: 'Hello world' }]));
export default router;
