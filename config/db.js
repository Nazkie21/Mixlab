import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mixlab_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Connect to database
const connectToDatabase = async () => {
  try {
    // Test connection
    const connection = await pool.getConnection();
    console.log('MySQL Connected successfully!');
    connection.release();
    
    return pool;
  } catch (error) {
    console.error('Database connection error:', error.message);
    throw error;
  }
};

export { pool, connectToDatabase };