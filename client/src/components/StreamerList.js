import React from 'react';
import '../styles/StreamerList.css';

function StreamerList({ 
  streamers, 
  selectedStreamer, 
  onSelectStreamer, 
  onStatusUpdate, 
  onDeleteStreamer,
  onEditStreamer,
  loading 
}) {
  return (
    <div className="streamer-list">
      <h2>Streamers ({streamers.length})</h2>
      {loading ? (
        <p>Loading...</p>
      ) : streamers.length === 0 ? (
        <p>No streamers added yet</p>
      ) : (
        <ul>
          {streamers.map((streamer) => (
            <li
              key={streamer.id}
              className={`streamer-item ${selectedStreamer?.id === streamer.id ? 'selected' : ''} ${streamer.status}`}
              onClick={() => onSelectStreamer(streamer)}
            >
              <div className="streamer-info">
                <h3>{streamer.name}</h3>
                <p>{streamer.platform || 'N/A'}</p>
                {streamer.page_link && (
                  <a 
                    href={streamer.page_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="page-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    🔗 Visit Page
                  </a>
                )}
                <p className={`status status-${streamer.status}`}>
                  Status: {streamer.status}
                </p>
              </div>
              <div className="streamer-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusUpdate(streamer.id, streamer.status === 'online' ? 'offline' : 'online');
                  }}
                  className={`status-btn status-${streamer.status}`}
                >
                  {streamer.status === 'online' ? 'Mark Offline' : 'Mark Online'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditStreamer(streamer);
                  }}
                  className="edit-btn"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this streamer?')) {
                      onDeleteStreamer(streamer.id);
                    }
                  }}
                  className="delete-btn"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default StreamerList;
