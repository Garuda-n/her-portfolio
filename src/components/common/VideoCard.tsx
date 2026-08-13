import type { Video } from '../../types/video';

interface VideoCardProps {
  video: Video;
  onPreview: (video: Video) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onPreview }) => {
  return (
    <div 
      className="video-card-container" 
      onClick={() => onPreview(video)}
    >
      <div className="video-card-thumbnail-wrapper">
        <img 
          src={video.thumbnailUrl} 
          alt={video.title} 
          className="video-card-thumbnail"
          loading="lazy"
        />
        <div className="video-card-overlay">
          <div className="video-card-play-btn">
            <svg 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="play-icon"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="video-card-details">
        <span className="video-card-category">{video.category}</span>
        <h3 className="video-card-title">{video.title}</h3>
      </div>
    </div>
  );
};
