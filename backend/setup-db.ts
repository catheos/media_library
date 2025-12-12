import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function setupDatabase(reset: boolean = false): Promise<void> {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASS
  });

  try {
    if (reset) {
      // Drop and recreate database
      await connection.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
      console.log(`Database ${process.env.DB_NAME} dropped`);
    }
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`Database ${process.env.DB_NAME} created or already exists`);
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await connection.end();
  }
}

// Check if --reset flag is passed
const reset = process.argv.includes('--reset');
setupDatabase(reset);