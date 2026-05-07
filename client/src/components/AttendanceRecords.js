import React, { useState, useEffect } from 'react';
import '../styles/AttendanceRecords.css';

function AttendanceRecords({ streamer }) {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (streamer) {
      fetchRecords();
      fetchStats();
    }
  }, [streamer]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/attendance/streamer/${streamer.id}`);
      const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/attendance/stats/${streamer.id}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) {
      alert('No records to export');
      return;
    }

    const headers = ['Timestamp', 'Status', 'Streamer'];
    const rows = records.map(r => [
      new Date(r.timestamp).toLocaleString(),
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
                <td>{new Date(record.timestamp).toLocaleString()}</td>
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
