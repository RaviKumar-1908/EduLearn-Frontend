import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, MessageCircle, Globe, Users, Mail, ShieldCheck, HelpCircle, Bug } from 'lucide-react';
import { getAuthUser } from '../utils/auth';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const user = getAuthUser();
  const role = user?.role;

  return (
    <footer style={{ 
      background: 'var(--glass-bg)', 
      backdropFilter: 'blur(8px)',
      borderTop: '1px solid var(--glass-border)',
      padding: '4rem 2rem 2rem',
      marginTop: 'auto'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '4rem' }}>
          
          {/* Brand Column */}
          <div style={{ flex: '1.5' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', marginBottom: '1.25rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', padding: '0.4rem', borderRadius: '0.6rem' }}>
                < BookOpen size={18} color="white" />
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 950, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>Edu<span className="text-gradient">Learn</span></span>
            </Link>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5, maxWidth: '280px', fontWeight: 500 }}>
              Empowering learners worldwide through high-quality, interactive education and industry-recognized certifications.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <SocialLink icon={<MessageCircle size={18} />} href="#" />
              <SocialLink icon={<Globe size={18} />} href="#" />
              <SocialLink icon={<Users size={18} />} href="#" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.25rem', fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Platform</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <FooterLink to="/courses">Browse Courses</FooterLink>
              
              {/* Conditional Links based on Role */}
              {role === 'STUDENT' && (
                <>
                  <FooterLink to="/student/dashboard">Student Dashboard</FooterLink>
                  <FooterLink to="/student/my-learning">My Learning</FooterLink>
                  <FooterLink to="/student/transactions">Transaction History</FooterLink>
                </>
              )}
              
              {role === 'INSTRUCTOR' && (
                <>
                  <FooterLink to="/instructor/dashboard">Instructor Hub</FooterLink>
                  <FooterLink to="/instructor/courses">My Courses</FooterLink>
                  <FooterLink to="/instructor/analytics">Course Analytics</FooterLink>
                  <FooterLink to="/instructor/transactions">Payout History</FooterLink>
                </>
              )}

              {/* General Authenticated Link */}
              {user && <FooterLink to="/discussions">Community Forum</FooterLink>}
              
              {/* Guest Only Links */}
              {!user && (
                <>
                  <FooterLink to="/login">Login</FooterLink>
                  <FooterLink to="/register">Join EduLearn</FooterLink>
                </>
              )}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.25rem', fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Support</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <FooterLink to="#"><HelpCircle size={14} /> Help Center</FooterLink>
              <FooterLink to="#"><ShieldCheck size={14} /> Terms of Service</FooterLink>
              <FooterLink to="#">Privacy Policy</FooterLink>
              <FooterLink to="/report-bug"><Bug size={14} /> Report an Issue</FooterLink>
              <FooterLink to="#"><Mail size={14} /> Contact Us</FooterLink>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ 
          borderTop: '1px solid var(--glass-border)', 
          paddingTop: '2rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>
            &copy; {currentYear} EduLearn Elite. All rights reserved. <span style={{ marginLeft: '0.75rem', color: 'var(--border-color)' }}>|</span> <span style={{ marginLeft: '0.75rem' }}>Designed for excellence.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700 }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
            All Systems Operational
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }) {
  return (
    <li>
      <Link to={to} className="footer-link-hover" style={{ 
        color: 'var(--text-secondary)', 
        textDecoration: 'none', 
        fontSize: '0.8rem', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.4rem',
        fontWeight: 600
      }}
      >
        {children}
      </Link>
    </li>
  );
}

function SocialLink({ icon, href }) {
  return (
    <a href={href} className="footer-link-hover" style={{ 
      width: '36px', height: '36px', borderRadius: '0.5rem', 
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-secondary)', textDecoration: 'none'
    }}
    >
      {icon}
    </a>
  );
}
