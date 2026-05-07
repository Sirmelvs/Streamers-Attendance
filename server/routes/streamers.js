const express = require('express');
const { db } = require('../db/database');

const router = express.Router();

// Get all streamers
router.get('/', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT s.*, 
             COUNT(a.id) as total_attendance,
             MAX(a.timestamp) as last_online
      FROM streamers s
      LEFT JOIN attendance a ON s.id = a.streamer_id AND a.status = 'online'
      GROUP BY s.id
      ORDER BY s.name
    `);
    const streamers = stmt.all();
    res.json(streamers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single streamer
router.get('/:id', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM streamers WHERE id = ?');
    const streamer = stmt.get(req.params.id);
    if (!streamer) {
      return res.status(404).json({ error: 'Streamer not found' });
    }
    res.json(streamer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new streamer
router.post('/', (req, res) => {
  try {
    const { name, platform, page_link } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO streamers (name, platform, page_link, status)
      VALUES (?, ?, ?, 'offline')
    `);
    const result = stmt.run(name, platform || null, page_link || null);
    
    const newStreamer = db.prepare('SELECT * FROM streamers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newStreamer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update streamer
router.put('/:id', (req, res) => {
  try {
    const { name, platform, page_link, status } = req.body;
    const stmt = db.prepare(`
      UPDATE streamers 
      SET name = ?, platform = ?, page_link = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(name, platform || null, page_link || null, status, req.params.id);
    
    const updatedStreamer = db.prepare('SELECT * FROM streamers WHERE id = ?').get(req.params.id);
    res.json(updatedStreamer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete streamer
router.delete('/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM streamers WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ message: 'Streamer deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
