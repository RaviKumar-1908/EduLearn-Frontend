import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { motion } from 'framer-motion';
import { Bug, Send, AlertTriangle, Image as ImageIcon, Layers, Zap, CheckCircle, Shield } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { getAuthUser } from '../utils/auth';

export default function BugReport() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        category: 'GENERAL',
        priority: 'MEDIUM',
        content: ''
    });

    const user = getAuthUser();

    const getDashboardPath = () => {
        if (!user) return '/';
        const role = user.role?.toUpperCase();
        if (role === 'ADMIN') return '/admin/dashboard';
        if (role === 'INSTRUCTOR') return '/instructor/dashboard';
        return '/student/dashboard';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.content.trim()) {
            toast.warning("Transmission requires data. Please describe the issue.");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/api/bugs', {
                ...formData,
                userId: user?.userId || user?.id || 'GUEST',
                username: user?.fullName || "Guest User",
                email: user?.email || 'guest@edulearn.com',
                reporterRole: user?.role || 'GUEST',
                url: window.location.href // Auto-capture current context
            });
            setSubmitted(true);
            toast.success("Incident data transmitted to Command Center.");
        } catch (error) {
            toast.error("Telemetry failure. Connection unstable.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div style={{
                minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
                background: 'var(--bg-primary)'
            }}>
                <div
                    className="premium-card animate-scale-in"
                    style={{ maxWidth: '600px', textAlign: 'center', padding: '4rem', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}
                >
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: '#10b981'
                    }}>
                        <CheckCircle size={48} />
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '1rem', color: 'var(--text-primary)' }}>Report <span style={{ color: '#10b981' }}>Transmitted</span></h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                        Your incident report has been logged in the secure administration terminal.
                        Our team will investigate the telemetry and prioritize resolution.
                    </p>
                    <button
                        onClick={() => navigate(getDashboardPath())}
                        className="glass-btn-primary"
                        style={{ padding: '1rem 2.5rem', background: 'var(--page-primary)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '6rem 2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '5rem', alignItems: 'start' }}>

                    {/* Left side: Context */}
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--page-primary)', marginBottom: '1.5rem' }}>
                            <Bug size={24} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Incident Terminal</span>
                        </div>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 950, lineHeight: 1, letterSpacing: '-0.04em', marginBottom: '2rem', color: 'var(--text-primary)' }}>
                            Found an <span style={{ color: 'var(--page-primary)' }}>Anomaly</span> in the system?
                        </h1>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '4rem', maxWidth: '600px' }}>
                            Help us maintain platform integrity. Your detailed reports are processed through our
                            high-priority administration queue for immediate investigation.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div style={{ padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '2rem', border: '1px solid var(--glass-border)' }}>
                                <div style={{ color: 'var(--page-primary)', marginBottom: '1rem' }}><Shield size={24} /></div>
                                <h4 style={{ fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Secure Transmission</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Reports are encrypted and sent directly to our moderation team.</p>
                            </div>
                            <div style={{ padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '2rem', border: '1px solid var(--glass-border)' }}>
                                <div style={{ color: '#3b82f6', marginBottom: '1rem' }}><Zap size={24} /></div>
                                <h4 style={{ fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Rapid Resolution</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Critical incidents are typically investigated within 24 hours.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right side: Form */}
                    <div
                        className="premium-card animate-slide-up"
                        style={{ padding: '4rem', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '32px' }}
                    >
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        Category
                                    </label>
                                    <select
                                        className="glass-input"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        style={{ padding: '1rem', borderRadius: '1.25rem', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                                    >
                                        <option value="GENERAL">General Issue</option>
                                        <option value="UI">UI / Visual Bug</option>
                                        <option value="PAYMENT">Payment / Finance</option>
                                        <option value="PERFORMANCE">Performance / Lag</option>
                                        <option value="SECURITY">Security Concern</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        Priority
                                    </label>
                                    <select
                                        className="glass-input"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        style={{ padding: '1rem', borderRadius: '1.25rem', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                                    >
                                        <option value="LOW">Low Impact</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High Priority</option>
                                        <option value="CRITICAL">Critical / Urgent</option>
                                    </select>
                                </div>
                            </div>


                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    Incident Description
                                </label>
                                <textarea
                                    className="glass-input"
                                    placeholder="Tell us exactly what happened..."
                                    rows={6}
                                    style={{
                                        padding: '1.5rem', borderRadius: '1.5rem', resize: 'none', lineHeight: 1.6,
                                        background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)'
                                    }}
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="hover-scale"
                                disabled={isSubmitting}
                                style={{
                                    marginTop: '1rem',
                                    padding: '1.5rem',
                                    borderRadius: '1.5rem',
                                    background: 'var(--page-primary)',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: 950,
                                    fontSize: '1.1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '1rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)'
                                }}
                            >
                                {isSubmitting ? 'Transmitting Data...' : <><Send size={24} /> Transmit Report</>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
