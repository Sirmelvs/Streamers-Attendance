const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

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

// Initialize database
initializeDatabase();

// Start live-monitor polling after DB is ready
startLivePolling();

// Routes
app.use('/api/streamers', streamerRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/monitor', monitorRoutes);

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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
