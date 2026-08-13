import { useEffect } from 'react';
import type { Video } from '../../types/video';

interface VideoModalProps {
  video: Video | null;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ video, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (video) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [video, onClose]);

  if (!video) return null;

  return (
    <div className="video-modal-overlay" onClick={onClose}>
      <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="video-modal-close" onClick={onClose} aria-label="Close modal">
          &times;
        </button>
        
        <div className="video-modal-player-wrapper">
          {video.videoUrl ? (
            <video 
              src={video.videoUrl} 
              className="video-modal-player" 
              controls 
              autoPlay
              playsInline
            />
          ) : (
            <div className="video-modal-placeholder">
              <span className="placeholder-text">Video preview placeholder (Drive integration ready)</span>
            </div>
          )}
        </div>
        
        <div className="video-modal-details">
          <div className="video-modal-meta">
            <span className="video-modal-category">{video.category}</span>
            <span className="video-modal-date">Released: {video.createdAt}</span>
          </div>
          <h2 className="video-modal-title">{video.title}</h2>
          <p className="video-modal-description">{video.description}</p>
        </div>
      </div>
    </div>
  );
};
