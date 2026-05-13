import React, { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, User, Clock, ChevronDown, ChevronUp, CheckCircle, ThumbsUp, Pin, Lock, Trash2, ArrowUpCircle, MoreVertical, Reply as ReplyIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import discussionService from '../../services/discussionService';
import api from '../../services/api';
import userService from '../../services/userService';
import { getAuthUser } from '../../utils/auth';

const CreateCommentInput = ({ onPost, isPosting, avatarNode }) => {
  const [text, setText] = useState('');
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      {avatarNode}
      <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) { onPost(text); setText(''); } }} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <textarea 
          className="glass-input" 
          placeholder="Add a comment..." 
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ 
            background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: 0, padding: '0.5rem 0', minHeight: '30px', resize: 'none'
          }}
          onFocus={(e) => e.target.style.borderBottom = '2px solid var(--page-primary)'}
          onBlur={(e) => e.target.style.borderBottom = '1px solid rgba(255,255,255,0.1)'}
        />
        {text.trim() && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" onClick={() => setText('')} className="glass-btn-secondary hover-scale" style={{ padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: 700, border: '1px solid transparent', color: 'var(--text-secondary)' }}>Cancel</button>
            <button type="submit" className="glass-btn-primary" style={{ padding: '0.5rem 1.25rem', borderRadius: '2rem', fontSize: '0.9rem' }} disabled={isPosting}>
              Comment
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

const CreateReplyInput = ({ onPost, isPosting, onCancel, avatarNode, autoFocus = true }) => {
  const [text, setText] = useState('');
  return (
    <div style={{ display: 'flex', gap: '0.75rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--page-primary)', marginTop: '1rem' }}>
      {avatarNode}
      <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) { onPost(text); setText(''); } }} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <input 
          autoFocus={autoFocus}
          className="glass-input" 
          placeholder="Add a reply..." 
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ 
            background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: 0, padding: '0.2rem 0', fontSize: '0.9rem', width: '100%'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button type="button" onClick={onCancel} className="glass-btn-secondary hover-scale" style={{ padding: '0.2rem 0.6rem', borderRadius: '2rem', fontSize: '0.7rem', fontWeight: 700, border: '1px solid transparent', color: 'var(--text-secondary)' }}>Cancel</button>
          <button type="submit" className="glass-btn-primary" style={{ padding: '0.3rem 0.8rem', borderRadius: '2rem', fontSize: '0.75rem' }} disabled={isPosting || !text.trim()}>
            Reply
          </button>
        </div>
      </form>
    </div>
  );
};

export default function LessonDiscussions({ lessonId, courseId, instructorId }) {
  const [threads, setThreads] = useState([]);
  const [expandedThreads, setExpandedThreads] = useState(new Set());
  const [replyingToId, setReplyingToId] = useState(null);
  const [replies, setReplies] = useState({});
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [profiles, setProfiles] = useState({});
  const [isPosting, setIsPosting] = useState(false);
  
  const user = getAuthUser();
  const isInstructor = user?.role?.toUpperCase() === 'INSTRUCTOR';

  useEffect(() => {
    if (lessonId) {
      fetchThreads(true);
    }
    if (instructorId) {
      fetchProfile(instructorId);
    }
    if (user?.userId || user?.id) {
      fetchProfile(user.userId || user.id);
    }
  }, [lessonId, instructorId]);

  const fetchThreads = async (isInitial = false) => {
    if (isInitial) setInitialLoading(true);
    setLoading(true);
    try {
      const res = await discussionService.getThreadsByLesson(lessonId);
      const fetchedThreads = discussionService.normalizeArray(res.data);
      setThreads(fetchedThreads);
      
      // Batch fetch profiles for thread authors
      const authorIds = [...new Set(fetchedThreads.map(t => t.authorId))];
      if (authorIds.length > 0) {
        const profileMap = await userService.getBulkProfiles(authorIds).catch(() => ({}));
        setProfiles(prev => ({ ...prev, ...profileMap }));
      }
    } catch (error) {
      console.error("Failed to fetch threads:", error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const fetchProfile = async (userId) => {
    if (profiles[userId]) return;
    try {
      const res = await api.get(`/auth/profile/${userId}`);
      setProfiles(prev => ({ ...prev, [userId]: res.data }));
    } catch (err) {
      setProfiles(prev => ({ ...prev, [userId]: { fullName: `User #${userId}`, profilePicUrl: null } }));
    }
  };

  const fetchReplies = async (threadId) => {
    try {
      const res = await discussionService.getReplies(threadId);
      const fetchedReplies = discussionService.normalizeArray(res.data);
      setReplies(prev => ({ ...prev, [threadId]: fetchedReplies }));
      
      // Batch fetch profiles for reply authors
      const authorIds = [...new Set(fetchedReplies.map(r => r.authorId))];
      if (authorIds.length > 0) {
        const profileMap = await userService.getBulkProfiles(authorIds).catch(() => ({}));
        setProfiles(prev => ({ ...prev, ...profileMap }));
      }
    } catch (error) {
      console.error("Failed to fetch replies:", error);
    }
  };

  const handleToggleReplies = (threadId) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
        if (!replies[threadId]) fetchReplies(threadId);
      }
      return newSet;
    });
  };

  const handleCreateComment = async (text) => {
    if (!text.trim() || isPosting) return;

    setIsPosting(true);
    try {
      const title = text.length > 50 ? text.substring(0, 47) + "..." : text;
      await discussionService.createThread({
        courseId,
        lessonId,
        authorId: user.userId || user.id,
        title: title,
        body: newComment
      });
      toast.success("Comment posted!");
      fetchThreads();

    } catch (error) {
      console.error("Post error:", error);
      toast.error("Failed to post comment.");
    } finally {
      setIsPosting(false);
    }
  };

  const handlePostReply = async (threadId, parentReplyId, text) => {
    if (!text?.trim() || isPosting) return;

    setIsPosting(true);
    try {
      await discussionService.postReply(threadId, {
        threadId,
        authorId: user.userId || user.id,
        body: content,
        parentReplyId: parentReplyId
      });
      toast.success("Reply posted!");
      setReplyingToId(null);
      setExpandedThreads(prev => new Set(prev).add(threadId));
      fetchReplies(threadId);
    } catch (error) {
      toast.error("Failed to post reply.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleUpvoteThread = async (threadId) => {
    try {
      await discussionService.upvoteThread(threadId, user.userId || user.id);
      fetchThreads(); // Refresh to get updated counts and toggle status
    } catch (error) {
      toast.error("Failed to update upvote.");
    }
  };

  const handleUpvoteReply = async (replyId, threadId) => {
    try {
      await discussionService.upvoteReply(replyId, user.userId || user.id);
      fetchReplies(threadId);
    } catch (error) {
      toast.error("Failed to update upvote.");
    }
  };

  const handleDeleteThread = async (threadId) => {
    if (!window.confirm("Delete this comment and all its replies?")) return;
    try {
      await discussionService.deleteThread(threadId);
      setThreads(threads.filter(t => t.threadId !== threadId));
      toast.success("Comment deleted.");
    } catch (error) {
      toast.error("Failed to delete comment.");
    }
  };

  const handleDeleteReply = async (replyId, threadId) => {
    if (!window.confirm("Delete this reply?")) return;
    try {
      await discussionService.deleteReply(replyId);
      setReplies(prev => ({
        ...prev,
        [threadId]: prev[threadId].filter(r => r.replyId !== replyId)
      }));
      toast.success("Reply deleted.");
    } catch (error) {
      toast.error("Failed to delete reply.");
    }
  };

  const CommentAvatar = ({ userId, size = '40px' }) => {
    const profile = profiles[userId];
    const initial = profile?.fullName?.charAt(0) || '?';
    
    return (
      <div style={{ 
        width: size, height: size, borderRadius: '50%', 
        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)'
      }}>
        {profile?.profilePicUrl ? (
          <img src={profile.profilePicUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ color: 'white', fontWeight: 800, fontSize: size === '40px' ? '1rem' : '0.8rem' }}>{initial}</span>
        )}
      </div>
    );
  };

  if (initialLoading) return <div className="p-8 text-center"><div className="loading-spinner"></div></div>;

  return (
    <div className="youtube-comments" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '850px' }}>
      
      {/* HEADER STATS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{threads.length} Comments</h3>
      </div>

      {/* NEW COMMENT INPUT */}
      <CreateCommentInput 
        isPosting={isPosting} 
        avatarNode={<CommentAvatar userId={user?.userId || user?.id} />} 
        onPost={handleCreateComment} 
      />

      {/* COMMENTS LIST - Scrollable Container */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '2rem',
        maxHeight: '600px',
        overflowY: 'auto',
        paddingRight: '1rem',
        paddingBottom: '2rem',
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--page-primary) transparent'
      }} className="custom-scrollbar">
        {threads.map(thread => {
          const profile = profiles[thread.authorId];
          const isThreadInstructor = profile?.role?.toUpperCase() === 'INSTRUCTOR';
          
          return (
            <div key={thread.threadId} style={{ display: 'flex', gap: '1rem' }}>
              <CommentAvatar userId={thread.authorId} />
              <div style={{ flex: 1 }}>
                {/* Author Meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ 
                    fontWeight: 700, fontSize: '0.9rem', 
                    color: isThreadInstructor ? 'white' : 'var(--text-primary)',
                    background: isThreadInstructor ? 'rgba(99,102,241,0.2)' : 'transparent',
                    padding: isThreadInstructor ? '0.1rem 0.5rem' : 0,
                    borderRadius: '4px'
                  }}>
                    @{profile?.fullName?.toLowerCase().replace(/\s+/g, '') || `user${thread.authorId}`}
                    {isThreadInstructor && <CheckCircle size={12} style={{ marginLeft: '4px', display: 'inline' }} />}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(thread.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Body */}
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{thread.body}</p>

                {/* Actions Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button 
                    onClick={() => handleUpvoteThread(thread.threadId)}
                    className="hover-scale" 
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', 
                      borderRadius: '1rem', background: thread.isUpvoted ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)', 
                      border: 'none', color: thread.isUpvoted ? 'var(--page-primary)' : 'var(--text-secondary)',
                      fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <ThumbsUp size={14} style={{ fill: thread.isUpvoted ? 'currentColor' : 'none' }} />
                    <span style={{ minWidth: '1rem' }}>{thread.upvotes || 0}</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      setReplyingToId(replyingToId === thread.threadId ? null : thread.threadId);
                      if (!expandedThreads.has(thread.threadId)) handleToggleReplies(thread.threadId);
                    }} 
                    className="hover-scale" 
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', 
                      borderRadius: '1rem', background: replyingToId === thread.threadId ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)', 
                      border: 'none', color: replyingToId === thread.threadId ? 'var(--page-primary)' : 'var(--text-primary)',
                      fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <ReplyIcon size={14} />
                    <span>Reply</span>
                  </button>

                  {(thread.authorId === (user.userId || user.id) || isInstructor) && (
                    <button 
                      onClick={() => handleDeleteThread(thread.threadId)}
                      className="hover-scale" 
                      style={{ 
                        marginLeft: 'auto', padding: '0.4rem', borderRadius: '50%', background: 'rgba(239,68,68,0.05)', 
                        border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7, transition: 'all 0.2s ease'
                      }}
                      title="Delete Comment"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Replies Area */}
                {(replies[thread.threadId]?.length > 0 || expandedThreads.has(thread.threadId)) && (
                  <div style={{ marginTop: '0.75rem' }}>
                    {/* View Replies Toggle */}
                    {replies[thread.threadId]?.length > 0 && !expandedThreads.has(thread.threadId) && (
                      <button 
                        onClick={() => handleToggleReplies(thread.threadId)}
                        className="text-btn" 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3ea6ff', fontWeight: 700, fontSize: '0.85rem' }}
                      >
                        <ChevronDown size={18} /> {replies[thread.threadId].length} replies
                      </button>
                    )}

                    {/* Replies List */}
                    {expandedThreads.has(thread.threadId) && (
                        <div 
                          className="animate-fade-in"
                          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem', overflow: 'hidden' }}
                        >
                          {/* Post Reply Input */}
                          {replyingToId === thread.threadId && (
                            <CreateReplyInput 
                              isPosting={isPosting}
                              avatarNode={<CommentAvatar userId={user?.userId || user?.id} size="24px" />}
                              onPost={(text) => handlePostReply(thread.threadId, null, text)}
                              onCancel={() => setReplyingToId(null)}
                            />
                          )}

                          {/* Render Existing Replies (Grouped by parent) */}
                          {(() => {
                            const threadReplies = replies[thread.threadId] || [];
                            const rootReplies = threadReplies.filter(r => !r.parentReplyId);
                            
                            return rootReplies.map(reply => {
                              const rProfile = profiles[reply.authorId];
                              const isReplyInstructor = rProfile?.role?.toUpperCase() === 'INSTRUCTOR';
                              const subReplies = threadReplies.filter(sr => sr.parentReplyId === reply.replyId);
                              const isReplyingToReply = replyingToId === `reply-${reply.replyId}`;

                              return (
                                <div key={reply.replyId} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <CommentAvatar userId={reply.authorId} size="24px" />
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.1rem' }}>
                                        <span style={{ 
                                          fontWeight: 700, fontSize: '0.85rem',
                                          color: isReplyInstructor ? 'white' : 'var(--text-primary)',
                                          background: isReplyInstructor ? 'rgba(99,102,241,0.2)' : 'transparent',
                                          padding: isReplyInstructor ? '0.1rem 0.4rem' : 0,
                                          borderRadius: '4px'
                                        }}>
                                          @{rProfile?.fullName?.toLowerCase().replace(/\s+/g, '') || `user${reply.authorId}`}
                                          {isReplyInstructor && <CheckCircle size={10} style={{ marginLeft: '4px', display: 'inline' }} />}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{new Date(reply.createdAt).toLocaleDateString()}</span>
                                      </div>
                                      <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.4 }}>{reply.body}</p>
                                      
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.4rem' }}>
                                         <button 
                                           onClick={() => handleUpvoteReply(reply.replyId, thread.threadId)} 
                                           className="hover-scale" 
                                           style={{ 
                                             display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem',
                                             borderRadius: '0.75rem', background: reply.isUpvoted ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                                             border: 'none', color: reply.isUpvoted ? 'var(--page-primary)' : 'var(--text-secondary)',
                                             fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s ease'
                                           }}
                                         >
                                           <ThumbsUp size={12} style={{ fill: reply.isUpvoted ? 'currentColor' : 'none' }} />
                                           <span>{reply.upvotes || 0}</span>
                                         </button>

                                         <button 
                                           onClick={() => setReplyingToId(replyingToId === `reply-${reply.replyId}` ? null : `reply-${reply.replyId}`)} 
                                           className="hover-scale" 
                                           style={{ 
                                             display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem',
                                             borderRadius: '0.75rem', background: replyingToId === `reply-${reply.replyId}` ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                                             border: 'none', color: replyingToId === `reply-${reply.replyId}` ? 'var(--page-primary)' : 'var(--text-primary)',
                                             fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s ease'
                                           }}
                                         >
                                           <ReplyIcon size={12} />
                                           <span>Reply</span>
                                         </button>

                                         {(reply.authorId === (user.userId || user.id) || isInstructor) && (
                                           <button 
                                             onClick={() => handleDeleteReply(reply.replyId, thread.threadId)}
                                             className="hover-scale" 
                                             style={{ 
                                               marginLeft: 'auto', padding: '0.3rem', borderRadius: '50%', background: 'rgba(239,68,68,0.05)',
                                               border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6, transition: 'all 0.2s ease'
                                             }}
                                             title="Delete Reply"
                                           >
                                             <Trash2 size={12} />
                                           </button>
                                         )}
                                      </div>

                                      {/* Sub-reply Input */}
                                      {replyingToId === `reply-${reply.replyId}` && (
                                        <CreateReplyInput 
                                          isPosting={isPosting}
                                          avatarNode={<CommentAvatar userId={user?.userId || user?.id} size="20px" />}
                                          onPost={(text) => handlePostReply(thread.threadId, reply.replyId, text)}
                                          onCancel={() => setReplyingToId(null)}
                                        />
                                      )}

                                      {/* Sub-replies List */}
                                      {subReplies.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', paddingLeft: '1rem', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                                          {subReplies.map(subReply => {
                                            const srProfile = profiles[subReply.authorId];
                                            const isSrInstructor = srProfile?.role?.toUpperCase() === 'INSTRUCTOR';
                                            return (
                                              <div key={subReply.replyId} style={{ display: 'flex', gap: '0.6rem' }}>
                                                <CommentAvatar userId={subReply.authorId} size="20px" />
                                                <div style={{ flex: 1 }}>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.1rem' }}>
                                                    <span style={{ 
                                                      fontWeight: 700, fontSize: '0.8rem',
                                                      color: isSrInstructor ? 'white' : 'var(--text-primary)',
                                                      background: isSrInstructor ? 'rgba(99,102,241,0.2)' : 'transparent',
                                                      padding: isSrInstructor ? '0.1rem 0.3rem' : 0,
                                                      borderRadius: '4px'
                                                    }}>
                                                      @{srProfile?.fullName?.toLowerCase().replace(/\s+/g, '') || `user${subReply.authorId}`}
                                                      {isSrInstructor && <CheckCircle size={10} style={{ marginLeft: '4px', display: 'inline' }} />}
                                                    </span>
                                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{new Date(subReply.createdAt).toLocaleDateString()}</span>
                                                  </div>
                                                  <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>{subReply.body}</p>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.3rem' }}>
                                                     <button 
                                                       onClick={() => handleUpvoteReply(subReply.replyId, thread.threadId)} 
                                                       className="hover-scale" 
                                                       style={{ 
                                                         display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.2rem 0.5rem',
                                                         borderRadius: '0.6rem', background: subReply.isUpvoted ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                                                         border: 'none', color: subReply.isUpvoted ? 'var(--page-primary)' : 'var(--text-secondary)',
                                                         fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s ease'
                                                       }}
                                                     >
                                                       <ThumbsUp size={10} style={{ fill: subReply.isUpvoted ? 'currentColor' : 'none' }} />
                                                       <span>{subReply.upvotes || 0}</span>
                                                     </button>

                                                     {(subReply.authorId === (user.userId || user.id) || isInstructor) && (
                                                       <button 
                                                         onClick={() => handleDeleteReply(subReply.replyId, thread.threadId)}
                                                         className="hover-scale" 
                                                         style={{ 
                                                           marginLeft: 'auto', padding: '0.2rem', borderRadius: '50%', background: 'rgba(239,68,68,0.05)',
                                                           border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.5, transition: 'all 0.2s ease'
                                                         }}
                                                         title="Delete Reply"
                                                       >
                                                         <Trash2 size={10} />
                                                       </button>
                                                     )}
                                                   </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            });
                          })()}

                          <button 
                            onClick={() => handleToggleReplies(thread.threadId)}
                            className="glass-btn-secondary hover-scale" 
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3ea6ff', fontWeight: 800, fontSize: '0.8rem', alignSelf: 'flex-start', marginTop: '1rem', padding: '0.4rem 1rem', borderRadius: '2rem', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)' }}
                          >
                            <ChevronUp size={16} /> Hide replies
                          </button>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
