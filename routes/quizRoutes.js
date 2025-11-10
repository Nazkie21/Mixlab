import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { 
  getQuizzes, 
  getQuizById, 
  createQuiz, 
  updateQuiz, 
  deleteQuiz 
} from '../controllers/quizController.js';

const router = express.Router();

router.get('/', getQuizzes);
router.get('/:id', getQuizById);
router.post('/', authenticateToken, authorizeRoles('admin'), createQuiz);
router.put('/:id', authenticateToken, authorizeRoles('admin'), updateQuiz);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteQuiz);

export default router;
