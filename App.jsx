import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────
const Icon = ({ d, size = 20, color = 'currentColor', fill = 'none', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  search:   'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  download: ['M12 3v13', 'M5 16l7 7 7-7', 'M3 21h18'],
  play:     { d: 'M5 3l14 9-14 9V3z', fill: 'currentColor', stroke: 'none' },
  pause:    { d: 'M6 4h4v16H6zM14 4h4v16h-4z', fill: 'currentColor', stroke: 'none' },
  prev:     ['M19 20L9 12l10-8v16z', 'M5 19V5'],
  next:     ['M5 4l10 8-10 8V4z', 'M19 5v14'],
  vol:      ['M11 5L6 9H2v6h4l5 4V5z', 'M15.54 8.46a5 5 0 0 1 0 7.07'],
  mute:     ['M11 5L6 9H2v6h4l5 4V5z', 'M23 9l-6 6', 'M17 9l6 6'],
  trash:    ['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6'],
  music:    ['M9 18V5l12-2v13', 'M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
  x:        ['M18 6L6 18', 'M6 6l12 12'],
  repeat:   ['M17 1l4 4-4 4', 'M3 11V9a4 4 0 0 1 4-4h14', 'M7 23l-4-4 4-4', 'M21 13v2a4 4 0 0 1-4 4H3'],
  shuffle:  ['M16 3h5v5', 'M4 20L21 3', 'M21 16v5h-5', 'M15 15l6 6', 'M4 4l5 5'],
  library:  ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M3 14h7v7H3z', 'M14 14h7v7h-7z'],
  waveform: 'M2 12h2M6 8v8M10 5v14M14 9v6M18 7v10M22 12h-2',
};

function fmt(s) {
  if (!s) return '--:--';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ─── EQ bars animation (playing indicator) ────────────────────────────────────
function EQBars({ active }) {
  return (
    <span style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 16 }}>
      {[1, 1.6, 0.7, 1.3].map((h, i) => (
        <span key={i} style={{
          width: 3,
          height: `${h * 100}%`,
          background: 'var(--accent)',
          borderRadius: 2,
          transformOrigin: 'bottom',
          animation: active ? `bars ${0.6 + i * 0.15}s ease-in-out infinite alternate` : 'none',
          transform: active ? undefined : 'scaleY(0.35)',
          transition: 'transform 0.3s',
        }} />
      ))}
    </span>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 18 }) {
  return (
    <span style={{
      display: 'inline-block',
      width: size,
      height: size,
      border: `2px solid var(--border)`,
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}

// ─── Search Result Card ───────────────────────────────────────────────────────
function ResultCard({ song, onDownload, downloading, isInLibrary }) {
  return (
    <div style={{
      display: 'flex',
      gap: 12,
      padding: '10px 12px',
      borderRadius: 10,
      background: 'var(--bg3)',
      border: '1px solid var(--border)',
      alignItems: 'center',
      animation: 'fadeUp 0.3s ease both',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#333'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <img
        src={song.thumbnail}
        alt=""
        style={{ width: 52, height: 52, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }}
        onError={e => { e.target.src = `https://i.ytimg.com/vi/${song.id}/mqdefault.jpg`; }}
      />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {song.title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 3, display: 'flex', gap: 8 }}>
          <span>{song.channel}</span>
          {song.duration && <span>· {fmt(song.duration)}</span>}
        </div>
      </div>

      <button
        onClick={() => !isInLibrary && !downloading && onDownload(song)}
        title={isInLibrary ? 'Already in library' : 'Download'}
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: isInLibrary ? '#1a2a1a' : downloading ? 'var(--bg2)' : 'var(--accent)',
          color: isInLibrary ? '#4caf50' : 'var(--bg)',
          transition: 'background 0.2s, transform 0.1s',
          transform: 'scale(1)',
        }}
        onMouseEnter={e => { if (!isInLibrary && !downloading) e.currentTarget.style.transform = 'scale(1.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {downloading ? <Spinner size={14} /> : isInLibrary
          ? <Icon d="M20 6L9 17l-5-5" size={15} color="#4caf50" />
          : <Icon d={ICONS.download} size={15} color="var(--bg)" />}
      </button>
    </div>
  );
}

// ─── Library Song Row ─────────────────────────────────────────────────────────
function LibraryRow({ song, isPlaying, isActive, onPlay, onDelete }) {
  return (
    <div
      onClick={onPlay}
      style={{
        display: 'flex',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 8,
        alignItems: 'center',
        cursor: 'pointer',
        background: isActive ? 'rgba(232,160,69,0.1)' : 'transparent',
        border: `1px solid ${isActive ? 'rgba(232,160,69,0.25)' : 'transparent'}`,
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg3)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
        <img src={song.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {isActive && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <EQBars active={isPlaying} />
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{
          fontSize: 12,
          fontWeight: isActive ? 600 : 400,
          color: isActive ? 'var(--accent)' : 'var(--text)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {song.title}
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
          {fmt(song.duration)}
        </div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDelete(song.id); }}
        style={{ padding: 4, color: 'var(--muted)', borderRadius: 4, transition: 'color 0.2s, background 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(232,84,84,0.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent'; }}
      >
        <Icon d={ICONS.trash} size={13} />
      </button>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState([]);
  const [searching, setSearching]   = useState(false);
  const [searchErr, setSearchErr]   = useState('');

  const [library, setLibrary]       = useState([]);
  const [downloading, setDownloading] = useState({}); // videoId → true

  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [progress, setProgress]     = useState(0);
  const [duration, setDuration]     = useState(0);
  const [volume, setVolume]         = useState(0.85);
  const [muted, setMuted]           = useState(false);
  const [shuffle, setShuffle]       = useState(false);
  const [repeat, setRepeat]         = useState(false);

  const audioRef = useRef(null);
  const searchTimer = useRef(null);

  // Load library on mount
  useEffect(() => {
    fetchLibrary();
  }, []);

  async function fetchLibrary() {
    try {
      const r = await fetch('/api/songs');
      if (r.ok) setLibrary(await r.json());
    } catch {}
  }

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); setSearchErr(''); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(query), 500);
    return () => clearTimeout(searchTimer.current);
  }, [query]);

  async function doSearch(q) {
    setSearching(true); setSearchErr('');
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setResults(data);
    } catch (e) {
      setSearchErr(e.message || 'Search failed');
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleDownload(song) {
    setDownloading(p => ({ ...p, [song.id]: true }));
    try {
      const r = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: song.id,
          title: song.title,
          thumbnail: song.thumbnail,
          channel: song.channel,
          duration: song.duration,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      await fetchLibrary();
      // Auto-play the downloaded song
      playSong(data.song);
    } catch (e) {
      alert('Download failed: ' + e.message);
    } finally {
      setDownloading(p => { const n = { ...p }; delete n[song.id]; return n; });
    }
  }

  function playSong(song) {
    setCurrentSong(song);
    setIsPlaying(true);
    setProgress(0);
  }

  async function deleteSong(id) {
    await fetch(`/api/songs/${id}`, { method: 'DELETE' });
    if (currentSong?.id === id) { setCurrentSong(null); setIsPlaying(false); }
    await fetchLibrary();
  }

  // Audio element sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    audio.src = `/api/stream/${currentSong.id}`;
    audio.volume = muted ? 0 : volume;
    audio.play().catch(() => setIsPlaying(false));
  }, [currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.play().catch(() => setIsPlaying(false));
    else audio.pause();
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  function handleTimeUpdate() {
    const a = audioRef.current;
    if (a) { setProgress(a.currentTime); setDuration(a.duration || 0); }
  }

  function handleEnded() {
    if (repeat) { audioRef.current.currentTime = 0; audioRef.current.play(); return; }
    playNext();
  }

  function playNext() {
    if (!currentSong || library.length === 0) return;
    const idx = library.findIndex(s => s.id === currentSong.id);
    let next;
    if (shuffle) {
      next = library[Math.floor(Math.random() * library.length)];
    } else {
      next = library[(idx + 1) % library.length];
    }
    if (next) playSong(next);
  }

  function playPrev() {
    if (!currentSong || library.length === 0) return;
    const idx = library.findIndex(s => s.id === currentSong.id);
    const prev = library[(idx - 1 + library.length) % library.length];
    if (prev) playSong(prev);
  }

  function seekTo(e) {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = ratio * duration;
  }

  const libraryIds = new Set(library.map(s => s.videoId));

  // ─── Layout ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* ── Sidebar: Library ── */}
      <aside style={{
        width: 'var(--sidebar-w)',
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '22px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon d={ICONS.waveform} size={18} color="var(--bg)" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>Wavvve</span>
          </div>
        </div>

        {/* Library header */}
        <div style={{ padding: '14px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>
            Library
          </span>
          <span style={{
            fontSize: 10, fontFamily: 'var(--font-mono)',
            background: 'var(--bg3)', color: 'var(--muted)',
            padding: '2px 7px', borderRadius: 99,
          }}>
            {library.length}
          </span>
        </div>

        {/* Song list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 10px' }}>
          {library.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--muted)' }}>
              <Icon d={ICONS.music} size={28} color="var(--border)" />
              <div style={{ marginTop: 10, fontSize: 12 }}>Search &amp; download<br />songs to fill your library</div>
            </div>
          ) : (
            library.map(song => (
              <LibraryRow
                key={song.id}
                song={song}
                isActive={currentSong?.id === song.id}
                isPlaying={isPlaying && currentSong?.id === song.id}
                onPlay={() => playSong(song)}
                onDelete={deleteSong}
              />
            ))
          )}
        </div>
      </aside>

      {/* ── Main area ── */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}>

        {/* Search bar */}
        <div style={{
          padding: '24px 28px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '10px 16px',
            transition: 'border-color 0.2s',
          }}
            onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            {searching ? <Spinner size={18} /> : <Icon d={ICONS.search} size={18} color="var(--muted)" />}
            <input
              type="text"
              placeholder="Search for songs, artists, albums..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--text)',
                fontSize: 14,
                fontWeight: 500,
              }}
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]); }} style={{ color: 'var(--muted)', padding: 2 }}>
                <Icon d={ICONS.x} size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px' }}>

          {/* Search error */}
          {searchErr && (
            <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12, fontFamily: 'var(--font-mono)' }}>
              ⚠ {searchErr}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>
                Results for "{query}"
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {results.map(song => (
                  <ResultCard
                    key={song.id}
                    song={song}
                    onDownload={handleDownload}
                    downloading={!!downloading[song.id]}
                    isInLibrary={libraryIds.has(song.id)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Empty state */}
          {!query && results.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎵</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)', marginBottom: 6 }}>
                Find your music
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                Search any song, artist, or album above.<br />
                Click the download button to save it to your library.
              </div>
              {library.length > 0 && (
                <div style={{ marginTop: 20, fontSize: 12, color: 'var(--accent)' }}>
                  You have {library.length} song{library.length > 1 ? 's' : ''} in your library →
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Player Bar ── */}
        <div style={{
          height: 'var(--player-h)',
          background: 'var(--bg2)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 24,
          flexShrink: 0,
        }}>

          {/* Current song info */}
          <div style={{ width: 220, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {currentSong ? (
              <>
                <img
                  src={currentSong.thumbnail}
                  alt=""
                  style={{ width: 46, height: 46, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentSong.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {currentSong.channel}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Nothing playing</div>
            )}
          </div>

          {/* Controls + seekbar */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Shuffle */}
              <button
                onClick={() => setShuffle(p => !p)}
                style={{ color: shuffle ? 'var(--accent)' : 'var(--muted)', padding: 4, transition: 'color 0.2s' }}
              >
                <Icon d={ICONS.shuffle} size={15} />
              </button>

              {/* Prev */}
              <button onClick={playPrev} style={{ color: 'var(--muted)', padding: 4 }}>
                <Icon d={ICONS.prev} size={18} />
              </button>

              {/* Play/Pause */}
              <button
                onClick={() => currentSong && setIsPlaying(p => !p)}
                style={{
                  width: 42, height: 42,
                  borderRadius: '50%',
                  background: currentSong ? 'var(--accent)' : 'var(--bg3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--bg)',
                  transition: 'background 0.2s, transform 0.1s',
                  transform: 'scale(1)',
                }}
                onMouseEnter={e => { if (currentSong) e.currentTarget.style.transform = 'scale(1.07)'; }}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {isPlaying
                  ? <Icon {...ICONS.pause} size={16} />
                  : <Icon {...ICONS.play} size={16} />}
              </button>

              {/* Next */}
              <button onClick={playNext} style={{ color: 'var(--muted)', padding: 4 }}>
                <Icon d={ICONS.next} size={18} />
              </button>

              {/* Repeat */}
              <button
                onClick={() => setRepeat(p => !p)}
                style={{ color: repeat ? 'var(--accent)' : 'var(--muted)', padding: 4, transition: 'color 0.2s' }}
              >
                <Icon d={ICONS.repeat} size={15} />
              </button>
            </div>

            {/* Seek bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 460 }}>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', width: 32, textAlign: 'right', flexShrink: 0 }}>
                {fmt(progress)}
              </span>
              <div
                onClick={seekTo}
                style={{
                  flex: 1, height: 3, background: 'var(--bg3)',
                  borderRadius: 99, cursor: 'pointer', position: 'relative',
                }}
              >
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${duration ? (progress / duration) * 100 : 0}%`,
                  background: 'var(--accent)', borderRadius: 99, transition: 'width 0.5s linear',
                }} />
              </div>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', width: 32, flexShrink: 0 }}>
                {fmt(duration)}
              </span>
            </div>
          </div>

          {/* Volume */}
          <div style={{ width: 160, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', flexShrink: 0 }}>
            <button
              onClick={() => setMuted(p => !p)}
              style={{ color: 'var(--muted)', padding: 4, flexShrink: 0 }}
            >
              <Icon d={muted ? ICONS.mute : ICONS.vol} size={16} />
            </button>
            <input
              type="range"
              min={0} max={1} step={0.01}
              value={muted ? 0 : volume}
              onChange={e => { setVolume(+e.target.value); setMuted(false); }}
              style={{ width: 80, accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
