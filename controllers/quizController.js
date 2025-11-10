import { Quiz } from '../models/quiz.js';

export const getQuizzes = async (_req, res) => {
  try {
    console.log(' Fetching all quizzes...');
    const quizzes = await Quiz.getAll();
    console.log(' Quizzes fetched:', quizzes);
    res.json(quizzes);
  } catch (error) {
    console.error(' DETAILED ERROR fetching quizzes:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).json({ 
      message: 'Error fetching quizzes',
      error: error.message, // FOR DEBUGGING ONLY
      details: error.stack  // FOR DEBUGGING ONLY
    });
  }
};

export const getQuizById = async (req, res) => {
  try {
    console.log(' Fetching quiz by ID:', req.params.id);
    const quiz = await Quiz.getByIdWithQuestions(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    console.log(' Quiz fetched:', quiz);
    res.json(quiz);
  } catch (error) {
    console.error(' DETAILED ERROR fetching quiz:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ 
      message: 'Error fetching quiz',
      error: error.message
    });
  }
};

export const createQuiz = async (req, res) => {
  try {
    console.log(' Creating quiz:', req.body);
    const { title, description, timeLimitSeconds, questions = [] } = req.body;
    
    if (!title) return res.status(400).json({ message: 'Title is required' });
    
    const quiz = await Quiz.create({ title, description, timeLimitSeconds });
    console.log(' Quiz created:', quiz);
    
    if (questions.length > 0) {
      await Quiz.upsertQuestions(quiz.quiz_id, questions);
    }
    
    const withQuestions = await Quiz.getByIdWithQuestions(quiz.quiz_id);
    res.status(201).json(withQuestions);
  } catch (error) {
    console.error(' DETAILED ERROR creating quiz:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ 
      message: 'Error creating quiz',
      error: error.message
    });
  }
};

export const updateQuiz = async (req, res) => {
  try {
    console.log(' Updating quiz:', req.params.id, req.body);
    const quizId = req.params.id;
    const { title, description, timeLimitSeconds, questions } = req.body;
    
    await Quiz.update(quizId, { title, description, timeLimitSeconds });
    
    if (Array.isArray(questions)) {
      await Quiz.upsertQuestions(quizId, questions);
    }
    
    const updated = await Quiz.getByIdWithQuestions(quizId);
    console.log(' Quiz updated:', updated);
    res.json(updated);
  } catch (error) {
    console.error(' DETAILED ERROR updating quiz:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ 
      message: 'Error updating quiz',
      error: error.message
    });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    console.log(' Deleting quiz:', req.params.id);
    await Quiz.remove(req.params.id);
    console.log(' Quiz deleted');
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error(' DETAILED ERROR deleting quiz:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ 
      message: 'Error deleting quiz',
      error: error.message
    });
  }
};
