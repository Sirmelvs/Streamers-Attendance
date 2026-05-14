const express = require('express');
const { db } = require('../db/database');

const router = express.Router();


router.get('/', (req, res) => {
    try {
        // We order them by date so the closest events show up first!
        const events = db.prepare('SELECT * FROM events ORDER BY event_date ASC').all();
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.delete('/:id', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM events WHERE id = ?');
        const info = stmt.run(req.params.id);

        if (info.changes === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.post('/', (req, res) => {
    try {
        const { title, description, event_date, type } = req.body;

        if (!title || !event_date) {
            return res.status(400).json({ error: 'Title and Date are required' });
        }

        const stmt = db.prepare(`
      INSERT INTO events (title, description, event_date, type) 
      VALUES (?, ?, ?, ?)
    `);

        stmt.run(title, description || '', event_date, type || 'event');

        res.status(201).json({ message: 'Event added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.put('/:id', (req, res) => {
  try {
    const { title, event_date, type } = req.body;
    
    if (!title || !event_date) {
      return res.status(400).json({ error: 'Title and Date are required' });
    }

    const stmt = db.prepare(`
      UPDATE events 
      SET title = ?, event_date = ?, type = ? 
      WHERE id = ?
    `);
    
    const info = stmt.run(title, event_date, type, req.params.id);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;