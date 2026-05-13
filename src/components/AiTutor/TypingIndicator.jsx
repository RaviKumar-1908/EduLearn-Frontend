import React from 'react';
import { Bot } from 'lucide-react';
import './TypingIndicator.css';

const TypingIndicator = () => {
  return (
    <div className="chat-message-wrapper ai typing">
      <div className="message-avatar">
        <Bot size={20} />
      </div>
      <div className="message-bubble typing-bubble">
        <div className="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
