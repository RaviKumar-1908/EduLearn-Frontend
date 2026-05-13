import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { ICONS } from '../design/iconMap';
import { extractCollection } from '../lib/api/responseNormalizer';
import '../styles/pages/Courses.css';

export default function Courses() {

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedPrice, setSelectedPrice] = useState('All');

  const navigate = useNavigate();
  const location = useLocation();

  // Fetch dynamic categories
  const { data: dynamicCategories = [] } = useQuery({
    queryKey: ['courseCategories'],
    queryFn: () => api.get('/api/course/published').then(res => {
      const courses = extractCollection(res.data);
      return [...new Set(courses.map(c => c.category).filter(Boolean))].sort();
    }),
    staleTime: 600000,
  });

  const categories = ['All', ...dynamicCategories];
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];
  const priceRanges = [
    { label: 'All Prices', value: 'All' },
    { label: 'Free', value: '0' },
    { label: 'Under ₹500', value: '500' },
    { label: 'Under ₹1000', value: '1000' }
  ];

  // Sync Search from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    if (query) {
      setSearchTerm(query);
      setDebouncedSearch(query);
    }
  }, [location.search]);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch function
  const fetchCourses = async () => {
    let endpoint = '/api/course/published';

    if (debouncedSearch.trim()) {
      endpoint = `/api/course/search?keyword=${encodeURIComponent(debouncedSearch)}`;
    } else if (selectedPrice !== 'All') {
      endpoint = `/api/course/price?maxPrice=${selectedPrice}`;
    } else if (selectedCategory !== 'All') {
      endpoint = `/api/course/category/${selectedCategory}`;
    } else if (selectedLevel !== 'All') {
      endpoint = `/api/course/level/${selectedLevel}`;
    }

    const response = await api.get(endpoint);
    const data = extractCollection(response.data);
    let filtered = data.filter(c => c.isPublished);

    if (
      !debouncedSearch.trim() &&
      selectedCategory === 'All' &&
      selectedLevel === 'All' &&
      selectedPrice === 'All'
    ) {
      filtered = [...filtered].sort(() => 0.5 - Math.random()).slice(0, 10);
    }

    return filtered;
  };

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses', debouncedSearch, selectedCategory, selectedLevel, selectedPrice],
    queryFn: fetchCourses,
    staleTime: 300000,
  });

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedCategory('All');
    setSelectedLevel('All');
    setSelectedPrice('All');
  };

  return (
    <div className="main-content" style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '0 4vw 6rem' }}>
      
      {/* HEADER SECTION */}
      <div 
        className="animate-fade-in"
        style={{ textAlign: 'center', marginBottom: '5rem', position: 'relative' }}
      >
        <div style={{ position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)', width: '400px', height: '400px', background: 'var(--page-primary)', opacity: 0.05, filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }} />
        
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', padding: '0.4rem 1.25rem', borderRadius: '2rem', marginBottom: '1.5rem', border: '1px solid var(--glass-border)' }}>
          <div style={{ width: '8px', height: '8px', background: 'var(--page-primary)', borderRadius: '50%', boxShadow: '0 0 10px var(--page-primary)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 950, color: 'var(--page-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Courses</span>
        </div>
        
        <h1 className="page-title" style={{ fontSize: '1.5rem', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '0.75rem' }}>
          Explore Our <span className="text-gradient">Catalog</span>
        </h1>
        <p className="page-subtitle" style={{ fontSize: '1rem', maxWidth: '600px', margin: '0 auto', color: 'var(--text-secondary)' }}>
          Find the perfect course to help you build your skills.
        </p>
        
        {/* SEARCH BAR */}
        <div style={{ maxWidth: '720px', margin: '3.5rem auto 0', position: 'relative' }}>
          <div style={{ 
            position: 'relative', 
            background: 'var(--glass-bg)', 
            borderRadius: '1.25rem', 
            padding: '0.25rem', 
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center'
          }}>
            <ICONS.SEARCH size={22} style={{ marginLeft: '1.5rem', color: 'var(--page-primary)' }} />
            <input 
              type="text" 
              className="glass-input" 
              placeholder="Find courses..." 
              style={{ border: 'none', background: 'transparent', boxShadow: 'none', height: '2.75rem', fontSize: '1rem', width: '100%', paddingLeft: '1rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="glass-btn-primary" style={{ height: '2.75rem', borderRadius: '1rem', padding: '0 2rem', fontSize: '0.9rem', fontWeight: 900 }}>Search</button>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{ position: 'sticky', top: '1rem', zIndex: 10, marginBottom: '4rem' }}>
        <div 
          className="glass-panel animate-scale-in" 
          style={{ 
            display: 'flex', gap: '1rem', padding: '1rem', 
            borderRadius: '1.5rem', alignItems: 'center', flexWrap: 'wrap', 
            justifyContent: 'center', backdropFilter: 'blur(30px)',
            background: 'var(--card-bg)', border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--page-primary)', marginRight: '1rem', background: 'rgba(99, 102, 241, 0.1)', padding: '0.6rem 1.25rem', borderRadius: '1.25rem', border: '1px solid var(--glass-border)' }}>
            <ICONS.FILTER size={18} /> <span style={{ fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase' }}>Filters</span>
          </div>
          
          <div className="select-container" style={{ position: 'relative' }}>
            <ICONS.FILTER size={14} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--page-primary)', pointerEvents: 'none' }} />
            <select className="glass-input" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ paddingLeft: '2.75rem', borderRadius: '1.25rem', fontSize: '0.9rem', fontWeight: 800, minWidth: '180px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>
              {categories.map(cat => <option key={cat} value={cat}>{cat === 'All' ? 'Categories' : cat}</option>)}
            </select>
          </div>
          
          <div className="select-container" style={{ position: 'relative' }}>
            <ICONS.PROGRESS size={14} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--page-primary)', pointerEvents: 'none' }} />
            <select className="glass-input" value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} style={{ paddingLeft: '2.75rem', borderRadius: '1.25rem', fontSize: '0.9rem', fontWeight: 800, minWidth: '180px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>
              {levels.map(level => <option key={level} value={level}>{level === 'All' ? 'Difficulty' : level}</option>)}
            </select>
          </div>

          <div className="select-container" style={{ position: 'relative' }}>
            <ICONS.PAYMENT size={14} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--page-primary)', pointerEvents: 'none' }} />
            <select className="glass-input" value={selectedPrice} onChange={(e) => setSelectedPrice(e.target.value)} style={{ paddingLeft: '2.75rem', borderRadius: '1.25rem', fontSize: '0.9rem', fontWeight: 800, minWidth: '180px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>
              {priceRanges.map(range => <option key={range.value} value={range.value}>{range.label}</option>)}
            </select>
          </div>

            { (searchTerm || selectedCategory !== 'All' || selectedLevel !== 'All' || selectedPrice !== 'All') && (
              <button 
                onClick={clearFilters} 
                className="glass-btn-secondary animate-fade-in hover-scale" 
                style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em', borderRadius: '1.25rem', padding: '0.6rem 1.25rem' }}
              >
                <ICONS.CLEAR size={16} /> Reset
              </button>
            )}
        </div>
      </div>

      {/* COURSE GRID */}
        {isLoading ? (
          <div key="loader" className="centered-message animate-fade-in" style={{ padding: '10rem 0' }}>
            <div className="loading-spinner" style={{ width: '60px', height: '60px', borderWidth: '5px' }}></div>
            <p style={{ marginTop: '2.5rem', fontSize: '1.25rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Loading...</p>
          </div>
        ) : courses.length === 0 ? (
          <div key="empty" className="glass-panel centered-message animate-scale-in" style={{ padding: '8rem', borderRadius: '3rem', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '2rem', opacity: 0.2 }}>
               <ICONS.SEARCH size={64} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>No Courses Found</h3>
            <button onClick={clearFilters} className="glass-btn-primary" style={{ marginTop: '3rem', padding: '1rem 3rem', borderRadius: '1.5rem', fontWeight: 900 }}>Reset Filters</button>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '10%', right: '-100px', width: '300px', height: '300px', background: 'var(--page-primary)', opacity: 0.03, filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }} />
            
            <div 
              key="grid" 
              className="courses-grid" 
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}
            >
              {courses.map((course, idx) => (
                <div 
                  key={course.courseId} 
                  className="glass-panel animate-slide-up hover-lift" 
                  onClick={() => navigate(`/course/${course.courseId}`)}
                  style={{ cursor: 'pointer', padding: '0', overflow: 'hidden', borderRadius: '0.75rem', border: '1px solid var(--glass-border)', background: 'var(--card-bg)', height: '100%', display: 'flex', flexDirection: 'column', animationDelay: `${idx * 0.05}s` }}
                >
                  <div style={{ 
                    width: '100%',
                    aspectRatio: '16 / 9', 
                    background: course.thumbnailUrl ? `url(${course.thumbnailUrl}) center/cover` : 'linear-gradient(135deg, var(--page-primary) 0%, var(--page-secondary) 100%)',
                    position: 'relative'
                  }}>
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                      <span style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '0.4rem', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {course.category}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 900, marginBottom: '0.2rem', lineHeight: 1.2, color: 'var(--text-primary)' }}>{course.title}</h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 900, textTransform: 'uppercase' }}>
                        ● Active
                      </span>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', flex: 1, lineHeight: '1.5', height: '3.8rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                      {course.description}
                    </p>
                    
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '1rem' }}>
                         <ICONS.PROGRESS size={16} style={{ color: 'var(--page-primary)' }} />
                         <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{course.level}</span>
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '1rem' }}>
                         <ICONS.DURATION size={16} style={{ color: 'var(--page-accent)' }} />
                         <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{course.totalDuration || '0'}m</span>
                       </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 950, color: 'var(--text-primary)' }}>
                          {course.price === 0 ? <span style={{ color: '#10b981' }}>FREE</span> : `₹${(course.price || 0).toLocaleString()}`}
                        </span>
                      </div>
                      <div 
                        className="hover-scale"
                        style={{ width: '36px', height: '36px', borderRadius: '0.5rem', background: 'linear-gradient(135deg, var(--page-primary), var(--page-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)', transition: 'all 0.2s' }}
                      >
                        <ICONS.COURSE size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}