import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const AuthPage = () => {
    const { login, register } = useAuth();
    const [isLogin, setIsLogin]   = useState(true);
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);
    const [form, setForm] = useState({ username: '', email: '', password: '' });

    const handleChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await login(form.email, form.password);
            } else {
                await register(form.username, form.email, form.password);
            }
        } catch (err) {
            console.error('Auth error:', err);
            const msg =
                err?.response?.data?.msg ||
                err?.response?.data?.message ||
                (typeof err?.response?.data === 'string' ? err.response.data : null) ||
                err?.response?.statusText ||
                err?.message ||
                'Something went wrong';
            setError(msg === 'Network Error' ? 'Backend server not responding. Is it running?' : msg);
        } finally {
            setLoading(false);
        }

    };

    return (
        <div className="auth-container">
            {/* Background glows */}
            <div className="auth-glow auth-glow-1" />
            <div className="auth-glow auth-glow-2" />

            <div className="auth-card fade-in-up">
                {/* Logo */}
                <div className="auth-logo">
                    <div className="logo-icon">🎥</div>
                    <h1 className="logo-text">MeetSpace</h1>
                    <p className="logo-sub">Connect. Collaborate. Create.</p>
                </div>

                {/* Tabs */}
                <div className="auth-tabs">
                    <button
                        id="tab-login"
                        className={`auth-tab ${isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(true)}
                    >
                        Sign In
                    </button>
                    <button
                        id="tab-register"
                        className={`auth-tab ${!isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(false)}
                    >
                        Create Account
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="auth-form">
                    {!isLogin && (
                        <div className="input-group">
                            <label htmlFor="username">Username</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="Your display name"
                                value={form.username}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}

                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {error && <div className="auth-error">⚠️ {error}</div>}

                    <button
                        id="auth-submit-btn"
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={loading}
                    >
                        {loading ? 'Please wait…' : isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <p className="auth-switch">
                    {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                    <button
                        className="auth-switch-btn"
                        onClick={() => setIsLogin((v) => !v)}
                    >
                        {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthPage;
