import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const { user, logout }   = useAuth();
    const socket             = useSocket();

    const [myMeets, setMyMeets]       = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [joinCode, setJoinCode]     = useState('');
    const [joinError, setJoinError]   = useState('');
    const [form, setForm] = useState({
        roomName: '',
        newMeetType: 'instant',
        newMeetDate: '',
        newMeetTime: '',
    });

    // ── Fetch my meetings ──────────────────────────────────────────────────
    useEffect(() => {
        if (!socket || !user) return;
        socket.emit('fetch-my-meets', { userId: user._id });
        socket.on('meets-fetched', ({ myMeets }) => setMyMeets(myMeets));
        return () => socket.off('meets-fetched');
    }, [socket, user]);

    // ── Create room ────────────────────────────────────────────────────────
    const handleCreate = (e) => {
        e.preventDefault();
        if (!socket) return;
        socket.emit('create-room', { userId: user._id, ...form });
        socket.once('room-created', ({ roomId, meetType }) => {
            setShowCreate(false);
            window.location.href = `/room/${roomId}`;
        });
    };

    // ── Join by code ───────────────────────────────────────────────────────
    const handleJoin = (e) => {
        e.preventDefault();
        if (!socket || !joinCode.trim()) return;
        setJoinError('');
        socket.emit('user-code-join', { roomId: joinCode.trim() });
        socket.once('room-exists', ({ roomId }) => {
            socket.emit('request-to-join-room', { roomId, userId: user._id });
        });
        socket.once('room-not-exist', () => setJoinError('Room not found. Check the code.'));
        socket.once('join-room', ({ roomId }) => {
            window.location.href = `/room/${roomId}`;
        });
    };

    // ── Delete meet ────────────────────────────────────────────────────────
    const handleDelete = (roomId) => {
        if (!socket) return;
        socket.emit('delete-meet', { roomId });
        socket.once('room-deleted', () =>
            setMyMeets((prev) => prev.filter((m) => m._id !== roomId))
        );
    };

    const formatDate = (d) =>
        d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

    return (
        <div className="dashboard">
            {/* ── Sidebar ── */}
            <aside className="sidebar">
                <div className="sidebar-logo">🎥 <span>MeetSpace</span></div>

                <nav className="sidebar-nav">
                    <a href="#dashboard" className="nav-item active" id="nav-dashboard">🏠 Dashboard</a>
                    <a href="#schedule"  className="nav-item"        id="nav-schedule" >📅 Schedule</a>
                    <a href="#settings"  className="nav-item"        id="nav-settings" >⚙️ Settings</a>
                </nav>

                <div className="sidebar-user">
                    <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
                    <div>
                        <p className="user-name">{user?.username}</p>
                        <p className="user-email">{user?.email}</p>
                    </div>
                    <button id="logout-btn" className="btn-icon" onClick={logout} title="Logout">🚪</button>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="main-content">
                <header className="dashboard-header">
                    <div>
                        <h2>Welcome back, {user?.username} 👋</h2>
                        <p>Ready to meet? Start or join a session below.</p>
                    </div>
                </header>

                {/* Quick Actions */}
                <section className="quick-actions">
                    <button
                        id="btn-new-meeting"
                        className="action-card primary"
                        onClick={() => setShowCreate(true)}
                    >
                        <span className="action-icon">🎬</span>
                        <span className="action-label">New Meeting</span>
                        <span className="action-sub">Start instantly</span>
                    </button>

                    <div className="action-card join-form">
                        <span className="action-icon">🔗</span>
                        <span className="action-label">Join Meeting</span>
                        <form onSubmit={handleJoin} className="join-row">
                            <input
                                id="join-code-input"
                                type="text"
                                placeholder="Enter room code…"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                            />
                            <button id="btn-join" type="submit" className="btn btn-primary">Join</button>
                        </form>
                        {joinError && <p className="error-text">{joinError}</p>}
                    </div>
                </section>

                {/* My Meetings */}
                <section className="meets-section">
                    <h3>My Meetings</h3>

                    {myMeets.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📭</div>
                            <p>No meetings yet. Create your first one!</p>
                        </div>
                    ) : (
                        <div className="meets-grid">
                            {myMeets.map((meet) => (
                                <div key={meet._id} className="meet-card card fade-in-up">
                                    <div className="meet-card-header">
                                        <h4>{meet.roomName || 'Untitled Meeting'}</h4>
                                        <span className={`badge badge-${meet.meetType === 'instant' ? 'accent' : 'success'}`}>
                                            {meet.meetType}
                                        </span>
                                    </div>
                                    <p className="meet-date">
                                        📅 {meet.meetDate || formatDate(meet.createdAt)}
                                        {meet.meetTime && ` · 🕐 ${meet.meetTime}`}
                                    </p>
                                    <p className="meet-id">ID: <code>{meet._id}</code></p>
                                    <div className="meet-actions flex gap-2 mt-4">
                                        <button
                                            id={`btn-start-${meet._id}`}
                                            className="btn btn-primary"
                                            onClick={() => window.location.href = `/room/${meet._id}`}
                                        >
                                            Start
                                        </button>
                                        <button
                                            id={`btn-delete-${meet._id}`}
                                            className="btn btn-danger"
                                            onClick={() => handleDelete(meet._id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* ── Create Meeting Modal ── */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal card fade-in-up" onClick={(e) => e.stopPropagation()}>
                        <h3>Create Meeting</h3>
                        <form onSubmit={handleCreate}>
                            <div className="input-group">
                                <label>Meeting Name</label>
                                <input
                                    id="meeting-name-input"
                                    type="text"
                                    placeholder="e.g. Team Standup"
                                    value={form.roomName}
                                    onChange={(e) => setForm({ ...form, roomName: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Type</label>
                                <select
                                    id="meeting-type-select"
                                    value={form.newMeetType}
                                    onChange={(e) => setForm({ ...form, newMeetType: e.target.value })}
                                >
                                    <option value="instant">Instant</option>
                                    <option value="scheduled">Scheduled</option>
                                </select>
                            </div>
                            {form.newMeetType === 'scheduled' && (
                                <>
                                    <div className="input-group">
                                        <label>Date</label>
                                        <input
                                            id="meeting-date-input"
                                            type="date"
                                            value={form.newMeetDate}
                                            onChange={(e) => setForm({ ...form, newMeetDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Time</label>
                                        <input
                                            id="meeting-time-input"
                                            type="time"
                                            value={form.newMeetTime}
                                            onChange={(e) => setForm({ ...form, newMeetTime: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}
                            <div className="flex gap-2 mt-4">
                                <button id="btn-create-submit" type="submit" className="btn btn-primary w-full">
                                    🚀 Create & Join
                                </button>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
