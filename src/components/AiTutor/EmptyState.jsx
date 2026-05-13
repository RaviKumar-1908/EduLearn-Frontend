import React from 'react';
import { Bot, Sparkles, MessageSquare, Lightbulb } from 'lucide-react';
// import { motion } from 'framer-motion';

const EmptyState = ({ onSuggestionClick }) => {
  const suggestions = [
    { text: "Summarize this lesson", icon: <MessageSquare size={16} /> },
    { text: "Explain the core concepts", icon: <Lightbulb size={16} /> },
    { text: "Give me real-world examples", icon: <Sparkles size={16} /> }
  ];

  return (
    <div className="ai-empty-state">
      <div className="empty-state-content animate-scale-in">
        <div className="ai-icon-large">
          <Bot size={48} />
        </div>
        <h2>AI Tutor</h2>
        <p>Your personal learning assistant. Ask anything about this lesson to deepen your understanding.</p>
        
        <div className="suggestions-grid">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestionClick(s.text)}
              className="suggestion-card hover-lift"
              style={{ transition: 'all 0.2s', animationDelay: `${i * 0.1}s` }}
            >
              {s.icon}
              <span>{s.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
