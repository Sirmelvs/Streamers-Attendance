const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'attendance.db');
const db = new Database(dbPath);

function initializeDatabase() {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
// Create Events table for the Calendar
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      event_date DATE NOT NULL,
      type TEXT DEFAULT 'event',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create streamers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS streamers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      platform TEXT,
      page_link TEXT,
      status TEXT DEFAULT 'offline',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'streamer',
      streamer_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE SET NULL
    )
  `);


  const addColumnSafely = (table, column, definition) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    } catch (err) {
      if (!err.message.includes('duplicate column')) {
        console.error(`Error adding column ${column}:`, err.message);
      }
    }
  };

  addColumnSafely('streamers', 'page_link', 'TEXT');
  addColumnSafely('streamers', 'platform', 'TEXT');
  addColumnSafely('streamers', 'status', 'TEXT DEFAULT "offline"');
  addColumnSafely('users', 'role', "TEXT DEFAULT 'streamer'");
  addColumnSafely('users', 'streamer_id', "INTEGER");
  addColumnSafely('streamers', 'current_title', 'TEXT');
  addColumnSafely('streamers', 'current_category', 'TEXT');
  addColumnSafely('streamers', 'current_link', 'TEXT');
  addColumnSafely('streamers', 'last_online_at', 'DATETIME');

  // Create attendance records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      streamer_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (streamer_id) REFERENCES streamers(id) ON DELETE CASCADE
    )
  `);

  // Create index for faster queries
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_attendance_streamer_id 
      ON attendance(streamer_id)
    `);
  } catch (err) {
    // Index already exists
  }

  console.log('Database initialized successfully');
}

module.exports = initializeDatabase;
module.exports.db = db;
