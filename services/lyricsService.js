import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const CACHE_FILE = path.join(DATA_DIR, 'lyrics-cache.json');
const CONFIG_FILE = path.join(DATA_DIR, 'lyrics-config.json');

// In-memory cache loaded from disk
let memoryCache = {};
try {
  if (fs.existsSync(CACHE_FILE)) {
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
    memoryCache = JSON.parse(raw);
  }
} catch (e) {
  memoryCache = {};
}

function saveCache() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(memoryCache, null, 2), 'utf-8');
  } catch (e) {
    console.error('[LyricsService] Error persisting cache:', e.message);
  }
}

/**
 * Get Google API / Custom Search configuration
 */
export function getLyricsConfig() {
  let saved = {};
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch (_) {}

  return {
    googleApiKey: saved.googleApiKey || process.env.GOOGLE_SEARCH_API_KEY || '',
    googleCx: saved.googleCx || process.env.GOOGLE_SEARCH_ENGINE_ID || '',
    isGoogleConfigured: Boolean(
      (saved.googleApiKey || process.env.GOOGLE_SEARCH_API_KEY) &&
      (saved.googleCx || process.env.GOOGLE_SEARCH_ENGINE_ID)
    ),
  };
}

/**
 * Save Google API / Custom Search configuration
 */
export function saveLyricsConfig(config) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const current = getLyricsConfig();
    const updated = {
      ...current,
      ...config,
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[LyricsService] Error saving lyrics config:', err.message);
    return false;
  }
}

/**
 * Clean scraped web lyrics into clean, church-presentation-ready stanzas
 */
export function sanitizeLyrics(raw) {
  if (!raw) return '';

  let text = raw;

  // 1. Remove LRC timestamps like [01:23.45] or [00:12]
  text = text.replace(/\[\d+:\d+(?:\.\d+)?\]\s*/g, '');

  // 2. Remove common Genius & web scrape artifacts
  text = text.replace(/^[0-9]+\s*Contributors?.*Lyrics/i, '');
  text = text.replace(/You might also like/gi, '');
  text = text.replace(/See [^\n]+ LiveGet tickets as low as \$\d+/gi, '');
  text = text.replace(/[0-9]*Embed$/i, '');
  text = text.replace(/\[Intro[^\n]*\]/gi, ''); // Optional intro marker clean

  // 3. Normalize brackets for sections: [Verse 1], [Chorus], [Bridge], etc.
  text = text.replace(/(\[(?:Verse|Chorus|Bridge|Pre-Chorus|Outro|Tag|Refrain|Hook|Ending|Interlude)[^\]]*\])/gi, '\n\n$1\n');

  // 4. Remove chord notation brackets e.g. [G], [Am7], [C#m], [D/F#]
  text = text.replace(/\[[A-G][b#]?(?:m|maj|min|dim|aug|sus)?[0-9]?(?:\/[A-G][b#]?)?\]/g, '');

  // 5. Clean up redundant blank lines & whitespace
  text = text
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

/**
 * Fetch and extract lyrics text from a Genius song page URL
 */
export async function extractGeniusLyrics(url, timeoutMs = 3500) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove unwanted widgets/scripts/buttons inside lyrics
    $('script, style, button, [data-exclude-from-selection="true"], .LyricsHeader__Container').remove();

    const containers = $('div[data-lyrics-container="true"]');
    if (containers.length === 0) {
      const oldContainer = $('.lyrics');
      if (oldContainer.length > 0) {
        oldContainer.find('br').replaceWith('\n');
        return sanitizeLyrics(oldContainer.text());
      }
      return null;
    }

    let combined = '';
    containers.each((_, el) => {
      $(el).find('br').replaceWith('\n');
      combined += $(el).text() + '\n\n';
    });

    return sanitizeLyrics(combined);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name !== 'AbortError') {
      console.warn(`[LyricsService] Error extracting Genius lyrics from ${url}:`, err.message);
    }
    return null;
  }
}

/**
 * Search Genius Multi-search API (Google's top lyrics index)
 */
export async function searchGenius(query, maxResults = 8) {
  try {
    const url = `https://genius.com/api/search/multi?per_page=5&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) return [];
    const data = await res.json();
    
    // Combine hits from top_hit, song, and lyric sections (supports title, artist, AND lyric search!)
    const rawHits = [];
    const seenSongIds = new Set();

    for (const section of data.response?.sections || []) {
      if (section.type === 'top_hit' || section.type === 'song' || section.type === 'lyric') {
        for (const hit of section.hits || []) {
          const r = hit.result;
          if (r && (hit.type === 'song' || r._type === 'song') && !seenSongIds.has(r.id)) {
            seenSongIds.add(r.id);
            rawHits.push(hit);
          }
        }
      }
    }

    const hits = rawHits.slice(0, maxResults);

    // Pre-fetch lyrics for top 4 hits in parallel with a 3.5s timeout
    const results = await Promise.all(
      hits.map(async (hit, index) => {
        const result = hit.result;
        if (!result) return null;
        let lyrics = '';

        if (index < 4 && result.url) {
          lyrics = (await extractGeniusLyrics(result.url, 3500)) || '';
        }

        const snippet = lyrics
          ? lyrics
              .split('\n')
              .filter(Boolean)
              .slice(0, 3)
              .join(' • ')
          : `By ${result.primary_artist?.name || 'Artist'}`;

        return {
          id: `genius-${result.id}`,
          trackName: result.title,
          artistName: result.primary_artist?.name || 'Unknown Artist',
          albumName: result.album?.name || '',
          snippet,
          plainLyrics: lyrics,
          artworkUrl: result.song_art_image_thumbnail_url || '',
          sourceUrl: result.url,
          source: 'genius',
        };
      })
    );

    return results.filter(Boolean);
  } catch (err) {
    console.error('[LyricsService] Error searching Genius:', err.message);
    return [];
  }
}

/**
 * Search Google Custom Search API (if configured by church / admin)
 */
export async function searchGoogleCSE(query, apiKey, cx, maxResults = 4) {
  if (!apiKey || !cx) return [];
  try {
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(query + ' lyrics')}&num=${maxResults}`;
    const res = await fetch(searchUrl);
    if (!res.ok) return [];

    const data = await res.json();
    const items = data.items || [];
    const results = [];

    for (const item of items) {
      const link = item.link || '';
      let plainLyrics = null;

      if (link.includes('genius.com')) {
        plainLyrics = await extractGeniusLyrics(link, 2500);
      } else {
        // Generic lyrics site scraper (AZLyrics, WorshipTogether, etc.)
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 2500);
          const pageRes = await fetch(link, {
            signal: controller.signal,
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            },
          });
          clearTimeout(timer);
          if (pageRes.ok) {
            const html = await pageRes.text();
            const $ = cheerio.load(html);
            $('script, style, nav, header, footer, .ad, .ads, [class*="banner"]').remove();
            
            let container = $('[class*="lyric"], [id*="lyric"]');
            if (container.length > 0) {
              container.find('br').replaceWith('\n');
              const text = container.first().text();
              if (text && text.length > 50) {
                plainLyrics = sanitizeLyrics(text);
              }
            }
          }
        } catch (_) {}
      }

      if (plainLyrics && plainLyrics.length > 30) {
        const snippet = plainLyrics
          .split('\n')
          .filter(Boolean)
          .slice(0, 3)
          .join(' • ');

        results.push({
          id: `google-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          trackName: item.title.replace(/lyrics/gi, '').replace(/[-–—|].*$/, '').trim() || query,
          artistName: 'Google Search Result',
          snippet,
          plainLyrics,
          sourceUrl: link,
          source: 'google',
        });
      }
    }

    return results;
  } catch (err) {
    console.error('[LyricsService] Error searching Google CSE:', err.message);
    return [];
  }
}

/**
 * Search LRCLIB (open lyrics catalog) as a complementary/fallback provider
 */
export async function searchLRCLIB(query, maxResults = 4) {
  try {
    const targetUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(query.trim())}`;
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'EasyPresenterStudio/2.0 (https://github.com/EasyPresenter)',
      },
    });
    if (!res.ok) return [];

    const data = await res.json();
    return (Array.isArray(data) ? data : [])
      .filter(item => item.plainLyrics || item.syncedLyrics)
      .slice(0, maxResults)
      .map(item => {
        const raw =
          item.plainLyrics ||
          (item.syncedLyrics
            ? item.syncedLyrics.replace(/\[\d+:\d+\.\d+\]\s*/g, '')
            : '');
        const snippet = raw
          .split('\n')
          .filter(Boolean)
          .slice(0, 3)
          .join(' • ');

        return {
          id: `lrclib-${item.id}`,
          trackName: item.trackName || item.name || query,
          artistName: item.artistName || item.artist || 'Unknown Artist',
          albumName: item.albumName || '',
          duration: item.duration || 0,
          snippet: snippet || '',
          plainLyrics: sanitizeLyrics(raw),
          source: 'lrclib',
        };
      });
  } catch (err) {
    console.error('[LyricsService] LRCLIB search error:', err.message);
    return [];
  }
}

/**
 * Lazy fetch full lyrics for a specific song result by ID or URL
 */
export async function getLyricsDetails(songId, sourceUrl) {
  // Check if we already have it in cached lists
  for (const list of Object.values(memoryCache)) {
    const found = list.find(s => s.id === songId);
    if (found && found.plainLyrics && found.plainLyrics.length > 20) {
      return found;
    }
  }

  // If sourceUrl is a Genius URL, fetch it
  if (sourceUrl && sourceUrl.includes('genius.com')) {
    const lyrics = await extractGeniusLyrics(sourceUrl, 5000);
    if (lyrics) {
      // Update memory cache
      for (const list of Object.values(memoryCache)) {
        const found = list.find(s => s.id === songId);
        if (found) {
          found.plainLyrics = lyrics;
          found.snippet = lyrics.split('\n').filter(Boolean).slice(0, 3).join(' • ');
          saveCache();
          return found;
        }
      }
      return { id: songId, plainLyrics: lyrics };
    }
  }

  return null;
}

/**
 * Master Search function: Multi-Tier Cascading Engine
 */
export async function searchMultiTierLyrics(query, options = {}) {
  const q = (query || '').trim();
  if (!q) return [];

  const cacheKey = q.toLowerCase();
  if (memoryCache[cacheKey] && memoryCache[cacheKey].length > 0) {
    return memoryCache[cacheKey];
  }

  const config = getLyricsConfig();
  const googleApiKey = options.googleApiKey || config.googleApiKey;
  const googleCx = options.googleCx || config.googleCx;

  let combined = [];

  // Tier 1: If Google Custom Search is configured, query it first
  if (googleApiKey && googleCx) {
    try {
      const googleResults = await searchGoogleCSE(q, googleApiKey, googleCx);
      if (googleResults.length > 0) {
        combined.push(...googleResults);
      }
    } catch (e) {
      console.warn('[LyricsService] Google CSE query failed, falling back:', e.message);
    }
  }

  // Tier 2: Query Genius (Google's #1 indexed lyrics catalog)
  try {
    const geniusResults = await searchGenius(q, 6);
    if (geniusResults.length > 0) {
      combined.push(...geniusResults);
    }
  } catch (e) {
    console.warn('[LyricsService] Genius search failed:', e.message);
  }

  // Tier 3: LRCLIB (Complementary / Fallback)
  try {
    const lrclibResults = await searchLRCLIB(q, 4);
    if (lrclibResults.length > 0) {
      combined.push(...lrclibResults);
    }
  } catch (e) {
    console.warn('[LyricsService] LRCLIB fallback failed:', e.message);
  }

  // Deduplicate by title & artist (case-insensitive)
  const seen = new Set();
  const deduped = [];
  for (const item of combined) {
    const key = `${item.trackName.toLowerCase().replace(/[^a-z0-9]/g, '')}|${item.artistName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }

  // Relevance ranking based on query tokens (supports both title/artist matches and lyric line matches)
  const queryTerms = q.toLowerCase().split(/\s+/).filter(w => w.length >= 2);
  const scored = deduped.map(item => {
    let score = 10; // Baseline: item was returned by search provider
    const titleLower = item.trackName.toLowerCase();
    const artistLower = item.artistName.toLowerCase();
    const lyricsLower = (item.plainLyrics || '').toLowerCase();
    const snippetLower = (item.snippet || '').toLowerCase();
    const qLower = q.toLowerCase();
    
    // Exact full query matches in title or artist
    if (titleLower.includes(qLower)) score += 60;
    if (artistLower.includes(qLower)) score += 40;

    // Full query match in lyrics or snippet
    if (lyricsLower.includes(qLower)) score += 50;
    if (snippetLower.includes(qLower)) score += 35;

    // Individual word matches
    for (const term of queryTerms) {
      if (titleLower.includes(term)) score += 15;
      if (artistLower.includes(term)) score += 10;
      if (lyricsLower.includes(term)) score += 8;
      if (snippetLower.includes(term)) score += 6;
    }

    if (item.plainLyrics && item.plainLyrics.length > 50) score += 5;

    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const finalResults = scored.map(s => s.item).slice(0, 10);

  if (finalResults.length > 0) {
    memoryCache[cacheKey] = finalResults;
    saveCache();
  }

  return finalResults;
}
