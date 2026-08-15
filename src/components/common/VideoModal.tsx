import { useEffect } from 'react';
import type { Video } from '../../types/video';
import { 
  normalizeVideoUrl, 
  isGoogleDriveUrl, 
  isYouTubeUrl, 
  isVimeoUrl, 
  extractGoogleDriveFileId, 
  extractYouTubeId, 
  extractVimeoId 
} from '../../utils/videoUtils';

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

  const driveFileId = isGoogleDriveUrl(video.videoUrl) ? extractGoogleDriveFileId(video.videoUrl) : null;
  const youtubeId = isYouTubeUrl(video.videoUrl) ? extractYouTubeId(video.videoUrl) : null;
  const vimeoId = isVimeoUrl(video.videoUrl) ? extractVimeoId(video.videoUrl) : null;

  return (
    <div className="video-modal-overlay" onClick={onClose}>
      <div className={`video-modal-content ${video.aspectRatio === '9:16' ? 'video-modal-vertical' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="video-modal-close" onClick={onClose} aria-label="Close modal">
          &times;
        </button>
        
        <div className="video-modal-player-wrapper">
          {video.videoUrl ? (
            youtubeId ? (
              <iframe 
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                className="video-modal-player" 
                style={{ border: 'none', width: '100%', height: '100%', borderRadius: '4px' }}
                allow="autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            ) : vimeoId ? (
              <iframe 
                src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`}
                className="video-modal-player" 
                style={{ border: 'none', width: '100%', height: '100%', borderRadius: '4px' }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : driveFileId ? (
              <iframe 
                src={`https://drive.google.com/file/d/${driveFileId}/preview`}
                className="video-modal-player" 
                style={{ border: 'none', width: '100%', height: '100%', borderRadius: '4px' }}
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            ) : (
              <video 
                src={normalizeVideoUrl(video.videoUrl)} 
                className="video-modal-player" 
                controls 
                autoPlay
                playsInline
              />
            )
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
