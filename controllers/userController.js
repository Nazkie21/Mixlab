import { connectToDatabase } from "../config/db.js";

// GET /profile //Already logged in 
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const db = await connectToDatabase();

    const [rows] = await db.query(
      "SELECT id, name, email, role, contact, profilePhoto FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, contact, profilePhoto } = req.body;
    const db = await connectToDatabase();

    await db.query(
      "UPDATE users SET name = ?, contact = ?, profilePhoto = ? WHERE id = ?",
      [name, contact, profilePhoto, userId]
    );

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
