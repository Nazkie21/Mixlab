import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getUserXp, addUserXp } from '../controllers/xpController.js';

const router = express.Router();

router.get('/:id/xp', authenticateToken, getUserXp);
router.post('/:id/xp/add', authenticateToken, addUserXp);

export default router;