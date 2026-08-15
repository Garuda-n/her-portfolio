import React, { useRef, useState } from 'react';
import type { Video } from '../../types/video';
import { 
  normalizeVideoUrl, 
  normalizeThumbnailUrl,
  isGoogleDriveUrl,
  isYouTubeUrl,
  extractYouTubeId,
  isVimeoUrl
} from '../../utils/videoUtils';

interface VideoCardProps {
  video: Video;
  onPreview: (video: Video) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onPreview }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isTouchDevice = () => {
    return typeof window !== 'undefined' && 
      (window.matchMedia('(hover: none)').matches || 'ontouchstart' in window);
  };

  const resolvedThumbnailUrl = video.thumbnailUrl 
    ? normalizeThumbnailUrl(video.thumbnailUrl) 
    : (isGoogleDriveUrl(video.videoUrl) 
      ? normalizeThumbnailUrl(video.videoUrl) 
      : (isYouTubeUrl(video.videoUrl) 
        ? `https://img.youtube.com/vi/${extractYouTubeId(video.videoUrl)}/hqdefault.jpg` 
        : undefined
      )
    );
  const hasThumbnail = !!resolvedThumbnailUrl;
  const isEmbed = isGoogleDriveUrl(video.videoUrl) || isYouTubeUrl(video.videoUrl) || isVimeoUrl(video.videoUrl);

  const handleMouseEnter = () => {
    if (isTouchDevice()) return;
    setIsHovered(true);
    if ((video.featured || !hasThumbnail) && videoRef.current && !hasError) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log('Video preview playback was prevented or failed:', error);
        });
      }
    }
  };

  const handleMouseLeave = () => {
    if (isTouchDevice()) return;
    setIsHovered(false);
    if ((video.featured || !hasThumbnail) && videoRef.current && !hasError) {
      try {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      } catch (error) {
        console.log('Error pausing or resetting video preview:', error);
      }
    }
  };

  // Show video if:
  // - It is not an embedded YouTube/Drive/Vimeo video
  // - AND (There is no thumbnail AND no error OR there IS a thumbnail and video is featured)
  const showVideo = !isEmbed && ((!hasThumbnail && !hasError) || (hasThumbnail && video.featured && !hasError));

  return (
    <div 
      className="video-card-container" 
      onClick={() => onPreview(video)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`video-card-thumbnail-wrapper ${video.aspectRatio === '9:16' ? 'video-card-vertical' : ''}`}>
        {hasThumbnail && (
          <img 
            src={resolvedThumbnailUrl} 
            alt={video.title} 
            className="video-card-thumbnail"
            loading="lazy"
          />
        )}
        {showVideo && (
          <video 
            ref={videoRef}
            src={normalizeVideoUrl(video.videoUrl)} 
            className="video-card-preview"
            muted
            playsInline
            preload="metadata"
            onError={() => setHasError(true)}
            style={{
              opacity: !hasThumbnail || isHovered ? 1 : 0,
              pointerEvents: 'none'
            }}
          />
        )}
        {!hasThumbnail && hasError && (
          <div className="video-card-fallback-preview">
            <svg 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="fallback-preview-icon"
            >
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13H6V11H14V13Z" />
            </svg>
          </div>
        )}
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

