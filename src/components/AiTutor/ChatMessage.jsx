import React, { lazy, Suspense } from 'react';
const ReactMarkdown = lazy(() => import('react-markdown'));
import { User, Bot } from 'lucide-react';
import './ChatMessage.css';

const ChatMessage = ({ message }) => {
  const isAi = message.role === 'ai';

  return (
    <div className={`chat-message-wrapper ${isAi ? 'ai' : 'user'}`}>
      <div className="message-avatar">
        {isAi ? <Bot size={20} /> : <User size={20} />}
      </div>
      <div className="message-bubble">
        {isAi ? (
          <div className="markdown-content">
            {typeof message.text === 'string' ? (
              <Suspense fallback={<div className="animate-pulse h-4 bg-gray-200 rounded w-full"></div>}>
                <ReactMarkdown>{message.text}</ReactMarkdown>
              </Suspense>
            ) : (
              <p>{JSON.stringify(message.text)}</p>
            )}
          </div>
        ) : (
          <p>{message.text}</p>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
