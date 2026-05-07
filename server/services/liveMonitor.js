const axios = require('axios');
const { db } = require('../db/database');

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN;
const POLL_INTERVAL_MS = parseInt(process.env.LIVE_POLL_INTERVAL_MS, 10) || 60000;
const USE_SCRAPE_FALLBACK = process.env.USE_SCRAPE_FALLBACK !== 'false';

let twitchToken = null;
let twitchTokenExpire = 0;
let useScrapeFallback = USE_SCRAPE_FALLBACK;
let lastLiveCheckDetails = {
  lastRunAt: null,
  lastMode: 'unknown',
  usedScrapeFallback: false,
  usedApi: false,
  streamersChecked: 0,
  errorCount: 0
};

const axiosInstance = axios.create({
  timeout: 7000,
  maxRedirects: 5,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  }
});

const getUseScrapeFallback = () => useScrapeFallback;
const setUseScrapeFallback = (value) => {
  useScrapeFallback = Boolean(value);
};

const getLastLiveCheckDetails = () => lastLiveCheckDetails;
const resetLastLiveCheckDetails = () => {
  lastLiveCheckDetails = {
    lastRunAt: new Date().toISOString(),
    lastMode: 'unknown',
    usedScrapeFallback: false,
    usedApi: false,
    streamersChecked: 0,
    errorCount: 0
  };
};

const recordLiveCheckMode = (mode) => {
  if (mode === 'scrape') {
    lastLiveCheckDetails.usedScrapeFallback = true;
  }
  if (mode === 'api') {
    lastLiveCheckDetails.usedApi = true;
  }
  if (lastLiveCheckDetails.usedApi && lastLiveCheckDetails.usedScrapeFallback) {
    lastLiveCheckDetails.lastMode = 'mixed';
  } else if (lastLiveCheckDetails.usedApi) {
    lastLiveCheckDetails.lastMode = 'api';
  } else if (lastLiveCheckDetails.usedScrapeFallback) {
    lastLiveCheckDetails.lastMode = 'scrape';
  }
};

const parseTwitchUsername = (url) => {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('twitch.tv')) return null;
    const parts = parsed.pathname.split('/').filter(Boolean);
    return parts[0] || null;
  } catch (error) {
    return null;
  }
};

const getTwitchAuthToken = async () => {
  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    return null;
  }

  const now = Date.now();
  if (twitchToken && now < twitchTokenExpire) {
    return twitchToken;
  }

  const response = await axios.post(
    `https://id.twitch.tv/oauth2/token`,
    null,
    {
      params: {
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        grant_type: 'client_credentials'
      }
    }
  );

  twitchToken = response.data.access_token;
  twitchTokenExpire = now + (response.data.expires_in - 30) * 1000;
  return twitchToken;
};

const checkTwitchLive = async (pageLink) => {
  const username = parseTwitchUsername(pageLink);
  if (!username) return null;
  const token = await getTwitchAuthToken();
  if (!token) return null;

  const response = await axios.get('https://api.twitch.tv/helix/streams', {
    params: { user_login: username },
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`
    }
  });

  return response.data.data && response.data.data.length > 0;
};

const parseFacebookUsername = (url) => {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    return parts[0] || null;
  } catch (error) {
    return null;
  }
};

const fetchPageHtml = async (url) => {
  const response = await axiosInstance.get(url);
  return response.data;
};

const safeJsonParse = (jsonString) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return null;
  }
};

const parseFacebookLiveFromHtml = (html) => {
  if (!html) return false;

  const liveIndicators = [
    /"is_live"\s*:\s*true/i,
    /"live_video"/i,
    /live now/i,
    /"is_live"\s*:\s*1/i,
    /"live_status"\s*:\s*2/i,
    /Live video/i,
    /This video is live/i,
    /\blive\b.*\bbroadcast\b/i,
    /\bBroadcast\b.*\blive\b/i
  ];

  return liveIndicators.some((pattern) => pattern.test(html));
};

const checkFacebookLiveScrape = async (pageLink) => {
  const username = parseFacebookUsername(pageLink);
  if (!username) return null;

  const urls = [
    `https://m.facebook.com/${username}`,
    `https://www.facebook.com/${username}`
  ];

  for (const url of urls) {
    try {
      const html = await fetchPageHtml(url);
      if (parseFacebookLiveFromHtml(html)) {
        return true;
      }
    } catch (error) {
      console.warn(`Facebook scrape fallback failed for ${url}:`, error.message);
    }
  }

  return false;
};

const checkFacebookLive = async (pageLink) => {
  const username = parseFacebookUsername(pageLink);
  if (!username) return null;

  if (!FACEBOOK_ACCESS_TOKEN) {
    if (!useScrapeFallback) {
      console.log('Facebook API token missing and scrape fallback is disabled. Skipping live check.');
      return null;
    }
    console.log('Facebook API token not configured - using scrape fallback');
    recordLiveCheckMode('scrape');
    return await checkFacebookLiveScrape(pageLink);
  }

  try {
    const response = await axiosInstance.get(`https://graph.facebook.com/v18.0/${username}`, {
      params: {
        fields: 'live_videos',
        access_token: FACEBOOK_ACCESS_TOKEN
      }
    });

    recordLiveCheckMode('api');
    return response.data.live_videos && response.data.live_videos.data.length > 0;
  } catch (error) {
    console.error('Facebook live check error:', error.message);
    if (!useScrapeFallback) {
      return null;
    }
    recordLiveCheckMode('scrape');
    return await checkFacebookLiveScrape(pageLink);
  }
};

const parseTikTokUsername = (url) => {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    return parts[0]?.replace('@', '') || null;
  } catch (error) {
    return null;
  }
};

const parseTikTokLiveFromHtml = (html) => {
  if (!html) return false;

  const scriptMatch = html.match(/<script[^>]+id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/i);
  if (scriptMatch) {
    const state = safeJsonParse(scriptMatch[1]);
    if (state) {
      const users = state?.UserModule?.users;
      if (users) {
        for (const userId of Object.keys(users)) {
          const user = users[userId];
          if (user?.liveStatus === 2 || user?.is_live === true || user?.isLive === true) {
            return true;
          }
        }
      }

      const liveInfo = state?.LiveModule?.liveInfo;
      if (liveInfo) {
        for (const entry of Object.values(liveInfo)) {
          if (entry?.isLivestreaming === true || entry?.is_live === true || entry?.liveStatus === 2) {
            return true;
          }
        }
      }
    }
  }

  const liveIndicators = [
    /"is_live"\s*:\s*true/i,
    /"isLive"\s*:\s*true/i,
    /"liveStatus"\s*:\s*2/i,
    /Live now/i,
    /LIVE/i,
    /liveStream/i
  ];

  return liveIndicators.some((pattern) => pattern.test(html));
};

const checkTikTokLiveScrape = async (pageLink) => {
  const username = parseTikTokUsername(pageLink);
  if (!username) return null;

  const urls = [
    `https://www.tiktok.com/@${username}`,
    `https://m.tiktok.com/@${username}`
  ];

  for (const url of urls) {
    try {
      const html = await fetchPageHtml(url);
      if (parseTikTokLiveFromHtml(html)) {
        return true;
      }
    } catch (error) {
      console.warn(`TikTok scrape fallback failed for ${url}:`, error.message);
    }
  }

  return false;
};

const checkTikTokLive = async (pageLink) => {
  const username = parseTikTokUsername(pageLink);
  if (!username) return null;

  if (!TIKTOK_ACCESS_TOKEN) {
    if (!useScrapeFallback) {
      console.log('TikTok API token missing and scrape fallback is disabled. Skipping live check.');
      return null;
    }
    console.log('TikTok API token not configured - using scrape fallback');
    recordLiveCheckMode('scrape');
    return await checkTikTokLiveScrape(pageLink);
  }

  try {
    const response = await axiosInstance.get('https://open.tiktokapis.com/v1/user/info', {
      headers: {
        Authorization: `Bearer ${TIKTOK_ACCESS_TOKEN}`
      },
      params: {
        fields: 'open_id,display_name,avatar_large'
      }
    });

    recordLiveCheckMode('api');
    return null;
  } catch (error) {
    console.error('TikTok live check error:', error.message);
    if (!useScrapeFallback) {
      return null;
    }
    recordLiveCheckMode('scrape');
    return await checkTikTokLiveScrape(pageLink);
  }
};

const checkStreamerLive = async (streamer) => {
  if (!streamer.page_link) return null;
  
  // Check Twitch
  if (streamer.platform && streamer.platform.toLowerCase().includes('twitch')) {
    return await checkTwitchLive(streamer.page_link);
  }
  if (streamer.page_link.includes('twitch.tv')) {
    return await checkTwitchLive(streamer.page_link);
  }
  
  // Check Facebook
  if (streamer.platform && streamer.platform.toLowerCase().includes('facebook')) {
    return await checkFacebookLive(streamer.page_link);
  }
  if (streamer.page_link.includes('facebook.com')) {
    return await checkFacebookLive(streamer.page_link);
  }
  
  // Check TikTok
  if (streamer.platform && streamer.platform.toLowerCase().includes('tiktok')) {
    return await checkTikTokLive(streamer.page_link);
  }
  if (streamer.page_link.includes('tiktok.com')) {
    return await checkTikTokLive(streamer.page_link);
  }
  
  return null;
};

const updateStreamerStatus = (streamerId, newStatus) => {
  const stmt = db.prepare(`
    UPDATE streamers
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(newStatus, streamerId);
};

const insertAttendanceRecord = (streamerId, status) => {
  const stmt = db.prepare(`
    INSERT INTO attendance (streamer_id, status)
    VALUES (?, ?)
  `);
  stmt.run(streamerId, status);
};

const runLiveCheck = async () => {
  resetLastLiveCheckDetails();

  try {
    const streamers = db.prepare("SELECT * FROM streamers WHERE page_link IS NOT NULL AND page_link != ''").all();
    lastLiveCheckDetails.streamersChecked = streamers.length;

    for (const streamer of streamers) {
      const isLive = await checkStreamerLive(streamer);
      if (isLive === null) continue;

      if (isLive && streamer.status !== 'online') {
        updateStreamerStatus(streamer.id, 'online');
        insertAttendanceRecord(streamer.id, 'online');
        console.log(`Live monitor: ${streamer.name} is now online.`);
      } else if (!isLive && streamer.status === 'online') {
        updateStreamerStatus(streamer.id, 'offline');
        insertAttendanceRecord(streamer.id, 'offline');
        console.log(`Live monitor: ${streamer.name} is now offline.`);
      }
    }
  } catch (error) {
    lastLiveCheckDetails.errorCount += 1;
    console.error('Live monitor error:', error.message || error);
  }
};

const startLivePolling = () => {
  runLiveCheck();
  setInterval(runLiveCheck, POLL_INTERVAL_MS);
};

module.exports = {
  startLivePolling,
  runLiveCheck,
  getUseScrapeFallback,
  setUseScrapeFallback,
  getLastLiveCheckDetails
};
