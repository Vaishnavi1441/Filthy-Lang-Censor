import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload, Shield, Mic, Settings, ChevronDown, X,
  Play, Pause, Volume2, AlertTriangle, CheckCircle2,
  Clock, Zap, FileAudio, BarChart3, Filter, Globe,
  Sliders, Plus, Trash2, Download, RefreshCw, Eye
} from "lucide-react";

// ─── Google Font import via style injection ───────────────────────────────────
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:wght@300;400;500&display=swap');

    * { box-sizing: border-box; }
    body { margin: 0; }

    :root {
      --bg-deep:     #0c0e14;
      --bg-base:     #10131c;
      --bg-surface:  #161924;
      --bg-raised:   #1d2130;
      --bg-hover:    #242840;
      --border:      rgba(255,255,255,0.06);
      --border-md:   rgba(255,255,255,0.10);
      --border-hi:   rgba(255,255,255,0.16);
      --accent:      #6c8eff;
      --accent-dim:  rgba(108,142,255,0.15);
      --accent-glow: rgba(108,142,255,0.35);
      --success:     #34d399;
      --warn:        #fb923c;
      --danger:      #f87171;
      --txt-hi:      #f0f2ff;
      --txt-md:      #a1a7c4; 
      --txt-lo:      #646a87; 
      font-family: 'DM Sans', sans-serif;
    }

    .mono { font-family: 'DM Mono', monospace; }

    .app {
      min-height: 100vh;
      background: var(--bg-deep);
      color: var(--txt-hi);
    }

    /* Glass panel */
    .glass {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      backdrop-filter: blur(20px);
    }
    .glass-raised {
      background: var(--bg-raised);
      border: 1px solid var(--border-md);
    }

    /* Upload Card Hover Effects */
    .upload-card {
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .upload-card:hover {
      transform: translateY(-4px) scale(1.01);
      border-color: var(--accent);
      box-shadow: 0 10px 30px rgba(108, 142, 255, 0.1);
    }

    /* Animations */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; } to { opacity: 1; }
    }
    @keyframes pulse-ring {
      0%   { box-shadow: 0 0 0 0 var(--accent-glow); }
      70%  { box-shadow: 0 0 0 14px transparent; }
      100% { box-shadow: 0 0 0 0 transparent; }
    }
    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes waveform {
      0%, 100% { height: 8px; }
      50%       { height: 28px; }
    }
    @keyframes progressFill {
      from { width: 0%; }
      to   { width: var(--target-w, 100%); }
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-10px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    .anim-fadeUp  { animation: fadeUp  0.45s cubic-bezier(.22,.68,0,1.2) both; }
    .anim-fadeIn  { animation: fadeIn  0.3s ease both; }

    .delay-1 { animation-delay: 0.05s; }
    .delay-2 { animation-delay: 0.10s; }
    .delay-3 { animation-delay: 0.15s; }
    .delay-4 { animation-delay: 0.20s; }

    /* Buttons */
    .btn {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 9px 18px; border-radius: 8px; border: none;
      font-family: inherit; font-size: 13.5px; font-weight: 500;
      cursor: pointer; transition: all 0.18s ease;
    }
    .btn:hover { transform: scale(1.025); }
    .btn:active { transform: scale(0.98); }
    .btn-primary {
      background: var(--accent); color: #fff;
      box-shadow: 0 0 24px var(--accent-glow);
    }
    .btn-primary:hover { box-shadow: 0 0 36px var(--accent-glow); }
    .btn-ghost {
      background: transparent;
      border: 1px solid var(--border-md);
      color: var(--txt-md);
    }
    .btn-ghost:hover { border-color: var(--border-hi); color: var(--txt-hi); background: var(--bg-hover); }
    .btn-danger { background: rgba(248,113,113,0.15); color: var(--danger); border: 1px solid rgba(248,113,113,0.25); }
    .btn-danger:hover { background: rgba(248,113,113,0.25); }

    /* Tag / badge */
    .badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 9px; border-radius: 99px;
      font-size: 11px; font-weight: 500;
    }
    .badge-accent { background: var(--accent-dim); color: var(--accent); border: 1px solid rgba(108,142,255,0.25); }
    .badge-warn   { background: rgba(251,146,60,0.12); color: var(--warn); border: 1px solid rgba(251,146,60,0.25); }
    .badge-danger { background: rgba(248,113,113,0.12); color: var(--danger); border: 1px solid rgba(248,113,113,0.25); }
    .badge-ok     { background: rgba(52,211,153,0.12); color: var(--success); border: 1px solid rgba(52,211,153,0.25); }

    /* Waveform bars */
    .wave-bar {
      width: 3px; border-radius: 2px;
      background: var(--accent);
      animation: waveform 0.9s ease-in-out infinite;
    }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--bg-hover); border-radius: 4px; }

    /* Drag overlay */
    .drop-active { border-color: var(--accent) !important; box-shadow: inset 0 0 60px var(--accent-dim); }

    /* Toggle switch */
    .toggle { position: relative; display: inline-block; width: 40px; height: 22px; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .toggle-slider {
      position: absolute; inset: 0;
      background: var(--bg-hover); border-radius: 22px;
      transition: 0.2s; cursor: pointer;
      border: 1px solid var(--border-md);
    }
    .toggle-slider:before {
      content: ''; position: absolute;
      width: 16px; height: 16px; left: 3px; bottom: 2px;
      background: var(--txt-md); border-radius: 50%; transition: 0.2s;
    }
    .toggle input:checked + .toggle-slider { background: var(--accent-dim); border-color: var(--accent); }
    .toggle input:checked + .toggle-slider:before { transform: translateX(17px); background: var(--accent); }

    /* Slider */
    .range-input {
      -webkit-appearance: none; width: 100%; height: 4px;
      background: var(--bg-hover); border-radius: 4px; outline: none;
    }
    .range-input::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px; height: 14px; border-radius: 50%;
      background: var(--accent); cursor: pointer;
      box-shadow: 0 0 8px var(--accent-glow);
    }

    /* Flagged item row */
    .flagged-row {
      animation: slideIn 0.3s ease both;
    }
    .flagged-row:hover .row-actions { opacity: 1; }
    .row-actions { opacity: 0; transition: opacity 0.15s; }
  `}</style>
);

// ─── Waveform visualization ───────────────────────────────────────────────────
const WaveformViz = ({ active = false, count = 24 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 3, height: 36 }}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="wave-bar"
        style={{
          height: active ? undefined : `${4 + Math.sin(i * 0.7) * 8 + Math.random() * 6}px`,
          animationDelay: `${i * 0.05}s`,
          animationPlayState: active ? "running" : "paused",
          opacity: active ? 1 : 0.35,
        }}
      />
    ))}
  </div>
);

// ─── Animated progress bar ────────────────────────────────────────────────────
const ProgressBar = ({ value, label, color = "var(--accent)" }) => (
  <div style={{ width: "100%" }}>
    {label && (
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "var(--txt-md)" }}>{label}</span>
        <span className="mono" style={{ fontSize: 11, color: "var(--accent)" }}>{value}%</span>
      </div>
    )}
    <div style={{ height: 4, background: "var(--bg-hover)", borderRadius: 4, overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${value}%`,
          background: color,
          borderRadius: 4,
          boxShadow: `0 0 10px ${color}88`,
          transition: "width 0.4s cubic-bezier(.4,0,.2,1)",
        }}
      />
    </div>
  </div>
);

// ─── Settings sidebar ─────────────────────────────────────────────────────────
const SettingsSidebar = ({ config, onChange }) => {
  const [blockedInput, setBlockedInput] = useState("");
  const [allowedInput, setAllowedInput] = useState("");

  const addWord = (list, word) => {
    if (!word.trim()) return;
    onChange({ ...config, [list]: [...config[list], word.trim().toLowerCase()] });
    list === "blocked" ? setBlockedInput("") : setAllowedInput("");
  };
  const removeWord = (list, idx) =>
    onChange({ ...config, [list]: config[list].filter((_, i) => i !== idx) });

  return (
    <aside
      style={{
        width: 280, flexShrink: 0,
        display: "flex", flexDirection: "column", gap: 16,
      }}
    >
      {/* Header */}
      <div style={{ padding: "22px 22px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <Settings size={14} color="var(--accent)" />
          <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Analysis Config
          </span>
        </div>
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Language */}
        <div className="glass" style={{ borderRadius: 10, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <Globe size={13} color="var(--txt-md)" />
            <span style={{ fontSize: 12, color: "var(--txt-md)", fontWeight: 500 }}>Language</span>
          </div>
          <select
            value={config.language}
            onChange={e => onChange({ ...config, language: e.target.value })}
            style={{
              width: "100%", padding: "8px 10px", borderRadius: 7,
              background: "var(--bg-hover)", border: "1px solid var(--border-md)",
              color: "var(--txt-hi)", fontSize: 13, fontFamily: "inherit", cursor: "pointer",
            }}
          >
            {["English","Spanish","French","German","Japanese","Portugese"].map(l => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Sensitivity */}
        <div className="glass" style={{ borderRadius: 10, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
            <Sliders size={13} color="var(--txt-md)" />
            <span style={{ fontSize: 12, color: "var(--txt-md)", fontWeight: 500 }}>Sensitivity</span>
            <span className="badge badge-accent" style={{ marginLeft: "auto" }}>
              {["Low", "Medium", "High", "Strict"][config.sensitivity]}
            </span>
          </div>
          <input
            type="range" min={0} max={3} step={1}
            value={config.sensitivity}
            onChange={e => onChange({ ...config, sensitivity: +e.target.value })}
            className="range-input"
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            {["Low", "Med", "High", "Strict"].map((l, i) => (
              <span key={l} style={{ fontSize: 10, color: i === config.sensitivity ? "var(--accent)" : "var(--txt-lo)" }}>{l}</span>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="glass" style={{ borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { key: "bleepAudio", label: "Auto-bleep audio" },
            { key: "exportReport", label: "Export report" },
            { key: "detectContext", label: "Context detection" },
          ].map(({ key, label }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "var(--txt-md)" }}>{label}</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={config[key]}
                  onChange={e => onChange({ ...config, [key]: e.target.checked })}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          ))}
        </div>

        {/* Blocked words */}
        <div className="glass" style={{ borderRadius: 10, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <AlertTriangle size={13} color="var(--warn)" />
            <span style={{ fontSize: 12, color: "var(--txt-md)", fontWeight: 500 }}>Blocked Words</span>
            <span className="badge badge-warn" style={{ marginLeft: "auto" }}>{config.blocked.length}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
            {config.blocked.map((w, i) => (
              <span key={i} className="badge badge-danger" style={{ cursor: "pointer" }} onClick={() => removeWord("blocked", i)}>
                {w} <X size={9} />
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={blockedInput}
              onChange={e => setBlockedInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addWord("blocked", blockedInput)}
              placeholder="Add word…"
              style={{
                flex: 1, padding: "7px 9px", borderRadius: 6, fontSize: 12,
                background: "var(--bg-hover)", border: "1px solid var(--border-md)",
                color: "var(--txt-hi)", fontFamily: "inherit",
              }}
            />
            <button className="btn btn-ghost" style={{ padding: "7px 10px" }} onClick={() => addWord("blocked", blockedInput)}>
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* Allowed words */}
        <div className="glass" style={{ borderRadius: 10, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <CheckCircle2 size={13} color="var(--success)" />
            <span style={{ fontSize: 12, color: "var(--txt-md)", fontWeight: 500 }}>Allowed Words</span>
            <span className="badge badge-ok" style={{ marginLeft: "auto" }}>{config.allowed.length}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
            {config.allowed.map((w, i) => (
              <span key={i} className="badge badge-ok" style={{ cursor: "pointer" }} onClick={() => removeWord("allowed", i)}>
                {w} <X size={9} />
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={allowedInput}
              onChange={e => setAllowedInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addWord("allowed", allowedInput)}
              placeholder="Add word…"
              style={{
                flex: 1, padding: "7px 9px", borderRadius: 6, fontSize: 12,
                background: "var(--bg-hover)", border: "1px solid var(--border-md)",
                color: "var(--txt-hi)", fontFamily: "inherit",
              }}
            />
            <button className="btn btn-ghost" style={{ padding: "7px 10px" }} onClick={() => addWord("allowed", allowedInput)}>
              <Plus size={13} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

// ─── Upload zone ──────────────────────────────────────────────────────────────
const UploadZone = ({ onFile }) => {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();

  const handle = file => {
    if (file && file.type.startsWith("audio")) onFile(file);
  };

  return (
    <div className="anim-fadeUp" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div
        className={`glass upload-card ${drag ? "drop-active" : ""}`}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
        onClick={() => inputRef.current.click()}
        style={{
          width: "100%", maxWidth: 520, padding: "64px 48px",
          borderRadius: 20, cursor: "pointer",
          border: "1.5px dashed var(--border-hi)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Subtle radial glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 40%, rgba(108,142,255,0.07) 0%, transparent 70%)",
        }} />

        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: "var(--accent-dim)",
          border: "1px solid rgba(108,142,255,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "pulse-ring 2.5s ease infinite",
        }}>
          <FileAudio size={28} color="var(--accent)" />
        </div>

        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--txt-hi)", letterSpacing: "-0.02em" }}>
            Drop your audio file here
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--txt-md)", lineHeight: 1.5 }}>
            or click to browse - MP3, WAV, FLAC, M4A, OGG
          </p>
        </div>

        <WaveformViz active={drag} count={28} />

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          {["Up to 2GB", "All formats", "< 30s analysis"].map(t => (
            <span key={t} className="badge badge-accent">{t}</span>
          ))}
        </div>

        <input ref={inputRef} type="file" accept="audio/*" style={{ display: "none" }}
          onChange={e => handle(e.target.files[0])} />
      </div>
    </div>
  );
};

// ─── Processing view (with error) ─────────────────────────────────────────────
const ProcessingView = ({ file, progress, stage, error }) => {
  const stages = [
    { id: "transcribe", label: "Transcribing audio", icon: Mic },
    { id: "detect",     label: "Detecting violations", icon: Shield },
    { id: "analyze",    label: "Context analysis", icon: BarChart3 },
    { id: "compile",    label: "Compiling report", icon: Filter },
  ];
  const currentIdx = stages.findIndex(s => s.id === stage);

  return (
    <div className="anim-fadeUp" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      {error ? (
        <div className="glass" style={{ borderRadius: 14, padding: 24, maxWidth: 480, textAlign: "center" }}>
          <AlertTriangle size={32} color="var(--danger)" style={{ marginBottom: 12 }} />
          <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600, color: "var(--txt-hi)" }}>Processing failed</p>
          <p style={{ margin: 0, fontSize: 13, color: "var(--txt-md)", lineHeight: 1.6 }}>{error}</p>
        </div>
      ) : (
      <div style={{ width: "100%", maxWidth: 500, display: "flex", flexDirection: "column", gap: 28 }}>

        {/* File card */}
        <div className="glass" style={{ borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileAudio size={20} color="var(--accent)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--txt-hi)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {file.name}
            </p>
            <p className="mono" style={{ margin: "2px 0 0", fontSize: 11, color: "var(--txt-md)" }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <WaveformViz active count={12} />
        </div>

        {/* Overall progress */}
        <div className="glass" style={{ borderRadius: 14, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--txt-md)" }}>Analyzing…</span>
            <span className="mono" style={{ fontSize: 22, fontWeight: 600, color: "var(--accent)", letterSpacing: "-0.03em" }}>
              {progress}%
            </span>
          </div>
          <ProgressBar value={progress} />
        </div>

        {/* Stage list */}
        <div className="glass" style={{ borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {stages.map((s, i) => {
            const done    = i < currentIdx;
            const active  = i === currentIdx;
            const Icon    = s.icon;
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, opacity: i > currentIdx ? 0.35 : 1, transition: "opacity 0.3s" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: done ? "rgba(52,211,153,0.15)" : active ? "var(--accent-dim)" : "var(--bg-hover)",
                  border: `1px solid ${done ? "rgba(52,211,153,0.3)" : active ? "rgba(108,142,255,0.35)" : "var(--border)"}`,
                  transition: "all 0.3s",
                }}>
                  {done
                    ? <CheckCircle2 size={15} color="var(--success)" />
                    : active
                      ? <div style={{ width: 14, height: 14, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      : <Icon size={15} color="var(--txt-lo)" />
                  }
                </div>
                <span style={{ fontSize: 13.5, color: active ? "var(--txt-hi)" : done ? "var(--txt-md)" : "var(--txt-lo)", fontWeight: active ? 500 : 400 }}>
                  {s.label}
                </span>
                {done && <span className="badge badge-ok" style={{ marginLeft: "auto" }}>Done</span>}
                {active && <span className="badge badge-accent" style={{ marginLeft: "auto" }}>Running</span>}
              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
};

// ─── Results dashboard ────────────────────────────────────────────────────────
const ResultsView = ({ file, results, moderatedAudioUrl, onReset, onDownload }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("flagged");
  const audioRef = useRef(null);

  const totalFlags = results.flagged.length;
  const categories = [...new Set(results.flagged.map(f => f.category))];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress(Math.round((audio.currentTime / audio.duration) * 100));
      }
    };
    const onEnded = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [moderatedAudioUrl]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  return (
    <div className="anim-fadeUp" style={{ flex: 1, overflowY: "auto", padding: "24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Summary cards - UPDATED RESPONSIVE GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        {[
          { label: "Violations",  value: totalFlags,                    icon: AlertTriangle, color: "var(--danger)" },
          { label: "Duration",    value: results.duration,              icon: Clock,         color: "var(--accent)" },
          { label: "Categories",  value: categories.length,             icon: Filter,        color: "var(--warn)" },
          { label: "Clean score", value: `${results.cleanScore ?? results.clean_score}%`,      icon: Shield,        color: "var(--success)" },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <div key={label} className={`glass anim-fadeUp delay-${i + 1}`} style={{ borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: "var(--txt-lo)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
              <Icon size={14} color={color} />
            </div>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 600, color, letterSpacing: "-0.03em" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Audio player */}
      <div className="glass anim-fadeUp delay-2" style={{ borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
        <audio ref={audioRef} src={moderatedAudioUrl} preload="metadata" />
        <button className="btn btn-primary" style={{ padding: "8px 12px", borderRadius: 8 }} onClick={togglePlayback}>
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 500, color: "var(--txt-hi)" }}>
            {file.name.replace(/\.[^.]+$/, "")}_moderated.mp3
          </p>
          <ProgressBar value={progress} />
        </div>
        <WaveformViz active={playing} count={20} />
        <Volume2 size={16} color="var(--txt-md)" />
      </div>

      {/* Before / After comparison */}
      <div className="glass anim-fadeUp delay-3" style={{ borderRadius: 14, padding: 20 }}>
        <p style={{ margin: "0 0 14px", fontSize: 12, color: "var(--txt-lo)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" }}>Before / After Waveform</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Original", color: "rgba(248,113,113,0.6)", bg: "rgba(248,113,113,0.06)" },
            { label: "Moderated", color: "var(--accent)", bg: "var(--accent-dim)" },
          ].map(({ label, color, bg }) => (
            <div key={label} style={{ background: bg, border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px" }}>
              <p style={{ margin: "0 0 10px", fontSize: 11, color: "var(--txt-md)", fontWeight: 500 }}>{label}</p>
              <svg viewBox="0 0 280 40" width="100%" height="40" style={{ display: "block" }}>
                {Array.from({ length: 56 }).map((_, i) => {
                  const h = label === "Original"
                    ? 5 + Math.abs(Math.sin(i * 0.45 + 1.2) * 16) + Math.random() * 6
                    : (i >= 18 && i <= 24) ? 2 : 4 + Math.abs(Math.sin(i * 0.45 + 1.2) * 14) + Math.random() * 4;
                  return (
                    <rect key={i} x={i * 5} y={20 - h / 2} width={3} height={h}
                      rx={1.5} fill={color} opacity={0.8} />
                  );
                })}
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs + flagged list */}
      <div className="glass anim-fadeUp delay-4" style={{ borderRadius: 14, overflow: "hidden" }}>
        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 20px" }}>
          {[["flagged", `Flagged (${totalFlags})`], ["transcript", "Transcript"], ["categories", "Categories"]].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                padding: "13px 16px", background: "none", border: "none",
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                color: activeTab === id ? "var(--txt-hi)" : "var(--txt-lo)",
                borderBottom: activeTab === id ? "2px solid var(--accent)" : "2px solid transparent",
                transition: "all 0.15s", fontFamily: "inherit",
              }}
            >{label}</button>
          ))}
        </div>

        {/* Flagged items - UPDATED EMPTY STATE */}
        {activeTab === "flagged" && results.flagged.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(52,211,153,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={24} color="var(--success)" />
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: "var(--txt-hi)" }}>All Clear!</p>
              <p style={{ margin: 0, color: "var(--txt-md)", fontSize: 13 }}>No profanity detected in this audio file.</p>
            </div>
          </div>
        )}
        {activeTab === "flagged" && results.flagged.length > 0 && (
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
            {results.flagged.map((item, i) => (
              <div
                key={i}
                className="flagged-row glass-raised"
                style={{
                  borderRadius: 10, padding: "11px 14px",
                  display: "flex", alignItems: "center", gap: 12,
                  animationDelay: `${i * 0.04}s`,
                  transition: "background 0.15s",
                }}
              >
                <span className="mono" style={{ fontSize: 11.5, color: "var(--accent)", minWidth: 48 }}>{item.time}</span>
                <span className={`badge ${item.severity === "high" ? "badge-danger" : "badge-warn"}`}>
                  {item.severity}
                </span>
                <span style={{ flex: 1, fontSize: 13, color: "var(--txt-md)" }}>
                  <span style={{ color: "var(--txt-hi)", fontWeight: 500 }}>"{item.word}"</span>
                  {" "}- {item.context}
                </span>
                <span className="badge" style={{ background: "var(--bg-hover)", color: "var(--txt-lo)", fontSize: 10 }}>
                  {item.category}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "transcript" && (
          <div style={{ padding: 20 }}>
            <p className="mono" style={{ fontSize: 12.5, color: "var(--txt-md)", lineHeight: 1.9, margin: 0 }}>
              {results.transcript}
            </p>
          </div>
        )}

        {activeTab === "categories" && totalFlags > 0 && (
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            {categories.map(cat => {
              const count = results.flagged.filter(f => f.category === cat).length;
              return (
                <div key={cat}>
                  <ProgressBar value={Math.round((count / totalFlags) * 100)} label={`${cat} (${count} instance${count !== 1 ? "s" : ""})`} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost" onClick={onReset}><RefreshCw size={14} /> New file</button>
        <button className="btn btn-primary" onClick={onDownload}><Download size={14} /> Download moderated audio</button>
      </div>
    </div>
  );
};

const STAGES = ["transcribe", "detect", "analyze", "compile"];

async function moderateAudio(file, config, onProgress) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("language", config.language);
  formData.append("bleep_audio", String(config.bleepAudio));
  formData.append("blocked_words", JSON.stringify(config.blocked));
  formData.append("allowed_words", JSON.stringify(config.allowed));

  onProgress?.(5, 0);

  const response = await fetch("https://clearwave.onrender.com/api/moderate", {
    method: "POST",
    body: formData,
  });

  onProgress?.(85, 2);

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const detail = payload.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg || JSON.stringify(item)).join(", ")
      : detail || "Failed to moderate audio";
    throw new Error(message);
  }

  onProgress?.(100, 3);
  return response.json();
}

// ─── Main app ─────────────────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase]       = useState("upload");
  const [file, setFile]         = useState(null);
  const [progress, setProgress] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);
  const [error, setError]       = useState(null);
  const [results, setResults]   = useState(null);
  const [moderatedAudioUrl, setModeratedAudioUrl] = useState(null);
  const progressTimer = useRef(null);
  const [config, setConfig] = useState({
    language: "English",
    sensitivity: 2,
    bleepAudio: true,
    exportReport: false,
    detectContext: true,
    blocked: [],
    allowed: [],
  });

  const reset = useCallback(() => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    if (moderatedAudioUrl) URL.revokeObjectURL(moderatedAudioUrl);
    setPhase("upload");
    setFile(null);
    setProgress(0);
    setStageIdx(0);
    setError(null);
    setResults(null);
    setModeratedAudioUrl(null);
  }, [moderatedAudioUrl]);

  const startProcessing = useCallback(async (uploadedFile) => {
    setFile(uploadedFile);
    setPhase("processing");
    setProgress(0);
    setStageIdx(0);
    setError(null);
    setResults(null);
    if (moderatedAudioUrl) URL.revokeObjectURL(moderatedAudioUrl);
    setModeratedAudioUrl(null);

    let simulated = 0;
    progressTimer.current = setInterval(() => {
      simulated = Math.min(92, simulated + Math.random() * 2.5 + 0.4);
      setProgress(Math.round(simulated));
      setStageIdx(Math.min(3, Math.floor(simulated / 24)));
    }, 120);

    try {
      const data = await moderateAudio(uploadedFile, config, (value, stage) => {
        setProgress(value);
        if (stage !== undefined) setStageIdx(stage);
      });

      clearInterval(progressTimer.current);
      setProgress(100);
      setStageIdx(3);

      setResults({
        duration: data.duration,
        cleanScore: data.clean_score,
        transcript: data.transcript,
        flagged: data.flagged,
      });
      setModeratedAudioUrl(data.moderated_audio_url);
      setTimeout(() => setPhase("results"), 400);
    } catch (err) {
      clearInterval(progressTimer.current);
      setError(err.message || "Something went wrong while processing the audio.");
    }
  }, [config, moderatedAudioUrl]);

  const handleDownload = useCallback(() => {
    if (!moderatedAudioUrl || !file) return;
    const anchor = document.createElement("a");
    anchor.href = moderatedAudioUrl;
    anchor.download = `${file.name.replace(/\.[^.]+$/, "")}_moderated.mp3`;
    anchor.click();
  }, [moderatedAudioUrl, file]);

  return (
    <>
      <FontLoader />
      <div className="app" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* Top bar */}
        <header style={{
          height: 56, display: "flex", alignItems: "center", padding: "0 24px",
          borderBottom: "1px solid var(--border)",
          background: "rgba(12,14,20,0.85)", backdropFilter: "blur(16px)",
          position: "sticky", top: 0, zIndex: 100,
        }}>
          
          {/* Logo Section - Beta Tag Removed */}
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: "var(--accent-dim)", border: "1px solid rgba(108,142,255,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Shield size={14} color="var(--accent)" />
            </div>
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em" }}>ClearWave</span>
          </div>

          {/* Right Header Section - Profile Logo Removed */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            {phase !== "upload" && (
              <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={reset}>
                <X size={13} /> Clear
              </button>
            )}
          </div>
          
        </header>

        {/* Body */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Main work area */}
          <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
            {/* Ambient bg gradient */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(108,142,255,0.06) 0%, transparent 60%)",
            }} />

            {phase === "upload"     && <UploadZone onFile={startProcessing} />}
            {phase === "processing" && (
              <ProcessingView
                file={file}
                progress={progress}
                stage={STAGES[stageIdx]}
                error={error}
              />
            )}
            {phase === "results" && results && (
              <ResultsView
                file={file}
                results={results}
                moderatedAudioUrl={moderatedAudioUrl}
                onReset={reset}
                onDownload={handleDownload}
              />
            )}
            {phase === "processing" && error && (
              <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)" }}>
                <button className="btn btn-ghost" onClick={reset}><RefreshCw size={14} /> Try again</button>
              </div>
            )}
          </main>

          {/* Settings sidebar */}
          <aside style={{
            width: 296, borderLeft: "1px solid var(--border)",
            background: "var(--bg-surface)",
            overflowY: "auto", padding: "16px 0",
          }}>
            <SettingsSidebar config={config} onChange={setConfig} />
          </aside>
        </div>

        {/* Status bar */}
        <footer style={{
          height: 32, display: "flex", alignItems: "center", padding: "0 20px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-surface)",
          gap: 20,
        }}>
          {[
            { dot: "var(--success)", text: "Model ready" },
            { dot: "var(--accent)",  text: `Lang: ${config.language}` },
            { dot: "var(--warn)",    text: `${config.blocked.length} blocked • ${config.allowed.length} allowed` },
          ].map(({ dot, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: dot }} />
              <span style={{ fontSize: 11, color: "var(--txt-lo)" }}>{text}</span>
            </div>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--txt-lo)" }} className="mono">
            ClearWave v1.0.0
          </span>
        </footer>
      </div>
    </>
  );
}