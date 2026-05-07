import React, { useState, useEffect } from 'react';
import './App.css';
import StreamerList from './components/StreamerList';
import AddStreamer from './components/AddStreamer';
import EditStreamer from './components/EditStreamer';
import AttendanceRecords from './components/AttendanceRecords';

function App() {
  const [streamers, setStreamers] = useState([]);
  const [selectedStreamer, setSelectedStreamer] = useState(null);
  const [editingStreamer, setEditingStreamer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [monitoringMessage, setMonitoringMessage] = useState('');
  const [monitoringMode, setMonitoringMode] = useState('unknown');
  const [scrapeFallbackEnabled, setScrapeFallbackEnabled] = useState(null);

  useEffect(() => {
    fetchStreamers();
    fetchMonitorSettings();
  }, []);

  const fetchMonitorSettings = async () => {
    try {
      const response = await fetch('/api/monitor/settings');
      const data = await response.json();
      setScrapeFallbackEnabled(data.useScrapeFallback);
      if (data.lastLiveCheckDetails?.lastMode) {
        setMonitoringMode(data.lastLiveCheckDetails.lastMode);
      }
    } catch (error) {
      console.error('Error fetching monitor settings:', error);
    }
  };

  const fetchStreamers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/streamers');
      const data = await response.json();
      setStreamers(data);
    } catch (error) {
      console.error('Error fetching streamers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStreamer = async (name, platform, page_link) => {
    try {
      const response = await fetch('/api/streamers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, platform, page_link })
      });
      const newStreamer = await response.json();
      setStreamers([...streamers, newStreamer]);
    } catch (error) {
      console.error('Error adding streamer:', error);
    }
  };

  const handleStatusUpdate = async (streamerId, status) => {
    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamer_id: streamerId, status })
      });
      fetchStreamers();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleCheckLiveNow = async () => {
    try {
      setMonitoringMessage('Checking live status...');
      const response = await fetch('/api/monitor/check');
      const data = await response.json();
      setMonitoringMessage(data.message || 'Live status updated');
      if (data.lastLiveCheckDetails?.lastMode) {
        setMonitoringMode(data.lastLiveCheckDetails.lastMode);
      }
      fetchStreamers();
      setTimeout(() => setMonitoringMessage(''), 4000);
    } catch (error) {
      console.error('Error running live check:', error);
      setMonitoringMessage('Live check failed. See console.');
    }
  };

  const handleToggleScrapeFallback = async () => {
    try {
      const nextValue = !scrapeFallbackEnabled;
      const response = await fetch('/api/monitor/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useScrapeFallback: nextValue })
      });
      const data = await response.json();
      setScrapeFallbackEnabled(data.useScrapeFallback);
    } catch (error) {
      console.error('Error toggling scrape fallback:', error);
    }
  };

  const handleDeleteStreamer = async (streamerId) => {
    try {
      await fetch(`/api/streamers/${streamerId}`, { method: 'DELETE' });
      setStreamers(streamers.filter(s => s.id !== streamerId));
      setSelectedStreamer(null);
    } catch (error) {
      console.error('Error deleting streamer:', error);
    }
  };

  const handleEditStreamer = (streamer) => {
    setEditingStreamer(streamer);
  };

  const handleSaveEdit = async (updatedData) => {
    try {
      const response = await fetch(`/api/streamers/${editingStreamer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      const updated = await response.json();
      setStreamers(streamers.map(s => s.id === updated.id ? updated : s));
      setSelectedStreamer(updated);
      setEditingStreamer(null);
      fetchStreamers();
    } catch (error) {
      console.error('Error updating streamer:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingStreamer(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>Streamer Attendance Monitor</h1>
          <div className="monitor-actions">
            <button className="monitor-btn" onClick={handleCheckLiveNow}>
              Check Live Status Now
            </button>
            <button className="monitor-btn" onClick={handleToggleScrapeFallback} disabled={scrapeFallbackEnabled === null}>
              {scrapeFallbackEnabled ? 'Disable Scrape Fallback' : 'Enable Scrape Fallback'}
            </button>
            {scrapeFallbackEnabled !== null && (
              <span className="monitor-message">
                Scrape fallback is {scrapeFallbackEnabled ? 'enabled' : 'disabled'}
              </span>
            )}
            <span className="monitor-message">
              Last live-check mode: {monitoringMode}
            </span>
            {monitoringMessage && <span className="monitor-message">{monitoringMessage}</span>}
          </div>
        </div>
      </header>
      <main className="App-main">
        <div className="sidebar">
          <AddStreamer onAddStreamer={handleAddStreamer} />
          <StreamerList 
            streamers={streamers}
            selectedStreamer={selectedStreamer}
            onSelectStreamer={setSelectedStreamer}
            onStatusUpdate={handleStatusUpdate}
            onDeleteStreamer={handleDeleteStreamer}
            onEditStreamer={handleEditStreamer}
            loading={loading}
          />
        </div>
        <div className="content">
          {selectedStreamer && (
            <AttendanceRecords streamer={selectedStreamer} />
          )}
        </div>
      </main>
      {editingStreamer && (
        <EditStreamer 
          streamer={editingStreamer}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      )}
    </div>
  );
}

export default App;
