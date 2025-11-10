import { connectToDatabase } from '../config/db.js';

export const QuizAttempt = {
  start: async ({ quizId, userId }) => {
    try {
      console.log(' [QuizAttempt.start] Starting...');
      const db = await connectToDatabase();
      console.log(' [QuizAttempt.start] DB connected');
      
      console.log(' [QuizAttempt.start] Executing INSERT query');
      const [result] = await db.query(
        'INSERT INTO quiz_attempts (quiz_id, user_id, started_at, status) VALUES (?, ?, NOW(), "in_progress")',
        [quizId, userId]
      );
      
      console.log(' [QuizAttempt.start] Insert successful:', result);
      return { 
        attempt_id: result.insertId, 
        quiz_id: quizId, 
        user_id: userId, 
        status: 'in_progress' 
      };
    } catch (err) {
      console.error(' [QuizAttempt.start] Database error:', {
        message: err.message,
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        sql: err.sql
      });
      throw err;
    }
  },

  submit: async ({ attemptId, answers }) => {
    try {
      console.log(' [QuizAttempt.submit] Starting...');
      const db = await connectToDatabase();
      
      console.log(' [QuizAttempt.submit] Deleting old answers');
      await db.query('DELETE FROM quiz_attempt_answers WHERE attempt_id = ?', [attemptId]);
      
      console.log(' [QuizAttempt.submit] Inserting', answers.length, 'new answers');
      for (const a of answers || []) {
        await db.query(
          'INSERT INTO quiz_attempt_answers (attempt_id, question_id, selected_index) VALUES (?, ?, ?)',
          [attemptId, a.questionId, a.selectedIndex]
        );
      }
      
      console.log(' [QuizAttempt.submit] Updating attempt status to submitted');
      await db.query(
        'UPDATE quiz_attempts SET status = "submitted", submitted_at = NOW() WHERE attempt_id = ?', 
        [attemptId]
      );
      
      console.log(' [QuizAttempt.submit] Success');
    } catch (err) {
      console.error(' [QuizAttempt.submit] Database error:', {
        message: err.message,
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        sql: err.sql
      });
      throw err;
    }
  },

  getById: async (attemptId) => {
    try {
      console.log(' [QuizAttempt.getById] Fetching attempt:', attemptId);
      const db = await connectToDatabase();
      const [rows] = await db.query('SELECT * FROM quiz_attempts WHERE attempt_id = ?', [attemptId]);
      console.log(' [QuizAttempt.getById] Result:', rows[0] || 'null');
      return rows[0] || null;
    } catch (err) {
      console.error(' [QuizAttempt.getById] Database error:', err);
      throw err;
    }
  },

  getAttemptAnswers: async (attemptId) => {
    try {
      console.log(' [QuizAttempt.getAttemptAnswers] Fetching answers for attempt:', attemptId);
      const db = await connectToDatabase();
      const [rows] = await db.query('SELECT * FROM quiz_attempt_answers WHERE attempt_id = ?', [attemptId]);
      console.log(' [QuizAttempt.getAttemptAnswers] Found:', rows.length, 'answers');
      return rows || [];
    } catch (err) {
      console.error(' [QuizAttempt.getAttemptAnswers] Database error:', err);
      throw err;
    }
  },
};
