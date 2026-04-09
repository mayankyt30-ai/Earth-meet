import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:6001';
axios.defaults.baseURL = SERVER_URL;
axios.defaults.headers.post['Content-Type'] = 'application/json';

export const AuthProvider = ({ children }) => {
    const [user, setUser]       = useState(null);
    const [token, setToken]     = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // ── Hydrate user from token on first load ──────────────────────────────
    useEffect(() => {
        const fetchMe = async () => {
            if (!token) { setLoading(false); return; }
            try {
                const { data } = await axios.get(`${SERVER_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(data.user);
            } catch {
                localStorage.removeItem('token');
                setToken(null);
            } finally {
                setLoading(false);
            }
        };
        fetchMe();
    }, [token]);

    // ── Register ───────────────────────────────────────────────────────────
    const register = async (username, email, password) => {
        const { data } = await axios.post(`${SERVER_URL}/auth/register`, {
            username, email, password,
        });
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return data;
    };

    // ── Login ──────────────────────────────────────────────────────────────
    const login = async (email, password) => {
        const { data } = await axios.post(`${SERVER_URL}/auth/login`, {
            email, password,
        });
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return data;
    };

    // ── Logout ─────────────────────────────────────────────────────────────
    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, register, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
