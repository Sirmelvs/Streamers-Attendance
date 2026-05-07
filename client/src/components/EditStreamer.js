import React, { useState, useEffect } from 'react';
import '../styles/EditStreamer.css';

function EditStreamer({ streamer, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('');
  const [page_link, setPageLink] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (streamer) {
      setName(streamer.name);
      setPlatform(streamer.platform || '');
      setPageLink(streamer.page_link || '');
      setError('');
    }
  }, [streamer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Streamer name is required');
      return;
    }
    
    onSave({
      name,
      platform,
      page_link
    });
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  return (
    <div className="edit-streamer-overlay">
      <div className="edit-streamer-modal">
        <div className="modal-header">
          <h2>Edit Streamer Info</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        
        {error && <p className="error">{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Streamer Name *</label>
            <input
              id="name"
              type="text"
              placeholder="Streamer Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="platform">Platform</label>
            <input
              id="platform"
              type="text"
              placeholder="e.g., Twitch, YouTube, etc."
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="page_link">Page Link</label>
            <input
              id="page_link"
              type="url"
              placeholder="https://example.com/streamer"
              value={page_link}
              onChange={(e) => setPageLink(e.target.value)}
            />
            {page_link && !isValidUrl(page_link) && (
              <p className="warning">Please enter a valid URL</p>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditStreamer;
