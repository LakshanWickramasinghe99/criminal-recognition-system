import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000';

/* ── Inject keyframes once ── */
if (!document.getElementById('lecs-id-styles')) {
  const tag = document.createElement('style');
  tag.id = 'lecs-id-styles';
  tag.textContent = `
    @keyframes fadeIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
    @keyframes scan   { 0%{top:0%} 100%{top:100%} }
    @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0.3} }
    @keyframes flickerIn { 0%{opacity:0} 20%{opacity:0.8} 40%{opacity:0.2} 60%{opacity:1} 80%{opacity:0.6} 100%{opacity:1} }
    @keyframes scanMatch { 0%{top:-2px} 100%{top:calc(100% + 2px)} }
    @keyframes pulseRed  { 0%,100%{box-shadow:0 0 0 0 rgba(224,80,80,0)} 50%{box-shadow:0 0 0 6px rgba(224,80,80,0.15)} }
    .lecs-pg { animation: fadeIn 0.3s ease; }
    .lecs-scan-line { position:absolute;left:0;right:0;height:1px;background:#22c55e;opacity:0.5;top:0;animation:scan 2s linear infinite; }
    .lecs-match-scan { position:absolute;left:0;right:0;height:2px;background:rgba(224,80,80,0.6);top:0;animation:scanMatch 1.8s linear infinite;z-index:4; }
    .lecs-ab-icon  { animation: blink 0.8s infinite; }
    .lecs-upload-zone { transition: border-color 0.15s, background 0.15s; }
    .lecs-upload-zone:hover { border-color: #2a6fc4 !important; }
    .lecs-btn-analyze { transition: all 0.15s; }
    .lecs-btn-analyze:hover:not(:disabled) { background:#160a0a!important; border-color:#6a2020!important; color:#ff7070!important; }
    .lecs-photo-flicker { animation: flickerIn 0.6s ease forwards; }
    .lecs-pulse-red { animation: pulseRed 1.5s infinite; }
  `;
  document.head.appendChild(tag);
}

/* ── Criminal photo with fallback ── */
function CriminalPhoto({ criminal_id, name }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '8px', background: '#0a0505',
      }}>
        <div style={{ fontSize: '52px', color: '#2a1a1a' }}>👤</div>
        <div style={{ fontSize: '9px', color: '#3a1515', letterSpacing: '2px' }}>NO PHOTO ON FILE</div>
      </div>
    );
  }
  return (
    <img
      className="lecs-photo-flicker"
      src={`${API}/api/enrollment/photo/${criminal_id}`}
      alt={name}
      onError={() => setErr(true)}
      style={{
        width: '100%', height: '100%',
        objectFit: 'cover', objectPosition: 'top center',
        display: 'block',
        filter: 'brightness(0.92) contrast(1.05)',
      }}
    />
  );
}

export default function Identification() {
  const [video,       setVideo]       = useState(null);
  const [result,      setResult]      = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [progress,    setProgress]    = useState(0);
  const [progMsg,     setProgMsg]     = useState('');
  const [vpLabel,     setVpLabel]     = useState('AWAITING INPUT');
  const [dragging,    setDragging]    = useState(false);
  const [vpMatchIdx,  setVpMatchIdx]  = useState(0);   // which match to show in viewport
  const fileRef = useRef();

  /* Cycle through matched criminals in the viewport every 2.5s */
  useEffect(() => {
    if (!result?.confirmed_matches?.length) return;
    const id = setInterval(() => {
      setVpMatchIdx(i => (i + 1) % result.confirmed_matches.length);
    }, 2500);
    return () => clearInterval(id);
  }, [result]);

  const pickFile = f => {
    if (!f) return;
    if (!f.type.startsWith('video/')) { setError('INVALID FILE TYPE — VIDEO REQUIRED'); return; }
    setVideo(f);
    setError(null);
    setVpLabel('VIDEO LOADED — READY');
    setResult(null);
    setVpMatchIdx(0);
  };

  const handleDrop = e => {
    e.preventDefault(); setDragging(false);
    pickFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!video) { setError('NO FILE SELECTED — UPLOAD A VIDEO TO PROCEED'); return; }
    setLoading(true); setError(null); setResult(null);
    setVpLabel('SCANNING...');
    setVpMatchIdx(0);

    const steps = [
      { p: 20,  m: 'Uploading video...' },
      { p: 45,  m: 'Detecting faces and occlusions...' },
      { p: 70,  m: 'Matching against criminal registry...' },
      { p: 90,  m: 'Verifying blockchain records...' },
    ];
    let si = 0;
    const iv = setInterval(() => {
      if (si < steps.length) { setProgress(steps[si].p); setProgMsg(steps[si].m); si++; }
    }, 700);

    const data = new FormData();
    data.append('video', video);
    try {
      const res = await axios.post(`${API}/api/identification/analyze-video`, data, { timeout: 300000 });
      clearInterval(iv);
      setProgress(100); setProgMsg('Analysis complete');
      setResult(res.data);
      setVpLabel(res.data.confirmed_matches?.length > 0 ? 'MATCH DETECTED' : 'NO MATCH FOUND');
    } catch (err) {
      clearInterval(iv);
      setError(err.response?.data?.detail || 'ANALYSIS FAILED — RETRY OR CONTACT SYSTEM ADMIN');
      setVpLabel('AWAITING INPUT');
    } finally {
      setLoading(false);
      setTimeout(() => { setProgress(0); setProgMsg(''); }, 800);
    }
  };

  const hasMatches    = result?.confirmed_matches?.length > 0;
  const currentMatch  = hasMatches ? result.confirmed_matches[vpMatchIdx] : null;

  return (
    <div className="lecs-pg" style={s.pg}>

      {/* ── Header ── */}
      <div style={s.pgHeader}>
        <div style={s.phLeft}>
          <div style={s.phIcon}>▶</div>
          <div>
            <div style={s.phTitle}>Video Identification</div>
            <div style={s.phSub}>FACIAL RECOGNITION — REAL-TIME CCTV ANALYSIS</div>
          </div>
        </div>
        <span style={s.statusPill}>RECOGNITION READY</span>
      </div>

      {/* ── Two-column grid ── */}
      <div style={s.grid2}>

        {/* Left: Upload */}
        <div style={s.panel}>
          <div style={s.panelTitle}>Upload CCTV Footage</div>

          <div style={s.formats}>
            {['MP4','MOV','AVI','MAX 500MB','REC <30s'].map(f => (
              <span key={f} style={s.fmt}>{f}</span>
            ))}
          </div>

          <div
            className="lecs-upload-zone"
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
            style={{
              ...s.uploadZone,
              borderColor: dragging ? '#2a6fc4' : video ? '#22c55e' : '#1a3a5c',
              background:  dragging ? '#071828'  : video ? '#060d06' : '#070d1a',
            }}
          >
            <input ref={fileRef} type="file" accept="video/*" style={{ display:'none' }}
              onChange={e => pickFile(e.target.files[0])} />
            <div style={{ ...s.uzIcon, color: video ? '#22c55e' : '#1a3a5c' }}>▶</div>
            <div style={s.uzMain}>{video ? video.name : 'Drop CCTV Video Here'}</div>
            <div style={s.uzSub}>{video ? 'Click to change' : 'Click to browse files'}</div>
          </div>

          {video && (
            <div style={s.fileInfo}>
              <span style={s.fiName}>{video.name}</span>
              <span style={s.fiSize}>{(video.size / 1024 / 1024).toFixed(1)} MB</span>
            </div>
          )}

          <button className="lecs-btn-analyze" onClick={handleSubmit} disabled={loading}
            style={{ ...s.btnAnalyze, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'ANALYZING...' : '▶ Analyze Video'}
          </button>

          {loading && (
            <div style={s.progressStrip}>
              <div style={s.progLabel}>Processing</div>
              <div style={s.progBarWrap}>
                <div style={{ ...s.progBar, width: `${progress}%` }} />
              </div>
              <div style={s.progMsg}>{progMsg}</div>
            </div>
          )}
        </div>

        {/* Right: Recognition Viewport */}
        <div style={s.panel}>
          <div style={s.panelTitle}>Recognition Viewport</div>

          {/* ── Viewport box ── */}
          <div
            className={hasMatches ? 'lecs-pulse-red' : ''}
            style={{
              ...s.scanPreview,
              border: hasMatches ? '1px solid #5a1515' : '1px solid #0f1e35',
            }}
          >
            {/* Grid overlay */}
            <div style={s.scanGrid} />

            {/* Scan line — green when idle/loading, red when matched */}
            {!hasMatches && <div className="lecs-scan-line" />}
            {hasMatches  && <div className="lecs-match-scan" />}

            {/* Corner brackets */}
            <div style={{ ...s.corner, ...s.cTL, borderColor: hasMatches ? '#e05050' : '#2a6fc4' }} />
            <div style={{ ...s.corner, ...s.cTR, borderColor: hasMatches ? '#e05050' : '#2a6fc4' }} />
            <div style={{ ...s.corner, ...s.cBL, borderColor: hasMatches ? '#e05050' : '#2a6fc4' }} />
            <div style={{ ...s.corner, ...s.cBR, borderColor: hasMatches ? '#e05050' : '#2a6fc4' }} />

            {/* ── MATCHED: show criminal photo ── */}
            {hasMatches && currentMatch ? (
              <>
                {/* Full-height photo */}
                <div key={currentMatch.criminal_id} style={s.vpPhotoWrap}>
                  <CriminalPhoto
                    criminal_id={currentMatch.criminal_id}
                    name={currentMatch.name}
                  />
                  {/* Red vignette overlay */}
                  <div style={s.vpVignette} />
                </div>

                {/* Top-left: MATCH DETECTED badge */}
                <div style={s.vpMatchBadge}>
                  <span className="lecs-ab-icon" style={{ color: '#e05050', marginRight: '5px' }}>▲</span>
                  MATCH DETECTED
                </div>

                {/* Bottom overlay: name + id + confidence */}
                <div style={s.vpOverlay}>
                  <div style={s.vpOverlayName}>{currentMatch.name}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={s.vpOverlayId}>{currentMatch.criminal_id}</span>
                    <span style={s.vpOverlayConf}>
                      {(currentMatch.avg_confidence * 100).toFixed(1)}% MATCH
                    </span>
                  </div>
                  {/* Multi-match dots */}
                  {result.confirmed_matches.length > 1 && (
                    <div style={s.vpDots}>
                      {result.confirmed_matches.map((_, i) => (
                        <div key={i} style={{
                          ...s.vpDot,
                          background: i === vpMatchIdx ? '#e05050' : '#3a1515',
                          border: `1px solid ${i === vpMatchIdx ? '#e05050' : '#2a1a1a'}`,
                        }} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* ── IDLE / NO MATCH ── */
              <span style={{
                ...s.scanLabel,
                color: hasMatches === false && result ? '#22c55e' : '#1a3a5a',
              }}>
                {vpLabel}
              </span>
            )}
          </div>

          {/* Below viewport: cycling hint when multiple matches */}
          {hasMatches && result.confirmed_matches.length > 1 && (
            <div style={s.cycleHint}>
              {vpMatchIdx + 1} / {result.confirmed_matches.length} — Auto-cycling every 2.5s
            </div>
          )}

          {/* No match caption */}
          {result && !hasMatches && (
            <div style={s.noMatchVp}>✓ No registered subjects identified in this footage</div>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={s.errorStrip}>
          <div style={s.errTitle}>Analysis Failed</div>
          <div style={s.errMsg}>{error}</div>
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <>
          <div style={s.statsGrid}>
            <Stat label="Case ID"      value={result.case_id}                    color="#3a8adc" />
            <Stat label="Duration"     value={`${result.duration?.toFixed(1)}s`} color="#7a5af8" />
            <Stat label="Total Frames" value={result.total_frames}               color="#4a8adc" />
            <Stat label="Processed"    value={result.processed_frames}           color="#22c55e" />
          </div>

          {hasMatches ? (
            <>
              <div style={s.alertBanner}>
                <div style={s.abLeft}>
                  <span className="lecs-ab-icon" style={s.abIcon}>▲</span>
                  <span style={s.abTxt}>{result.confirmed_matches.length} Criminal(s) Identified</span>
                </div>
                <span style={s.abCount}>ALERT</span>
              </div>

              {result.confirmed_matches.map((m, i) => (
                <div key={i} style={s.matchCard}>
                  {/* Match card: photo + details side by side */}
                  <div style={s.mcInner}>
                    {/* Thumbnail */}
                    <div style={s.mcThumb}>
                      <CriminalPhoto criminal_id={m.criminal_id} name={m.name} />
                      <div style={s.mcThumbOverlay}>
                        {(m.avg_confidence * 100).toFixed(1)}%
                      </div>
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1 }}>
                      <div style={s.mcHeader}>
                        <span style={s.mcName}>{m.name}</span>
                        <span style={s.mcConf}>{(m.avg_confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div style={s.mcGrid}>
                        <McItem label="Criminal ID"    value={<span style={s.mcId}>{m.criminal_id}</span>} />
                        <McItem label="Frames Matched" value={m.frame_count} />
                        <McItem label="First Seen"     value={`${m.first_seen_at?.toFixed(1)}s`} />
                        <McItem label="Occlusions"     value={
                          m.occlusions?.length
                            ? m.occlusions.map((o, j) => <span key={j} style={s.occTag}>{o}</span>)
                            : '—'
                        } />
                      </div>

                      {m.blockchain_tx && (
                        <div style={s.txBlock}>
                          <div style={s.txLbl}>⬡ Blockchain TX Hash</div>
                          <div style={s.txVal}>{m.blockchain_tx}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={s.noMatch}>
              <span style={s.nmIc}>✓</span>
              <span style={s.nmTxt}>NO REGISTERED SUBJECTS IDENTIFIED IN THIS FOOTAGE</span>
            </div>
          )}
        </>
      )}

      {/* ── Footer ── */}
      <div style={s.footer}>
        <span style={s.ft}>LECS v2.4.1 — IDENTIFICATION MODULE — RESTRICTED</span>
        <span style={s.enc}>AES-256 ENCRYPTED</span>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ ...s.stat, borderTop: `2px solid ${color}` }}>
      <div style={s.statLbl}>{label}</div>
      <div style={{ ...s.statVal, color }}>{value}</div>
    </div>
  );
}

function McItem({ label, value }) {
  return (
    <div>
      <div style={s.mcItemLbl}>{label}</div>
      <div style={s.mcItemVal}>{value}</div>
    </div>
  );
}

/* ── Styles ── */
const s = {
  pg: {
    background: '#0a0e1a', padding: '20px',
    fontFamily: "'Courier New', monospace", color: '#c8d8f0', minHeight: '100vh',
  },
  pgHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid #1a3a5c', paddingBottom: '14px', marginBottom: '18px',
  },
  phLeft:  { display: 'flex', alignItems: 'center', gap: '10px' },
  phIcon:  {
    width: '34px', height: '34px', background: '#100a0a',
    border: '2px solid #3a1515', borderRadius: '3px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
  },
  phTitle: { fontSize: '12px', fontWeight: '700', color: '#e0ecff', letterSpacing: '2px', textTransform: 'uppercase' },
  phSub:   { fontSize: '9px', color: '#2a5a8a', letterSpacing: '2px', marginTop: '2px' },
  statusPill: {
    background: '#100a0a', border: '1px solid #3a1515',
    color: '#e05050', fontSize: '9px', padding: '3px 10px', letterSpacing: '2px',
  },

  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' },

  panel: { background: '#0d1526', border: '1px solid #1a3a5c', padding: '18px' },
  panelTitle: {
    fontSize: '10px', fontWeight: '700', color: '#4a8adc',
    letterSpacing: '3px', textTransform: 'uppercase',
    borderLeft: '3px solid #2a6fc4', paddingLeft: '8px', marginBottom: '14px',
  },

  formats: { display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' },
  fmt: {
    background: '#070d1a', border: '1px solid #0f1e35',
    color: '#1a4a6a', fontSize: '9px', padding: '2px 8px', letterSpacing: '1px',
  },

  uploadZone: {
    border: '2px dashed', padding: '32px 16px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: '8px', cursor: 'pointer', marginBottom: '12px',
  },
  uzIcon: { fontSize: '28px' },
  uzMain: { fontSize: '9px', color: '#1a4a6a', letterSpacing: '2px', textTransform: 'uppercase' },
  uzSub:  { fontSize: '9px', color: '#0f2a40', letterSpacing: '1px' },

  fileInfo: {
    background: '#070d1a', border: '1px solid #1a3a5c',
    padding: '8px 12px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: '12px',
  },
  fiName: { fontSize: '10px', color: '#4a8adc', letterSpacing: '1px' },
  fiSize: { fontSize: '9px', color: '#2a5a7a', letterSpacing: '1px' },

  btnAnalyze: {
    width: '100%', background: '#100a0a', border: '1px solid #3a1515',
    color: '#e05050', fontFamily: "'Courier New', monospace",
    fontSize: '10px', fontWeight: '700', letterSpacing: '3px',
    textTransform: 'uppercase', padding: '10px',
  },

  progressStrip: {
    background: '#070d1a', border: '1px solid #1a2a1a',
    borderLeft: '3px solid #22c55e', padding: '10px 14px', marginTop: '10px',
  },
  progLabel:   { fontSize: '9px', color: '#1a5a2a', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '5px' },
  progBarWrap: { background: '#060c06', height: '3px', overflow: 'hidden' },
  progBar:     { background: '#22c55e', height: '3px', transition: 'width 0.3s' },
  progMsg:     { fontSize: '9px', color: '#1a4a2a', letterSpacing: '1px', marginTop: '5px' },

  /* ── Viewport ── */
  scanPreview: {
    background: '#060c14', height: '240px', position: 'relative',
    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  scanGrid: {
    position: 'absolute', inset: 0, zIndex: 1,
    backgroundImage: 'linear-gradient(#0f2a3a18 1px,transparent 1px),linear-gradient(90deg,#0f2a3a18 1px,transparent 1px)',
    backgroundSize: '20px 20px', pointerEvents: 'none',
  },
  scanLabel: { fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', position: 'relative', zIndex: 2 },

  /* Corner brackets */
  corner: { position: 'absolute', width: '14px', height: '14px', borderStyle: 'solid', borderWidth: 0, zIndex: 5 },
  cTL: { top: '8px',    left: '8px',  borderTopWidth: '2px', borderLeftWidth: '2px'  },
  cTR: { top: '8px',    right: '8px', borderTopWidth: '2px', borderRightWidth: '2px' },
  cBL: { bottom: '8px', left: '8px',  borderBottomWidth: '2px', borderLeftWidth: '2px'  },
  cBR: { bottom: '8px', right: '8px', borderBottomWidth: '2px', borderRightWidth: '2px' },

  /* Photo inside viewport */
  vpPhotoWrap: { position: 'absolute', inset: 0, zIndex: 2 },
  vpVignette:  {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to bottom, rgba(224,80,80,0.08) 0%, transparent 40%, rgba(0,0,0,0.55) 100%)',
    zIndex: 3,
  },

  /* Match badge top-left */
  vpMatchBadge: {
    position: 'absolute', top: '28px', left: '12px', zIndex: 6,
    background: 'rgba(16,5,5,0.9)', border: '1px solid #5a1515',
    color: '#e05050', fontSize: '9px', padding: '3px 8px',
    letterSpacing: '2px', textTransform: 'uppercase', display: 'flex', alignItems: 'center',
  },

  /* Name / ID overlay at bottom */
  vpOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 6,
    background: 'rgba(10,5,5,0.88)',
    borderTop: '1px solid #3a1515', padding: '8px 12px',
  },
  vpOverlayName: { fontSize: '12px', fontWeight: '700', color: '#e0ecff', letterSpacing: '1px', marginBottom: '3px' },
  vpOverlayId:   { fontSize: '9px', color: '#3a8adc', letterSpacing: '2px' },
  vpOverlayConf: {
    fontSize: '9px', fontWeight: '700', color: '#e05050',
    background: 'rgba(90,10,10,0.6)', border: '1px solid #5a1515',
    padding: '1px 6px', letterSpacing: '1px',
  },
  vpDots: { display: 'flex', gap: '5px', marginTop: '6px' },
  vpDot:  { width: '6px', height: '6px', borderRadius: '50%' },

  cycleHint: { fontSize: '9px', color: '#2a3a5a', letterSpacing: '1px', textAlign: 'center', marginTop: '6px' },
  noMatchVp: { fontSize: '9px', color: '#1a5a2a', letterSpacing: '1px', textAlign: 'center', marginTop: '6px' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '14px' },
  stat:    { background: '#0d1526', border: '1px solid #1a3a5c', padding: '12px 14px' },
  statLbl: { fontSize: '9px', color: '#4a7aaa', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '5px' },
  statVal: { fontSize: '20px', fontWeight: '700' },

  alertBanner: {
    background: '#100505', border: '1px solid #5a1515',
    borderLeft: '3px solid #e05050', padding: '10px 16px',
    marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  abLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  abIcon: { fontSize: '14px', color: '#e05050' },
  abTxt:  { fontSize: '11px', fontWeight: '700', color: '#e05050', letterSpacing: '2px', textTransform: 'uppercase' },
  abCount: {
    background: '#1a0505', border: '1px solid #5a1515',
    color: '#e05050', fontSize: '10px', fontWeight: '700',
    padding: '2px 10px',
  },

  /* Match card: photo beside details */
  matchCard: {
    background: '#0d1020', border: '1px solid #3a1515',
    borderLeft: '3px solid #e05050', marginBottom: '12px', overflow: 'hidden',
  },
  mcInner: { display: 'flex', gap: '0' },
  mcThumb: {
    width: '90px', flexShrink: 0, position: 'relative',
    background: '#0a0505', borderRight: '1px solid #2a1010',
  },
  mcThumbOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: 'rgba(10,5,5,0.88)', borderTop: '1px solid #3a1515',
    color: '#e05050', fontSize: '9px', fontWeight: '700',
    padding: '3px', textAlign: 'center', letterSpacing: '1px',
  },

  mcHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 14px 10px', borderBottom: '1px solid #1a0a0a',
  },
  mcName: { fontSize: '13px', fontWeight: '700', color: '#e0ecff', letterSpacing: '1px' },
  mcConf: {
    background: '#1a0505', border: '1px solid #5a1515',
    color: '#e05050', fontSize: '12px', fontWeight: '700', padding: '3px 12px',
  },
  mcGrid:    { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', padding: '10px 14px 12px' },
  mcItemLbl: { fontSize: '9px', color: '#2a3a5a', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '3px' },
  mcItemVal: { fontSize: '11px', color: '#a0c0e8', letterSpacing: '0.5px' },
  mcId:      { color: '#3a8adc' },
  occTag: {
    display: 'inline-block', background: '#1a1000', border: '1px solid #3a2a00',
    color: '#d97706', fontSize: '9px', padding: '1px 6px',
    letterSpacing: '1px', textTransform: 'uppercase', marginRight: '3px',
  },
  txBlock: { background: '#06090f', border: '1px solid #0f1a2a', padding: '8px 10px', margin: '0 14px 12px' },
  txLbl:   { fontSize: '9px', color: '#1a3a5a', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' },
  txVal:   { fontSize: '9px', color: '#1a4a6a', letterSpacing: '1px', wordBreak: 'break-all' },

  noMatch: {
    background: '#070d0a', border: '1px solid #1a4a1a',
    borderLeft: '3px solid #22c55e', padding: '14px 16px',
    display: 'flex', alignItems: 'center', gap: '10px',
  },
  nmIc:  { color: '#22c55e', fontSize: '12px' },
  nmTxt: { fontSize: '10px', color: '#1a6a3a', letterSpacing: '2px', textTransform: 'uppercase' },

  errorStrip: {
    background: '#0d0606', border: '1px solid #3a1515',
    borderLeft: '3px solid #e05050', padding: '12px 14px', marginBottom: '14px',
  },
  errTitle: { fontSize: '9px', fontWeight: '700', color: '#e05050', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' },
  errMsg:   { fontSize: '10px', color: '#7a3030', letterSpacing: '1px' },

  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginTop: '4px', paddingTop: '10px', borderTop: '1px solid #0d1a2e',
  },
  ft:  { fontSize: '9px', color: '#1a3a5a', letterSpacing: '1.5px' },
  enc: {
    background: '#06090f', border: '1px solid #0d1f35',
    color: '#1e4a6a', fontSize: '9px', padding: '3px 10px', letterSpacing: '2px',
  },
};
