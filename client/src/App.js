import React, { useState, useEffect } from 'react';
import './App.css';
import StreamerList from './components/StreamerList';
import AddStreamer from './components/AddStreamer';
import EditStreamer from './components/EditStreamer';
import AttendanceRecords from './components/AttendanceRecords';
import Auth from './components/Auth';
import StreamerDashboard from './components/StreamerDashboard';
import UserManagement from './components/UserManagement';
import CalendarView from './components/CalendarView';
import AddEvent from './components/AddEvent';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [streamers, setStreamers] = useState([]);
  const [selectedStreamer, setSelectedStreamer] = useState(null);
  const [editingStreamer, setEditingStreamer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [monitoringMessage, setMonitoringMessage] = useState('');
  const [monitoringMode, setMonitoringMode] = useState('unknown');
  const [scrapeFallbackEnabled, setScrapeFallbackEnabled] = useState(null);
  const [calendarTrigger, setCalendarTrigger] = useState(0);
  const handleEventAdded = () => setCalendarTrigger(prev => prev + 1);

  useEffect(() => {
    if (token) {
      fetchStreamers();
      fetchMonitorSettings();
    }
  }, [token]); // This tells React to re-run the fetch when your token changes (like when you log in)

  const handleLogin = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const fetchMonitorSettings = async () => {
    try {
      const response = await fetch('/api/monitor/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
      const response = await fetch('/api/streamers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (Array.isArray(data)) {
        setStreamers(data);
      } else {
        setStreamers([]);
        if (response.status === 401 || response.status === 403) {
          handleLogout();
        }
      }
    } catch (error) {
      console.error('Error fetching streamers:', error);
      setStreamers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckLiveNow = async () => {
    try {
      setMonitoringMessage('Checking live status...');
      const response = await fetch('/api/monitor/check', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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

  const handleAddStreamer = async (name, platform, page_link) => {
    try {
      const response = await fetch('/api/streamers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ streamer_id: streamerId, status })
      });
      fetchStreamers();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleToggleScrapeFallback = async () => {
    try {
      const nextValue = !scrapeFallbackEnabled;
      const response = await fetch('/api/monitor/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
      await fetch(`/api/streamers/${streamerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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

  // 1. If not logged in, show the Auth screen
  if (!token || !user) {
    return (
      <div className="App" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <Auth onLogin={handleLogin} />
      </div>
    );
  }

  // 2. If logged in as a STREAMER, show the Streamer UI
  if (user.role === 'streamer') {
    return (
      <div className="App">
        <header className="App-header">
          <div className="header-content">
            <h1>Streamer Portal</h1>
            <div className="monitor-actions">
              <button className="monitor-btn" onClick={handleLogout} style={{ backgroundColor: '#e53e3e' }}>
                Logout
              </button>
            </div>
          </div>
        </header>
        <main style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
          <StreamerDashboard user={user} token={token} />
        </main>
      </div>
    );
  }

  // 3. If logged in as an ADMIN, show your existing Admin UI
  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>Admin Control Panel</h1>
          <div className="monitor-actions">
            <button className="monitor-btn" onClick={handleCheckLiveNow}>
              Check Live Status Now
            </button>
            <button className="monitor-btn" onClick={handleToggleScrapeFallback} disabled={scrapeFallbackEnabled === null}>
              {scrapeFallbackEnabled ? 'Disable Scrape Fallback' : 'Enable Scrape Fallback'}
            </button>
            <button className="monitor-btn" onClick={handleLogout} style={{ backgroundColor: '#e53e3e' }}>
              Logout
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

          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#333', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
              Event Calendar Management
            </h2>
            <AddEvent token={token} onEventAdded={handleEventAdded} />
            <CalendarView token={token} key={calendarTrigger} isAdmin={true} />
          </div>

          <UserManagement token={token} streamers={streamers} />
          {selectedStreamer && (
            <AttendanceRecords streamer={selectedStreamer} token={token} />
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
