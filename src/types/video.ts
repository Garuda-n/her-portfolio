export interface Video {
  id: string;
  title: string;
  description: string;
  category: string;
  videoUrl: string;
  thumbnailUrl?: string;
  featured: boolean;
  featuredSlot?: number;
  createdAt: string;
  aspectRatio?: '16:9' | '9:16';
  status?: 'active' | 'deleted';
}
