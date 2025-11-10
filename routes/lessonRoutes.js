// routes/lessonRoutes.js
import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { getLessons, getLessonById, submitQuiz, getProgress,} from "../controllers/lessonController.js";

const router = express.Router();

// public free lesson
router.get('/free', (req, res) => res.send('Free lesson for everyone'));

// guest-only or any - if you want to allow guests with role 'guest' saved in DB:
router.get('/guest-preview', authenticateToken, authorizeRoles('guest','user','admin'), (req, res) => {
  res.send('Preview for guest and registered users');
});

// premium lesson - only registered users and admins
router.get('/premium', authenticateToken, authorizeRoles('user','admin'), (req, res) => {
  res.send('Premium lesson only for logged-in users');
});

// admin route
router.delete('/lesson/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  res.send('Lesson deleted');
});

// Public routes
router.get("/free", (req, res) => res.send('Free lesson for everyone'));
router.get("/", getLessons);          // GET /api/lessons
router.get("/:id", getLessonById);    // GET /api/lessons/:id

// Protected routes
router.get("/guest-preview", authenticateToken, authorizeRoles('guest','user','admin'), (req, res) => {
  res.send('Preview for guest and registered users');
});
router.get("/premium", authenticateToken, authorizeRoles('user','admin'), (req, res) => {
  res.send('Premium lesson only for logged-in users');
});
router.delete("/:id", authenticateToken, authorizeRoles('admin'), (req, res) => {
  res.send('Lesson deleted');
});

// Quiz routes
router.post("/:id/submit", authenticateToken, submitQuiz);
router.get("/:id/progress", authenticateToken, getProgress);



export default router;
