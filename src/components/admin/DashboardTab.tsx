import React, { useMemo } from 'react';
import { useVideoContext } from '../../context/VideoContext';

export const DashboardTab: React.FC = () => {
  const { videos } = useVideoContext();

  const metrics = useMemo(() => {
    const total = videos.length;
    const featured = videos.filter(v => v.featured).length;
    const availableFeatured = 4 - featured;
    
    // Category Breakdown
    const categoriesMap: Record<string, number> = {};
    videos.forEach(v => {
      categoriesMap[v.category] = (categoriesMap[v.category] || 0) + 1;
    });
    
    const categoriesList = Object.entries(categoriesMap).map(([name, count]) => ({
      name,
      count
    }));

    return {
      total,
      featured,
      availableFeatured,
      categoriesList
    };
  }, [videos]);

  return (
    <div className="admin-dashboard">
      <div className="admin-metrics-grid">
        {/* Total Videos Metric Card */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Videos</span>
            <span className="metric-icon">📁</span>
          </div>
          <div className="metric-value-container">
            <span className="metric-value">{metrics.total}</span>
            <span className="metric-limit">/ 50 limit</span>
          </div>
          <div className="metric-progress-wrapper">
            <div 
              className="metric-progress-bar" 
              style={{ width: `${(metrics.total / 50) * 100}%` }}
            />
          </div>
        </div>

        {/* Featured Cuts Metric Card */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Featured Cuts</span>
            <span className="metric-icon">⭐️</span>
          </div>
          <div className="metric-value-container">
            <span className="metric-value">{metrics.featured}</span>
            <span className="metric-limit">/ 4 limit</span>
          </div>
          <div className="metric-progress-wrapper">
            <div 
              className="metric-progress-bar accent-bar" 
              style={{ width: `${(metrics.featured / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Available Featured Slots Card */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Available Slots</span>
            <span className="metric-icon">🎯</span>
          </div>
          <div className="metric-value-container">
            <span className="metric-value">{metrics.availableFeatured}</span>
            <span className="metric-limit">slots open</span>
          </div>
          <div className="metric-status">
            {metrics.availableFeatured === 0 ? (
              <span className="status-badge status-full">All slots filled</span>
            ) : (
              <span className="status-badge status-open">{metrics.availableFeatured} free slots</span>
            )}
          </div>
        </div>
      </div>

      <div className="admin-dashboard-details">
        {/* Categories Summary Card */}
        <div className="dashboard-panel">
          <h3>Category Breakdown</h3>
          {metrics.categoriesList.length === 0 ? (
            <div className="empty-state-small">No categories created yet.</div>
          ) : (
            <div className="category-list">
              {metrics.categoriesList.map(cat => (
                <div key={cat.name} className="category-list-item">
                  <span className="category-item-name">{cat.name}</span>
                  <span className="category-item-count">{cat.count} {cat.count === 1 ? 'video' : 'videos'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Studio Guidelines / Information Card */}
        <div className="dashboard-panel panel-tips">
          <h3>Post-Production Workspace Guidelines</h3>
          <ul>
            <li>To swap or rearrange homepage highlights, navigate to the **Featured Work** tab and use drag-and-drop.</li>
            <li>Always upload thumbnails with aspect ratios matching **16:9** for consistent grid presentation.</li>
            <li>Maintain clear descriptions outlining editorial techniques (match cuts, grading profiles, sound design) to showcase technical proficiency.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
