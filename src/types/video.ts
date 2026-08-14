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
}
