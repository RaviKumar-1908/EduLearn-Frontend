import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, Eye, Users, Clock } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import courseService from '../../services/courseService';

export default function CourseInventory() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: courses = [], isLoading } = useQuery({
        queryKey: ['adminCourses'],
        queryFn: courseService.getAll,
        staleTime: 300000, // 5 minutes
    });

    const filteredCourses = useMemo(() => {
        let result = courses;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter((course) =>
                course.title?.toLowerCase().includes(query) ||
                course.category?.toLowerCase().includes(query)
            );
        }
        if (statusFilter !== 'ALL') {
            if (statusFilter === 'PUBLISHED') result = result.filter((course) => course.isPublished);
            else if (statusFilter === 'DRAFT') result = result.filter((course) => !course.isPublished);
        }
        return result;
    }, [courses, searchQuery, statusFilter]);

    const handleDeleteCourse = async (courseId) => {
        if (!window.confirm("Are you sure you want to delete this course from the platform? This action is permanent.")) return;
        try {
            await api.delete(`/api/course/${courseId}`);
            queryClient.setQueryData(['adminCourses'], (prev = []) => prev.filter((course) => course.courseId !== courseId));
            toast.success("Course removed successfully.");
        } catch {
            toast.error("Failed to delete course.");
        }
    };

    return (
        <div className="admin-courses" style={{ maxWidth: '100%', margin: '0', padding: '0 4vw 5rem' }}>
            <header style={{ marginBottom: '2.5rem', padding: '2rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                    <h1 className="page-title" style={{ margin: 0, fontSize: '2.2rem', fontWeight: 950, letterSpacing: '-0.03em' }}>Course <span className="text-gradient">Inventory</span></h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Overview of all courses available on the platform.</p>
                </div>
            </header>

            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input 
                        type="text" 
                        placeholder="Search by title or category..." 
                        className="glass-input"
                        style={{ paddingLeft: '3rem' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select className="glass-input" style={{ width: '200px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="ALL">All Status</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Drafts</option>
                </select>
            </div>

            {isLoading ? (
                <div style={{ padding: '5rem', textAlign: 'center' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    {filteredCourses.map(course => (
                        <div 
                            key={course.courseId} 
                            className="glass-panel hover-lift"
                            style={{ 
                                padding: '1rem', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '1rem', 
                                transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease',
                                willChange: 'transform'
                            }}
                        >
                            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '0.75rem', overflow: 'hidden' }}>
                                <img src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=300&q=60'} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" decoding="async" />
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--page-primary)', fontWeight: 800 }}>{course.category}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {course.courseId}</span>
                                </div>
                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.3 }}>{course.title}</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        <Users size={14} style={{ color: 'var(--page-primary)' }} /> 
                                        {course.instructorName || `ID: ${course.instructorId}`}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '1.4rem' }}>
                                        {course.instructorEmail}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                        <Clock size={14} /> {course.level}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => navigate(`/admin/course/${course.courseId}`)} className="action-btn" title="Inspect Course" style={{ color: 'var(--page-primary)', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                                        <Eye size={18} />
                                    </button>
                                    <button onClick={() => handleDeleteCourse(course.courseId)} className="action-btn" title="Delete" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.05)' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
