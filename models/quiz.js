import { connectToDatabase } from '../config/db.js';

export const Quiz = {
  getAll: async () => {
    try {
      console.log(' [Quiz.getAll] Connecting to database...');
      const db = await connectToDatabase();
      console.log(' [Quiz.getAll] Executing query...');
      const [rows] = await db.query('SELECT * FROM quizzes ORDER BY created_at DESC');
      console.log(' [Quiz.getAll] Result:', rows);
      return rows || [];
    } catch (err) {
      console.error(' [Quiz.getAll] Database error:', err);
      throw err;
    }
  },

  getByIdWithQuestions: async (quizId) => {
    try {
      console.log(' [Quiz.getByIdWithQuestions] Fetching quiz:', quizId);
      const db = await connectToDatabase();
      const [quizRows] = await db.query('SELECT * FROM quizzes WHERE quiz_id = ?', [quizId]);
      
      if (!quizRows || !quizRows[0]) {
        console.log(' [Quiz.getByIdWithQuestions] Quiz not found');
        return null;
      }
      
      const [questionRows] = await db.query(
        'SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY order_index ASC',
        [quizId]
      );
      
      const result = { ...quizRows[0], questions: questionRows || [] };
      console.log(' [Quiz.getByIdWithQuestions] Result:', result);
      return result;
    } catch (err) {
      console.error(' [Quiz.getByIdWithQuestions] Database error:', err);
      throw err;
    }
  },

  create: async ({ title, description, timeLimitSeconds = null }) => {
    try {
      console.log(' [Quiz.create] Creating quiz:', { title, description, timeLimitSeconds });
      const db = await connectToDatabase();
      const [result] = await db.query(
        'INSERT INTO quizzes (title, description, time_limit_seconds, created_at) VALUES (?, ?, ?, NOW())',
        [title, description ?? null, timeLimitSeconds]
      );
      console.log(' [Quiz.create] Insert result:', result);
      return { 
        quiz_id: result.insertId, 
        title, 
        description, 
        time_limit_seconds: timeLimitSeconds 
      };
    } catch (err) {
      console.error(' [Quiz.create] Database error:', err);
      throw err;
    }
  },

  update: async (quizId, { title, description, timeLimitSeconds = null }) => {
    try {
      console.log(' [Quiz.update] Updating quiz:', quizId);
      const db = await connectToDatabase();
      await db.query(
        'UPDATE quizzes SET title=COALESCE(?, title), description=COALESCE(?, description), time_limit_seconds=COALESCE(?, time_limit_seconds) WHERE quiz_id=?',
        [title ?? null, description ?? null, timeLimitSeconds, quizId]
      );
      console.log(' [Quiz.update] Success');
    } catch (err) {
      console.error(' [Quiz.update] Database error:', err);
      throw err;
    }
  },

  remove: async (quizId) => {
    try {
      console.log(' [Quiz.remove] Deleting quiz:', quizId);
      const db = await connectToDatabase();
      await db.query('DELETE FROM quiz_attempt_answers WHERE attempt_id IN (SELECT attempt_id FROM quiz_attempts WHERE quiz_id = ?)', [quizId]);
      await db.query('DELETE FROM quiz_attempts WHERE quiz_id = ?', [quizId]);
      await db.query('DELETE FROM quiz_questions WHERE quiz_id = ?', [quizId]);
      await db.query('DELETE FROM quizzes WHERE quiz_id = ?', [quizId]);
      console.log(' [Quiz.remove] Success');
    } catch (err) {
      console.error(' [Quiz.remove] Database error:', err);
      throw err;
    }
  },

  upsertQuestions: async (quizId, questions) => {
    try {
      console.log(' [Quiz.upsertQuestions] Upserting questions for quiz:', quizId);
      const db = await connectToDatabase();
      await db.query('DELETE FROM quiz_questions WHERE quiz_id = ?', [quizId]);
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await db.query(
          'INSERT INTO quiz_questions (quiz_id, text, options_json, correct_index, order_index) VALUES (?, ?, ?, ?, ?)',
          [quizId, q.text, JSON.stringify(q.options || []), q.correctIndex ?? null, i]
        );
      }
      console.log(' [Quiz.upsertQuestions] Success - inserted', questions.length, 'questions');
    } catch (err) {
      console.error(' [Quiz.upsertQuestions] Database error:', err);
      throw err;
    }
  },
};