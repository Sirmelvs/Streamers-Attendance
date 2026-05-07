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
router.post('/', (req, res) => {
  try {
    const { streamer_id, status } = req.body;
    if (!streamer_id || !status) {
      return res.status(400).json({ error: 'streamer_id and status are required' });
    }
    
    // Validate status
    if (!['online', 'offline'].includes(status)) {
      return res.status(400).json({ error: 'status must be "online" or "offline"' });
    }

    const stmt = db.prepare(`
      INSERT INTO attendance (streamer_id, status)
      VALUES (?, ?)
    `);
    const result = stmt.run(streamer_id, status);

    // Update streamer status
    const updateStmt = db.prepare('UPDATE streamers SET status = ? WHERE id = ?');
    updateStmt.run(status, streamer_id);
    
    const record = db.prepare('SELECT * FROM attendance WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(record);
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
