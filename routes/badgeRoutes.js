import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { 
  getAllBadges, 
  getUserBadges, 
  earnBadge, 
  createBadge 
} from '../controllers/badgeController.js';

const router = express.Router();

router.get('/', getAllBadges);
router.get('/:id/badges', authenticateToken, getUserBadges);
router.post('/earn', authenticateToken, earnBadge);
router.post('/', authenticateToken, authorizeRoles('admin'), createBadge);

export default router;