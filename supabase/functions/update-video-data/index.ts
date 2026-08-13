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
  thumbnailUrl: string;
  featured: boolean;
  featuredSlot?: number;
  createdAt: string;
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
    let videos: Video[] = JSON.parse(currentContentStr);

    if (!Array.isArray(videos)) {
      return new Response(
        JSON.stringify({ error: 'Invalid data format on GitHub: video.json must be an array.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Helper functions for validating video properties
    const validateVideoFields = (v: any) => {
      if (!v.title || typeof v.title !== 'string' || !v.title.trim()) return 'Title is required.';
      if (!v.description || typeof v.description !== 'string' || !v.description.trim()) return 'Description is required.';
      if (!v.category || typeof v.category !== 'string' || !v.category.trim()) return 'Category is required.';
      if (!v.videoUrl || typeof v.videoUrl !== 'string' || !v.videoUrl.trim()) return 'Video URL is required.';
      if (!v.thumbnailUrl || typeof v.thumbnailUrl !== 'string' || !v.thumbnailUrl.trim()) return 'Thumbnail URL is required.';
      
      // Simple format check for URLs
      if (!v.videoUrl.startsWith('http://') && !v.videoUrl.startsWith('https://')) return 'Invalid Video URL format.';
      if (!v.thumbnailUrl.startsWith('http://') && !v.thumbnailUrl.startsWith('https://')) return 'Invalid Thumbnail URL format.';
      
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
        thumbnailUrl: payload.thumbnailUrl.trim(),
        featured: false,
        createdAt: new Date().toISOString().split('T')[0]
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
      videos[index] = {
        ...existingVideo,
        title: payload.title.trim(),
        description: payload.description.trim(),
        category: payload.category.trim(),
        videoUrl: payload.videoUrl.trim(),
        thumbnailUrl: payload.thumbnailUrl.trim(),
        featured: typeof payload.featured === 'boolean' ? payload.featured : existingVideo.featured,
        featuredSlot: typeof payload.featuredSlot === 'number' ? payload.featuredSlot : existingVideo.featuredSlot
      };

      // Reset featured slot if featured toggled off
      if (payload.featured === false) {
        videos[index].featuredSlot = undefined;
      }

    } else if (action === 'delete') {
      const index = videos.findIndex(v => v.id === payload.id);
      if (index === -1) {
        return new Response(
          JSON.stringify({ error: `Video cut not found: ${payload.id}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      videos.splice(index, 1);

    } else if (action === 'toggleFeatured') {
      const index = videos.findIndex(v => v.id === payload.id);
      if (index === -1) {
        return new Response(
          JSON.stringify({ error: `Video cut not found: ${payload.id}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const video = videos[index];
      if (!video.featured) {
        // Toggle on: Check limit (max 4)
        const featuredCount = videos.filter(v => v.featured).length;
        if (featuredCount >= 4) {
          return new Response(
            JSON.stringify({ error: 'Maximum featured slots filled (maximum 4 highlights allowed).' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Find first available slot (1 to 4)
        const activeSlots = videos.filter(v => v.featured).map(v => v.featuredSlot);
        let firstFreeSlot = 1;
        for (let i = 1; i <= 4; i++) {
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
      const newSlots = payload.newSlots as (string | null)[]; // Array of 4 video IDs or nulls
      if (!Array.isArray(newSlots) || newSlots.length !== 4) {
        return new Response(
          JSON.stringify({ error: 'Invalid slots structure: must be an array of length 4.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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

    } else {
      return new Response(
        JSON.stringify({ error: `Unsupported action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Global checks on the final array
    const finalFeatured = videos.filter(v => v.featured);
    if (finalFeatured.length > 4) {
      return new Response(
        JSON.stringify({ error: 'Integrity Error: Featured list exceeds 4 items.' }),
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
    const invalidSlot = activeSlots.find(s => typeof s !== 'number' || s < 1 || s > 4);
    if (invalidSlot !== undefined) {
      return new Response(
        JSON.stringify({ error: `Integrity Error: Invalid featured slot number: ${invalidSlot}.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Serialize and encode UTF-8 JSON back to base64
    const updatedContentStr = JSON.stringify(videos, null, 2);
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
        message: `admin: update video.json [skip ci]`,
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
        path: commitData.content.path
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
