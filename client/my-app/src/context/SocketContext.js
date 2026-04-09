import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:6001';

export const SocketProvider = ({ children }) => {
    const { token } = useAuth();
    const socketRef  = useRef(null);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!token) {
            // Disconnect if user logs out
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
            }
            return;
        }

        // Connect with auth token
        const s = io(SERVER_URL, {
            auth: { token },
            transports: ['websocket'],
        });

        s.on('connect', () => console.log('🔌 Socket connected:', s.id));
        s.on('connect_error', (err) => console.error('Socket error:', err.message));
        s.on('disconnect', () => console.log('Socket disconnected'));

        socketRef.current = s;
        setSocket(s);

        return () => {
            s.disconnect();
        };
    }, [token]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
