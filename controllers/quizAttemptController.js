import { QuizAttempt } from '../models/quizAttempt.js';
import { XP } from '../models/xp.js';
import { Quiz } from '../models/quiz.js';

export const startAttempt = async (req, res) => {
  try {
    const { quizId, userId } = req.body;
    
    console.log(' [startAttempt] Received:', { quizId, userId });
    
    if (!quizId || !userId) {
      console.warn('[startAttempt] Missing quizId or userId');
      return res.status(400).json({ message: 'quizId and userId are required' });
    }
    
    console.log(' [startAttempt] Attempting to start quiz...');
    const attempt = await QuizAttempt.start({ quizId, userId });
    
    console.log('[startAttempt] Attempt created:', attempt);
    res.status(201).json({ message: 'Attempt started', attempt });
  } catch (error) {
    console.error(' [startAttempt] DETAILED ERROR:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sql: error.sql
    });
    res.status(500).json({ 
      message: 'Error starting attempt',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const submitAttempt = async (req, res) => {
  try {
    const { attemptId, answers = [] } = req.body;
    
    console.log(' [submitAttempt] Received:', { attemptId, answersCount: answers.length });
    
    if (!attemptId) {
      return res.status(400).json({ message: 'attemptId is required' });
    }
    
    // Get attempt details
    console.log('[submitAttempt] Fetching attempt:', attemptId);
    const attempt = await QuizAttempt.getById(attemptId);
    
    if (!attempt) {
      console.warn('[submitAttempt] Attempt not found:', attemptId);
      return res.status(404).json({ message: 'Attempt not found' });
    }
    
    console.log(' [submitAttempt] Attempt found:', attempt);
    
    // Submit answers
    console.log('[submitAttempt] Submitting answers...');
    await QuizAttempt.submit({ attemptId, answers });
    
    // Calculate score and award XP
    console.log('[submitAttempt] Fetching quiz:', attempt.quiz_id);
    const quiz = await Quiz.getByIdWithQuestions(attempt.quiz_id);
    
    if (!quiz) {
      console.warn('[submitAttempt] Quiz not found:', attempt.quiz_id);
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    console.log('[submitAttempt] Quiz found with', quiz.questions.length, 'questions');
    
    const attemptAnswers = await QuizAttempt.getAttemptAnswers(attemptId);
    console.log('[submitAttempt] Got attempt answers:', attemptAnswers.length);
    
    let score = 0;
    quiz.questions.forEach((question) => {
      const userAnswer = attemptAnswers.find(a => a.question_id === question.question_id);
      if (userAnswer && userAnswer.selected_index === question.correct_index) {
        score++;
      }
    });
    
    const scorePercentage = (score / quiz.questions.length) * 100;
    const xpReward = Math.ceil(scorePercentage);
    
    console.log(' [submitAttempt] Score:', { score, total: quiz.questions.length, percentage: scorePercentage, xpReward });
    
    // Award XP
    console.log(' [submitAttempt] Awarding XP to user:', attempt.user_id);
    await XP.addXp(attempt.user_id, xpReward, `Quiz submission: ${quiz.title}`);
    
    console.log('[submitAttempt] Success!');
    res.json({ 
      message: 'Attempt submitted', 
      score, 
      totalQuestions: quiz.questions.length,
      scorePercentage,
      xpAwarded: xpReward
    });
  } catch (error) {
    console.error('[submitAttempt] DETAILED ERROR:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sql: error.sql
    });
    res.status(500).json({ 
      message: 'Error submitting attempt',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
