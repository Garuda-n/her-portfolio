import type { Video } from '../types/video';
import videosData from '../data/video.json';

const videos: Video[] = videosData as Video[];

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
