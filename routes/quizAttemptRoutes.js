import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { startAttempt, submitAttempt } from '../controllers/quizAttemptController.js';

const router = express.Router();

router.post('/start', authenticateToken, startAttempt);
router.post('/submit', authenticateToken, submitAttempt);

export default router;