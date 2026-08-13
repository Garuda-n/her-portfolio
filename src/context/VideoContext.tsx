import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Video } from '../types/video';
import { getVideos as initialFetch } from '../services/videoService';
import { supabase } from '../services/supabaseClient';

interface ToastData {
  message: string;
  type: 'success' | 'error';
}

interface VideoContextType {
  videos: Video[];
  toast: ToastData | null;
  isSaving: boolean;
  addVideo: (video: Omit<Video, 'id' | 'createdAt' | 'featured' | 'featuredSlot'>) => Promise<boolean>;
  updateVideo: (id: string, updated: Partial<Video>) => Promise<boolean>;
  deleteVideo: (id: string) => Promise<boolean>;
  toggleFeatured: (id: string) => Promise<boolean>;
  updateFeaturedSlots: (newSlots: (Video | null)[]) => Promise<boolean>;
  showToast: (message: string, type: 'success' | 'error') => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize data on load
  useEffect(() => {
    setVideos(initialFetch());
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // Clear toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // General server-side function mediator call
  const invokePersistenceApi = async (
    action: string, 
    payload: any
  ): Promise<{ success: boolean; error?: string }> => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-video-data', {
        body: { action, payload }
      });

      if (error) {
        return { success: false, error: error.message };
      }
      if (data?.error) {
        return { success: false, error: data.error };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network connection failed.' };
    } finally {
      setIsSaving(false);
    }
  };

  const addVideo = async (
    newVideoData: Omit<Video, 'id' | 'createdAt' | 'featured' | 'featuredSlot'>
  ): Promise<boolean> => {
    if (videos.length >= 50) {
      showToast('Maximum limit of 50 videos reached.', 'error');
      return false;
    }

    const optimisticId = `video-${Date.now()}`;
    const optimisticVideo: Video = {
      ...newVideoData,
      id: optimisticId,
      createdAt: new Date().toISOString().split('T')[0],
      featured: false,
      featuredSlot: undefined
    };

    const previousVideos = [...videos];
    // Optimistic UI update
    setVideos(prev => [...prev, optimisticVideo]);

    const res = await invokePersistenceApi('add', { ...newVideoData, id: optimisticId });
    
    if (!res.success) {
      // Rollback optimistic state
      setVideos(previousVideos);
      showToast(res.error || 'Failed to save video cut to GitHub.', 'error');
      return false;
    }

    showToast('Changes saved to GitHub.', 'success');
    return true;
  };

  const updateVideo = async (id: string, updatedFields: Partial<Video>): Promise<boolean> => {
    const previousVideos = [...videos];
    
    // Optimistic UI update
    setVideos(prev => 
      prev.map(v => {
        if (v.id === id) {
          const merged = { ...v, ...updatedFields };
          if (updatedFields.featured === false) {
            merged.featuredSlot = undefined;
          }
          return merged;
        }
        return v;
      })
    );

    const targetVideo = videos.find(v => v.id === id);
    if (!targetVideo) {
      setVideos(previousVideos);
      return false;
    }

    const payload = { ...targetVideo, ...updatedFields };
    const res = await invokePersistenceApi('update', payload);

    if (!res.success) {
      // Rollback optimistic state
      setVideos(previousVideos);
      showToast(res.error || 'Failed to update video cut on GitHub.', 'error');
      return false;
    }

    showToast('Changes saved to GitHub.', 'success');
    return true;
  };

  const deleteVideo = async (id: string): Promise<boolean> => {
    const previousVideos = [...videos];
    
    // Optimistic UI update
    setVideos(prev => prev.filter(v => v.id !== id));

    const res = await invokePersistenceApi('delete', { id });

    if (!res.success) {
      // Rollback optimistic state
      setVideos(previousVideos);
      showToast(res.error || 'Failed to delete video cut from GitHub.', 'error');
      return false;
    }

    showToast('Changes saved to GitHub.', 'success');
    return true;
  };

  const toggleFeatured = async (id: string): Promise<boolean> => {
    const targetVideo = videos.find(v => v.id === id);
    if (!targetVideo) return false;

    const previousVideos = [...videos];

    let nextFeatured = !targetVideo.featured;
    let nextSlot: number | undefined = undefined;

    if (nextFeatured) {
      const featuredCount = videos.filter(v => v.featured).length;
      if (featuredCount >= 4) {
        showToast('Maximum of 4 featured videos reached. Remove one first.', 'error');
        return false;
      }

      const busySlots = videos.filter(v => v.featured).map(v => v.featuredSlot);
      let freeSlot = 1;
      for (let i = 1; i <= 4; i++) {
        if (!busySlots.includes(i)) {
          freeSlot = i;
          break;
        }
      }
      nextSlot = freeSlot;
    }

    // Optimistic UI update
    setVideos(prev => 
      prev.map(v => v.id === id ? { ...v, featured: nextFeatured, featuredSlot: nextSlot } : v)
    );

    const res = await invokePersistenceApi('toggleFeatured', { id });

    if (!res.success) {
      // Rollback optimistic state
      setVideos(previousVideos);
      showToast(res.error || 'Failed to update featured highlight on GitHub.', 'error');
      return false;
    }

    showToast('Changes saved to GitHub.', 'success');
    return true;
  };

  const updateFeaturedSlots = async (newSlots: (Video | null)[]): Promise<boolean> => {
    const previousVideos = [...videos];

    // Optimistic UI update
    setVideos(prev => {
      return prev.map(video => {
        const slotIndex = newSlots.findIndex(slot => slot && slot.id === video.id);
        if (slotIndex !== -1) {
          return {
            ...video,
            featured: true,
            featuredSlot: slotIndex + 1
          };
        } else {
          return {
            ...video,
            featured: false,
            featuredSlot: undefined
          };
        }
      });
    });

    const slotIds = newSlots.map(slot => slot ? slot.id : null);
    const res = await invokePersistenceApi('updateFeaturedSlots', { newSlots: slotIds });

    if (!res.success) {
      // Rollback optimistic state
      setVideos(previousVideos);
      showToast(res.error || 'Failed to save reordered highlights to GitHub.', 'error');
      return false;
    }

    showToast('Changes saved to GitHub.', 'success');
    return true;
  };

  return (
    <VideoContext.Provider value={{
      videos,
      toast,
      isSaving,
      addVideo,
      updateVideo,
      deleteVideo,
      toggleFeatured,
      updateFeaturedSlots,
      showToast
    }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideoContext = () => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error('useVideoContext must be used within a VideoProvider');
  }
  return context;
};
