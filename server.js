import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json({ limit: '10mb' }));

const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
const COOKIES_PATH  = path.join(DOWNLOADS_DIR, 'cookies.txt');

if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

// Serve built React frontend
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hasCookies() {
  return fs.existsSync(COOKIES_PATH) && fs.statSync(COOKIES_PATH).size > 100;
}

// Build yt-dlp base flags — always use cookies when available, plus resilience flags
function ytdlpFlags() {
  const cookies = hasCookies() ? `--cookies "${COOKIES_PATH}"` : '';
  return [
    cookies,
    '--extractor-args "youtube:player_client=android,web"',
    '--no-check-certificates',
    '--socket-timeout 30',
    '--retries 3',
  ].filter(Boolean).join(' ');
}

// ─── Cookie management ────────────────────────────────────────────────────────
// GET  /api/cookies/status  → { hasCookies: bool }
app.get('/api/cookies/status', (req, res) => {
  res.json({ hasCookies: hasCookies() });
});

// POST /api/cookies  body: { content: "<raw cookies.txt text>" }
app.post('/api/cookies', (req, res) => {
  const { content } = req.body;
  if (!content || !content.includes('youtube.com')) {
    return res.status(400).json({ error: 'Invalid cookies — must contain youtube.com entries' });
  }
  fs.writeFileSync(COOKIES_PATH, content, 'utf-8');
  res.json({ success: true, message: 'Cookies saved — downloads should now work.' });
});

// DELETE /api/cookies  → remove saved cookies
app.delete('/api/cookies', (req, res) => {
  try { if (fs.existsSync(COOKIES_PATH)) fs.unlinkSync(COOKIES_PATH); } catch {}
  res.json({ success: true });
});

// ─── Search YouTube ───────────────────────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required' });

  try {
    const flags = ytdlpFlags();
    const { stdout } = await execAsync(
      `yt-dlp ${flags} "ytsearch12:${q.replace(/"/g, '').replace(/`/g, '')}" --dump-json --no-download --flat-playlist`,
      { timeout: 40000 }
    );

    const results = stdout.trim().split('\n').filter(Boolean).map(line => {
      try {
        const d = JSON.parse(line);
        return {
          id:        d.id,
          title:     d.title,
          duration:  d.duration,
          channel:   d.channel || d.uploader || 'Unknown',
          thumbnail: d.thumbnail || `https://i.ytimg.com/vi/${d.id}/mqdefault.jpg`,
        };
      } catch { return null; }
    }).filter(Boolean);

    res.json(results);
  } catch (err) {
    console.error('Search error:', err.message);
    const needsCookies = err.message.includes('Sign in') || err.message.includes('bot') || err.message.includes('429');
    res.status(500).json({
      error: needsCookies
        ? 'YouTube requires authentication. Please upload your cookies in Settings ⚙'
        : 'Search failed: ' + err.message,
      needsCookies,
    });
  }
});

// ─── Download song → store as MP3 ────────────────────────────────────────────
app.post('/api/download', async (req, res) => {
  const { videoId, title, thumbnail, channel, duration } = req.body;
  if (!videoId) return res.status(400).json({ error: 'videoId required' });

  // Already downloaded?
  const existing = getLibrary().find(s => s.videoId === videoId);
  if (existing) return res.json({ success: true, song: existing, cached: true });

  const songId         = crypto.randomUUID();
  const outputTemplate = path.join(DOWNLOADS_DIR, `${songId}.%(ext)s`);
  const mp3Path        = path.join(DOWNLOADS_DIR, `${songId}.mp3`);
  const metaPath       = path.join(DOWNLOADS_DIR, `${songId}.json`);

  try {
    const flags = ytdlpFlags();
    await execAsync(
      `yt-dlp ${flags} -x --audio-format mp3 --audio-quality 0 --no-playlist -o "${outputTemplate}" "https://www.youtube.com/watch?v=${videoId}"`,
      { timeout: 300000 }
    );

    const meta = {
      id:        songId,
      videoId,
      title:     title     || 'Unknown',
      thumbnail: thumbnail || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      channel:   channel   || 'Unknown',
      duration:  duration  || 0,
      addedAt:   Date.now(),
    };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    res.json({ success: true, song: meta });
  } catch (err) {
    console.error('Download error:', err.message);
    [mp3Path, metaPath].forEach(f => { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} });

    const needsCookies = err.message.includes('Sign in') || err.message.includes('bot') || err.message.includes('429');
    res.status(500).json({
      error: needsCookies
        ? 'YouTube requires authentication. Please upload your cookies in Settings ⚙'
        : 'Download failed: ' + err.message,
      needsCookies,
    });
  }
});

// ─── List library ─────────────────────────────────────────────────────────────
app.get('/api/songs', (req, res) => {
  res.json(getLibrary());
});

// ─── Stream MP3 (range support) ───────────────────────────────────────────────
app.get('/api/stream/:id', (req, res) => {
  const songPath = path.join(DOWNLOADS_DIR, `${req.params.id}.mp3`);
  if (!fs.existsSync(songPath)) return res.status(404).json({ error: 'Not found' });

  const stat  = fs.statSync(songPath);
  const range = req.headers.range;

  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
    const start = parseInt(startStr, 10);
    const end   = endStr ? parseInt(endStr, 10) : stat.size - 1;
    res.writeHead(206, {
      'Content-Range':  `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges':  'bytes',
      'Content-Length': end - start + 1,
      'Content-Type':   'audio/mpeg',
    });
    fs.createReadStream(songPath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Length': stat.size, 'Content-Type': 'audio/mpeg', 'Accept-Ranges': 'bytes' });
    fs.createReadStream(songPath).pipe(res);
  }
});

// ─── Delete from library ──────────────────────────────────────────────────────
app.delete('/api/songs/:id', (req, res) => {
  const id = req.params.id;
  ['.mp3', '.json'].forEach(ext => {
    const f = path.join(DOWNLOADS_DIR, `${id}${ext}`);
    try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {}
  });
  res.json({ success: true });
});

// ─── Library helper ───────────────────────────────────────────────────────────
function getLibrary() {
  try {
    return fs.readdirSync(DOWNLOADS_DIR)
      .filter(f => f.endsWith('.json') && f !== 'cookies.json')
      .map(f => {
        try { return JSON.parse(fs.readFileSync(path.join(DOWNLOADS_DIR, f), 'utf-8')); }
        catch { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => b.addedAt - a.addedAt);
  } catch { return []; }
}

// ─── SPA fallback ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🎵 Music server on http://localhost:${PORT}`));
