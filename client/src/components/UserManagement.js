import React, { useState, useEffect } from 'react';

function UserManagement({ token, streamers }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleLinkUser = async (userId, streamerId) => {
    setLoading(true);
    try {
      await fetch(`/api/users/${userId}/link`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ streamer_id: streamerId })
      });
      alert('Streamer linked successfully!');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error linking user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#333', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        User Account Linking
      </h2>
      
      {users.length === 0 ? (
        <p style={{ fontSize: '14px', color: '#666' }}>No streamer accounts have registered yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', textAlign: 'left', fontSize: '14px' }}>
              <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Account Username</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Linked Streamer Profile</th>
            </tr>
          </thead>
          <tbody>
            {users.map((account) => (
              <tr key={account.id}>
                <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                  {account.username}
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                  <select 
                    value={account.streamer_id || ''} 
                    onChange={(e) => handleLinkUser(account.id, e.target.value)}
                    disabled={loading}
                    style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', width: '200px' }}
                  >
                    <option value="">-- Select a Streamer --</option>
                    {streamers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.platform})</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UserManagement;