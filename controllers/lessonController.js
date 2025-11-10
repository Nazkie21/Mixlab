// controllers/lessonController.js
import { Lesson } from "../models/lessonModel.js";
import { connectToDatabase } from "../config/db.js";

export const getLessons = async (req, res) => {
  try {
    const lessons = await Lesson.getAll();
    res.json(lessons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching lessons" });
  }
};

export const getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.getById(req.params.id);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    res.json(lesson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching lesson" });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { score } = req.body;
    const { id } = req.params;
    const userId = req.user.id || 1;
    console.log("submitQuiz called:", { lessonId: id, userId, score });


    // Get db connection
    const db = await connectToDatabase();

     const insertResult = await db.query(
      "INSERT INTO lesson_progress (lesson_id, user_id, score, completed) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE score = ?, completed = 1",
      [id, userId, score, score]
    );
    console.log("Insert result:", insertResult);

    
    // Calculate total points
    const [progress] = await db.query(
      "SELECT SUM(score) AS total_points FROM lesson_progress WHERE user_id = ?",
      [userId]
    );
    const totalPoints = progress[0].total_points || 0;

    // Check which badges the user can earn
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

    res.json({
      message: "Quiz submitted successfully!",
      totalPoints,
    });
  } catch (error) {
    console.error("SubmitQuiz error:", error); // detailed logging
    res.status(500).json({ message: "Error submitting quiz" });
  }
};

export const getProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const progress = await Lesson.getProgress(id, userId);
    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching progress" });
  }
};
