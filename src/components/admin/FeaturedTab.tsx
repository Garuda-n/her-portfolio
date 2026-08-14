import React, { useState, useMemo } from 'react';
import { useVideoContext } from '../../context/VideoContext';
import type { Video } from '../../types/video';

const FeaturedVideoPreview: React.FC<{ src: string }> = ({ src }) => {
  const [hasError, setHasError] = React.useState(false);
  if (hasError) {
    return (
      <div className="video-card-fallback-preview" style={{ position: 'relative' }}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="fallback-preview-icon">
          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13H6V11H14V13Z" />
        </svg>
      </div>
    );
  }
  return (
    <video
      src={src}
      className="video-card-preview"
      muted
      playsInline
      preload="metadata"
      onError={() => setHasError(true)}
      style={{ pointerEvents: 'none', width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
};

export const FeaturedTab: React.FC = () => {
  const { videos, slotsCount, updateFeaturedSlots, addSlot, deleteSlot, isSaving } = useVideoContext();
  const [draggedOverSlot, setDraggedOverSlot] = useState<number | null>(null);
  const [showAssignDropdown, setShowAssignDropdown] = useState<number | null>(null);

  // Extract videos currently in Slot 1, 2, ..., slotsCount
  const slots = useMemo(() => {
    const list: (Video | null)[] = Array(slotsCount).fill(null);
    videos.forEach(v => {
      if (v.featured && typeof v.featuredSlot === 'number' && v.featuredSlot >= 1 && v.featuredSlot <= slotsCount) {
        list[v.featuredSlot - 1] = v;
      }
    });
    return list;
  }, [videos, slotsCount]);

  const handleDeleteSlot = async (idx: number, hasVideo: boolean, videoTitle?: string) => {
    if (isSaving) return;
    if (slotsCount <= 1) return;

    if (hasVideo) {
      const confirmDelete = window.confirm(
        `Delete Slot 0${idx + 1}?\n\nThe video "${videoTitle}" currently assigned to this slot will be removed from the Featured Showcase. Videos in later slots will move up by one position.\n\nClick OK to confirm.`
      );
      if (!confirmDelete) return;
    } else {
      const confirmDelete = window.confirm(`Are you sure you want to delete empty Slot 0${idx + 1}?`);
      if (!confirmDelete) return;
    }

    await deleteSlot(idx);
  };

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
      <div className="admin-tab-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3>Featured Work Showcase ({slotsCount} Highlight Slots)</h3>
          <p className="tab-subtitle-info">
            Arrange the highlight slots by dragging videos directly between them, or dragging unassigned cuts into the slot boxes.
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={addSlot}
          disabled={isSaving}
          style={{ fontSize: '0.9rem', padding: '0.6rem 1.2rem', marginTop: '0.2rem' }}
        >
          {isSaving ? 'Saving...' : '＋ Add Highlight Slot'}
        </button>
      </div>

      <div className="featured-workspace-layout">
        {/* The Highlights Slots */}
        <div className="slots-wrapper">
          {slots.map((video, idx) => (
            <div 
              key={idx}
              className={`slot-dropzone ${draggedOverSlot === idx ? 'drag-active' : ''}`}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, idx)}
            >
              <div className="slot-badge">Slot {(idx + 1) < 10 ? '0' + (idx + 1) : idx + 1}</div>

              {slotsCount > 1 && (
                <button
                  type="button"
                  className="btn-delete-slot"
                  onClick={() => handleDeleteSlot(idx, !!video, video?.title)}
                  disabled={isSaving}
                  title={`Delete Slot ${(idx + 1) < 10 ? '0' + (idx + 1) : idx + 1}`}
                  aria-label={`Delete Slot ${(idx + 1) < 10 ? '0' + (idx + 1) : idx + 1}`}
                >
                  🗑
                </button>
              )}

              {video ? (
                <div 
                  className="drag-video-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, video, idx)}
                >
                  <div className="drag-card-thumb">
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt={video.title} />
                    ) : (
                      <FeaturedVideoPreview src={video.videoUrl} />
                    )}
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
                    aria-label={`Remove ${video.title} from Slot ${(idx + 1) < 10 ? '0' + (idx + 1) : idx + 1}`}
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
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt={video.title} />
                    ) : (
                      <FeaturedVideoPreview src={video.videoUrl} />
                    )}
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
