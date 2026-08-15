import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Video } from '../types/video';
import { getVideos as initialFetch, getSlotsCount } from '../services/videoService';
import { supabase } from '../services/supabaseClient';
import { useAuthContext } from './AuthContext';

interface ToastData {
  message: string;
  type: 'success' | 'error';
}

interface VideoContextType {
  videos: Video[];
  slotsCount: number;
  toast: ToastData | null;
  isSaving: boolean;
  addVideo: (video: Omit<Video, 'id' | 'createdAt' | 'featured' | 'featuredSlot'>) => Promise<boolean>;
  updateVideo: (id: string, updated: Partial<Video>) => Promise<boolean>;
  deleteVideo: (id: string) => Promise<boolean>;
  toggleFeatured: (id: string) => Promise<boolean>;
  updateFeaturedSlots: (newSlots: (Video | null)[]) => Promise<boolean>;
  addSlot: () => Promise<boolean>;
  deleteSlot: (index: number) => Promise<boolean>;
  showToast: (message: string, type: 'success' | 'error') => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthContext();
  const [videos, setVideos] = useState<Video[]>([]);
  const [slotsCount, setSlotsCount] = useState<number>(4);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize data on load from the bundled snapshot (fine for the public portfolio,
  // which only needs to reflect the last deploy).
  useEffect(() => {
    setVideos(initialFetch());
    setSlotsCount(getSlotsCount());
  }, []);

  // The admin console can't rely on the bundled snapshot: it can be older than the
  // real data on GitHub. As soon as an admin session starts, pull the live state so
  // the console always matches what a mutation will actually be validated against.
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.functions.invoke('update-video-data', {
        body: { action: 'list', payload: {} }
      });
      if (cancelled || error || !data?.success) return;
      setVideos((data.videos as Video[]).filter(v => v.status !== 'deleted'));
      setSlotsCount(data.slotsCount);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

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

  // General server-side function mediator call. On success, the Edge Function returns
  // the exact videos/slotsCount it just committed to GitHub — reconcile local state to
  // that instead of trusting the optimistic patch, so the admin's view can never drift
  // from what's actually on GitHub.
  const invokePersistenceApi = async (
    action: string,
    payload: any
  ): Promise<{ success: boolean; error?: string; videos?: Video[]; slotsCount?: number }> => {
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
      return { success: true, videos: data?.videos, slotsCount: data?.slotsCount };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network connection failed.' };
    } finally {
      setIsSaving(false);
    }
  };

  const reconcileFromServer = (res: { videos?: Video[]; slotsCount?: number }) => {
    if (res.videos) {
      setVideos(res.videos.filter(v => v.status !== 'deleted'));
    }
    if (typeof res.slotsCount === 'number') {
      setSlotsCount(res.slotsCount);
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

    reconcileFromServer(res);
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

    reconcileFromServer(res);
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

    reconcileFromServer(res);
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
      if (featuredCount >= slotsCount) {
        showToast(`Maximum of ${slotsCount} featured videos reached. Remove one first.`, 'error');
        return false;
      }

      const busySlots = videos.filter(v => v.featured).map(v => v.featuredSlot);
      let freeSlot = 1;
      for (let i = 1; i <= slotsCount; i++) {
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

    reconcileFromServer(res);
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

    reconcileFromServer(res);
    showToast('Changes saved to GitHub.', 'success');
    return true;
  };

  const addSlot = async (): Promise<boolean> => {
    const previousSlotsCount = slotsCount;
    // Optimistic UI update
    setSlotsCount(prev => prev + 1);

    const res = await invokePersistenceApi('addSlot', {});

    if (!res.success) {
      // Rollback optimistic state
      setSlotsCount(previousSlotsCount);
      showToast(res.error || 'Failed to add highlight slot on GitHub.', 'error');
      return false;
    }

    reconcileFromServer(res);
    showToast('Showcase slot added successfully.', 'success');
    return true;
  };

  const deleteSlot = async (index: number): Promise<boolean> => {
    if (slotsCount <= 1) {
      showToast('Cannot delete the only remaining slot.', 'error');
      return false;
    }
    const previousSlotsCount = slotsCount;
    const previousVideos = [...videos];

    // Optimistic UI update
    setVideos(prev => 
      prev.map(v => {
        if (v.featured && typeof v.featuredSlot === 'number') {
          if (v.featuredSlot === index + 1) {
            return { ...v, featured: false, featuredSlot: undefined };
          } else if (v.featuredSlot > index + 1) {
            return { ...v, featuredSlot: v.featuredSlot - 1 };
          }
        }
        return v;
      })
    );
    setSlotsCount(prev => prev - 1);

    const res = await invokePersistenceApi('deleteSlot', { index });

    if (!res.success) {
      // Rollback optimistic state
      setVideos(previousVideos);
      setSlotsCount(previousSlotsCount);
      showToast(res.error || 'Failed to delete showcase slot on GitHub.', 'error');
      return false;
    }

    reconcileFromServer(res);
    showToast('Showcase slot deleted successfully.', 'success');
    return true;
  };

  return (
    <VideoContext.Provider value={{
      videos,
      slotsCount,
      toast,
      isSaving,
      addVideo,
      updateVideo,
      deleteVideo,
      toggleFeatured,
      updateFeaturedSlots,
      addSlot,
      deleteSlot,
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
