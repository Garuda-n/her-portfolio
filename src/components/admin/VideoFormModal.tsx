import React, { useState, useEffect } from 'react';
import type { Video } from '../../types/video';
import { useVideoContext } from '../../context/VideoContext';

interface VideoFormModalProps {
  isOpen: boolean;
  videoToEdit: Video | null;
  onClose: () => void;
  onSubmit: (videoData: Omit<Video, 'id' | 'createdAt' | 'featured' | 'featuredSlot'>) => void;
}

export const VideoFormModal: React.FC<VideoFormModalProps> = ({ 
  isOpen, 
  videoToEdit, 
  onClose, 
  onSubmit 
}) => {
  const { isSaving } = useVideoContext();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (videoToEdit) {
      setTitle(videoToEdit.title);
      setCategory(videoToEdit.category);
      setVideoUrl(videoToEdit.videoUrl);
      setThumbnailUrl(videoToEdit.thumbnailUrl);
      setDescription(videoToEdit.description);
    } else {
      setTitle('');
      setCategory('');
      setVideoUrl('');
      setThumbnailUrl('');
      setDescription('');
    }
    setErrors({});
  }, [videoToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!category.trim()) newErrors.category = 'Category is required';
    if (!videoUrl.trim()) newErrors.videoUrl = 'Video URL is required';
    if (!thumbnailUrl.trim()) newErrors.thumbnailUrl = 'Thumbnail URL is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        title: title.trim(),
        category: category.trim(),
        videoUrl: videoUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim(),
        description: description.trim()
      });
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2>{videoToEdit ? 'Edit Video Cut' : 'Add New Video Cut'}</h2>
          <button className="admin-modal-close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleFormSubmit} className="admin-modal-form">
          {/* Title Field */}
          <div className="form-group">
            <label htmlFor="form-title">Project Title</label>
            <input 
              type="text" 
              id="form-title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. Elysium Echoes"
              className={errors.title ? 'input-error' : ''}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          {/* Category Field */}
          <div className="form-group">
            <label htmlFor="form-category">Category</label>
            <input 
              type="text" 
              id="form-category" 
              list="category-suggestions"
              value={category} 
              onChange={(e) => setCategory(e.target.value)} 
              placeholder="e.g. Cinematic, Commercial, Music Video"
              className={errors.category ? 'input-error' : ''}
            />
            <datalist id="category-suggestions">
              <option value="Cinematic" />
              <option value="Commercial" />
              <option value="Music Video" />
              <option value="Documentary" />
            </datalist>
            {errors.category && <span className="error-text">{errors.category}</span>}
          </div>

          {/* Video URL Field */}
          <div className="form-group">
            <label htmlFor="form-video-url">Video Source URL (MP4 / Preview Link)</label>
            <input 
              type="text" 
              id="form-video-url" 
              value={videoUrl} 
              onChange={(e) => setVideoUrl(e.target.value)} 
              placeholder="https://example.com/video.mp4"
              className={errors.videoUrl ? 'input-error' : ''}
            />
            {errors.videoUrl && <span className="error-text">{errors.videoUrl}</span>}
          </div>

          {/* Thumbnail URL Field */}
          <div className="form-group">
            <label htmlFor="form-thumbnail-url">Thumbnail Image URL</label>
            <input 
              type="text" 
              id="form-thumbnail-url" 
              value={thumbnailUrl} 
              onChange={(e) => setThumbnailUrl(e.target.value)} 
              placeholder="https://images.unsplash.com/photo-..."
              className={errors.thumbnailUrl ? 'input-error' : ''}
            />
            {errors.thumbnailUrl && <span className="error-text">{errors.thumbnailUrl}</span>}
          </div>

          {/* Description Field */}
          <div className="form-group">
            <label htmlFor="form-description">Project Description & Creative Cut Details</label>
            <textarea 
              id="form-description" 
              rows={4}
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Describe editorial techniques, sound design, pacing, and color grading choices..."
              className={errors.description ? 'input-error' : ''}
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>

          {/* Form Actions */}
          <div className="admin-modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving to GitHub...' : (videoToEdit ? 'Save Changes' : 'Add Video')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
