import React, { useState, useMemo } from 'react';
import { useVideoContext } from '../context/VideoContext';
import type { Video } from '../types/video';
import { VideoCard } from '../components/common/VideoCard';
import { VideoModal } from '../components/common/VideoModal';

export const PortfolioView: React.FC = () => {
  const { videos } = useVideoContext();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Load videos from context
  const featuredVideos = useMemo(() => {
    return videos
      .filter(v => v.featured && typeof v.featuredSlot === 'number')
      .sort((a, b) => (a.featuredSlot || 0) - (b.featuredSlot || 0));
  }, [videos]);

  const allVideos = videos;

  const categories = useMemo(() => {
    const cats = videos.map(v => v.category);
    return ['All', ...Array.from(new Set(cats))];
  }, [videos]);

  // Filtered videos for the All Work section
  const filteredVideos = useMemo(() => {
    if (activeCategory === 'All') return allVideos;
    return allVideos.filter(v => v.category === activeCategory);
  }, [activeCategory, allVideos]);

  return (
    <div className="portfolio-view">
      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="hero-content">
          <span className="hero-subtitle">FILM EDITOR & COLORIST</span>
          <h1 className="hero-title">
            Edit with Intent <br />
            <span className="hero-title-gradient">Deliver with Impact</span>.
          </h1>
          <p className="hero-lead">
            Video Editor with 2 years of experience in social media reels, YouTube content, and e-commerce videos.
          </p>
          <div className="hero-actions">
            <a 
              href="#featured" 
              className="btn btn-primary"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              View My Edits
            </a>
            {/* <a 
              href="#contact" 
              className="btn btn-outline"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Get In Touch
            </a> */}
          </div>
        </div>
        <div className="hero-background-gradient" />
      </section>

      {/* Featured Work Section */}
      <section id="featured" className="featured-section">
        <div className="section-header">
          <span className="section-tag">SELECTED WORK</span>
          <h2 className="section-title">Featured Cuts</h2>
        </div>
        
        <div className="featured-grid">
          {featuredVideos.map((video) => (
            <VideoCard 
              key={video.id} 
              video={video} 
              onPreview={setSelectedVideo} 
            />
          ))}
        </div>
      </section>

      {/* Portfolio Grid Section */}
      <section id="work" className="work-section">
        <div className="section-header">
          <span className="section-tag">PORTFOLIO</span>
          <h2 className="section-title">All Project Cuts</h2>
        </div>

        {/* Filter Tabs */}
        <div className="category-tabs">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-tab ${activeCategory === category ? 'category-tab-active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Dynamic Grid */}
        <div className="work-grid">
          {filteredVideos.map((video) => (
            <VideoCard 
              key={video.id} 
              video={video} 
              onPreview={setSelectedVideo} 
            />
          ))}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="about-grid">
          <div className="about-visual">
            <div className="about-card-placeholder">
              <img 
                src={`${import.meta.env.BASE_URL}profile.png`} 
                alt="Visual Storyteller Profile" 
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover'
                }} 
              />
            </div>
          </div>
          <div className="about-details">
            <span className="section-tag">ABOUT ME</span>
            <h2 className="section-title">Hi, I’m Karthika.</h2>
            <p>
              A Video Editor with 2 years of experience in social media and e-commerce content.
            </p>
            <p>
              I enjoy turning raw footage into simple, engaging, and visually appealing videos. I focus on clean cuts, smooth transitions, good pacing, and storytelling that keeps viewers interested.
            </p>
            <p>
              To me, great editing is about making every moment feel natural. When the cuts, pacing, and visuals work together, the audience stays focused on the story without thinking about the edit. That’s the kind of experience I aim to create in every project
            </p>
            <div style={{ marginTop: '1.5rem', marginBottom: '2.5rem' }}>
              <a 
                href={`${import.meta.env.BASE_URL}resume.pdf`} 
                download="FORHER_Resume.pdf" 
                className="btn btn-outline"
                style={{ gap: '0.6rem' }}
              >
                <span>Download Resume</span>
                <span>📥</span>
              </a>
            </div>
            
            <div className="skills-grid">
              <div className="skill-item">
                <h5>Editing</h5>
                <p>Premiere Pro, DaVinci Resolve, Avid Media Composer</p>
              </div>
              <div className="skill-item">
                <h5>Color Grading</h5>
                <p>HDR/SDR grading, LUT calibration, color matching</p>
              </div>
              <div className="skill-item">
                <h5>Motion Graphics</h5>
                <p>After Effects, lower thirds, subtitle layout, credits</p>
              </div>
              <div className="skill-item">
                <h5>Sound Design</h5>
                <p>Audio mixing, Foley synchronization, pacing locks</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="contact-card">
          <span className="section-tag">COLLABORATION</span>
          <h2 className="contact-title">Let’s work together</h2>
          {/* <p className="contact-lead">
            Available for film editing, commercial projects, color grading, and remote post-production consultations.
          </p> */}
          <div className="contact-methods">
            <a href="mailto:hello@forher.com" className="contact-btn">
              hello@forher.com
            </a>
            <a href="tel:+916380865947" className="contact-btn">
              +91 6380865947
            </a>
          </div>
        </div>
      </section>

      {/* Video Preview Lightbox */}
      <VideoModal 
        video={selectedVideo} 
        onClose={() => setSelectedVideo(null)} 
      />
    </div>
  );
};
