import React, { useState } from 'react';
import { useVideoContext } from '../../context/VideoContext';
import type { Video } from '../../types/video';
import { VideoFormModal } from './VideoFormModal';

interface AllVideosTabProps {
  onPreviewVideo: (video: Video) => void;
}

export const AllVideosTab: React.FC<AllVideosTabProps> = ({ onPreviewVideo }) => {
  const { videos, addVideo, updateVideo, deleteVideo, toggleFeatured, isSaving } = useVideoContext();
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);

  const handleOpenAddForm = () => {
    setEditingVideo(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (video: Video) => {
    setEditingVideo(video);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData: Omit<Video, 'id' | 'createdAt' | 'featured' | 'featuredSlot'>) => {
    let success = false;
    if (editingVideo) {
      success = await updateVideo(editingVideo.id, formData);
    } else {
      success = await addVideo(formData);
    }

    if (success) {
      setIsFormOpen(false);
      setEditingVideo(null);
    }
  };

  const handleDeleteTrigger = (id: string) => {
    setDeletingVideoId(id);
  };

  const handleDeleteConfirm = async () => {
    if (deletingVideoId) {
      const success = await deleteVideo(deletingVideoId);
      if (success) {
        setDeletingVideoId(null);
      }
    }
  };

  return (
    <div className="admin-videos-tab">
      <div className="admin-tab-header">
        <h3>All Video Cuts ({videos.length}/50)</h3>
        <button 
          className="btn btn-primary" 
          onClick={handleOpenAddForm}
          disabled={videos.length >= 50}
        >
          + Add New Cut
        </button>
      </div>

      {videos.length === 0 ? (
        <div className="empty-state-large">
          <div className="empty-icon">🎬</div>
          <h4>No video cuts in library</h4>
          <p>Add your first post-production project cut to get started.</p>
          <button className="btn btn-outline" onClick={handleOpenAddForm}>
            Add First Cut
          </button>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Video Title / Info</th>
                <th>Category</th>
                <th>Date Added</th>
                <th>Featured</th>
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video) => (
                <tr key={video.id}>
                  <td>
                    <div className="table-video-info">
                      <div className="table-video-thumb">
                        <img src={video.thumbnailUrl} alt={video.title} />
                      </div>
                      <div className="table-video-meta">
                        <span className="table-video-title">{video.title}</span>
                        <span className="table-video-desc-trunc" title={video.description}>
                          {video.description.substring(0, 75)}...
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge-category">{video.category}</span>
                  </td>
                  <td>{video.createdAt}</td>
                  <td>
                    <button 
                      className={`btn-toggle-featured ${video.featured ? 'toggle-on' : 'toggle-off'}`}
                      onClick={() => toggleFeatured(video.id)}
                      title={video.featured ? 'Remove from Highlights' : 'Add to Highlights'}
                    >
                      <span className="toggle-slider"></span>
                      <span className="toggle-label">{video.featured ? 'ON' : 'OFF'}</span>
                    </button>
                    {video.featured && (
                      <span className="table-slot-badge">Slot 0{video.featuredSlot}</span>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className="action-btn action-preview"
                        onClick={() => onPreviewVideo(video)}
                        title="Preview cut"
                      >
                        👁️
                      </button>
                      <button 
                        className="action-btn action-edit"
                        onClick={() => handleOpenEditForm(video)}
                        title="Edit cut"
                      >
                        ✏️
                      </button>
                      <button 
                        className="action-btn action-delete"
                        onClick={() => handleDeleteTrigger(video.id)}
                        title="Delete cut"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      <VideoFormModal 
        isOpen={isFormOpen} 
        videoToEdit={editingVideo} 
        onClose={() => setIsFormOpen(false)} 
        onSubmit={handleFormSubmit}
      />

      {/* Custom Confirmation Dialog Modal */}
      {deletingVideoId && (
        <div className="admin-modal-overlay delete-confirm-overlay" onClick={() => setDeletingVideoId(null)}>
          <div className="admin-modal-content delete-confirm-content" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">⚠️</div>
            <h3>Remove Video Cut</h3>
            <p>
              Are you sure you want to permanently delete this video cut from the portfolio? This action cannot be undone.
            </p>
            <div className="admin-modal-actions">
              <button className="btn btn-outline" onClick={() => setDeletingVideoId(null)} disabled={isSaving}>
                Cancel
              </button>
              <button className="btn btn-delete-confirm" onClick={handleDeleteConfirm} disabled={isSaving}>
                {isSaving ? 'Deleting on GitHub...' : 'Yes, Delete Cut'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
