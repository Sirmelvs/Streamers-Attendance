import React, { useState, useEffect } from 'react';
import '../styles/Calendar.css';

function CalendarView({ token, isAdmin = false }) {
    const [events, setEvents] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());

    // --- Modal State ---
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', event_date: '', type: 'event' });

    useEffect(() => {
        fetchEvents();
    }, [token]);

    const fetchEvents = async () => {
        try {
            const response = await fetch('/api/events', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setEvents(data);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    // --- Modal Handlers ---
    const handleEventClick = (event) => {
        if (!isAdmin) return;
        setSelectedEvent(event);
        setEditForm({ title: event.title, event_date: event.event_date, type: event.type });
        setIsEditing(false); // Start in view/options mode
    };

    const closeAndResetModal = () => {
        setSelectedEvent(null);
        setIsEditing(false);
    };

    const handleDeleteEvent = async () => {
        if (window.confirm(`Are you sure you want to completely delete "${selectedEvent.title}"?`)) {
            try {
                await fetch(`/api/events/${selectedEvent.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                closeAndResetModal();
                fetchEvents();
            } catch (error) {
                console.error('Error deleting event:', error);
            }
        }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            await fetch(`/api/events/${selectedEvent.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });
            closeAndResetModal();
            fetchEvents();
        } catch (error) {
            console.error('Error updating event:', error);
        }
    };

    // --- Calendar Math ---
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();
    const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();

    const days = [];
    for (let i = startDay - 1; i >= 0; i--) { days.push({ day: prevMonthEnd - i, currentMonth: false }); }
    for (let i = 1; i <= daysInMonth; i++) { days.push({ day: i, currentMonth: true }); }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) { days.push({ day: i, currentMonth: false }); }

    const isToday = (day) => {
        const today = new Date();
        return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
    };

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const handleToday = () => setCurrentDate(new Date());

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <h2 style={{ margin: 0 }}>
                    {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
                </h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className="calendar-nav-btn" onClick={handlePrevMonth}>&larr; Prev</button>
                    <button className="calendar-nav-btn today-btn" onClick={handleToday}>Today</button>
                    <button className="calendar-nav-btn" onClick={handleNextMonth}>Next &rarr;</button>
                </div>
            </div>

            <div className="calendar-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="calendar-day-label">{d}</div>
                ))}
                {days.map((item, idx) => {
                    const dateString = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${item.day.toString().padStart(2, '0')}`;
                    const dayEvents = item.currentMonth ? events.filter(e => e.event_date === dateString) : [];

                    return (
                        <div key={idx} className={`calendar-cell ${!item.currentMonth ? 'different-month' : ''} ${item.currentMonth && isToday(item.day) ? 'today' : ''}`}>
                            <div className="day-number">{item.day}</div>

                            {dayEvents.map(e => {
                                // Determine if this event is in the past!
                                const todayStr = new Date().toLocaleDateString('en-CA'); // Gets YYYY-MM-DD format perfectly
                                const isPast = e.event_date < todayStr;

                                return (
                                    <div
                                        key={e.id}
                                        className={`event-dot ${e.type} ${isAdmin ? 'admin-clickable' : ''} ${isPast ? 'past-event' : ''}`}
                                        onClick={() => handleEventClick(e)}
                                        title={isAdmin ? "Manage Event" : (isPast ? `(Completed) ${e.title}` : e.title)}
                                    >
                                        {e.title}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            {/* --- THE POP-UP MODAL --- */}
            {selectedEvent && (
                <div className="modal-overlay" onClick={closeAndResetModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 className="modal-title">
                            {isEditing ? 'Edit Event' : 'Manage Event'}
                        </h3>

                        {!isEditing ? (
                            // View/Action Mode
                            <div>
                                <p><strong>Title:</strong> {selectedEvent.title}</p>
                                <p><strong>Date:</strong> {selectedEvent.event_date}</p>
                                <p><strong>Type:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedEvent.type}</span></p>

                                <div className="modal-actions">
                                    <button className="modal-btn btn-delete" onClick={handleDeleteEvent}>Delete Event</button>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="modal-btn btn-cancel" onClick={closeAndResetModal}>Cancel</button>
                                        <button className="modal-btn btn-edit" onClick={() => setIsEditing(true)}>Edit Details</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Edit Form Mode
                            <form onSubmit={handleSaveEdit}>
                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Event Title</label>
                                    <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Date</label>
                                    <input type="date" value={editForm.event_date} onChange={e => setEditForm({ ...editForm, event_date: e.target.value })} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Type</label>
                                    <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}>
                                        <option value="event">Standard Event</option>
                                        <option value="tournament">Tournament</option>
                                        <option value="meeting">Meeting</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                                    <button type="button" className="modal-btn btn-cancel" style={{ flex: 1 }} onClick={() => setIsEditing(false)}>Back</button>
                                    <button type="submit" className="modal-btn btn-save" style={{ flex: 2, margin: 0 }}>Save Changes</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default CalendarView;