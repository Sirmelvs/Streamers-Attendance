const verifyToken = require('./middleware/authMiddleware');
const authRoutes = require('./routes/auth');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');

// Set timezone to GMT+8 (Asia/Singapore, Asia/Kuala_Lumpur, Asia/Manila, etc.)
process.env.TZ = 'Asia/Singapore';

const attendanceRoutes = require('./routes/attendance');
const streamerRoutes = require('./routes/streamers');
const monitorRoutes = require('./routes/monitor');
const initializeDatabase = require('./db/database');
const { startLivePolling } = require('./services/liveMonitor');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/users', verifyToken, userRoutes);

// Initialize database
initializeDatabase();

// // Start live-monitor polling after DB is ready
// startLivePolling();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/streamers', verifyToken, streamerRoutes);
app.use('/api/attendance', verifyToken, attendanceRoutes);
app.use('/api/monitor', verifyToken, monitorRoutes);
app.use('/api/events', verifyToken, eventRoutes);
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/build')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// PUT: Admin updates a streamer's schedule
// PUT: Admin updates a streamer's schedule
app.put('/api/streamers/:id/schedule', verifyToken, (req, res) => {
  try {
    // 1. Safely import the database right here so it never says "db is undefined"
    const { db } = require('./db/database'); 
    const { weekly_schedule } = req.body;
    const streamerId = req.params.id;

    // 2. Try updating the streamers table first
    try {
      db.prepare('UPDATE streamers SET weekly_schedule = ? WHERE id = ?').run(weekly_schedule, streamerId);
    } catch (err) {
      // 3. If they don't have a streamers table, fallback to athe users table
      db.prepare('UPDATE users SET weekly_schedule = ? WHERE id = ?').run(weekly_schedule, streamerId);
    }

    res.json({ message: 'Schedule updated successfully' });
  } catch (error) {
    // 4. If EVERYTHING fails, log the error but DO NOT CRASH the server!
    console.error("CRITICAL ERROR SAVING SCHEDULE:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
