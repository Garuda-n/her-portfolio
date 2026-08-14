import type { Video } from '../types/video';
import videosData from '../data/video.json';

const videos: Video[] = Array.isArray(videosData) 
  ? (videosData as Video[]) 
  : (videosData && typeof videosData === 'object' && Array.isArray((videosData as any).videos)) 
    ? ((videosData as any).videos as Video[]) 
    : [];

export const getVideos = (): Video[] => {
  return videos;
};

export const getFeaturedVideos = (): Video[] => {
  return videos
    .filter(v => v.featured && typeof v.featuredSlot === 'number')
    .sort((a, b) => (a.featuredSlot || 0) - (b.featuredSlot || 0));
};

export const getVideoById = (id: string): Video | undefined => {
  return videos.find(v => v.id === id);
};

export const getCategories = (): string[] => {
  const categories = videos.map(v => v.category);
  return Array.from(new Set(categories));
};

export const getSlotsCount = (): number => {
  if (videosData && typeof videosData === 'object' && 'slotsCount' in videosData) {
    return Number((videosData as any).slotsCount) || 4;
  }
  return 4;
};
