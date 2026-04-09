import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AuthPage   from './pages/AuthPage';
import Dashboard  from './pages/Dashboard';
import Room       from './pages/Room';
import './index.css';

// ─── Protected Route ─────────────────────────────────────────────────────────
const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '100vh', fontSize: '2rem'
            }}>
                ⏳
            </div>
        );
    }
    return user ? children : <Navigate to="/auth" replace />;
};

// ─── App ─────────────────────────────────────────────────────────────────────
function AppRoutes() {
    const { user } = useAuth();
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/auth"
                    element={user ? <Navigate to="/" replace /> : <AuthPage />}
                />
                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            <SocketProvider>
                                <Dashboard />
                            </SocketProvider>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/room/:roomId"
                    element={
                        <PrivateRoute>
                            <SocketProvider>
                                <Room />
                            </SocketProvider>
                        </PrivateRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

