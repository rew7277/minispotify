# 🎵 Wavvve — Self-hosted Music Player

Search YouTube → Download as MP3 → Store on server → Play anytime.  
Built with Node.js + Express + yt-dlp + React + Vite. Deployable on Railway.

---

## Features
- **YouTube search** — powered by yt-dlp (no API key needed)
- **Server-side download** — saves MP3s directly on the server
- **Persistent library** — songs stay across page refreshes
- **Full audio player** — seek, volume, shuffle, repeat, prev/next
- **No duplicates** — already-downloaded songs are auto-detected

---

## Local Development

**Prerequisites:** Node 18+, `yt-dlp`, `ffmpeg` installed locally.

```bash
# Install yt-dlp (macOS)
brew install yt-dlp ffmpeg

# Clone and install
git clone <your-repo>
cd music-app

npm install
cd frontend && npm install && cd ..

# Run backend (port 3000)
node server.js

# In another terminal — run frontend dev server (port 5173, proxies /api → 3000)
cd frontend && npm run dev
```

Open http://localhost:5173

---

## Deploy to Railway

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/music-app.git
git push -u origin main
```

### 2. Deploy on Railway
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your `music-app` repo
3. Railway will auto-detect the Dockerfile and build
4. **Add a Volume** in Railway dashboard → mount at `/app/downloads` to persist songs across deploys

### 3. Environment (optional)
```
PORT=3000   # Railway sets this automatically
```

---

## Project Structure
```
music-app/
├── server.js          # Express API (search, download, stream, delete)
├── package.json       # Backend deps
├── Dockerfile         # Installs yt-dlp + ffmpeg, builds frontend, runs server
├── railway.toml       # Railway config with volume mount
├── downloads/         # MP3s stored here (gitignored, use Railway volume)
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx    # Full UI: search, library, player
        └── index.css
```

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/search?q=...` | Search YouTube (returns 12 results) |
| POST | `/api/download` | Download video as MP3, save to server |
| GET | `/api/songs` | List library |
| GET | `/api/stream/:id` | Stream MP3 (supports range requests) |
| DELETE | `/api/songs/:id` | Remove from library |
