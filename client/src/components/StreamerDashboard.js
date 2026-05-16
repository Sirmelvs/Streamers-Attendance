import React, { useState, useEffect } from 'react';
import CalendarView from './CalendarView';
import dashboardBg from '../assets/dashboard-bg.jpg';

function StreamerDashboard({ user, token }) {
    const [status, setStatus] = useState('offline');
    const [loading, setLoading] = useState(false);
    const [streamTitle, setStreamTitle] = useState('');
    const [streamInfo, setStreamInfo] = useState('');
    const [streamLink, setStreamLink] = useState('');
    const [streamerName, setStreamerName] = useState('');
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const [mySchedule, setMySchedule] = useState('');
    const [isTimeLocked, setIsTimeLocked] = useState(false);

    useEffect(() => {
        const checkTimeLock = () => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();

            // Locked if: (1 AM AND >= 31 mins) OR (2 AM through 7 AM)
            if ((hours === 1 && minutes >= 31) || (hours >= 2 && hours <= 7)) {
                setIsTimeLocked(true);
            } else {
                setIsTimeLocked(false);
            }
        };

        checkTimeLock(); // Check immediately on load
        const interval = setInterval(checkTimeLock, 60000); // Re-check every 60 seconds
        return () => clearInterval(interval);
    }, []);

    // Fetch initial status
    useEffect(() => {
        const fetchCurrentStatus = async () => {
            if (!user.streamer_id) return;
            try {
                const response = await fetch('/api/streamers', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const streamers = await response.json();

                if (Array.isArray(streamers)) {
                    const myProfile = streamers.find(s => s.id === user.streamer_id);

                    if (myProfile) {
                        setStatus(myProfile.status || 'offline');
                        setStreamTitle(myProfile.current_title || '');
                        setStreamInfo(myProfile.current_category || ''); 
                        setStreamLink(myProfile.current_link || '');
                        setStreamerName(myProfile.name || ''); 
                        setMySchedule(myProfile.weekly_schedule || 'No schedule set yet.');

                        if (myProfile.status === 'online' && myProfile.last_online_at) {
                            const startTime = new Date(myProfile.last_online_at + 'Z').getTime();
                            const now = new Date().getTime();
                            const diffInSeconds = Math.floor((now - startTime) / 1000);
                            setSessionSeconds(diffInSeconds > 0 ? diffInSeconds : 0);
                        } else {
                            setSessionSeconds(0);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching current status:', error);
            }
        };
        fetchCurrentStatus();
    }, [user.streamer_id, token]);

    // Live Session Timer
    useEffect(() => {
        let interval = null;
        if (status === 'online') {
            interval = setInterval(() => {
                setSessionSeconds(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [status]);

    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!user.streamer_id) {
            alert("Your account isn't linked to a streamer profile yet.");
            return;
        }
        
        // Frontend Check: Double check the lock before letting them go online!
        if (newStatus === 'online' && isTimeLocked) {
            alert("System Lock: Broadcasting is disabled between 1:31 AM and 7:59 AM.");
            return;
        }

        if (newStatus === 'online' && !streamTitle.trim()) {
            alert("Please enter a Stream Title before going live!");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    streamer_id: user.streamer_id,
                    status: newStatus,
                    title: streamTitle,
                    category: streamInfo, 
                    link: streamLink
                })
            });

            // --- THIS IS THE NEW PART: Catch the backend lock! ---
            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.error); // Shows the backend rejection message
                setLoading(false);
                return; // Stop the function so they don't actually go online
            }

            setStatus(newStatus);
            if (newStatus === 'online') setSessionSeconds(0);
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            backgroundImage: `url(${dashboardBg})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center', 
            backgroundAttachment: 'fixed',
            minHeight: '100vh', 
            width: '100vw',
            paddingTop: '40px',
            paddingBottom: '40px',
            boxSizing: 'border-box'
        }}>
            
            <div style={{ 
                padding: '40px', 
                maxWidth: '800px', 
                margin: '0 auto', 
                fontFamily: 'sans-serif', 
                backgroundColor: 'rgba(255, 255, 255, 0.85)', 
                borderRadius: '12px', 
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' 
            }}>
                
                <h2 style={{ color: '#1e293b' }}>Welcome back, {streamerName ? streamerName : user.username}!</h2>
                <p style={{ color: '#64748b', marginBottom: '20px' }}>This is your private streamer control center.</p>

                <div style={{ background: '#eff6ff', borderLeft: '4px solid #3b82f6', padding: '15px', borderRadius: '4px', marginBottom: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <strong style={{ color: '#1e3a8a', display: 'block', marginBottom: '5px' }}>🗓️ Your Assigned Schedule:</strong>
                    <span style={{ color: '#1e40af', whiteSpace: 'pre-wrap' }}>{mySchedule}</span>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '30px', padding: '30px', background: status === 'online' ? '#ecfdf5' : '#f8fafc', border: `2px solid ${status === 'online' ? '#10b981' : '#cbd5e1'}`, borderRadius: '12px', transition: 'all 0.3s ease' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: status === 'online' ? '#059669' : '#64748b' }}>
                        {status === 'online' ? '🔴 LIVE SESSION TIMER' : 'OFFLINE'}
                    </h3>
                    <div style={{ fontSize: '48px', fontWeight: 'bold', color: status === 'online' ? '#10b981' : '#94a3b8', fontFamily: 'monospace' }}>
                        {formatTime(sessionSeconds)}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 300px', padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ marginTop: 0, color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>📝 Stream Details</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>Stream Title *</label>
                                <input type="text" placeholder="e.g., Playing Ranked Valorant!" value={streamTitle} onChange={(e) => setStreamTitle(e.target.value)} disabled={status === 'online'} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>Description</label>
                                <textarea placeholder="e.g., Doing a 12-hour subathon today! Come chill with chat." value={streamInfo} onChange={(e) => setStreamInfo(e.target.value)} disabled={status === 'online'} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>Stream Link</label>
                                <input type="text" placeholder="https://fb.gg/..." value={streamLink} onChange={(e) => setStreamLink(e.target.value)} disabled={status === 'online'} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ flex: '1 1 200px', padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <h3 style={{ marginTop: 0, color: '#334155', width: '100%', textAlign: 'center' }}>Broadcast Actions</h3>
                        
                        {isTimeLocked && status !== 'online' && (
                            <p style={{ fontSize: '12px', color: '#e53e3e', textAlign: 'center', fontWeight: 'bold', margin: '10px 0' }}>
                                ⚠️ System Lock Active: 1:31 AM - 7:59 AM
                            </p>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', marginTop: '10px' }}>
                            
                            <button
                                onClick={() => handleStatusUpdate('online')}
                                disabled={loading || status === 'online' || isTimeLocked}
                                style={{ 
                                    padding: '15px', 
                                    background: status === 'online' ? '#d1fae5' : (isTimeLocked ? '#cbd5e1' : '#10b981'), 
                                    color: status === 'online' ? '#a7f3d0' : (isTimeLocked ? '#64748b' : 'white'), 
                                    border: 'none', 
                                    borderRadius: '6px', 
                                    cursor: status === 'online' || isTimeLocked ? 'not-allowed' : 'pointer', 
                                    fontWeight: 'bold', 
                                    fontSize: '16px' 
                                }}
                            >
                                {isTimeLocked ? '🔒 Locked' : '🚀 Go Live'}
                            </button>

                            <button onClick={() => handleStatusUpdate('offline')} disabled={loading || status === 'offline'} style={{ padding: '15px', background: status === 'offline' ? '#fee2e2' : '#e53e3e', color: status === 'offline' ? '#fecaca' : 'white', border: 'none', borderRadius: '6px', cursor: status === 'offline' ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                                🛑 End Stream
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '30px' }}>
                    <h3 style={{ color: '#334155', marginBottom: '15px' }}>📅 Upcoming Events</h3>
                    <CalendarView token={token} />
                </div>
            </div>
        </div>
    );
}

export default StreamerDashboard;