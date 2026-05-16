const express = require('express');
const { db } = require('../db/database');

const router = express.Router();

// Get attendance records for a streamer
router.get('/streamer/:streamerId', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT a.*, s.name as streamer_name
      FROM attendance a
      JOIN streamers s ON a.streamer_id = s.id
      WHERE a.streamer_id = ?
      ORDER BY a.timestamp DESC
      LIMIT 100
    `);
    const records = stmt.all(req.params.streamerId);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance statistics
router.get('/stats/:streamerId', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'online' THEN 1 END) as online_count,
        COUNT(CASE WHEN status = 'offline' THEN 1 END) as offline_count,
        MIN(timestamp) as first_record,
        MAX(timestamp) as last_record,
        COUNT(DISTINCT DATE(timestamp)) as unique_days
      FROM attendance
      WHERE streamer_id = ?
    `);
    const stats = stmt.get(req.params.streamerId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record attendance
router.post('/', async (req, res) => {
  try {
    // We are now accepting the extra stream info!
    const { streamer_id, status, title, category, link } = req.body;

    if (!streamer_id || !status) {
      return res.status(400).json({ error: 'Streamer ID and status are required' });
    }

    // --- THE UNBREAKABLE BACKEND TIME LOCK ---
    if (status === 'online') {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();

        // Locked if: (1 AM AND >= 31 mins) OR (2 AM through 7 AM)
        if ((hours === 1 && minutes >= 31) || (hours >= 2 && hours <= 7)) {
            return res.status(403).json({ 
                error: "System Lock Active: Broadcasting is disabled between 1:31 AM and 7:59 AM server time." 
            });
        }
    }
    // --- END TIME LOCK ---

    // 1. Insert the attendance log history
    const insertStmt = db.prepare('INSERT INTO attendance (streamer_id, status) VALUES (?, ?)');
    insertStmt.run(streamer_id, status);

    // 2. Update the main streamer profile
    if (status === 'online') {
      // If they go online, save their stream info and the EXACT time they started
      const updateStmt = db.prepare(`
        UPDATE streamers 
        SET status = ?, current_title = ?, current_category = ?, current_link = ?, last_online_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      updateStmt.run(status, title || null, category || null, link || null, streamer_id);
    } else {
      const updateStmt = db.prepare('UPDATE streamers SET status = ? WHERE id = ?');
      updateStmt.run(status, streamer_id);
    }

    res.status(201).json({ message: 'Status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all attendance records with filters
router.get('/', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = `
      SELECT a.*, s.name as streamer_name
      FROM attendance a
      JOIN streamers s ON a.streamer_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ' AND DATE(a.timestamp) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND DATE(a.timestamp) <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY a.timestamp DESC LIMIT 500';

    const stmt = db.prepare(query);
    const records = stmt.all(...params);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;