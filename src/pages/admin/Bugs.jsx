import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bug, CheckCircle, XCircle, Search, Mail, Eye, AlertCircle, Clock, Tag, MessageSquare, Filter, ChevronRight, Send, AlertTriangle, Layers } from 'lucide-react';

import api from '../../services/api';
import { toast } from 'react-toastify';

const STATUS_CONFIG = {
  'PENDING': { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: <AlertCircle size={14} /> },
  'OPEN': { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: <AlertCircle size={14} /> },
  'SEEN': { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: <Clock size={14} /> },
  'IN_PROGRESS': { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: <Clock size={14} /> },
  'RESOLVED': { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle size={14} /> }
};

const PRIORITY_CONFIG = {
  'CRITICAL': { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  'HIGH': { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
  'MEDIUM': { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  'LOW': { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' }
};

export default function AdminBugs() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const queryClient = useQueryClient();

    const { data: bugs = [], isLoading } = useQuery({
        queryKey: ['admin-bugs'],
        queryFn: async () => {
            const res = await api.get('/api/bugs');
            return res.data || [];
        },
        staleTime: 120000, // 2 minutes
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            return api.put(`/api/bugs/${id}`, data);
        },
        onMutate: async ({ id, data }) => {
            // Optimistic Update
            await queryClient.cancelQueries(['admin-bugs']);
            const previousBugs = queryClient.getQueryData(['admin-bugs']);
            queryClient.setQueryData(['admin-bugs'], (old) => {
                return old.map(bug => bug.id === id ? { ...bug, ...data } : bug);
            });
            return { previousBugs };
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(['admin-bugs'], context.previousBugs);
            toast.error("Telemetry update failed.");
        },
        onSettled: () => {
            queryClient.invalidateQueries(['admin-bugs']);
        },
        onSuccess: () => {
            toast.success("Incident status synchronized.");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            return api.delete(`/api/bugs/${id}`);
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries(['admin-bugs']);
            const previousBugs = queryClient.getQueryData(['admin-bugs']);
            queryClient.setQueryData(['admin-bugs'], (old) => {
                return old.filter(bug => bug.id !== id);
            });
            return { previousBugs };
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(['admin-bugs'], context.previousBugs);
            toast.error("Failed to purge report.");
        },
        onSettled: () => {
            queryClient.invalidateQueries(['admin-bugs']);
        },
        onSuccess: () => {
            toast.success("Incident data purged.");
        }
    });

    const filteredBugs = bugs.filter(b => {
        let matches = true;
        if (searchQuery) {
            matches = (b.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (b.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (b.content || '').toLowerCase().includes(searchQuery.toLowerCase());
        }
        if (matches && statusFilter !== 'ALL') {
            if (statusFilter === 'PENDING') {
                matches = b.status === 'PENDING' || b.status === 'OPEN';
            } else if (statusFilter === 'SEEN') {
                matches = b.status === 'SEEN' || b.status === 'IN_PROGRESS';
            } else {
                matches = b.status === statusFilter;
            }
        }
        return matches;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const handleAction = (bugId, status) => {
        updateMutation.mutate({
            id: bugId,
            data: { status }
        });
    };

    const handleDelete = (bugId) => {
        if (window.confirm("Are you sure you want to permanently delete this report?")) {
            deleteMutation.mutate(bugId);
        }
    };

    return (
        <div className="admin-bugs-layout" style={{ 
            minHeight: '100vh', 
            padding: '0 4vw 5rem',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)'
        }}>
            {/* --- HEADER --- */}
            <header style={{ marginBottom: '2.5rem', padding: '2rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '2rem', flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 950, letterSpacing: '-0.03em', lineHeight: 1 }}>
                            Incident <span className="text-gradient">Command</span>
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500, marginTop: '0.5rem', opacity: 0.8 }}>
                            Monitoring {bugs.length} system anomalies and platform telemetry.
                        </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', width: '350px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                            <input 
                                type="text" 
                                placeholder="Search incidents..." 
                                className="glass-input"
                                style={{ 
                                    padding: '1.25rem 1.25rem 1.25rem 3.5rem', 
                                    borderRadius: '1.5rem',
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.02)'
                                }}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Filter size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                            <select 
                                className="glass-input" 
                                style={{ 
                                    padding: '1.25rem 3rem 1.25rem 3.5rem', 
                                    borderRadius: '1.5rem', 
                                    minWidth: '200px', 
                                    appearance: 'none', 
                                    cursor: 'pointer'
                                }}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="ALL">All Status</option>
                                <option value="PENDING">Pending</option>
                                <option value="SEEN">Under Review</option>
                                <option value="RESOLVED">Resolved</option>
                            </select>
                            <ChevronRight size={16} style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%) rotate(90deg)', opacity: 0.4, pointerEvents: 'none' }} />
                        </div>
                    </div>
                </div>
            </header>

            {/* --- MAIN GRID --- */}
            <div style={{ width: '100%' }}>
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem' }}>
                        <div className="loading-spinner"></div>
                    </div>
                ) : filteredBugs.length === 0 ? (
                    <div style={{ 
                        padding: '10rem 2rem', 
                        textAlign: 'center', 
                        background: 'rgba(255,255,255,0.01)', 
                        borderRadius: '3rem',
                        border: '1px dashed rgba(255,255,255,0.1)'
                    }}>
                        <CheckCircle size={80} style={{ margin: '0 auto 2.5rem', color: '#10b981', opacity: 0.5 }} />
                        <h2 style={{ fontWeight: 950, fontSize: '2rem' }}>All Systems Operational</h2>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>No pending incidents require your attention.</p>
                    </div>
                ) : (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', 
                        gap: '1.5rem'
                    }}>
                        {filteredBugs.map(bug => (
                            <div 
                                key={bug.id}
                                className="glass-panel hover-lift"
                                style={{ 
                                     padding: '1.5rem', 
                                     background: 'var(--card-bg)',
                                     border: `1px solid ${STATUS_CONFIG[bug.status]?.color}33`,
                                     display: 'flex',
                                     flexDirection: 'column',
                                     gap: '1.25rem',
                                     position: 'relative',
                                     overflow: 'hidden',
                                     borderRadius: '1.25rem',
                                     transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease',
                                     willChange: 'transform'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ 
                                        padding: '0.6rem 1.25rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 950,
                                        background: STATUS_CONFIG[bug.status]?.bg,
                                        color: STATUS_CONFIG[bug.status]?.color,
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        letterSpacing: '0.1em'
                                    }}>
                                        {STATUS_CONFIG[bug.status]?.icon} {(bug.status === 'OPEN' ? 'PENDING' : bug.status === 'IN_PROGRESS' ? 'SEEN' : bug.status).replace('_', ' ')}
                                    </div>
                                    <div style={{ 
                                        width: '12px', height: '12px', borderRadius: '50%',
                                        background: PRIORITY_CONFIG[bug.priority]?.color,
                                        boxShadow: `0 0 10px ${PRIORITY_CONFIG[bug.priority]?.color}`
                                    }} title={`Priority: ${bug.priority}`} />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <p style={{ 
                                        fontSize: '0.95rem', 
                                        lineHeight: 1.5, 
                                        fontWeight: 500, 
                                        color: 'var(--text-primary)',
                                        margin: 0,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {bug.content}
                                    </p>
                                </div>

                                <div style={{ 
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.85rem 1rem',
                                    background: 'rgba(255,255,255,0.02)',
                                    borderRadius: '0.75rem',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ 
                                            width: '28px', height: '28px', borderRadius: '8px', 
                                            background: 'linear-gradient(135deg, var(--page-primary), var(--page-secondary))', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                            color: 'white', fontWeight: 900, fontSize: '0.75rem'
                                        }}>
                                            {bug.username?.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{bug.username}</div>
                                            <div style={{ fontSize: '0.65rem', opacity: 0.6, fontWeight: 700, color: 'var(--text-secondary)' }}>{bug.reporterRole}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.6, color: 'var(--text-secondary)' }}>{new Date(bug.createdAt).toLocaleDateString()}</div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                                    {(bug.status === 'PENDING' || bug.status === 'OPEN') && (
                                        <button 
                                            onClick={() => handleAction(bug.id, 'SEEN')}
                                            className="hover-scale"
                                            style={{ 
                                                flex: 1, padding: '1rem', borderRadius: '1rem', border: 'none',
                                                background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', 
                                                fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer'
                                            }}
                                        >
                                            MARK SEEN
                                        </button>
                                    )}
                                    {bug.status !== 'RESOLVED' && (
                                        <button 
                                            onClick={() => handleAction(bug.id, 'RESOLVED')}
                                            className="hover-scale"
                                            style={{ 
                                                flex: 2, padding: '0.8rem', borderRadius: '0.75rem', border: 'none',
                                                background: 'var(--page-primary)', color: 'white', 
                                                fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer',
                                                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }}
                                        >
                                            RESOLVE
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleDelete(bug.id)}
                                        className="hover-scale"
                                        style={{ 
                                            padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)',
                                            background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                        }}
                                    >
                                        <XCircle size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
