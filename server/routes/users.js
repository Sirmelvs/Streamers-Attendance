const express = require('express');
const { db } = require('../db/database');

const router = express.Router();


router.get('/', (req, res) => {
  try {
    const users = db.prepare("SELECT id, username, role, streamer_id FROM users WHERE role = 'streamer'").all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.put('/:id/link', (req, res) => {
  try {
    const { streamer_id } = req.body;
    const value = streamer_id === '' ? null : streamer_id; 
    
    const stmt = db.prepare('UPDATE users SET streamer_id = ? WHERE id = ?');
    stmt.run(value, req.params.id);
    
    res.json({ message: 'Account linked successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;