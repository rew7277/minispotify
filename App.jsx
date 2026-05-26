import React, { useState, useEffect, useRef } from 'react';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20, color = 'currentColor', fill = 'none', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);
const ICONS = {
  search:   'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  download: ['M12 3v13', 'M5 16l7 7 7-7', 'M3 21h18'],
  play:     { d: 'M5 3l14 9-14 9V3z',              fill: 'currentColor', stroke: 'none' },
  pause:    { d: 'M6 4h4v16H6zM14 4h4v16h-4z',    fill: 'currentColor', stroke: 'none' },
  prev:     ['M19 20L9 12l10-8v16z', 'M5 19V5'],
  next:     ['M5 4l10 8-10 8V4z',   'M19 5v14'],
  vol:      ['M11 5L6 9H2v6h4l5 4V5z', 'M15.54 8.46a5 5 0 0 1 0 7.07'],
  mute:     ['M11 5L6 9H2v6h4l5 4V5z', 'M23 9l-6 6', 'M17 9l6 6'],
  trash:    ['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6'],
  music:    ['M9 18V5l12-2v13', 'M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
  x:        ['M18 6L6 18', 'M6 6l12 12'],
  repeat:   ['M17 1l4 4-4 4', 'M3 11V9a4 4 0 0 1 4-4h14', 'M7 23l-4-4 4-4', 'M21 13v2a4 4 0 0 1-4 4H3'],
  shuffle:  ['M16 3h5v5', 'M4 20L21 3', 'M21 16v5h-5', 'M15 15l6 6', 'M4 4l5 5'],
  settings: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'],
  check:    'M20 6L9 17l-5-5',
  cookie:   ['M12 2a10 10 0 1 0 10 10', 'M12 2a10 10 0 0 1 10 10', 'M8.5 8.5v.01', 'M16 15.5v.01', 'M12 12v.01'],
  alert:    ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01'],
  waveform: 'M2 12h2M6 8v8M10 5v14M14 9v6M18 7v10M22 12h-2',
  upload:   ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v13'],
};

function fmt(s) {
  if (!s) return '--:--';
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function Spinner({ size = 18 }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      border: '2px solid var(--border)', borderTopColor: 'var(--accent)',
      borderRadius: '50%', animation: 'spin 0.7s linear infinite',
    }} />
  );
}

function EQBars({ active }) {
  return (
    <span style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 16 }}>
      {[1, 1.6, 0.7, 1.3].map((h, i) => (
        <span key={i} style={{
          width: 3, height: `${h * 100}%`, background: 'var(--accent)',
          borderRadius: 2, transformOrigin: 'bottom',
          animation: active ? `bars ${0.6 + i * 0.15}s ease-in-out infinite alternate` : 'none',
          transform: active ? undefined : 'scaleY(0.35)', transition: 'transform 0.3s',
        }} />
      ))}
    </span>
  );
}

// ─── Settings Modal ───────────────────────────────────────────────────────────
function SettingsModal({ onClose }) {
  const [hasCookies, setHasCookies] = useState(null);
  const [cookieText, setCookieText] = useState('');
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState('');
  const fileRef = useRef();

  useEffect(() => {
    fetch('/api/cookies/status').then(r => r.json()).then(d => setHasCookies(d.hasCookies));
  }, []);

  async function saveCookies() {
    if (!cookieText.trim()) return;
    setSaving(true); setMsg('');
    try {
      const r = await fetch('/api/cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: cookieText }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMsg('✅ ' + d.message);
      setHasCookies(true);
      setCookieText('');
    } catch (e) {
      setMsg('❌ ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeCookies() {
    await fetch('/api/cookies', { method: 'DELETE' });
    setHasCookies(false);
    setMsg('Cookies removed.');
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCookieText(ev.target.result);
    reader.readAsText(file);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16,
        width: 520, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto', padding: 28,
        animation: 'fadeUp 0.2s ease',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon d={ICONS.settings} size={20} color="var(--accent)" />
            <span style={{ fontWeight: 700, fontSize: 16 }}>Settings</span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--muted)', padding: 4 }}>
            <Icon d={ICONS.x} size={18} />
          </button>
        </div>

        {/* Cookie status badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          borderRadius: 10, marginBottom: 20,
          background: hasCookies ? 'rgba(76,175,80,0.1)' : 'rgba(232,84,84,0.1)',
          border: `1px solid ${hasCookies ? 'rgba(76,175,80,0.3)' : 'rgba(232,84,84,0.3)'}`,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: hasCookies ? '#4caf50' : '#e85454',
            animation: hasCookies ? 'none' : 'pulse 1.5s ease-in-out infinite',
          }} />
          <div style={{ fontSize: 13 }}>
            {hasCookies === null ? 'Checking...' : hasCookies
              ? 'YouTube cookies are active — downloads should work.'
              : 'No cookies set — Railway\'s IP may be blocked by YouTube.'}
          </div>
        </div>

        {/* Why needed */}
        <div style={{
          background: 'var(--bg3)', borderRadius: 10, padding: '12px 14px',
          fontSize: 12, lineHeight: 1.7, color: 'var(--muted)', marginBottom: 20,
          border: '1px solid var(--border)',
        }}>
          <strong style={{ color: 'var(--text)', display: 'block', marginBottom: 4 }}>
            ⚠ Why is this needed?
          </strong>
          YouTube detects cloud server IPs (Railway, AWS, etc.) and blocks downloads with a <strong style={{ color: 'var(--text)' }}>429 Too Many Requests</strong> or bot error.
          Providing your browser cookies lets yt-dlp authenticate as your account and bypass this block.
          <br /><br />
          <strong style={{ color: 'var(--text)' }}>How to get your cookies:</strong><br />
          1. Install <em>Get cookies.txt LOCALLY</em> extension in Chrome/Firefox<br />
          2. Visit <a href="https://youtube.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>youtube.com</a> while logged in<br />
          3. Click the extension → Export → <code style={{ background: 'var(--bg)', padding: '1px 5px', borderRadius: 4 }}>youtube.com</code> → Copy or Save<br />
          4. Paste the content below
        </div>

        {/* Upload buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button
            onClick={() => fileRef.current.click()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: 'var(--bg3)', border: '1px solid var(--border)',
              color: 'var(--text)', transition: 'border-color 0.2s',
            }}
          >
            <Icon d={ICONS.upload} size={14} />
            Upload cookies.txt file
          </button>
          <input ref={fileRef} type="file" accept=".txt" style={{ display: 'none' }} onChange={handleFileUpload} />
        </div>

        {/* Textarea */}
        <textarea
          value={cookieText}
          onChange={e => setCookieText(e.target.value)}
          placeholder="# Netscape HTTP Cookie File&#10;.youtube.com TRUE / FALSE ... (paste your cookies.txt content here)"
          style={{
            width: '100%', height: 130, padding: '10px 12px',
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text)',
            fontSize: 11, fontFamily: 'var(--font-mono)',
            resize: 'vertical', outline: 'none', lineHeight: 1.5,
          }}
        />

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <button
            onClick={saveCookies}
            disabled={!cookieText.trim() || saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: cookieText.trim() ? 'var(--accent)' : 'var(--bg3)',
              color: cookieText.trim() ? 'var(--bg)' : 'var(--muted)',
              transition: 'background 0.2s', cursor: cookieText.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {saving ? <Spinner size={14} /> : <Icon d={ICONS.check} size={14} color="inherit" />}
            Save Cookies
          </button>

          {hasCookies && (
            <button
              onClick={removeCookies}
              style={{
                padding: '9px 14px', borderRadius: 8, fontSize: 13,
                color: 'var(--danger)', background: 'rgba(232,84,84,0.1)',
                border: '1px solid rgba(232,84,84,0.2)',
              }}
            >
              Remove
            </button>
          )}

          {msg && (
            <span style={{ fontSize: 12, color: msg.startsWith('✅') ? '#4caf50' : 'var(--danger)', flex: 1, textAlign: 'right' }}>
              {msg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────
function ResultCard({ song, onDownload, downloading, isInLibrary }) {
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '10px 12px', borderRadius: 10,
      background: 'var(--bg3)', border: '1px solid var(--border)',
      alignItems: 'center', animation: 'fadeUp 0.3s ease both',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#333'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <img src={song.thumbnail} alt="" style={{ width: 52, height: 52, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }}
        onError={e => { e.target.src = `https://i.ytimg.com/vi/${song.id}/mqdefault.jpg`; }} />
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
        style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isInLibrary ? '#1a2a1a' : downloading ? 'var(--bg2)' : 'var(--accent)',
          color: isInLibrary ? '#4caf50' : 'var(--bg)',
          transition: 'background 0.2s, transform 0.1s',
        }}
        onMouseEnter={e => { if (!isInLibrary && !downloading) e.currentTarget.style.transform = 'scale(1.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {downloading ? <Spinner size={14} />
          : isInLibrary ? <Icon d={ICONS.check} size={15} color="#4caf50" />
          : <Icon d={ICONS.download} size={15} color="var(--bg)" />}
      </button>
    </div>
  );
}

// ─── Library Row ──────────────────────────────────────────────────────────────
function LibraryRow({ song, isPlaying, isActive, onPlay, onDelete }) {
  return (
    <div onClick={onPlay} style={{
      display: 'flex', gap: 10, padding: '8px 10px', borderRadius: 8,
      alignItems: 'center', cursor: 'pointer',
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
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EQBars active={isPlaying} />
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{
          fontSize: 12, fontWeight: isActive ? 600 : 400,
          color: isActive ? 'var(--accent)' : 'var(--text)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{song.title}</div>
        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
          {fmt(song.duration)}
        </div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDelete(song.id); }}
        style={{ padding: 4, color: 'var(--muted)', borderRadius: 4, transition: 'color 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; }}
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
  const [searchErr, setSearchErr]   = useState(null);   // { message, needsCookies }

  const [library, setLibrary]       = useState([]);
  const [downloading, setDownloading] = useState({});

  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [progress, setProgress]     = useState(0);
  const [duration, setDuration]     = useState(0);
  const [volume, setVolume]         = useState(0.85);
  const [muted, setMuted]           = useState(false);
  const [shuffle, setShuffle]       = useState(false);
  const [repeat, setRepeat]         = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [hasCookies, setHasCookies]     = useState(false);

  const audioRef   = useRef(null);
  const searchTimer = useRef(null);

  useEffect(() => {
    fetchLibrary();
    fetch('/api/cookies/status').then(r => r.json()).then(d => setHasCookies(d.hasCookies));
  }, []);

  async function fetchLibrary() {
    try {
      const r = await fetch('/api/songs');
      if (r.ok) setLibrary(await r.json());
    } catch {}
  }

  useEffect(() => {
    if (!query.trim()) { setResults([]); setSearchErr(null); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(query), 500);
    return () => clearTimeout(searchTimer.current);
  }, [query]);

  async function doSearch(q) {
    setSearching(true); setSearchErr(null);
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await r.json();
      if (!r.ok) throw data;
      setResults(data);
    } catch (e) {
      setSearchErr(e);
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
        body: JSON.stringify({ videoId: song.id, title: song.title, thumbnail: song.thumbnail, channel: song.channel, duration: song.duration }),
      });
      const data = await r.json();
      if (!r.ok) throw data;
      await fetchLibrary();
      playSong(data.song);
    } catch (e) {
      if (e.needsCookies) {
        setSearchErr(e);
        setShowSettings(true);
      } else {
        alert('Download failed: ' + (e.error || 'Unknown error'));
      }
    } finally {
      setDownloading(p => { const n = { ...p }; delete n[song.id]; return n; });
    }
  }

  function playSong(song) { setCurrentSong(song); setIsPlaying(true); setProgress(0); }

  async function deleteSong(id) {
    await fetch(`/api/songs/${id}`, { method: 'DELETE' });
    if (currentSong?.id === id) { setCurrentSong(null); setIsPlaying(false); }
    await fetchLibrary();
  }

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !currentSong) return;
    a.src = `/api/stream/${currentSong.id}`;
    a.volume = muted ? 0 : volume;
    a.play().catch(() => setIsPlaying(false));
  }, [currentSong]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) a.play().catch(() => setIsPlaying(false));
    else a.pause();
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  function handleEnded() {
    if (repeat) { audioRef.current.currentTime = 0; audioRef.current.play(); return; }
    playNext();
  }

  function playNext() {
    if (!currentSong || !library.length) return;
    const idx = library.findIndex(s => s.id === currentSong.id);
    const next = shuffle ? library[Math.floor(Math.random() * library.length)] : library[(idx + 1) % library.length];
    if (next) playSong(next);
  }

  function playPrev() {
    if (!currentSong || !library.length) return;
    const idx = library.findIndex(s => s.id === currentSong.id);
    playSong(library[(idx - 1 + library.length) % library.length]);
  }

  function seekTo(e) {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  }

  const libraryIds = new Set(library.map(s => s.videoId));

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <audio
        ref={audioRef}
        onTimeUpdate={() => { const a = audioRef.current; if (a) { setProgress(a.currentTime); setDuration(a.duration || 0); } }}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {showSettings && (
        <SettingsModal onClose={() => {
          setShowSettings(false);
          fetch('/api/cookies/status').then(r => r.json()).then(d => setHasCookies(d.hasCookies));
        }} />
      )}

      {/* ── Sidebar ── */}
      <aside style={{
        width: 'var(--sidebar-w)', background: 'var(--bg2)',
        borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        {/* Logo + Settings */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={ICONS.waveform} size={18} color="var(--bg)" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>Wavvve</span>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            title="Settings / Cookies"
            style={{ position: 'relative', padding: 6, color: hasCookies ? 'var(--muted)' : 'var(--danger)', borderRadius: 8, transition: 'color 0.2s, background 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = hasCookies ? 'var(--muted)' : 'var(--danger)'; }}
          >
            <Icon d={ICONS.settings} size={17} />
            {!hasCookies && (
              <span style={{
                position: 'absolute', top: 3, right: 3, width: 7, height: 7,
                borderRadius: '50%', background: 'var(--danger)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            )}
          </button>
        </div>

        {/* Library label */}
        <div style={{ padding: '14px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>Library</span>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', background: 'var(--bg3)', color: 'var(--muted)', padding: '2px 7px', borderRadius: 99 }}>
            {library.length}
          </span>
        </div>

        {/* Song list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 10px' }}>
          {library.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--muted)' }}>
              <Icon d={ICONS.music} size={28} color="var(--border)" />
              <div style={{ marginTop: 10, fontSize: 12 }}>Search &amp; download<br />songs to fill your library</div>
            </div>
          ) : library.map(song => (
            <LibraryRow
              key={song.id} song={song}
              isActive={currentSong?.id === song.id}
              isPlaying={isPlaying && currentSong?.id === song.id}
              onPlay={() => playSong(song)}
              onDelete={deleteSong}
            />
          ))}
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>

        {/* Search bar */}
        <div style={{ padding: '22px 28px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '10px 16px', transition: 'border-color 0.2s',
          }}
            onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            {searching ? <Spinner size={18} /> : <Icon d={ICONS.search} size={18} color="var(--muted)" />}
            <input
              type="text" placeholder="Search songs, artists, albums..."
              value={query} onChange={e => setQuery(e.target.value)}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 14, fontWeight: 500 }}
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]); setSearchErr(null); }} style={{ color: 'var(--muted)' }}>
                <Icon d={ICONS.x} size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px' }}>

          {/* Error banner */}
          {searchErr && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
              borderRadius: 10, marginBottom: 14,
              background: searchErr.needsCookies ? 'rgba(232,160,69,0.08)' : 'rgba(232,84,84,0.08)',
              border: `1px solid ${searchErr.needsCookies ? 'rgba(232,160,69,0.3)' : 'rgba(232,84,84,0.3)'}`,
            }}>
              <Icon d={ICONS.alert} size={16} color={searchErr.needsCookies ? 'var(--accent)' : 'var(--danger)'} />
              <div style={{ flex: 1, fontSize: 13 }}>
                {searchErr.error || searchErr.message}
                {searchErr.needsCookies && (
                  <button
                    onClick={() => setShowSettings(true)}
                    style={{ marginLeft: 8, color: 'var(--accent)', fontWeight: 700, fontSize: 12, textDecoration: 'underline' }}
                  >
                    Open Settings ⚙
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Cookie warning (persistent if no cookies) */}
          {!hasCookies && !searchErr && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              borderRadius: 10, marginBottom: 14,
              background: 'rgba(232,160,69,0.06)', border: '1px solid rgba(232,160,69,0.2)',
              fontSize: 12, color: 'var(--muted)',
            }}>
              <Icon d={ICONS.alert} size={14} color="var(--accent)" />
              <span>Downloads may fail on Railway without cookies.</span>
              <button onClick={() => setShowSettings(true)} style={{ color: 'var(--accent)', fontWeight: 700, marginLeft: 'auto', fontSize: 12 }}>
                Setup ⚙
              </button>
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
                    key={song.id} song={song}
                    onDownload={handleDownload}
                    downloading={!!downloading[song.id]}
                    isInLibrary={libraryIds.has(song.id)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Empty state */}
          {!query && !results.length && (
            <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--muted)' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🎵</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)', marginBottom: 6 }}>Find your music</div>
              <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                Search any song, artist, or album above.<br />
                Click ⬇ to download &amp; save it to your library.
              </div>
              {library.length > 0 && (
                <div style={{ marginTop: 16, fontSize: 12, color: 'var(--accent)' }}>
                  {library.length} song{library.length > 1 ? 's' : ''} in your library →
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Player Bar ── */}
        <div style={{
          height: 'var(--player-h)', background: 'var(--bg2)',
          borderTop: '1px solid var(--border)', display: 'flex',
          alignItems: 'center', padding: '0 24px', gap: 24, flexShrink: 0,
        }}>
          {/* Song info */}
          <div style={{ width: 220, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {currentSong ? (
              <>
                <img src={currentSong.thumbnail} alt="" style={{ width: 46, height: 46, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentSong.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{currentSong.channel}</div>
                </div>
              </>
            ) : <div style={{ color: 'var(--muted)', fontSize: 13 }}>Nothing playing</div>}
          </div>

          {/* Controls + seekbar */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button onClick={() => setShuffle(p => !p)} style={{ color: shuffle ? 'var(--accent)' : 'var(--muted)', padding: 4 }}>
                <Icon d={ICONS.shuffle} size={15} />
              </button>
              <button onClick={playPrev} style={{ color: 'var(--muted)', padding: 4 }}>
                <Icon d={ICONS.prev} size={18} />
              </button>
              <button
                onClick={() => currentSong && setIsPlaying(p => !p)}
                style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: currentSong ? 'var(--accent)' : 'var(--bg3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--bg)', transition: 'background 0.2s, transform 0.1s',
                }}
                onMouseEnter={e => { if (currentSong) e.currentTarget.style.transform = 'scale(1.07)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {isPlaying ? <Icon {...ICONS.pause} size={16} /> : <Icon {...ICONS.play} size={16} />}
              </button>
              <button onClick={playNext} style={{ color: 'var(--muted)', padding: 4 }}>
                <Icon d={ICONS.next} size={18} />
              </button>
              <button onClick={() => setRepeat(p => !p)} style={{ color: repeat ? 'var(--accent)' : 'var(--muted)', padding: 4 }}>
                <Icon d={ICONS.repeat} size={15} />
              </button>
            </div>
            {/* Seek */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 460 }}>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', width: 32, textAlign: 'right', flexShrink: 0 }}>{fmt(progress)}</span>
              <div onClick={seekTo} style={{ flex: 1, height: 3, background: 'var(--bg3)', borderRadius: 99, cursor: 'pointer', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${duration ? (progress / duration) * 100 : 0}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width 0.5s linear' }} />
              </div>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', width: 32, flexShrink: 0 }}>{fmt(duration)}</span>
            </div>
          </div>

          {/* Volume */}
          <div style={{ width: 160, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', flexShrink: 0 }}>
            <button onClick={() => setMuted(p => !p)} style={{ color: 'var(--muted)', padding: 4 }}>
              <Icon d={muted ? ICONS.mute : ICONS.vol} size={16} />
            </button>
            <input type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume}
              onChange={e => { setVolume(+e.target.value); setMuted(false); }}
              style={{ width: 80, accentColor: 'var(--accent)', cursor: 'pointer' }} />
          </div>
        </div>
      </main>
    </div>
  );
}
