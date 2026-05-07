const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'attendance.db');
const db = new Database(dbPath);

function initializeDatabase() {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

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

  // Add missing columns if they don't exist (for existing databases)
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
