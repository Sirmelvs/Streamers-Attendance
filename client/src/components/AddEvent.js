import React, { useState } from 'react';

function AddEvent({ token, onEventAdded }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('event');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, event_date: date, type })
      });
      setTitle('');
      setDate('');
      onEventAdded(); // Refresh calendar
      alert('Event scheduled!');
    } catch (err) { console.error(err); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
      <div style={{ flex: 2 }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Event Title</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
      </div>
      <div style={{ flex: 1 }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
      </div>
      <div style={{ flex: 1 }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Type</label>
        <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '8px' }}>
          <option value="event">Standard Event</option>
          <option value="tournament">Tournament</option>
          <option value="meeting">Meeting</option>
        </select>
      </div>
      <button type="submit" style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}>Add to Calendar</button>
    </form>
  );
}

export default AddEvent;