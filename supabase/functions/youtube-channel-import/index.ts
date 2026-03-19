const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const YOUTUBE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

const YOUTUBE_INNERTUBE_CONTEXT = {
  client: {
    clientName: "WEB",
    clientVersion: "2.20240101.00.00",
    hl: "en",
    gl: "US",
  },
};

interface VideoEntry {
  title: string;
  videoId: string;
  author: string;
  thumbnail: string;
  url: string;
  published: string;
  description: string;
}

interface VideoSummary {
  videoId: string;
  title: string;
}

function extractText(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value?.simpleText === "string") return value.simpleText;
  if (Array.isArray(value?.runs)) {
    return value.runs
      .map((run: any) => run?.text || "")
      .join("")
      .trim();
  }
  return "";
}

function extractApiKey(pageText: string): string | null {
  const apiKeyMatch = pageText.match(/"innertubeApiKey":"([^"]+)"/);
  return apiKeyMatch?.[1] || null;
}

function parseInitialData(pageText: string): any | null {
  const patterns = [
    /var ytInitialData\s*=\s*(\{.*?\});\s*<\/script>/s,
    /ytInitialData\s*=\s*(\{.*?\});\s*(?:var|<\/script>)/s,
  ];

  for (const pattern of patterns) {
    const match = pageText.match(pattern);
    if (!match) continue;

    try {
      return JSON.parse(match[1]);
    } catch {
      // Try the next pattern.
    }
  }

  return null;
}

function findFirstByKey(node: any, key: string): any | null {
  if (!node) return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const result = findFirstByKey(item, key);
      if (result) return result;
    }
    return null;
  }

  if (typeof node === "object") {
    if (key in node) return node[key];

    for (const value of Object.values(node)) {
      const result = findFirstByKey(value, key);
      if (result) return result;
    }
  }

  return null;
}

function findToken(node: any): string | null {
  if (!node) return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const token = findToken(item);
      if (token) return token;
    }
    return null;
  }

  if (typeof node === "object") {
    if (typeof node.token === "string" && node.token) {
      return node.token;
    }

    for (const value of Object.values(node)) {
      const token = findToken(value);
      if (token) return token;
    }
  }

  return null;
}

function extractPlaylistItems(contents: any[]): { videos: VideoSummary[]; continuationToken: string | null } {
  const videos: VideoSummary[] = [];
  let continuationToken: string | null = null;

  for (const item of contents || []) {
    const playlistVideo = item?.playlistVideoRenderer;
    if (playlistVideo?.videoId) {
      const title = extractText(playlistVideo.title);
      if (title) {
        videos.push({
          videoId: playlistVideo.videoId,
          title,
        });
      }
      continue;
    }

    const continuationItem = item?.continuationItemRenderer;
    if (continuationItem && !continuationToken) {
      continuationToken = findToken(continuationItem);
    }
  }

  return { videos, continuationToken };
}

function extractPlaylistPageData(pageText: string): {
  videos: VideoSummary[];
  continuationToken: string | null;
  apiKey: string | null;
} {
  const apiKey = extractApiKey(pageText);
  const data = parseInitialData(pageText);

  if (!data) {
    return { videos: [], continuationToken: null, apiKey };
  }

  const playlistVideoListRenderer = findFirstByKey(data, "playlistVideoListRenderer");
  if (!playlistVideoListRenderer) {
    return { videos: [], continuationToken: null, apiKey };
  }

  const { videos, continuationToken } = extractPlaylistItems(playlistVideoListRenderer.contents || []);
  return { videos, continuationToken, apiKey };
}

function getContinuationItems(data: any): any[] {
  const actionItems = data?.onResponseReceivedActions?.flatMap((action: any) =>
    action?.appendContinuationItemsAction?.continuationItems || []
  ) || [];

  if (actionItems.length > 0) return actionItems;

  const endpointItems = data?.onResponseReceivedEndpoints?.flatMap((endpoint: any) =>
    endpoint?.appendContinuationItemsAction?.continuationItems || []
  ) || [];

  if (endpointItems.length > 0) return endpointItems;

  return data?.continuationContents?.playlistVideoListContinuation?.contents || [];
}

async function fetchPlaylistContinuation(
  continuationToken: string,
  apiKey: string,
): Promise<{ videos: VideoSummary[]; nextToken: string | null }> {
  const browseUrl = `https://www.youtube.com/youtubei/v1/browse?key=${apiKey}&prettyPrint=false`;
  const res = await fetch(browseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": YOUTUBE_HEADERS["User-Agent"],
    },
    body: JSON.stringify({
      context: YOUTUBE_INNERTUBE_CONTEXT,
      continuation: continuationToken,
    }),
  });

  if (!res.ok) {
    console.error("Playlist continuation error:", res.status);
    return { videos: [], nextToken: null };
  }

  const data = await res.json();
  const items = getContinuationItems(data);
  const { videos, continuationToken: nextToken } = extractPlaylistItems(items);
  return { videos, nextToken };
}

async function resolveChannelId(channelUrl: string): Promise<string> {
  const channelIdMatch = channelUrl.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
  if (channelIdMatch) return channelIdMatch[1];

  const handleMatch = channelUrl.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/);
  const cMatch = channelUrl.match(/youtube\.com\/c\/([a-zA-Z0-9_.-]+)/);
  const pageUrl = handleMatch || cMatch ? channelUrl : "";

  if (!pageUrl) {
    throw new Error("Format d'URL non reconnu. Utilisez https://youtube.com/@NomDeLaChaine");
  }

  const pageRes = await fetch(pageUrl, { headers: YOUTUBE_HEADERS });
  const pageText = await pageRes.text();

  const patterns = [
    /\"channelId\":\"(UC[a-zA-Z0-9_-]+)\"/,
    /\"externalId\":\"(UC[a-zA-Z0-9_-]+)\"/,
    /channel_id=(UC[a-zA-Z0-9_-]+)/,
    /\"browseId\":\"(UC[a-zA-Z0-9_-]+)\"/,
    /<meta\s+itemprop="channelId"\s+content="(UC[a-zA-Z0-9_-]+)"/,
    /\/channel\/(UC[a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = pageText.match(pattern);
    if (match) return match[1];
  }

  const handle = handleMatch?.[1] || cMatch?.[1] || "";
  if (handle) {
    const testFeedUrl = `https://www.youtube.com/feeds/videos.xml?user=${handle}`;
    const testRes = await fetch(testFeedUrl, { headers: { "User-Agent": YOUTUBE_HEADERS["User-Agent"] } });
    if (testRes.ok) {
      const testText = await testRes.text();
      const testCidMatch = testText.match(/<yt:channelId>([^<]+)<\/yt:channelId>/);
      if (testCidMatch) return testCidMatch[1];
    } else {
      await testRes.text();
    }
  }

  throw new Error("Impossible de trouver l'ID de la chaîne. Vérifiez l'URL.");
}

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

    const channelId = await resolveChannelId(channelUrl.trim());
    const uploadsPlaylistId = `UU${channelId.slice(2)}`;
    const playlistUrl = `https://www.youtube.com/playlist?list=${uploadsPlaylistId}`;

    const playlistRes = await fetch(playlistUrl, { headers: YOUTUBE_HEADERS });
    const playlistText = await playlistRes.text();

    const { videos: initialVideos, continuationToken, apiKey } = extractPlaylistPageData(playlistText);
    console.log(`Initial playlist extraction: ${initialVideos.length} videos, has continuation: ${!!continuationToken}, has apiKey: ${!!apiKey}`);

    const seenIds = new Set<string>();
    const allVideos: VideoSummary[] = [];

    for (const video of initialVideos) {
      if (!seenIds.has(video.videoId)) {
        seenIds.add(video.videoId);
        allVideos.push(video);
      }
    }

    if (continuationToken && apiKey) {
      let nextToken: string | null = continuationToken;
      let pageCount = 0;
      const startedAt = Date.now();
      const MAX_PAGES = 200;
      const MAX_DURATION_MS = 120_000;

      while (nextToken && pageCount < MAX_PAGES && Date.now() - startedAt < MAX_DURATION_MS) {
        pageCount += 1;
        console.log(`Fetching playlist continuation page ${pageCount}...`);

        const { videos: moreVideos, nextToken: newToken } = await fetchPlaylistContinuation(nextToken, apiKey);
        for (const video of moreVideos) {
          if (!seenIds.has(video.videoId)) {
            seenIds.add(video.videoId);
            allVideos.push(video);
          }
        }

        console.log(`Playlist page ${pageCount}: found ${moreVideos.length} videos (total: ${allVideos.length})`);
        nextToken = newToken;

        if (nextToken) {
          await new Promise((resolve) => setTimeout(resolve, 120));
        }
      }
    }

    const rssData = new Map<string, { published: string; description: string }>();
    let channelName = "YouTube";

    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const feedRes = await fetch(feedUrl, { headers: { "User-Agent": YOUTUBE_HEADERS["User-Agent"] } });
    if (feedRes.ok) {
      const feedText = await feedRes.text();
      const nameMatch = feedText.match(/<name>([^<]+)<\/name>/);
      if (nameMatch) channelName = nameMatch[1];

      const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
      let entryMatch;
      while ((entryMatch = entryRegex.exec(feedText)) !== null) {
        const entry = entryMatch[1];
        const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
        const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
        const descMatch = entry.match(/<media:description>([\s\S]*?)<\/media:description>/);
        if (videoIdMatch) {
          rssData.set(videoIdMatch[1], {
            published: publishedMatch?.[1] || "",
            description: descMatch?.[1]?.trim() || "",
          });
        }
      }
    } else {
      await feedRes.text();
    }

    const videos: VideoEntry[] = allVideos.map((video) => {
      const rss = rssData.get(video.videoId);
      return {
        title: video.title,
        videoId: video.videoId,
        author: channelName,
        thumbnail: `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${video.videoId}`,
        published: rss?.published || "",
        description: rss?.description || "",
      };
    });

    console.log(`Final result: ${videos.length} videos for channel ${channelName} (${channelId})`);

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