import React, { useState } from 'react';
import '../styles/AddStreamer.css';

function AddStreamer({ onAddStreamer }) {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('');
  const [page_link, setPageLink] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Streamer name is required');
      return;
    }
    
    onAddStreamer(name, platform, page_link);
    setName('');
    setPlatform('');
    setPageLink('');
    setError('');
  };

  return (
    <div className="add-streamer">
      <h2>Add New Streamer</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Streamer Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Platform (optional)"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        />
        <input
          type="url"
          placeholder="Page Link (optional)"
          value={page_link}
          onChange={(e) => setPageLink(e.target.value)}
        />
        <button type="submit">Add Streamer</button>
      </form>
    </div>
  );
}

export default AddStreamer;
