const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

/**
 * Extract videos from ytInitialData JSON embedded in the page HTML.
 * Returns videos + continuation token if available.
 */
function extractVideosFromPageData(pageText: string): { videos: Array<{ videoId: string; title: string }>, continuationToken: string | null, apiKey: string | null } {
  const videos: Array<{ videoId: string; title: string }> = [];
  let continuationToken: string | null = null;
  let apiKey: string | null = null;

  // Extract innertubeApiKey
  const apiKeyMatch = pageText.match(/"innertubeApiKey":"([^"]+)"/);
  if (apiKeyMatch) apiKey = apiKeyMatch[1];

  // Extract ytInitialData
  const dataMatch = pageText.match(/var ytInitialData\s*=\s*(\{.*?\});\s*<\/script>/s);
  if (!dataMatch) {
    // Fallback: try another pattern
    const altMatch = pageText.match(/ytInitialData\s*=\s*(\{.*?\});\s*(?:var|<\/script>)/s);
    if (!altMatch) return { videos, continuationToken, apiKey };
    try {
      const data = JSON.parse(altMatch[1]);
      return extractFromParsedData(data, apiKey);
    } catch { return { videos, continuationToken, apiKey }; }
  }

  try {
    const data = JSON.parse(dataMatch[1]);
    return extractFromParsedData(data, apiKey);
  } catch {
    return { videos, continuationToken, apiKey };
  }
}

function extractFromParsedData(data: any, apiKey: string | null): { videos: Array<{ videoId: string; title: string }>, continuationToken: string | null, apiKey: string | null } {
  const videos: Array<{ videoId: string; title: string }> = [];
  let continuationToken: string | null = null;

  // Navigate to the videos tab content
  const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
  let videosTab: any = null;
  
  for (const tab of tabs) {
    const tabRenderer = tab?.tabRenderer;
    if (tabRenderer?.selected && tabRenderer?.content) {
      videosTab = tabRenderer.content;
      break;
    }
  }

  if (!videosTab) {
    // Try first tab with content
    for (const tab of tabs) {
      if (tab?.tabRenderer?.content) {
        videosTab = tab.tabRenderer.content;
        break;
      }
    }
  }

  // Extract from richGridRenderer (modern layout)
  const richGrid = videosTab?.richGridRenderer;
  if (richGrid) {
    const contents = richGrid.contents || [];
    for (const item of contents) {
      if (item?.richItemRenderer?.content?.videoRenderer) {
        const vr = item.richItemRenderer.content.videoRenderer;
        const videoId = vr.videoId;
        const title = vr.title?.runs?.[0]?.text || vr.title?.simpleText || "";
        if (videoId && title) videos.push({ videoId, title });
      }
      // Continuation token
      if (item?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token) {
        continuationToken = item.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
      }
    }
  }

  // Also try sectionListRenderer > itemSectionRenderer (older layout)
  if (videos.length === 0) {
    const sections = videosTab?.sectionListRenderer?.contents || [];
    for (const section of sections) {
      const items = section?.itemSectionRenderer?.contents || [];
      for (const item of items) {
        const gridItems = item?.gridRenderer?.items || [];
        for (const gi of gridItems) {
          const vr = gi?.gridVideoRenderer;
          if (vr?.videoId) {
            const title = vr.title?.runs?.[0]?.text || vr.title?.simpleText || "";
            if (title) videos.push({ videoId: vr.videoId, title });
          }
        }
        // Continuation from grid
        for (const gi of gridItems) {
          if (gi?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token) {
            continuationToken = gi.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
          }
        }
      }
    }
  }

  return { videos, continuationToken, apiKey };
}

/**
 * Fetch next page of videos using YouTube's browse API with continuation token.
 */
async function fetchContinuation(continuationToken: string, apiKey: string): Promise<{ videos: Array<{ videoId: string; title: string }>, nextToken: string | null }> {
  const videos: Array<{ videoId: string; title: string }> = [];
  let nextToken: string | null = null;

  const browseUrl = `https://www.youtube.com/youtubei/v1/browse?key=${apiKey}&prettyPrint=false`;
  const res = await fetch(browseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    body: JSON.stringify({
      context: {
        client: {
          clientName: "WEB",
          clientVersion: "2.20240101.00.00",
          hl: "en",
          gl: "US",
        },
      },
      continuation: continuationToken,
    }),
  });

  if (!res.ok) {
    console.error("Browse API error:", res.status);
    return { videos, nextToken };
  }

  const data = await res.json();

  // Extract videos from continuation response
  const actions = data?.onResponseReceivedActions || [];
  for (const action of actions) {
    const items = action?.appendContinuationItemsAction?.continuationItems || [];
    for (const item of items) {
      if (item?.richItemRenderer?.content?.videoRenderer) {
        const vr = item.richItemRenderer.content.videoRenderer;
        const videoId = vr.videoId;
        const title = vr.title?.runs?.[0]?.text || vr.title?.simpleText || "";
        if (videoId && title) videos.push({ videoId, title });
      }
      // Grid video renderer (older layout)
      if (item?.gridVideoRenderer) {
        const vr = item.gridVideoRenderer;
        const title = vr.title?.runs?.[0]?.text || vr.title?.simpleText || "";
        if (vr.videoId && title) videos.push({ videoId: vr.videoId, title });
      }
      // Next continuation token
      if (item?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token) {
        nextToken = item.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
      }
    }
  }

  return { videos, nextToken };
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

    // Extract channel identifier from URL
    let channelId = "";
    const channelIdMatch = channelUrl.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
    const handleMatch = channelUrl.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/);
    const cMatch = channelUrl.match(/youtube\.com\/c\/([a-zA-Z0-9_.-]+)/);
    const handle = handleMatch?.[1] || cMatch?.[1] || "";

    if (channelIdMatch) {
      channelId = channelIdMatch[1];
    } else if (handle) {
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
        /\/channel\/(UC[a-zA-Z0-9_-]+)/,
      ];

      for (const pattern of patterns) {
        const m = pageText.match(pattern);
        if (m) { channelId = m[1]; break; }
      }

      if (!channelId) {
        const testFeedUrl = `https://www.youtube.com/feeds/videos.xml?user=${handle}`;
        const testRes = await fetch(testFeedUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (testRes.ok) {
          const testText = await testRes.text();
          const testCidMatch = testText.match(/<yt:channelId>([^<]+)<\/yt:channelId>/);
          if (testCidMatch) channelId = testCidMatch[1];
        } else {
          await testRes.text(); // consume body
        }

        if (!channelId) {
          return new Response(JSON.stringify({ error: "Impossible de trouver l'ID de la chaîne. Vérifiez l'URL." }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    } else {
      return new Response(JSON.stringify({ error: "Format d'URL non reconnu. Utilisez https://youtube.com/@NomDeLaChaine" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Fetch the channel /videos page
    const videosPageUrl = `https://www.youtube.com/channel/${channelId}/videos`;
    const videosPageRes = await fetch(videosPageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    const videosPageText = await videosPageRes.text();

    // Extract channel name
    const channelNameMatch = videosPageText.match(/"channelMetadataRenderer":\{"title":"([^"]+)"/);
    let channelName = channelNameMatch?.[1] || "";

    // Step 2: Parse initial videos + continuation token from page
    const { videos: initialVideos, continuationToken, apiKey } = extractVideosFromPageData(videosPageText);
    
    console.log(`Initial extraction: ${initialVideos.length} videos, has continuation: ${!!continuationToken}, has apiKey: ${!!apiKey}`);

    // Deduplicate
    const seenIds = new Set<string>();
    const allVideos: Array<{ videoId: string; title: string }> = [];
    
    for (const v of initialVideos) {
      if (!seenIds.has(v.videoId)) {
        seenIds.add(v.videoId);
        allVideos.push(v);
      }
    }

    // Step 3: Paginate with continuation tokens to get ALL videos
    if (continuationToken && apiKey) {
      let nextToken: string | null = continuationToken;
      let pageCount = 0;
      const MAX_PAGES = 20; // Safety limit (~30 videos per page = ~600 max)

      while (nextToken && pageCount < MAX_PAGES) {
        pageCount++;
        console.log(`Fetching continuation page ${pageCount}...`);
        
        const { videos: moreVideos, nextToken: newToken } = await fetchContinuation(nextToken, apiKey);
        
        for (const v of moreVideos) {
          if (!seenIds.has(v.videoId)) {
            seenIds.add(v.videoId);
            allVideos.push(v);
          }
        }
        
        console.log(`Page ${pageCount}: found ${moreVideos.length} videos (total: ${allVideos.length})`);
        nextToken = newToken;
        
        // Small delay to be respectful
        if (nextToken) await new Promise(r => setTimeout(r, 200));
      }
    }

    // Step 4: Also fetch RSS for metadata (descriptions, dates) of latest 15
    const rssData = new Map<string, { published: string; description: string }>();
    if (!channelName) channelName = "YouTube";
    
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const feedRes = await fetch(feedUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (feedRes.ok) {
      const feedText = await feedRes.text();
      if (!channelName || channelName === "YouTube") {
        const nameMatch = feedText.match(/<name>([^<]+)<\/name>/);
        if (nameMatch) channelName = nameMatch[1];
      }
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
      await feedRes.text(); // consume body
    }

    // Step 5: Build final video list
    const videos: VideoEntry[] = allVideos.map(v => {
      const rss = rssData.get(v.videoId);
      return {
        title: v.title,
        videoId: v.videoId,
        author: channelName,
        thumbnail: `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${v.videoId}`,
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
