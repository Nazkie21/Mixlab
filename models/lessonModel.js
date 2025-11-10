// models/lessonModel.js
import { connectToDatabase } from "../config/db.js";

export const Lesson = {
  getAll: async () => {
    const db = await connectToDatabase();
    const [rows] = await db.query("SELECT * FROM lessons");
    return rows;
  },

  getById: async (id) => {
    const db = await connectToDatabase();
    const [rows] = await db.query("SELECT * FROM lessons WHERE `lesson_id` = ?", [id]);
    return rows[0];
  },

  submitQuiz: async (lessonId, userId, score) => {
    const db = await connectToDatabase();

    //  Save quiz progress
    await db.query(
      "INSERT INTO lesson_progress (lesson_id, user_id, score, completed) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE score = ?, completed = 1",
      [lessonId, userId, score, score]
    );

    //  Calculate total points
    const [progress] = await db.query(
      "SELECT SUM(score) AS total_points FROM lesson_progress WHERE user_id = ?",
      [userId]
    );
    const totalPoints = progress[0].total_points || 0;

    // Assign badges
    const [badges] = await db.query(
      "SELECT * FROM badges WHERE points_required <= ?",
      [totalPoints]
    );

    for (const badge of badges) {
      await db.query(
        "INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)",
        [userId, badge.id]
      );
    }

    // Return response
    return {
      message: "Quiz submitted successfully!",
      totalPoints,
    };
  },

  getProgress: async (lessonId, userId) => {
    const db = await connectToDatabase();
    const [rows] = await db.query(
      "SELECT * FROM lesson_progress WHERE lesson_id = ? AND user_id = ?",
      [lessonId, userId]
    );
    return rows[0] || { progress: 0, score: 0 };
  },
};
