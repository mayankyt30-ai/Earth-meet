import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import AgoraRTC from 'agora-rtc-sdk-ng';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

import { useSocket } from '../context/SocketContext';
import '../styles/Room.css';

const APP_ID = process.env.REACT_APP_AGORA_APP_ID || 'e264170a051b4036af4c3d385b28a970';

const Room = () => {
    const { roomId }         = useParams();
    const { user }           = useAuth();
    const socket             = useSocket();

    // Agora refs
    const clientRef          = useRef(null);
    const localVideoRef      = useRef(null);
    const localTrackRef      = useRef({ audio: null, video: null });
    const mountedRef         = useRef(true);

    // UI state
    const [participants, setParticipants]   = useState({});
    const [roomName, setRoomName]           = useState('');
    const [remoteUsers, setRemoteUsers]     = useState([]);
    const [micOn, setMicOn]                 = useState(true);
    const [camOn, setCamOn]                 = useState(true);
    const [chatOpen, setChatOpen]           = useState(false);
    const [messages, setMessages]           = useState([]);
    const [msgInput, setMsgInput]           = useState('');
    const [joined, setJoined]               = useState(false);
    const [error, setError]                 = useState('');

    // ── Join Agora Channel ─────────────────────────────────────────────────
    useEffect(() => {
        if (!socket || !user || !roomId) return;
        mountedRef.current = true;

        // Get participants list from socket
        socket.emit('get-participants', { roomId });
        socket.on('participants-list', ({ usernames, roomName }) => {
            if (!mountedRef.current) return;
            setParticipants(usernames);
            setRoomName(roomName);
        });

        // Socket join
        socket.emit('join-room', { roomId, userId: user._id });
        socket.on('user-joined', ({ userId }) => {
            if (!mountedRef.current) return;
            setParticipants((prev) => ({ ...prev, [userId]: userId }));
        });

        // Chat
        socket.on('new-chat-arrived', ({ msg }) => {
            if (!mountedRef.current) return;
            setMessages((prev) => [...prev, msg]);
        });

        // Agora join
        joinAgoraChannel();

        return () => {
            mountedRef.current = false;
            socket.off('participants-list');
            socket.off('user-joined');
            socket.off('new-chat-arrived');
            leaveChannel();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, user, roomId]);

    const joinAgoraChannel = async () => {
        try {
            const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
            clientRef.current = client;

            client.on('user-published', async (remoteUser, mediaType) => {
                if (clientRef.current?.connectionState && ['DISCONNECTING', 'DISCONNECTED'].includes(clientRef.current.connectionState)) {
                    return;
                }

                try {
                    await client.subscribe(remoteUser, mediaType);
                } catch (err) {
                    console.warn('Agora subscribe skipped during disconnect:', err);
                    return;
                }

                if (mediaType === 'video') {
                    setRemoteUsers((prev) => {
                        const exists = prev.find((u) => u.uid === remoteUser.uid);
                        return exists ? prev : [...prev, remoteUser];
                    });
                    setTimeout(() => {
                        remoteUser.videoTrack?.play(`remote-video-${remoteUser.uid}`);
                    }, 300);
                }
                if (mediaType === 'audio') {
                    remoteUser.audioTrack?.play();
                }
            });

            client.on('user-unpublished', (remoteUser) => {
                setRemoteUsers((prev) => prev.filter((u) => u.uid !== remoteUser.uid));
            });

            client.on('user-left', (remoteUser) => {
                setRemoteUsers((prev) => prev.filter((u) => u.uid !== remoteUser.uid));
            });

            // For the local join, generate a unique numeric UID per tab to avoid conflicts
            const randomUid = Math.floor(Math.random() * 100000);

            // Join channel — fetch dynamic token from server using the same UID
            const { data } = await axios.get(`${process.env.REACT_APP_SERVER_URL || 'http://localhost:6001'}/api/token`, {
                params: {
                    channelName: roomId,
                    uid: randomUid,
                }
            });

            if (!mountedRef.current) return;
            await client.join(APP_ID, roomId, data.rtcToken, randomUid);
            if (!mountedRef.current) return;



            const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
            localTrackRef.current = { audio: audioTrack, video: videoTrack };

            if (!mountedRef.current) return;
            videoTrack.play(localVideoRef.current);
            if (!mountedRef.current) return;
            await client.publish([audioTrack, videoTrack]);
            if (!mountedRef.current) return;
            setJoined(true);
        } catch (err) {
            if (!mountedRef.current || err?.message?.includes('WS_ABORT')) {
                console.warn('Agora join aborted or unmounted:', err);
                return;
            }
            setError(`Could not join video call: ${err.message}`);
            console.error('Agora error:', err);
        }
    };

    const leaveChannel = async () => {
        localTrackRef.current.audio?.close();
        localTrackRef.current.video?.close();
        clientRef.current?.off('user-published');
        clientRef.current?.off('user-unpublished');
        clientRef.current?.off('user-left');
        await clientRef.current?.leave();
        if (socket && user) {
            socket.emit('user-left-room', { userId: user._id, roomId });
        }
    };

    // ── Media Controls ─────────────────────────────────────────────────────
    const toggleMic = async () => {
        const track = localTrackRef.current.audio;
        if (!track) return;
        await track.setEnabled(!micOn);
        setMicOn((v) => !v);
    };

    const toggleCam = async () => {
        const track = localTrackRef.current.video;
        if (!track) return;
        await track.setEnabled(!camOn);
        setCamOn((v) => !v);
    };

    const handleLeave = async () => {
        await leaveChannel();
        window.location.href = '/';
    };

    // ── Chat ───────────────────────────────────────────────────────────────
    const sendMessage = (e) => {
        e.preventDefault();
        if (!msgInput.trim() || !socket) return;
        const msg = { text: msgInput.trim(), sender: user?.username, time: new Date().toLocaleTimeString() };
        socket.emit('new-chat', { msg, roomId });
        setMessages((prev) => [...prev, { ...msg, self: true }]);
        setMsgInput('');
    };

    return (
        <div className="room-page">
            {/* ── Header ── */}
            <header className="room-header">
                <div className="room-info">
                    <span className="room-dot" />
                    <h2>{roomName || 'Meeting Room'}</h2>
                    <span className="room-id-badge">ID: {roomId?.slice(0, 8)}…</span>
                </div>
                <div className="header-actions">
                    <button
                        id="btn-copy-id"
                        className="btn btn-ghost"
                        onClick={() => navigator.clipboard.writeText(roomId)}
                    >
                        📋 Copy ID
                    </button>
                </div>
            </header>

            {/* ── Error Banner ── */}
            {error && <div className="error-banner">⚠️ {error}</div>}

            {/* ── Video Grid ── */}
            <div className="video-section">
                <div className={`video-grid participants-${Math.min(remoteUsers.length + 1, 4)}`}>
                    {/* Local video */}
                    <div className="video-tile local-tile">
                        <div ref={localVideoRef} className="video-player" />
                        {!camOn && <div className="cam-off-placeholder">📷 Camera Off</div>}
                        <div className="tile-label">
                            <span>{user?.username} (You)</span>
                            {!micOn && <span className="muted-icon">🔇</span>}
                        </div>
                    </div>

                    {/* Remote videos */}
                    {remoteUsers.map((remoteUser) => (
                        <div key={remoteUser.uid} className="video-tile">
                            <div id={`remote-video-${remoteUser.uid}`} className="video-player" />
                            <div className="tile-label">
                                <span>{participants[remoteUser.uid] || `User ${remoteUser.uid}`}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Chat Panel ── */}
                {chatOpen && (
                    <div className="chat-panel">
                        <div className="chat-header">
                            <h4>In-Meeting Chat</h4>
                            <button onClick={() => setChatOpen(false)} className="btn-icon">✕</button>
                        </div>
                        <div className="chat-messages">
                            {messages.length === 0 && (
                                <p className="chat-empty">No messages yet. Say hi! 👋</p>
                            )}
                            {messages.map((m, i) => (
                                <div key={i} className={`chat-bubble ${m.self ? 'self' : 'other'}`}>
                                    {!m.self && <span className="bubble-sender">{m.sender}</span>}
                                    <p>{m.text}</p>
                                    <span className="bubble-time">{m.time}</span>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={sendMessage} className="chat-input-row">
                            <input
                                id="chat-input"
                                value={msgInput}
                                onChange={(e) => setMsgInput(e.target.value)}
                                placeholder="Type a message…"
                            />
                            <button id="chat-send-btn" type="submit" className="btn btn-primary">Send</button>
                        </form>
                    </div>
                )}
            </div>

            {/* ── Controls Bar ── */}
            <div className="controls-bar">
                <button
                    id="btn-toggle-mic"
                    className={`btn-icon ${!micOn ? 'danger-active' : ''}`}
                    onClick={toggleMic}
                    title={micOn ? 'Mute' : 'Unmute'}
                >
                    {micOn ? '🎙️' : '🔇'}
                </button>

                <button
                    id="btn-toggle-cam"
                    className={`btn-icon ${!camOn ? 'danger-active' : ''}`}
                    onClick={toggleCam}
                    title={camOn ? 'Turn off camera' : 'Turn on camera'}
                >
                    {camOn ? '📹' : '📷'}
                </button>

                <button
                    id="btn-toggle-chat"
                    className={`btn-icon ${chatOpen ? 'active' : ''}`}
                    onClick={() => setChatOpen((v) => !v)}
                    title="Chat"
                >
                    💬
                </button>

                <button
                    id="btn-leave"
                    className="btn btn-danger"
                    onClick={handleLeave}
                >
                    📴 Leave
                </button>
            </div>

            {/* ── Participants Panel ── */}
            <div className="participants-panel">
                <h4>Participants ({Object.keys(participants).length})</h4>
                {Object.entries(participants).map(([id, name]) => (
                    <div key={id} className="participant-item">
                        <div className="participant-avatar">{name?.[0]?.toUpperCase()}</div>
                        <span>{name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Room;
