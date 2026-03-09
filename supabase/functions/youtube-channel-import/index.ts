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
    let feedUrl = "";

    const channelIdMatch = channelUrl.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
    const handleMatch = channelUrl.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/);
    const cMatch = channelUrl.match(/youtube\.com\/c\/([a-zA-Z0-9_.-]+)/);

    if (channelIdMatch) {
      channelId = channelIdMatch[1];
      feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    } else if (handleMatch || cMatch) {
      const handle = handleMatch?.[1] || cMatch?.[1];
      // Fetch the channel page to extract the channel ID
      const pageRes = await fetch(`https://www.youtube.com/@${handle}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      const pageText = await pageRes.text();

      // Try multiple patterns to find channel ID
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

      if (channelId) {
        feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      } else {
        // Fallback: try RSS feed by user handle directly
        // Some handles work with the user parameter
        const testFeedUrl = `https://www.youtube.com/feeds/videos.xml?user=${handle}`;
        const testRes = await fetch(testFeedUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        });
        if (testRes.ok) {
          const testText = await testRes.text();
          const testCidMatch = testText.match(/<yt:channelId>([^<]+)<\/yt:channelId>/);
          if (testCidMatch) {
            channelId = testCidMatch[1];
            feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
          }
        }

        if (!channelId) {
          console.error("Could not find channel ID. Page length:", pageText.length, "First 500 chars:", pageText.substring(0, 500));
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

    // Fetch the RSS feed (returns latest 15 videos)
    const feedRes = await fetch(feedUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });

    if (!feedRes.ok) {
      return new Response(JSON.stringify({ error: "Impossible de récupérer le flux de la chaîne." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const feedText = await feedRes.text();

    // Parse XML to extract video entries
    const videos: Array<{
      title: string;
      videoId: string;
      author: string;
      thumbnail: string;
      url: string;
      published: string;
    }> = [];

    // Extract channel name
    const channelNameMatch = feedText.match(/<name>([^<]+)<\/name>/);
    const channelName = channelNameMatch?.[1] || "YouTube";

    // Extract entries
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let entryMatch;
    while ((entryMatch = entryRegex.exec(feedText)) !== null) {
      const entry = entryMatch[1];
      const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
      const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);

      if (titleMatch && videoIdMatch) {
        const vid = videoIdMatch[1];
        videos.push({
          title: titleMatch[1],
          videoId: vid,
          author: channelName,
          thumbnail: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${vid}`,
          published: publishedMatch?.[1] || "",
        });
      }
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
