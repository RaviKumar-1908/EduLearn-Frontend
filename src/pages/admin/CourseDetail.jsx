import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Users, Clock, CheckCircle, XCircle, Info, List, User, ChevronLeft, Play, FileText, Download, Tag } from 'lucide-react';

import api from '../../services/api';
import enrollmentService from '../../services/enrollmentService';
import { toast } from 'react-toastify';

export default function AdminCourseDetail() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');

    const { data: courseDetails, isLoading } = useQuery({
        queryKey: ['adminCourseDetail', courseId],
        queryFn: async () => {
            const [courseRes, lessonRes, enrollRes] = await Promise.all([
                api.get(`/api/course/${courseId}`),
                api.get(`/api/lesson/course/${courseId}`).catch(() => ({ data: [] })),
                enrollmentService.getCourseEnrollments(courseId).catch(() => ({ data: [] }))
            ]);

            const courseData = courseRes.data;
            const enrollments = enrollRes.data || [];
            
            // Bulk fetch student profiles for efficiency
            const uniqueStudentIds = [...new Set(enrollments.map(enroll => enroll.studentId).filter(Boolean))];
            const studentProfilesMap = {};
            
            if (uniqueStudentIds.length > 0) {
                const profiles = await Promise.all(
                    uniqueStudentIds.map(async (id) => {
                        try {
                            const res = await api.get(`/auth/profile/${id}`);
                            return [id, res.data];
                        } catch {
                            return [id, null];
                        }
                    })
                );
                profiles.forEach(([id, data]) => {
                    if (data) studentProfilesMap[id] = data;
                });
            }

            let instructorData = null;
            if (courseData.instructorId) {
                instructorData = await api.get(`/auth/profile/${courseData.instructorId}`).then(res => res.data).catch(() => null);
            }

            return {
                course: courseData,
                lessons: lessonRes.data || [],
                enrollments,
                studentProfiles: studentProfilesMap,
                instructor: instructorData
            };
        },
        staleTime: 300000, // 5 minutes
    });

    const queryClient = useQueryClient();

    const handleUpdateStatus = async (newStatus) => {
        try {
            await api.put(`/api/course/admin/status/${courseId}?status=${newStatus}`);
            toast.success(`Course status updated to ${newStatus}.`);
            queryClient.invalidateQueries(['adminCourseDetail', courseId]);
            queryClient.invalidateQueries(['adminCourses']);
        } catch (error) {
            toast.error("Failed to update status.");
        }
    };

    if (isLoading) {
        return (
            <div style={{ padding: '10rem', textAlign: 'center' }}>
                <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 800, letterSpacing: '0.2em' }}>SYNCHRONIZING REPOSITORY...</p>
            </div>
        );
    }

    const { course, lessons, enrollments, studentProfiles, instructor } = courseDetails;

    return (
        <div className="admin-course-detail" style={{ maxWidth: '100%', margin: '0', padding: '0 4vw 5rem' }}>
            <button 
                onClick={() => navigate('/admin/courses')} 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', margin: '2rem 0', fontWeight: 600 }}
            >
                <ChevronLeft size={20} /> Back to Courses
            </button>

            <header className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ width: '300px', aspectRatio: '16/9', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <img src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&q=65'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" decoding="async" />
                </div>
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--page-primary)', fontWeight: 800, textTransform: 'uppercase' }}>{course.category}</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {course.status === 'PENDING' && (
                                <>
                                    <button onClick={() => handleUpdateStatus('APPROVED')} className="glass-btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#10b981' }}>Approve</button>
                                    <button onClick={() => handleUpdateStatus('REJECTED')} className="glass-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: '#ef4444' }}>Reject</button>
                                </>
                            )}
                            {course.status === 'APPROVED' && <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.85rem' }}>APPROVED</span>}
                        </div>
                    </div>
                    <h1 style={{ margin: '0.5rem 0', fontSize: '2rem', fontWeight: 900 }}>{course.title}</h1>
                    <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Users size={16} /> {enrollments.length} Enrolled</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><BookOpen size={16} /> {lessons.length} Lessons</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={16} /> {course.level}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: (course.price === 0 || !course.price) ? '#10b981' : 'var(--page-primary)', fontWeight: 800 }}>
                            <Tag size={16} /> 
                            {(course.price === 0 || !course.price) ? 'FREE' : `₹${course.price}`}
                        </span>
                    </div>
                </div>
            </header>

            <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem' }}>
                <div style={{ display: 'inline-flex', gap: '0.75rem', padding: '0.35rem', borderRadius: '1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                    {[
                        { key: 'overview', label: 'Overview' },
                        { key: 'lessons', label: 'Lessons' },
                        { key: 'students', label: 'Students' }
                    ].map((tab) => {
                        const isActive = activeTab === tab.key;

                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    minWidth: '140px',
                                    padding: '0.85rem 1.4rem',
                                    borderRadius: '1rem',
                                    border: isActive ? '1px solid transparent' : '1px solid rgba(255,255,255,0.08)',
                                    background: isActive
                                        ? 'linear-gradient(135deg, var(--page-primary), var(--page-secondary))'
                                        : 'rgba(255,255,255,0.02)',
                                    color: isActive ? 'white' : 'var(--text-primary)',
                                    fontSize: '0.95rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    boxShadow: isActive ? '0 10px 24px rgba(99, 102, 241, 0.22)' : 'none',
                                    transition: 'background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease'
                                }}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div
                key={activeTab}
                style={{ transition: 'opacity 0.2s ease' }}
            >
                {activeTab === 'overview' && (
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
                            <div>
                                <h3 style={{ marginTop: 0, marginBottom: '1.25rem', fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>Description</h3>
                                <div style={{ 
                                    color: 'var(--text-secondary)', 
                                    lineHeight: 1.7, 
                                    whiteSpace: 'pre-wrap', 
                                    fontSize: '1rem',
                                    fontWeight: 500
                                }}>
                                    {course.description || "No description provided."}
                                </div>
                            </div>
                            <div>
                                <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem' }}>Instructor Information</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--page-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', overflow: 'hidden' }}>
                                        {(course.instructorProfilePicUrl || instructor?.profilePicUrl) ? (
                                            <img src={course.instructorProfilePicUrl || instructor?.profilePicUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            (course.instructorName || instructor?.fullName || '?').charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{course.instructorName || instructor?.fullName || "Instructor"}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{course.instructorEmail || instructor?.email || `ID: ${course.instructorId}`}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'lessons' && (
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        {lessons.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No lessons added to this course yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {lessons.map((lesson, idx) => (
                                    <div key={lesson.lessonId} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>{idx + 1}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700 }}>{lesson.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem' }}>
                                                <span>{lesson.duration} mins</span>
                                                <span>{lesson.contentType}</span>
                                            </div>
                                        </div>
                                        {lesson.contentType === 'VIDEO' ? <Play size={18} /> : <FileText size={18} />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'students' && (
                    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                    <th style={{ padding: '1.25rem' }}>Student</th>
                                    <th style={{ padding: '1.25rem' }}>Enrollment Date</th>
                                    <th style={{ padding: '1.25rem' }}>Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrollments.map(enroll => {
                                    const studentProfile = studentProfiles[enroll.studentId];
                                    const studentName = studentProfile?.fullName || `Student #${enroll.studentId}`;
                                    const studentEmail = studentProfile?.email || `ID: ${enroll.studentId}`;

                                    return (
                                    <tr key={enroll.enrollmentId} style={{ borderTop: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                                                {studentProfile?.profilePicUrl ? (
                                                    <img
                                                        src={studentProfile.profilePicUrl}
                                                        alt={studentName}
                                                        style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.08)' }}
                                                    />
                                                ) : (
                                                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--page-primary), var(--page-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                                                        {studentName.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <div style={{ fontWeight: 700 }}>{studentName}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{studentEmail}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem', color: 'var(--text-secondary)' }}>{new Date(enroll.enrolledAt).toLocaleDateString()}</td>
                                        <td style={{ padding: '1.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${enroll.progressPercent || 0}%`, height: '100%', background: 'var(--page-primary)' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{enroll.progressPercent || 0}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                        {enrollments.length === 0 && (
                            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No students enrolled yet.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
