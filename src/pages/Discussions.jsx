import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Pin, Trash2, Search, ChevronRight, ChevronDown, ChevronUp, MessageCircle, Monitor, Hash, Layers } from 'lucide-react';
// import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-toastify';
import discussionService from '../services/discussionService';
import { getAuthUser } from '../utils/auth';
import enrollmentService from '../services/enrollmentService';
import { fetchCoursesByIds, fetchProfilesByIds } from '../services/dashboardService';
import api from '../services/api';

const fetchEnrolledCourseIds = async (userId) => {
  const enrolledRes = await enrollmentService.getStudentEnrollments(userId);
  const enrollments = Array.isArray(enrolledRes.data) ? enrolledRes.data : (enrolledRes.data?.data || []);
  return [...new Set(enrollments.map((enrollment) => enrollment.courseId).filter(Boolean))];
};

const loadDetailedMetadata = async (courseIds) => {
  if (!courseIds || !courseIds.length) return { courses: [], lessons: [] };

  const [courseMap, lessonsResults] = await Promise.all([
    fetchCoursesByIds(courseIds),
    Promise.allSettled(courseIds.map((courseId) => api.get(`/api/lesson/course/${courseId}`))),
  ]);

  const lessons = lessonsResults
    .filter((result) => result.status === 'fulfilled')
    .flatMap((result) => {
      const payload = result.value.data;
      return Array.isArray(payload) ? payload : (payload?.data || []);
    });

  return {
    courses: Object.values(courseMap),
    lessons,
  };
};

const InlineReplyInput = ({ onPost }) => {
  const [text, setText] = useState('');
  return (
    <div style={{ display: 'flex', gap: '0.75rem' }}>
      <input 
        className="glass-input" 
        placeholder="Reply..." 
        value={text} 
        onChange={(e) => setText(e.target.value)} 
        style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '0.75rem' }} 
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onPost(text);
            setText('');
          }
        }}
      />
      <button 
        onClick={() => { onPost(text); setText(''); }} 
        style={{ padding: '0.6rem', borderRadius: '0.75rem', background: '#6366f1', border: 'none', color: 'white', cursor: 'pointer' }}
        disabled={!text.trim()}
      >
        <Send size={16} />
      </button>
    </div>
  );
};

const DiscussionSkeleton = () => (
  <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    {[1, 2, 3].map((i) => (
      <div key={i} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="skeleton-pulse" style={{ width: '36px', height: '36px', borderRadius: '0.75rem' }}></div>
        <div style={{ flex: 1 }}>
          <div className="skeleton-pulse" style={{ height: '0.8rem', width: '20%', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
          <div className="skeleton-pulse" style={{ height: '1.25rem', width: '50%', borderRadius: '4px' }}></div>
        </div>
      </div>
    ))}
  </div>
);

// Memoized Thread Item for performance
const ThreadItem = React.memo(({ thread, author, threadExpanded, onToggle, onPin, onDelete, onUpvote, replies, onPostReply, replyBody, onReplyChange, profiles }) => {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1.25rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <Avatar profile={author} fallback={thread.authorName?.charAt(0) || 'U'} size="36px" />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{thread.title}</h4>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => onPin(thread.threadId)} style={{ background: 'none', border: 'none', color: thread.pinned ? '#f59e0b' : 'var(--text-secondary)', cursor: 'pointer' }}>
                <Pin size={16} />
              </button>
              <button onClick={() => onDelete(thread.threadId)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {thread.authorName || author?.fullName || 'Student'} • {new Date(thread.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>{thread.body}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem' }}>
        <button 
          onClick={() => onUpvote(thread.threadId)}
          className="hover-scale" 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', 
            borderRadius: '1rem', background: thread.isUpvoted ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)', 
            border: 'none', color: thread.isUpvoted ? 'var(--page-primary)' : 'var(--text-secondary)',
            fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <ThumbsUp size={14} style={{ fill: thread.isUpvoted ? 'currentColor' : 'none' }} />
          <span>{thread.upvotes || 0}</span>
        </button>

        <button 
          onClick={() => onToggle(thread.threadId)} 
          className="hover-scale" 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', 
            borderRadius: '1rem', background: threadExpanded ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)', 
            border: 'none', color: threadExpanded ? 'var(--page-primary)' : 'var(--text-primary)',
            fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <MessageCircle size={14} />
          <span>{threadExpanded ? 'Hide Replies' : `${thread.repliesCount || 0} Replies`}</span>
        </button>
      </div>

        {threadExpanded && (
          <div className="animate-fade-in" style={{ overflow: 'hidden', marginTop: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '1rem', borderLeft: '2px solid rgba(99,102,241,0.1)', marginBottom: '1rem' }}>
              {(replies || []).map((reply) => (
                <div key={reply.replyId} style={{ display: 'flex', gap: '0.75rem' }}>
                  <Avatar profile={profiles[reply.authorId]} fallback={reply.authorName?.charAt(0) || 'U'} size="24px" />
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '0 1rem 1rem 1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.2rem' }}>{reply.authorName || profiles[reply.authorId]?.fullName || `User #${reply.authorId}`}</div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{reply.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <InlineReplyInput onPost={(text) => onPostReply(thread.threadId, text)} />
          </div>
        )}
    </div>
  );
});

export default function Discussions() {
  const navigate = useNavigate();
  const user = getAuthUser();
  const userId = user?.userId || user?.id;
  const isInstructor = user?.role?.toUpperCase() === 'INSTRUCTOR';

  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [expandedThreads, setExpandedThreads] = useState(new Set());
  const [replies, setReplies] = useState({});
  const [profiles, setProfiles] = useState({});

  // Redirect for instructors is removed to allow forum access
  // useEffect(() => {
  //   if (isInstructor) navigate('/instructor/dashboard', { replace: true });
  // }, [isInstructor, navigate]);

  // Query 1: Fast Enrollment Fetch
  const { data: enrolledCourseIds, isLoading: enrollmentLoading } = useQuery({
    queryKey: ['enrolledCourseIds', userId],
    queryFn: () => fetchEnrolledCourseIds(userId),
    enabled: !!userId && !isInstructor,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Query 2: Fetch Threads IMMEDIATELY after enrollments
  const { data: threadsData, isLoading: threadsLoading, refetch: refetchThreads } = useQuery({
    queryKey: ['discussionThreads', selectedCourseId, enrolledCourseIds],
    queryFn: async () => {
      if (!userId || (!selectedCourseId && !enrolledCourseIds?.length)) return { threads: [], profiles: {} };
      
      let response;
      if (selectedCourseId) {
        response = await discussionService.getThreadsByCourse(selectedCourseId);
      } else {
        response = await discussionService.getThreadsByCourses(enrolledCourseIds);
      }
      
      const nextThreads = discussionService.normalizeArray(response?.data);
      
      // Fetch profiles for thread authors
      const authorIds = [...new Set(nextThreads.map(t => t.authorId))].filter(Boolean);
      let threadProfiles = {};
      if (authorIds.length) {
        threadProfiles = await fetchProfilesByIds(authorIds).catch(() => ({}));
      }
      
      return { threads: nextThreads, profiles: threadProfiles };
    },
    enabled: !!userId && (!!selectedCourseId || (!!enrolledCourseIds && !isInstructor)),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Query 3: Slow Detailed Metadata (Background)
  const { data: detailedMetaData, isLoading: detailedMetaLoading } = useQuery({
    queryKey: ['detailedDiscussionMeta', enrolledCourseIds],
    queryFn: () => loadDetailedMetadata(enrolledCourseIds),
    enabled: !!enrolledCourseIds?.length && !isInstructor,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const threads = threadsData?.threads || [];
  const threadProfiles = threadsData?.profiles || {};

  // Update global profiles state when new profiles are loaded
  useEffect(() => {
    if (Object.keys(threadProfiles).length > 0) {
      setProfiles(prev => ({ ...prev, ...threadProfiles }));
    }
  }, [threadProfiles]);

  const courses = detailedMetaData?.courses || [];
  const lessons = detailedMetaData?.lessons || [];

  const selectedCourse = useMemo(() => courses.find((course) => course.courseId === selectedCourseId), [courses, selectedCourseId]);

  const groupedDiscussions = useMemo(() => {
    const visibleThreads = threads;
    const groups = {};

    visibleThreads.forEach((thread) => {
      const lesson = lessons.find((item) => Number(item.lessonId) === Number(thread.lessonId));
      const course = courses.find((item) => Number(item.courseId) === Number(thread.courseId));
      const key = `${thread.courseId}-${thread.lessonId || 0}`;
      
      let courseTitle = course?.title;
      if (!courseTitle) courseTitle = detailedMetaLoading ? 'Loading Course...' : 'Unknown Course';
      
      let lessonTitle = lesson?.title;
      if (!lessonTitle) {
        if (thread.lessonId) {
          lessonTitle = detailedMetaLoading ? 'Loading Lesson...' : `Lesson #${thread.lessonId}`;
        } else {
          lessonTitle = 'General Course Discussion';
        }
      }

      if (!groups[key]) {
        groups[key] = {
          key,
          courseTitle,
          lessonTitle,
          threads: [],
        };
      }
      groups[key].threads.push(thread);
    });

    if (!searchQuery.trim()) return Object.values(groups);

    const query = searchQuery.toLowerCase();
    return Object.values(groups)
      .map((group) => ({
        ...group,
        threads: group.threads.filter((thread) =>
          thread.title?.toLowerCase().includes(query) || thread.body?.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.threads.length > 0);
  }, [courses, lessons, threads, searchQuery, selectedCourseId, detailedMetaLoading]);

  const loadReplies = async (threadId) => {
    if (replies[threadId]) return;
    try {
      const response = await discussionService.getReplies(threadId);
      const nextReplies = discussionService.normalizeArray(response.data);
      setReplies((prev) => ({ ...prev, [threadId]: nextReplies }));
      const replyProfiles = await fetchProfilesByIds(nextReplies.map((reply) => reply.authorId)).catch(() => ({}));
      setProfiles((prev) => ({ ...prev, ...replyProfiles }));
    } catch {
      toast.error('Failed to load replies.');
    }
  };

  const toggleGroup = React.useCallback((key) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleThread = React.useCallback(async (threadId) => {
    setExpandedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(threadId)) next.delete(threadId);
      else next.add(threadId);
      return next;
    });
    await loadReplies(threadId);
  }, [replies]);

  const handlePostReply = React.useCallback(async (threadId, body) => {
    if (!body?.trim()) return;
    try {
      const response = await discussionService.postReply(threadId, {
        body,
        authorId: userId,
        authorName: user.fullName || user.email,
      });
      const reply = response.data?.data || response.data;
      setReplies((prev) => ({ ...prev, [threadId]: [...(prev[threadId] || []), reply] }));
      setReplyInput((prev) => ({ ...prev, [threadId]: '' }));
      setProfiles((prev) => ({
        ...prev,
        [userId]: prev[userId] || { fullName: user.fullName || user.email, profilePicUrl: user.profilePicUrl || null },
      }));
      toast.success('Reply posted!');
    } catch {
      toast.error('Failed to post reply.');
    }
  }, [userId, user]);

  const handlePinThread = React.useCallback(async (threadId) => {
    try {
      await discussionService.pinThread(threadId);
      toast.success('Pin status updated!');
      refetchThreads();
    } catch {
      toast.error('Failed to update pin status.');
    }
  }, [refetchThreads]);

  const handleDeleteThread = React.useCallback(async (threadId) => {
    if (!window.confirm('Delete this discussion?')) return;
    try {
      await discussionService.deleteThread(threadId);
      toast.success('Discussion deleted.');
      refetchThreads();
    } catch {
      toast.error('Failed to delete discussion.');
    }
  }, [refetchThreads]);

  const handleUpvoteThread = React.useCallback(async (threadId) => {
    try {
      await discussionService.upvoteThread(threadId, userId);
      // Local refresh for threads
      refetchThreads();
    } catch {
      toast.error('Failed to update upvote.');
    }
  }, [userId, refetchThreads]);

  return (
    <div className="discussions-layout" style={{ display: 'flex', height: 'calc(100vh - 80px)', background: 'var(--bg-main)', color: 'var(--text-primary)', overflow: 'hidden' }}>
      <div className="course-sidebar" style={{ width: '320px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)' }}>
        <div style={{ padding: '2rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Layers size={20} color="#6366f1" />
            Forum Explorer
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Filter by course</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          <SidebarItem active={selectedCourseId === null} title="Global Overview" subtitle="All courses & lessons" icon={<Layers size={18} />} onClick={() => setSelectedCourseId(null)} gradient="linear-gradient(135deg, #10b981, #3b82f6)" />
          {courses.map((course) => (
            <SidebarItem
              key={course.courseId}
              active={selectedCourseId === course.courseId}
              title={course.title}
              subtitle={course.category}
              icon={course.title?.charAt(0)}
              onClick={() => setSelectedCourseId(course.courseId)}
              gradient="linear-gradient(135deg, #6366f1, #a855f7)"
            />
          ))}
        </div>
      </div>

      <div className="main-feed" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
        <div style={{ padding: '2rem 3rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 950, letterSpacing: '-0.02em' }}>
              {selectedCourse ? selectedCourse.title : (detailedMetaLoading && selectedCourseId ? 'Loading Course...' : 'Global Dashboard')}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, marginTop: '0.25rem' }}>
              {groupedDiscussions.length} active lesson modules
            </p>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input className="glass-input" placeholder="Search conversations..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} style={{ padding: '0.75rem 1.25rem 0.75rem 3rem', borderRadius: '1.25rem', width: '300px' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 3rem', minHeight: '400px' }}>
          {enrollmentLoading || threadsLoading ? (
            <DiscussionSkeleton />
          ) : groupedDiscussions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
              <MessageSquare size={80} style={{ opacity: 0.1, marginBottom: '2rem' }} />
              <h3>No discussions found.</h3>
            </div>
          ) : (
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {groupedDiscussions.map((group) => {
                const expanded = expandedGroups.has(group.key);
                return (
                  <div key={group.key} style={{ borderRadius: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <button onClick={() => toggleGroup(group.key)} style={{ width: '100%', padding: '1.5rem 2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1.25rem', background: expanded ? 'rgba(99,102,241,0.05)' : 'transparent', border: 'none', color: 'inherit' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '0.75rem', background: group.key.endsWith('-0') ? 'rgba(236,72,153,0.1)' : 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: group.key.endsWith('-0') ? '#ec4899' : '#6366f1' }}>
                        {group.key.endsWith('-0') ? <Monitor size={18} /> : <Hash size={18} />}
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        {!selectedCourseId && <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.1rem' }}>{group.courseTitle}</div>}
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{group.lessonTitle}</h3>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>{group.threads.length} threads</span>
                      {expanded ? <ChevronDown size={20} style={{ opacity: 0.5 }} /> : <ChevronRight size={20} style={{ opacity: 0.5 }} />}
                    </button>

                    {expanded && (
                      <div className="animate-fade-in" style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '0 2rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div style={{ height: '1px', background: 'var(--border-color)', margin: '0 0 1rem' }} />
                          {group.threads.map((thread) => (
                              <ThreadItem 
                                key={thread.threadId}
                                thread={thread}
                                author={profiles[thread.authorId]}
                                threadExpanded={expandedThreads.has(thread.threadId)}
                                onToggle={toggleThread}
                                onPin={handlePinThread}
                                onDelete={handleDeleteThread}
                                onUpvote={handleUpvoteThread}
                                replies={replies[thread.threadId]}
                                onPostReply={handlePostReply}
                                replyBody={null}
                                onReplyChange={() => {}}
                                profiles={profiles}
                              />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ active, title, subtitle, icon, onClick, gradient }) {
  return (
    <button onClick={onClick} className="hover-lift" style={{ width: '100%', padding: '1.25rem', borderRadius: '1.25rem', cursor: 'pointer', marginBottom: '0.75rem', background: active ? 'rgba(99,102,241,0.1)' : 'transparent', border: active ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent', transition: 'all 0.3s ease', color: 'inherit' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '1rem', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.9rem', fontWeight: 900 }}>
          {icon}
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>{title}</h4>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{subtitle}</p>
        </div>
      </div>
    </button>
  );
}

function Avatar({ profile, fallback, size }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '0.75rem', background: profile?.profilePicUrl ? 'transparent' : 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'var(--page-primary)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
      {profile?.profilePicUrl ? <img src={profile.profilePicUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : fallback}
    </div>
  );
}
