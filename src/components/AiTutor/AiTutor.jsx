import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Bot, Loader2, Sparkles } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
import aiService from '../../services/aiService';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import EmptyState from './EmptyState';
import './AiTutor.css';

const AiTutor = ({ lessonId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    setMessages([]);
    setInput('');
    setIsLoading(false);
  }, [lessonId]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiService.askLessonAI(lessonId, userMessage.text);
      if (import.meta.env.DEV) console.log("AI Response:", response);
      const aiMessage = { role: 'ai', text: response || "I'm sorry, I couldn't formulate a specific response for that." };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorText =
        error?.response?.data?.response ||
        error?.response?.data?.message ||
        error?.message ||
        "I encountered an error while processing your request. Please try again.";

      const errorMessage = {
        role: 'ai',
        text: errorText
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear this conversation?')) {
      setMessages([]);
    }
  };

  return (
    <div className="ai-tutor-container">
      {/* Header */}
      <div className="ai-tutor-header">
        <div className="header-info">
          <div className="ai-badge">
            <Bot size={18} />
            <div className="online-indicator"></div>
          </div>
          <div>
            <h3>AI Tutor</h3>
            <p>Ask questions related to this lesson</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="clear-btn" title="Clear Chat">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Chat Area */}
      <div className="chat-content-area">
          {messages.length === 0 ? (
            <EmptyState key="empty" onSuggestionClick={(text) => { setInput(text); inputRef.current?.focus(); }} />
          ) : (
            <div key="messages" className="messages-list">
              {messages.map((msg, index) => (
                <ChatMessage key={index} message={msg} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
      </div>

      {/* Input Area */}
      <div className="ai-input-wrapper">
        <form onSubmit={handleSend} className="ai-input-container">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask something about this lesson..."
            rows="1"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="send-btn hover-scale"
            style={{ transition: 'all 0.2s' }}
          >
            {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
          </button>
        </form>
        <div className="ai-footer-note">
          <Sparkles size={12} />
          <span>AI generated content may contain inaccuracies.</span>
        </div>
      </div>
    </div>
  );
};

export default AiTutor;
