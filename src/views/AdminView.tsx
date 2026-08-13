import React, { useState } from 'react';
import { useVideoContext } from '../context/VideoContext';
import { useAuthContext } from '../context/AuthContext';
import { DashboardTab } from '../components/admin/DashboardTab';
import { AllVideosTab } from '../components/admin/AllVideosTab';
import { FeaturedTab } from '../components/admin/FeaturedTab';
import { Toast } from '../components/admin/Toast';
import { VideoModal } from '../components/common/VideoModal';
import type { Video } from '../types/video';

export const AdminView: React.FC = () => {
  const { toast } = useVideoContext();
  const { signOut } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'videos' | 'featured'>('dashboard');
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);

  return (
    <div className="admin-view-container">
      {/* Toast Notification Banner */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Admin Shell Header */}
      <header className="admin-header">
        <div className="admin-header-container">
          <div className="admin-logo-section">
            <h1>Creative Studio Console</h1>
            <span className="admin-badge">Admin Portal</span>
          </div>
          <div className="admin-header-actions">
            <a href="#/" className="btn-back-portfolio">
              &larr; View Public Portfolio
            </a>
            <button onClick={signOut} className="btn-admin-logout">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Admin Shell Body */}
      <div className="admin-body-layout">
        {/* Navigation Sidebar */}
        <aside className="admin-sidebar">
          <nav className="admin-sidebar-nav">
            <button 
              className={`sidebar-nav-btn ${activeTab === 'dashboard' ? 'nav-active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
            </button>
            <button 
              className={`sidebar-nav-btn ${activeTab === 'videos' ? 'nav-active' : ''}`}
              onClick={() => setActiveTab('videos')}
            >
              <span className="nav-icon">🎬</span>
              <span className="nav-text">Video Cuts Library</span>
            </button>
            <button 
              className={`sidebar-nav-btn ${activeTab === 'featured' ? 'nav-active' : ''}`}
              onClick={() => setActiveTab('featured')}
            >
              <span className="nav-icon">⭐️</span>
              <span className="nav-text">Featured Highlights</span>
            </button>
          </nav>
        </aside>

        {/* Tab Panel Content */}
        <main className="admin-content-panel">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'videos' && <AllVideosTab onPreviewVideo={setPreviewVideo} />}
          {activeTab === 'featured' && <FeaturedTab />}
        </main>
      </div>

      {/* Embedded Playback Modal */}
      <VideoModal 
        video={previewVideo} 
        onClose={() => setPreviewVideo(null)} 
      />
    </div>
  );
};
