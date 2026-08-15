/**
 * Checks whether a given URL is a Google Drive URL.
 */
export const isGoogleDriveUrl = (url: string): boolean => {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed.includes('drive.google.com') ||
    trimmed.includes('docs.google.com') ||
    trimmed.includes('lh3.googleusercontent.com')
  );
};

/**
 * Extracts the file ID from a Google Drive URL.
 * Supports various formats:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://drive.google.com/uc?export=download&id=FILE_ID
 * - https://docs.google.com/file/d/FILE_ID/edit
 * - https://lh3.googleusercontent.com/d/FILE_ID
 */
export const extractGoogleDriveFileId = (url: string): string | null => {
  if (!url) return null;
  const trimmed = url.trim();

  // Pattern for /d/FILE_ID (matches both /file/d/FILE_ID and /d/FILE_ID)
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1]) {
    return dMatch[1];
  }

  // Pattern for query params: ?id=FILE_ID or &id=FILE_ID
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }

  return null;
};

/**
 * Normalizes a URL to a direct video stream link if it is a Google Drive URL.
 * If not, or if parsing fails, it returns the original URL.
 */
export const normalizeVideoUrl = (url: string): string => {
  if (!url) return '';
  const trimmed = url.trim();

  if (!isGoogleDriveUrl(trimmed)) {
    return trimmed;
  }

  const fileId = extractGoogleDriveFileId(trimmed);
  if (fileId) {
    return `https://drive.google.com/uc?id=${fileId}&export=download`;
  }

  return trimmed;
};

/**
 * Normalizes a URL to a thumbnail image link if it is a Google Drive URL.
 * If not, or if parsing fails, it returns the original URL.
 */
export const normalizeThumbnailUrl = (url: string): string => {
  if (!url) return '';
  const trimmed = url.trim();

  if (!isGoogleDriveUrl(trimmed)) {
    return trimmed;
  }

  const fileId = extractGoogleDriveFileId(trimmed);
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return trimmed;
};

/**
 * Checks if a given URL is a YouTube URL.
 */
export const isYouTubeUrl = (url: string): boolean => {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed.includes('youtube.com') ||
    trimmed.includes('youtu.be')
  );
};

/**
 * Extracts the video ID from a YouTube URL.
 */
export const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const trimmed = url.trim();

  // Pattern for watch?v=VIDEO_ID
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watchMatch && watchMatch[1]) {
    return watchMatch[1];
  }

  // Pattern for shorts/VIDEO_ID
  const shortsMatch = trimmed.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch && shortsMatch[1]) {
    return shortsMatch[1];
  }

  // Pattern for youtu.be/VIDEO_ID
  const shareMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shareMatch && shareMatch[1]) {
    return shareMatch[1];
  }

  // Pattern for embed/VIDEO_ID
  const embedMatch = trimmed.match(/\/embed\/([a-zA-Z0-9_-]+)/);
  if (embedMatch && embedMatch[1]) {
    return embedMatch[1];
  }

  return null;
};

/**
 * Checks if a given URL is a Vimeo URL.
 */
export const isVimeoUrl = (url: string): boolean => {
  if (!url) return false;
  const trimmed = url.trim();
  return trimmed.includes('vimeo.com');
};

/**
 * Extracts the video ID from a Vimeo URL.
 */
export const extractVimeoId = (url: string): string | null => {
  if (!url) return null;
  const trimmed = url.trim();

  // Pattern for vimeo.com/VIDEO_ID or player.vimeo.com/video/VIDEO_ID
  const match = trimmed.match(/(?:vimeo\.com\/|video\/)(\d+)/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
};
