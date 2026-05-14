import React, { useState, useEffect } from 'react';
import '../styles/AttendanceRecords.css';

function AttendanceRecords({ streamer, token }) {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // NEW: State for the Admin's view of the Live Timer
  const [liveUptime, setLiveUptime] = useState(0);

  // 1. Fetching Records and Stats
  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/attendance/streamer/${streamer.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setRecords(data);
        } else {
          setRecords([]);
        }
      } catch (error) {
        console.error('Error fetching records:', error);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/attendance/stats/${streamer.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!data.error) {
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    if (streamer && token) {
      fetchRecords();
      fetchStats();
    }
  }, [streamer, token]);

  // 2. Admin Live Timer Logic
  useEffect(() => {
    let interval = null;
    
    // Only run the timer if they are online and have a start time in the DB
    if (streamer.status === 'online' && streamer.last_online_at) {
      const startTime = new Date(streamer.last_online_at + 'Z').getTime();

      const updateTimer = () => {
        const now = new Date().getTime();
        const diff = Math.floor((now - startTime) / 1000);
        setLiveUptime(diff > 0 ? diff : 0);
      };

      updateTimer(); // Run immediately so it doesn't wait 1 second to show up
      interval = setInterval(updateTimer, 1000);
    } else {
      setLiveUptime(0);
    }
    
    return () => clearInterval(interval);
  }, [streamer.status, streamer.last_online_at]);

  // 3. Time Formatter Helper
  const formatLocalTime = (dbTimeString) => {
    if (!dbTimeString) return 'N/A';
    const date = new Date(dbTimeString + 'Z');
    return date.toLocaleString();
  };

  const formatUptime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 4. CSV Export
  const handleExportCSV = () => {
    if (records.length === 0) {
      alert('No records to export');
      return;
    }
    const headers = ['Timestamp', 'Status', 'Streamer'];
    const rows = records.map(r => [
      formatLocalTime(r.timestamp),
      r.status,
      r.streamer_name
    ]);
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `attendance_${streamer.name}_${new Date().toISOString().slice(0, 10)}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="attendance-records">
      <div className="record-header">
        <h2>Attendance Records - {streamer.name}</h2>
        <button onClick={handleExportCSV} className="export-btn">
          Export to CSV
        </button>
      </div>

      {/* THE NEW ADMIN LIVE BANNER */}
      {streamer.status === 'online' && (
        <div style={{ background: '#ecfdf5', border: '2px solid #10b981', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #a7f3d0', paddingBottom: '10px', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ height: '12px', width: '12px', backgroundColor: '#ef4444', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
              LIVE NOW
            </h3>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', fontFamily: 'monospace' }}>
              {formatUptime(liveUptime)}
            </span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '15px', color: '#334155' }}>
            <div><strong style={{ color: '#0f172a' }}>📝 Stream Title:</strong> {streamer.current_title || <em>None provided</em>}</div>
            <div><strong style={{ color: '#0f172a' }}>🎮 Category/Game:</strong> {streamer.current_category || <em>None provided</em>}</div>
            <div style={{ gridColumn: 'span 2' }}>
              <strong style={{ color: '#0f172a' }}>🔗 Broadcast Link:</strong>{' '}
              {streamer.current_link ? (
                <a href={streamer.current_link} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 'bold' }}>
                  {streamer.current_link}
                </a>
              ) : (
                <em>None provided</em>
              )}
            </div>
          </div>
        </div>
      )}

      {/* The Rest of Your Existing Code */}
      {stats && (
        <div className="stats">
          <div className="stat-item">
            <span className="stat-label">Times Online:</span>
            <span className="stat-value">{stats.online_count || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Times Offline:</span>
            <span className="stat-value">{stats.offline_count || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active Days:</span>
            <span className="stat-value">{stats.unique_days || 0}</span>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading records...</p>
      ) : records.length === 0 ? (
        <p>No attendance records yet</p>
      ) : (
        <table className="records-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{formatLocalTime(record.timestamp)}</td>
                <td>
                  <span className={`status-badge status-${record.status}`}>
                    {record.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AttendanceRecords;