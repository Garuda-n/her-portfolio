import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encodeBase64, decodeBase64 } from 'https://deno.land/std@0.207.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Video {
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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verify GITHUB_TOKEN exists on server
    const githubToken = Deno.env.get('GITHUB_TOKEN');
    if (!githubToken) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: GITHUB_TOKEN is missing.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Extract JWT token and authenticate session
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Authorization header is missing.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid user session.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse request payload
    const { action, payload } = await req.json();
    if (!action || !payload) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: action and payload are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Retrieve current video.json from GitHub
    const githubUrl = 'https://api.github.com/repos/Garuda-n/her-portfolio/contents/src/data/video.json';
    const fetchResponse = await fetch(githubUrl, {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Supabase-Edge-Function'
      }
    });

    if (!fetchResponse.ok) {
      const errMsg = await fetchResponse.text();
      return new Response(
        JSON.stringify({ error: `Failed to fetch video.json from GitHub: ${fetchResponse.statusText}. Details: ${errMsg}` }),
        { status: fetchResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileData = await fetchResponse.json();
    const currentSha = fileData.sha;
    
    // Decode current base64 content safely to UTF-8 string
    const decodedBytes = decodeBase64(fileData.content.replace(/\s/g, ''));
    const currentContentStr = new TextDecoder().decode(decodedBytes);
    const data = JSON.parse(currentContentStr);

    let slotsCount = 4;
    let videos: Video[] = [];

    if (Array.isArray(data)) {
      videos = data;
    } else if (data && typeof data === 'object') {
      slotsCount = Number(data.slotsCount) || 4;
      videos = Array.isArray(data.videos) ? data.videos : [];
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid video.json format on GitHub.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Read-only sync: return the live GitHub state as-is, no commit involved.
    // Used by the admin console so it never acts on data baked into an old site build.
    if (action === 'list') {
      return new Response(
        JSON.stringify({ success: true, slotsCount, videos }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Helper functions for validating video properties
    const validateVideoFields = (v: any) => {
      if (!v.title || typeof v.title !== 'string' || !v.title.trim()) return 'Title is required.';
      if (!v.description || typeof v.description !== 'string' || !v.description.trim()) return 'Description is required.';
      if (!v.category || typeof v.category !== 'string' || !v.category.trim()) return 'Category is required.';
      if (!v.videoUrl || typeof v.videoUrl !== 'string' || !v.videoUrl.trim()) return 'Video URL is required.';
      
      // Simple format check for URLs
      if (!v.videoUrl.startsWith('http://') && !v.videoUrl.startsWith('https://')) return 'Invalid Video URL format.';
      
      if (v.thumbnailUrl !== undefined && v.thumbnailUrl !== null && v.thumbnailUrl !== '') {
        if (typeof v.thumbnailUrl !== 'string') return 'Thumbnail URL must be a string.';
        if (!v.thumbnailUrl.startsWith('http://') && !v.thumbnailUrl.startsWith('https://')) return 'Invalid Thumbnail URL format.';
      }
      
      return null;
    };

    // 5. Apply the requested operation
    if (action === 'add') {
      if (videos.length >= 50) {
        return new Response(
          JSON.stringify({ error: 'Video library limit reached (maximum 50 videos).' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const error = validateVideoFields(payload);
      if (error) {
        return new Response(
          JSON.stringify({ error: `Validation Error: ${error}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const newVideo: Video = {
        id: payload.id || `video-${Date.now()}`,
        title: payload.title.trim(),
        description: payload.description.trim(),
        category: payload.category.trim(),
        videoUrl: payload.videoUrl.trim(),
        thumbnailUrl: (payload.thumbnailUrl && typeof payload.thumbnailUrl === 'string' && payload.thumbnailUrl.trim()) ? payload.thumbnailUrl.trim() : undefined,
        featured: false,
        createdAt: new Date().toISOString().split('T')[0],
        aspectRatio: payload.aspectRatio || '16:9',
        status: payload.status || 'active'
      };

      videos.push(newVideo);

    } else if (action === 'update') {
      const index = videos.findIndex(v => v.id === payload.id);
      if (index === -1) {
        return new Response(
          JSON.stringify({ error: `Video cut not found: ${payload.id}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const error = validateVideoFields(payload);
      if (error) {
        return new Response(
          JSON.stringify({ error: `Validation Error: ${error}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const existingVideo = videos[index];
      if (existingVideo.status === 'deleted') {
        return new Response(
          JSON.stringify({ error: 'Cannot update a deleted video.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      videos[index] = {
        ...existingVideo,
        title: payload.title.trim(),
        description: payload.description.trim(),
        category: payload.category.trim(),
        videoUrl: payload.videoUrl.trim(),
        thumbnailUrl: (payload.thumbnailUrl && typeof payload.thumbnailUrl === 'string' && payload.thumbnailUrl.trim()) ? payload.thumbnailUrl.trim() : undefined,
        featured: typeof payload.featured === 'boolean' ? payload.featured : existingVideo.featured,
        featuredSlot: typeof payload.featuredSlot === 'number' ? payload.featuredSlot : existingVideo.featuredSlot,
        aspectRatio: payload.aspectRatio || existingVideo.aspectRatio || '16:9',
        status: payload.status || existingVideo.status || 'active'
      };

      // Reset featured slot if featured toggled off
      if (payload.featured === false) {
        videos[index].featuredSlot = undefined;
      }

    } else if (action === 'delete') {
      const index = videos.findIndex(v => v.id === payload.id);
      if (index === -1) {
        return new Response(
          JSON.stringify({ success: true, message: 'Video cut already deleted.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      videos[index].status = 'deleted';
      videos[index].featured = false;
      videos[index].featuredSlot = undefined;

    } else if (action === 'toggleFeatured') {
      const index = videos.findIndex(v => v.id === payload.id);
      if (index === -1) {
        return new Response(
          JSON.stringify({ error: `Video cut not found: ${payload.id}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const video = videos[index];
      if (video.status === 'deleted') {
        return new Response(
          JSON.stringify({ error: 'Cannot feature a deleted video.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!video.featured) {
        // Toggle on: Check limit (max slotsCount)
        const featuredCount = videos.filter(v => v.featured).length;
        if (featuredCount >= slotsCount) {
          return new Response(
            JSON.stringify({ error: `Maximum featured slots filled (maximum ${slotsCount} highlights allowed).` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Find first available slot (1 to slotsCount)
        const activeSlots = videos.filter(v => v.featured).map(v => v.featuredSlot);
        let firstFreeSlot = 1;
        for (let i = 1; i <= slotsCount; i++) {
          if (!activeSlots.includes(i)) {
            firstFreeSlot = i;
            break;
          }
        }

        videos[index].featured = true;
        videos[index].featuredSlot = firstFreeSlot;
      } else {
        // Toggle off
        videos[index].featured = false;
        videos[index].featuredSlot = undefined;
      }

    } else if (action === 'updateFeaturedSlots') {
      let newSlots = payload.newSlots as (string | null)[]; // Array of slotsCount video IDs or nulls
      if (!Array.isArray(newSlots)) {
        return new Response(
          JSON.stringify({ error: 'Invalid slots structure: must be an array.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Handle mismatch between frontend slotsCount and backend slotsCount gracefully (e.g., due to caching/deployment delay)
      if (newSlots.length < slotsCount) {
        while (newSlots.length < slotsCount) {
          newSlots.push(null);
        }
      } else if (newSlots.length > slotsCount) {
        newSlots = newSlots.slice(0, slotsCount);
      }

      // Check for duplicate assignments
      const nonNullIds = newSlots.filter(id => id !== null);
      const uniqueIds = new Set(nonNullIds);
      if (uniqueIds.size !== nonNullIds.length) {
        return new Response(
          JSON.stringify({ error: 'Validation Error: A video cannot be featured in multiple slots.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Re-assign slots
      videos = videos.map(video => {
        const slotIdx = newSlots.findIndex(id => id === video.id);
        if (slotIdx !== -1) {
          return { ...video, featured: true, featuredSlot: slotIdx + 1 };
        } else {
          return { ...video, featured: false, featuredSlot: undefined };
        }
      });

    } else if (action === 'addSlot') {
      slotsCount = slotsCount + 1;

    } else if (action === 'deleteSlot') {
      const index = Number(payload.index);
      if (isNaN(index) || index < 0) {
        return new Response(
          JSON.stringify({ error: `Invalid delete slot index: ${index}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (index >= slotsCount) {
        return new Response(
          JSON.stringify({ success: true, message: 'Slot already deleted on the server.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (slotsCount <= 1) {
        return new Response(
          JSON.stringify({ error: 'Cannot delete the only remaining slot.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Unfeature any video at that slot number (which is index + 1)
      // And shift all slots above it (slots > index + 1) down by 1
      videos = videos.map(video => {
        if (video.featured && typeof video.featuredSlot === 'number') {
          if (video.featuredSlot === index + 1) {
            return { ...video, featured: false, featuredSlot: undefined };
          } else if (video.featuredSlot > index + 1) {
            return { ...video, featuredSlot: video.featuredSlot - 1 };
          }
        }
        return video;
      });

      slotsCount = slotsCount - 1;

    } else {
      return new Response(
        JSON.stringify({ error: `Unsupported action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Global checks on the final array
    if (typeof slotsCount !== 'number' || !Number.isInteger(slotsCount) || slotsCount < 1) {
      return new Response(
        JSON.stringify({ error: 'Integrity Error: slotsCount must be an integer >= 1.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const videoIds = videos.map(v => v.id);
    const uniqueVideoIds = new Set(videoIds);
    if (uniqueVideoIds.size !== videoIds.length) {
      return new Response(
        JSON.stringify({ error: 'Integrity Error: Duplicate video IDs detected.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const finalFeatured = videos.filter(v => v.featured);
    if (finalFeatured.length > slotsCount) {
      return new Response(
        JSON.stringify({ error: `Integrity Error: Featured list exceeds ${slotsCount} items.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const activeSlots = finalFeatured.map(v => v.featuredSlot);
    const uniqueSlots = new Set(activeSlots);
    if (uniqueSlots.size !== activeSlots.length) {
      return new Response(
        JSON.stringify({ error: 'Integrity Error: Featured slot collision detected.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check invalid slot values
    const invalidSlot = activeSlots.find(s => typeof s !== 'number' || s < 1 || s > slotsCount);
    if (invalidSlot !== undefined) {
      return new Response(
        JSON.stringify({ error: `Integrity Error: Invalid featured slot number: ${invalidSlot}.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Serialize and encode UTF-8 JSON back to base64
    const updatedContentStr = JSON.stringify({ slotsCount, videos }, null, 2);
    const base64Content = encodeBase64(new TextEncoder().encode(updatedContentStr));

    // 8. Commit changes back to GitHub Contents API
    const commitResponse = await fetch(githubUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Supabase-Edge-Function',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `admin: update video.json`,
        content: base64Content,
        sha: currentSha
      })
    });

    if (commitResponse.status === 409) {
      return new Response(
        JSON.stringify({ error: 'Conflict: The video database has been modified since it was read. Please refresh and try again.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!commitResponse.ok) {
      const commitErr = await commitResponse.text();
      return new Response(
        JSON.stringify({ error: `GitHub commit failed: ${commitResponse.statusText}. Details: ${commitErr}` }),
        { status: commitResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const commitData = await commitResponse.json();
    return new Response(
      JSON.stringify({
        success: true,
        commitSha: commitData.commit.sha,
        path: commitData.content.path,
        slotsCount,
        videos
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
