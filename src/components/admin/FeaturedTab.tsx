import React, { useState, useMemo } from 'react';
import { useVideoContext } from '../../context/VideoContext';
import type { Video } from '../../types/video';

export const FeaturedTab: React.FC = () => {
  const { videos, updateFeaturedSlots, isSaving } = useVideoContext();
  const [draggedOverSlot, setDraggedOverSlot] = useState<number | null>(null);
  const [showAssignDropdown, setShowAssignDropdown] = useState<number | null>(null);

  // Extract videos currently in Slot 1, 2, 3, 4
  const slots = useMemo(() => {
    const list: (Video | null)[] = [null, null, null, null];
    videos.forEach(v => {
      if (v.featured && typeof v.featuredSlot === 'number' && v.featuredSlot >= 1 && v.featuredSlot <= 4) {
        list[v.featuredSlot - 1] = v;
      }
    });
    return list;
  }, [videos]);

  // Unassigned available videos for the pool
  const unassignedVideos = useMemo(() => {
    return videos.filter(v => !v.featured);
  }, [videos]);

  // --- HTML5 Drag & Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, video: Video, sourceSlotIndex?: number) => {
    if (isSaving) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id: video.id,
      sourceSlotIndex: sourceSlotIndex !== undefined ? sourceSlotIndex : null
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    if (!isSaving) {
      setDraggedOverSlot(slotIndex);
    }
  };

  const handleDragLeave = () => {
    setDraggedOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent, targetSlotIndex: number) => {
    e.preventDefault();
    setDraggedOverSlot(null);
    if (isSaving) return;

    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;

      const { id, sourceSlotIndex } = JSON.parse(dataStr) as { id: string; sourceSlotIndex: number | null };
      const draggedVideo = videos.find(v => v.id === id);
      if (!draggedVideo) return;

      const newSlots = [...slots];

      if (sourceSlotIndex !== null) {
        // Swap slots
        const temp = newSlots[targetSlotIndex];
        newSlots[targetSlotIndex] = draggedVideo;
        newSlots[sourceSlotIndex] = temp;
      } else {
        // Dragged from available pool
        newSlots[targetSlotIndex] = draggedVideo;
      }

      updateFeaturedSlots(newSlots);
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  const handleRemoveFromSlot = (slotIndex: number) => {
    if (isSaving) return;
    const newSlots = [...slots];
    newSlots[slotIndex] = null;
    updateFeaturedSlots(newSlots);
  };

  // --- Mobile click/tap fallback assign handlers ---
  const handleAssignVideo = (slotIndex: number, video: Video) => {
    if (isSaving) return;
    const newSlots = [...slots];
    newSlots[slotIndex] = video;
    updateFeaturedSlots(newSlots);
    setShowAssignDropdown(null);
  };

  return (
    <div className="admin-featured-tab">
      <div className="admin-tab-header">
        <h3>Featured Work Showcase (Max 4 Highlights)</h3>
        <p className="tab-subtitle-info">
          Arrange the highlight slots by dragging videos directly between them, or dragging unassigned cuts into the slot boxes.
        </p>
      </div>

      <div className="featured-workspace-layout">
        {/* The 4 Highlights Slots */}
        <div className="slots-wrapper">
          {slots.map((video, idx) => (
            <div 
              key={idx}
              className={`slot-dropzone ${draggedOverSlot === idx ? 'drag-active' : ''}`}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, idx)}
            >
              <div className="slot-badge">Slot 0{idx + 1}</div>

              {video ? (
                <div 
                  className="drag-video-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, video, idx)}
                >
                  <div className="drag-card-thumb">
                    <img src={video.thumbnailUrl} alt={video.title} />
                    <div className="drag-handle-overlay">
                      <span>Drag to Swap</span>
                    </div>
                  </div>
                  <div className="drag-card-info">
                    <span className="drag-card-category">{video.category}</span>
                    <span className="drag-card-title">{video.title}</span>
                  </div>
                  <button 
                    className="btn-remove-slot" 
                    onClick={() => handleRemoveFromSlot(idx)}
                    title="Remove from slot"
                    aria-label={`Remove ${video.title} from Slot 0${idx + 1}`}
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <div className="empty-slot-placeholder">
                  <span className="placeholder-icon">📥</span>
                  <span className="placeholder-text">Drop a video cut here</span>
                  
                  {/* Tap assignment fallback for mobile/tablet */}
                  <div className="mobile-assign-fallback">
                    <button 
                      type="button"
                      className="btn-mobile-assign"
                      onClick={() => setShowAssignDropdown(showAssignDropdown === idx ? null : idx)}
                    >
                      Assign Cut
                    </button>
                    {showAssignDropdown === idx && (
                      <div className="mobile-dropdown-menu">
                        <div className="dropdown-menu-header">
                          <span>Select a Video Cut</span>
                          <button onClick={() => setShowAssignDropdown(null)}>&times;</button>
                        </div>
                        {unassignedVideos.length === 0 ? (
                          <div className="dropdown-empty-state">No unassigned cuts available.</div>
                        ) : (
                          <div className="dropdown-items">
                            {unassignedVideos.map(v => (
                              <button
                                key={v.id}
                                className="dropdown-item"
                                onClick={() => handleAssignVideo(idx, v)}
                              >
                                {v.title} ({v.category})
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Available Cuts Pool Panel */}
        <div className="unassigned-pool-panel">
          <h4>Available Cuts Pool</h4>
          <p className="pool-info">Drag items below into slots on the left, or toggle them in the Cuts tab.</p>
          
          {unassignedVideos.length === 0 ? (
            <div className="empty-state-pool">
              <span>⭐️</span>
              <p>All video cuts are currently featured.</p>
            </div>
          ) : (
            <div className="pool-items-list">
              {unassignedVideos.map((video) => (
                <div
                  key={video.id}
                  className="pool-drag-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, video)}
                >
                  <div className="pool-item-thumb">
                    <img src={video.thumbnailUrl} alt={video.title} />
                  </div>
                  <div className="pool-item-meta">
                    <span className="pool-item-title">{video.title}</span>
                    <span className="pool-item-cat">{video.category}</span>
                  </div>
                  <div className="pool-item-drag-indicator">⋮⋮</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
