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
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-subtitle">FILM EDITOR & COLORIST</span>
          <h1 className="hero-title">
            Shaping stories through <br />
            <span className="hero-title-gradient">motion and rhythm</span>.
          </h1>
          <p className="hero-lead">
            Collaborating with directors and brands to craft compelling cinematic experiences with high visual precision.
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
              Explore Featured Work
            </a>
            <a 
              href="#contact" 
              className="btn btn-outline"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Get In Touch
            </a>
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
            {/* Elegant cinematic visual placeholder */}
            <div className="about-card-placeholder">
              <div className="placeholder-brand">FORHER</div>
            </div>
          </div>
          <div className="about-details">
            <span className="section-tag">ABOUT ME</span>
            <h2 className="section-title">Visual Storyteller</h2>
            <p>
              I am a professional film editor and colorist. I focus on carving out human emotion, matching pacing to sound design, and maintaining high technical quality.
            </p>
            <p>
              My expertise lies in handling narrative structure, fine-tuning transitions, color grading across log profiles, and exporting clean mastering deliverables.
            </p>
            
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
          <h2 className="contact-title">Let's craft your next project together</h2>
          <p className="contact-lead">
            Available for film editing, commercial projects, color grading, and remote post-production consultations.
          </p>
          <div className="contact-methods">
            <a href="mailto:hello@forher.com" className="contact-btn">
              hello@forher.com
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
