import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
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
    const handleMatch = channelUrl.match(/youtube\.com\/@([a-zA-Z0-9_-]+)/);
    const cMatch = channelUrl.match(/youtube\.com\/c\/([a-zA-Z0-9_-]+)/);

    if (channelIdMatch) {
      channelId = channelIdMatch[1];
      feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    } else if (handleMatch || cMatch) {
      // For handles, we need to resolve the channel ID first
      const handle = handleMatch?.[1] || cMatch?.[1];
      // Fetch the channel page to extract the channel ID
      const pageRes = await fetch(`https://www.youtube.com/@${handle}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const pageText = await pageRes.text();
      const cidMatch = pageText.match(/\"channelId\":\"([a-zA-Z0-9_-]+)\"/);
      if (cidMatch) {
        channelId = cidMatch[1];
        feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      } else {
        return new Response(JSON.stringify({ error: "Impossible de trouver l'ID de la chaîne. Vérifiez l'URL." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      return new Response(JSON.stringify({ error: "Format d'URL non reconnu. Utilisez https://youtube.com/@NomDeLaChaine" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the RSS feed (returns latest 15 videos)
    const feedRes = await fetch(feedUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
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
