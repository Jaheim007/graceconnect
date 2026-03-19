const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { channelUrl } = await req.json();

    if (!channelUrl || typeof channelUrl !== "string") {
      return new Response(JSON.stringify({ error: "URL de chaîne requise." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract channel identifier from URL
    let channelId = "";

    const channelIdMatch = channelUrl.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
    const handleMatch = channelUrl.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/);
    const cMatch = channelUrl.match(/youtube\.com\/c\/([a-zA-Z0-9_.-]+)/);

    const handle = handleMatch?.[1] || cMatch?.[1] || "";

    if (channelIdMatch) {
      channelId = channelIdMatch[1];
    } else if (handle) {
      // Fetch the channel page to extract the channel ID
      const pageRes = await fetch(`https://www.youtube.com/@${handle}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      const pageText = await pageRes.text();

      const patterns = [
        /\"channelId\":\"(UC[a-zA-Z0-9_-]+)\"/,
        /\"externalId\":\"(UC[a-zA-Z0-9_-]+)\"/,
        /channel_id=(UC[a-zA-Z0-9_-]+)/,
        /\"browseId\":\"(UC[a-zA-Z0-9_-]+)\"/,
        /<meta\s+itemprop="channelId"\s+content="(UC[a-zA-Z0-9_-]+)"/,
        /data-channel-external-id="(UC[a-zA-Z0-9_-]+)"/,
        /\/channel\/(UC[a-zA-Z0-9_-]+)/,
      ];

      for (const pattern of patterns) {
        const m = pageText.match(pattern);
        if (m) {
          channelId = m[1];
          break;
        }
      }

      if (!channelId) {
        // Try user-based feed as fallback
        const testFeedUrl = `https://www.youtube.com/feeds/videos.xml?user=${handle}`;
        const testRes = await fetch(testFeedUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        });
        if (testRes.ok) {
          const testText = await testRes.text();
          const testCidMatch = testText.match(/<yt:channelId>([^<]+)<\/yt:channelId>/);
          if (testCidMatch) {
            channelId = testCidMatch[1];
          }
        }

        if (!channelId) {
          return new Response(JSON.stringify({ error: "Impossible de trouver l'ID de la chaîne. Vérifiez l'URL." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    } else {
      return new Response(JSON.stringify({ error: "Format d'URL non reconnu. Utilisez https://youtube.com/@NomDeLaChaine" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Strategy: Scrape the channel /videos page to get all video IDs, 
    // then use RSS for metadata of latest 15, and oembed for the rest.
    
    // Step 1: Fetch the channel /videos page to extract all video IDs
    const videosPageUrl = `https://www.youtube.com/channel/${channelId}/videos`;
    const videosPageRes = await fetch(videosPageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    const videosPageText = await videosPageRes.text();

    // Extract channel name from page
    const channelNamePageMatch = videosPageText.match(/"channelMetadataRenderer":\{"title":"([^"]+)"/);
    let channelName = channelNamePageMatch?.[1] || "";

    // Extract all video IDs from the page's initial data (ytInitialData)
    const allVideoIds: string[] = [];
    const videoIdRegex = /\"videoId\":\"([a-zA-Z0-9_-]{11})\"/g;
    let vidMatch;
    const seenIds = new Set<string>();
    
    while ((vidMatch = videoIdRegex.exec(videosPageText)) !== null) {
      const vid = vidMatch[1];
      if (!seenIds.has(vid)) {
        seenIds.add(vid);
        allVideoIds.push(vid);
      }
    }

    // Step 2: Also fetch RSS feed for metadata of latest videos
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const feedRes = await fetch(feedUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });

    const rssVideos = new Map<string, { title: string; published: string; description: string }>();
    
    if (feedRes.ok) {
      const feedText = await feedRes.text();
      
      // Get channel name from RSS if not found yet
      if (!channelName) {
        const nameMatch = feedText.match(/<name>([^<]+)<\/name>/);
        channelName = nameMatch?.[1] || "YouTube";
      }
      
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
      let entryMatch;
      while ((entryMatch = entryRegex.exec(feedText)) !== null) {
        const entry = entryMatch[1];
        const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
        const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
        const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
        const descMatch = entry.match(/<media:description>([\s\S]*?)<\/media:description>/);
        
        if (titleMatch && videoIdMatch) {
          rssVideos.set(videoIdMatch[1], {
            title: titleMatch[1],
            published: publishedMatch?.[1] || "",
            description: descMatch?.[1]?.trim() || "",
          });
          // Make sure RSS video IDs are in our list
          if (!seenIds.has(videoIdMatch[1])) {
            seenIds.add(videoIdMatch[1]);
            allVideoIds.push(videoIdMatch[1]);
          }
        }
      }
    }

    if (!channelName) channelName = "YouTube";

    // Step 3: For video IDs not in RSS, try to get titles from the page data
    // Extract video titles from ytInitialData
    const titleMap = new Map<string, string>();
    // Pattern: {"videoId":"XXX",...,"title":{"runs":[{"text":"TITLE"}],...}}
    const titlePatterns = [
      /\{"videoId":"([a-zA-Z0-9_-]{11})"[^}]*?"title":\{"runs":\[\{"text":"([^"]+)"\}/g,
      /\{"videoId":"([a-zA-Z0-9_-]{11})"[^}]*?"title":\{"simpleText":"([^"]+)"\}/g,
    ];
    
    for (const pattern of titlePatterns) {
      let tMatch;
      while ((tMatch = pattern.exec(videosPageText)) !== null) {
        if (!titleMap.has(tMatch[1])) {
          titleMap.set(tMatch[1], tMatch[2]);
        }
      }
    }

    // Step 4: Build the final video list
    const videos: Array<{
      title: string;
      videoId: string;
      author: string;
      thumbnail: string;
      url: string;
      published: string;
      description: string;
    }> = [];

    for (const vid of allVideoIds) {
      const rssData = rssVideos.get(vid);
      const pageTitle = titleMap.get(vid);
      const title = rssData?.title || pageTitle || "";
      
      // Skip if we can't determine a title (likely not an actual video)
      if (!title) continue;

      videos.push({
        title,
        videoId: vid,
        author: channelName,
        thumbnail: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${vid}`,
        published: rssData?.published || "",
        description: rssData?.description || "",
      });
    }

    return new Response(JSON.stringify({ videos, channelName, channelId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("youtube-channel-import error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur interne." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
