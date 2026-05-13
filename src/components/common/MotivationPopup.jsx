import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

// --- Content Engine ---

const QUOTE_BANK = {
  morning: [
    { text: "Stay hungry, stay foolish. — Steve Jobs", tag: "wisdom" },
    { text: "Knowledge is power. — Francis Bacon", tag: "study" },
    { text: "Genius is patience. — Isaac Newton", tag: "wisdom" },
    { text: "Believe you can. — Theodore Roosevelt", tag: "wisdom" },
    { text: "Your brain absorbs best in the morning. 🌅", tag: "study" },
    { text: "The first hour is the most important.", tag: "discipline" },
  ],
  afternoon: [
    { text: "Well done is better than well said. — Franklin", tag: "action" },
    { text: "Turn your wounds into wisdom. — Oprah", tag: "wisdom" },
    { text: "Action is the foundational key to success. — Picasso", tag: "action" },
    { text: "Whatever you are, be a good one. — Lincoln", tag: "wisdom" },
    { text: "Afternoon drag is a choice. Stay disciplined. 💪", tag: "discipline" },
    { text: "Review builds memory. Don't skip it.", tag: "study" },
  ],
  evening: [
    { text: "One more topic before you sleep. 🧠", tag: "study" },
    { text: "Tonight's notes are tomorrow's confidence.", tag: "study" },
    { text: "Recap your wins before resting. ✨", tag: "wisdom" },
    { text: "Sleep encodes your daily learning.", tag: "study" },
    { text: "The night is for the disciplined. 🌙", tag: "discipline" },
    { text: "Finish strong, sleep better.", tag: "discipline" },
  ],
  general: [
    { text: "Be the change you wish to see. — Gandhi", tag: "wisdom" },
    { text: "Quality is not an act, it's a habit. — Aristotle", tag: "habit" },
    { text: "Everything you can imagine is real. — Picasso", tag: "wisdom" },
    { text: "Simplicity is ultimate sophistication. — Da Vinci", tag: "wisdom" },
    { text: "It always seems impossible until it's done. — Mandela", tag: "wisdom" },
    { text: "Success depends upon previous preparation. — Confucius", tag: "wisdom" },
    { text: "Where there is love there is life. — Gandhi", tag: "wisdom" },
    { text: "Change the game, don't let it change you.", tag: "wisdom" },
    { text: "The unexamined life is not worth living. — Socrates", tag: "wisdom" },
    { text: "I think, therefore I am. — Descartes", tag: "wisdom" },
    { text: "Either I find a way or make one.", tag: "wisdom" },
    { text: "Don't wait. The time is never right. — Hill", tag: "wisdom" },
    { text: "The best way to predict future is create. — Drucker", tag: "wisdom" },
    { text: "Success is walking from failure to failure. — Churchill", tag: "wisdom" },
    { text: "If you're going through hell, keep going. — Churchill", tag: "wisdom" },
    { text: "Consistency beats intensity. Keep going! 🔥", tag: "discipline" },
    { text: "Every expert was once a beginner. 🎯", tag: "wisdom" },
    { text: "Small progress is still progress.", tag: "wisdom" },
    { text: "You are closer than you think. ✨", tag: "wisdom" },
    { text: "Do what you can, with what you have. — Roosevelt", tag: "wisdom" },
    { text: "Dream big and dare to fail. — Norman Vaughan", tag: "wisdom" },
    { text: "Don't count the days, make them count. — Ali", tag: "wisdom" },
    { text: "Tough times never last, but tough people do.", tag: "wisdom" },
    { text: "The best revenge is massive success. — Sinatra", tag: "wisdom" },
    { text: "Limit your 'always' and your 'nevers'.", tag: "wisdom" },
    { text: "If you tell truth, you don't remember.", tag: "wisdom" },
    { text: "Mastering yourself is true power. — Lao Tzu", tag: "wisdom" },
    { text: "Intelligence is ability to adapt to change. — Hawking", tag: "wisdom" },
    { text: "A journey begins with a single step. — Lao Tzu", tag: "wisdom" },
    { text: "Life is what happens during other plans. — Lennon", tag: "wisdom" },
  ],
};

const LEARNING_CONTEXT_QUOTES = {
  '/lesson': "Concentrate all your thoughts upon the work. — Bell",
  '/course': "A journey of thousand miles begins now. — Lao Tzu",
  '/dashboard': "The secret of getting ahead is getting started.",
  '/learning': "Intelligence is the ability to adapt to change. — Hawking",
};

// --- Helpers ---

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

function getContextLabel(pathname) {
  if (pathname.includes('/lesson')) return 'Deep Focus';
  if (pathname.includes('/course')) return 'Course Mode';
  if (pathname.includes('/dashboard')) return 'Overview';
  return 'Daily Spark';
}

function buildShuffledDeck(timeOfDay) {
  const pool = [...QUOTE_BANK[timeOfDay], ...QUOTE_BANK.general];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

// --- Component ---

const MotivationPopup = () => {
  const [popupData, setPopupData] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  const deckRef = useRef([]);
  const deckIndexRef = useRef(0);

  const getNextQuote = useCallback(() => {
    if (deckIndexRef.current >= deckRef.current.length) {
      deckRef.current = buildShuffledDeck(getTimeOfDay());
      deckIndexRef.current = 0;
    }
    return deckRef.current[deckIndexRef.current++];
  }, []);

  const showPopup = useCallback(() => {
    const path = location.pathname;
    const isLearningPage =
      path.includes('/lesson') ||
      path.includes('/dashboard') ||
      path.includes('/learning') ||
      path.includes('/course');

    if (!isLearningPage) return;

    const sessionKey = `lms_ctx_shown_${path.split('/')[1]}`;
    const contextQuote = Object.entries(LEARNING_CONTEXT_QUOTES).find(([key]) =>
      path.includes(key)
    )?.[1];

    let quoteText;
    let isContextual = false;

    if (contextQuote && !sessionStorage.getItem(sessionKey)) {
      quoteText = contextQuote;
      sessionStorage.setItem(sessionKey, '1');
      isContextual = true;
    } else {
      quoteText = getNextQuote()?.text;
    }

    if (!quoteText) return;

    setPopupData({
      quote: quoteText,
      label: isContextual ? '📍 Context' : getContextLabel(path),
    });
    setIsVisible(true);

    const timer = setTimeout(() => setIsVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [location.pathname, getNextQuote]);

  useEffect(() => {
    deckRef.current = buildShuffledDeck(getTimeOfDay());
    const initialDelay = setTimeout(showPopup, 600000);
    const interval = setInterval(showPopup, 600000);
    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [showPopup]);

  return (
    isVisible && popupData && (
        <div
          className="animate-slide-up hover-lift"
          style={{
            position: 'fixed',
            bottom: '7.5rem',
            right: '2rem',
            width: '340px',
            zIndex: 1000,
            padding: '1.5rem',
            borderRadius: '1.5rem',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
            cursor: 'default',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'auto'
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, var(--page-primary), var(--page-secondary))',
            width: '44px',
            height: '44px',
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)'
          }}>
            <Sparkles size={22} color="white" />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: 'var(--page-primary)',
                opacity: 0.9
              }}>
                {popupData.label}
              </span>
              <button
                onClick={() => setIsVisible(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--page-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                title="Close"
              >
                <X size={14} />
              </button>
            </div>

            <p style={{
              margin: 0,
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
              lineHeight: 1.6,
              fontWeight: 600,
              letterSpacing: '-0.01em'
            }}>
              {popupData.quote}
            </p>

          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, var(--page-primary), var(--page-secondary))',
              borderRadius: '0 0 1.5rem 1.5rem',
              transformOrigin: 'left',
              animation: 'toast-progress-shrink 5s linear forwards'
            }}
          />
        </div>
    )
  );
};

export default MotivationPopup;
