import React, { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000';

export default function Identification() {
  const [video,    setVideo]    = useState(null);
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [progress, setProgress] = useState('');
  const [dragging, setDragging] = useState(false);

  const pickFile = f => {
    if (f && f.type.startsWith('video/')) { setVideo(f); setError(null); }
    else setError('INVALID FILE TYPE — VIDEO REQUIRED');
  };

  const handleDrop = e => {
    e.preventDefault(); setDragging(false);
    pickFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!video) { setError('NO FILE SELECTED — UPLOAD A VIDEO TO PROCEED'); return; }
    setLoading(true); setError(null); setResult(null);
    setProgress('UPLOADING VIDEO...');
    const data = new FormData();
    data.append('video', video);
    try {
      setProgress('ANALYZING — DETECTING FACES & OCCLUSIONS...');
      const res = await axios.post(`${API}/api/identification/analyze-video`, data, { timeout: 300000 });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'ANALYSIS FAILED — RETRY OR CONTACT SYSTEM ADMIN');
    } finally {
      setLoading(false); setProgress('');
    }
  };

  return (
    <div style={s.dash}>

      {/* ── Section header ── */}
      <div style={s.sectionHeader}>
        <span style={s.sectionTitle}>VIDEO IDENTIFICATION MODULE</span>
        <span style={s.sectionSub}>SURVEILLANCE FOOTAGE ANALYSIS — FACIAL RECOGNITION</span>
      </div>

      {/* ── Upload panel ── */}
      <div style={s.panel}>
        <div style={s.panelHeaderRow}>
          <div style={s.panelTitle}>INPUT — VIDEO FILE</div>
        </div>

        <p style={s.hint}>SUPPORTED FORMATS: MP4 · MOV · AVI — RECOMMENDED MAX 30 SECONDS</p>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('vid-input').click()}
          style={{
            ...s.dropZone,
            borderColor: dragging ? '#3a8adc' : video ? '#22c55e' : '#1a3a5c',
            background:  dragging ? '#071828' : video ? '#071510' : '#080e1c',
          }}
        >
          <input
            id="vid-input"
            type="file"
            accept="video/*"
            onChange={e => pickFile(e.target.files[0])}
            style={{ display: 'none' }}
          />

          {video ? (
            <>
              <div style={{ ...s.dropIcon, color: '#22c55e' }}>▶</div>
              <div style={{ color: '#22c55e', fontSize: '11px', fontWeight: '700', letterSpacing: '1px' }}>
                {video.name}
              </div>
              <div style={s.dropMeta}>
                SIZE: {(video.size / 1024 / 1024).toFixed(2)} MB — CLICK TO CHANGE
              </div>
            </>
          ) : (
            <>
              <div style={s.dropIcon}>⬡</div>
              <div style={s.dropLabel}>DROP VIDEO HERE OR CLICK TO BROWSE</div>
              <div style={s.dropMeta}>MP4 · MOV · AVI ACCEPTED</div>
            </>
          )}
        </div>

        {/* Analyze button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            ...s.btn,
            background:  loading ? '#0a0e1a' : '#0d2040',
            borderColor: loading ? '#1a3a5c' : '#2a6fc4',
            color:       loading ? '#4a7aaa' : '#3a8adc',
            cursor:      loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? `⏳  ${progress || 'PROCESSING...'}` : '▶  RUN FACIAL ANALYSIS'}
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={s.errorBox}>
          <span style={{ color: '#e05050', marginRight: '8px' }}>✕</span>
          {error}
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <>
          {/* Stats row */}
          <div style={s.panelHeaderRow}>
            <div style={s.panelTitle}>ANALYSIS SUMMARY</div>
          </div>
          <div style={s.statsGrid}>
            <StatCard label="Case ID"         value={result.case_id}                    accent="#7a5af8" />
            <StatCard label="Duration"        value={`${result.duration?.toFixed(1)}s`} accent="#3a8adc" />
            <StatCard label="Total Frames"    value={result.total_frames}               accent="#3a8adc" />
            <StatCard label="Frames Analyzed" value={result.processed_frames}           accent="#3a8adc" />
          </div>

          {/* Match header */}
          <div style={s.panelHeaderRow}>
            <div style={s.panelTitle}>
              {result.confirmed_matches.length === 0
                ? 'MATCH RESULTS'
                : `MATCH RESULTS — ${result.confirmed_matches.length} SUBJECT${result.confirmed_matches.length > 1 ? 'S' : ''} IDENTIFIED`}
            </div>
            <span style={{
              ...s.badgeCount,
              borderColor: result.confirmed_matches.length > 0 ? '#4a1a1a' : '#1a3a5c',
              color:       result.confirmed_matches.length > 0 ? '#e05050' : '#4a8adc',
              background:  result.confirmed_matches.length > 0 ? '#1a0a0a' : '#0d2040',
            }}>
              {result.confirmed_matches.length} MATCHES
            </span>
          </div>

          {result.confirmed_matches.length === 0 ? (
            <div style={s.noMatch}>
              <span style={{ color: '#22c55e', marginRight: '8px' }}>✓</span>
              NO REGISTERED SUBJECTS IDENTIFIED IN THIS FOOTAGE
            </div>
          ) : (
            <>
              <div style={s.alertBar}>
                <div style={s.alertDot} />
                ALERT — REGISTERED CRIMINAL{result.confirmed_matches.length > 1 ? 'S' : ''} DETECTED IN FOOTAGE
              </div>

              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr style={s.thead}>
                      {['Subject', 'Criminal ID', 'Confidence', 'Frames Matched', 'First Seen', 'Occlusions', 'Blockchain TX']
                        .map(h => <th key={h} style={s.th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {result.confirmed_matches.map((m, i) => (
                      <tr key={i} style={s.tr}>
                        <td style={{ ...s.td, ...s.nameCell }}>{m.name}</td>
                        <td style={s.td}><span style={s.idTag}>{m.criminal_id}</span></td>
                        <td style={s.td}><span style={s.confTag}>{(m.avg_confidence * 100).toFixed(1)}%</span></td>
                        <td style={{ ...s.td, ...s.monoCell }}>{m.frame_count}</td>
                        <td style={{ ...s.td, ...s.monoCell }}>{m.first_seen_at?.toFixed(1)}s</td>
                        <td style={s.td}>
                          {m.occlusions?.length
                            ? m.occlusions.map((o, j) => <span key={j} style={s.occTag}>{o}</span>)
                            : <span style={s.noneTag}>NONE</span>}
                        </td>
                        <td style={{ ...s.td, ...s.hashCell }}>
                          {m.blockchain_tx
                            ? <><span style={s.chainIcon}>⬡ </span>{m.blockchain_tx.slice(0, 14)}...</>
                            : <span style={{ color: '#2a5a7a' }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div style={s.footer}>
            <span style={s.footerTxt}>LECS v2.4.1 — RESTRICTED ACCESS ONLY</span>
            <span style={s.secureBadge}>ENCRYPTED — AES-256</span>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{ ...s.statCard, borderTop: `2px solid ${accent}` }}>
      <div style={s.statLabel}>{label}</div>
      <div style={{ ...s.statVal, color: accent }}>{value}</div>
    </div>
  );
}

const s = {
  dash: {
    background: '#0a0e1a',
    minHeight: '100vh',
    padding: '20px',
    color: '#c8d8f0',
    fontFamily: "'Courier New', monospace",
  },

  sectionHeader: {
    borderBottom: '1px solid #1a3a5c',
    paddingBottom: '14px',
    marginBottom: '20px',
  },
  sectionTitle: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '700',
    color: '#e0ecff',
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },
  sectionSub: {
    display: 'block',
    fontSize: '10px',
    color: '#4a7aaa',
    letterSpacing: '1px',
    marginTop: '4px',
  },

  panel: {
    background: '#0d1526',
    border: '1px solid #1a3a5c',
    padding: '16px',
    marginBottom: '16px',
  },
  panelHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  panelTitle: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#4a8adc',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    borderLeft: '3px solid #2a6fc4',
    paddingLeft: '10px',
  },
  badgeCount: {
    border: '1px solid',
    fontSize: '10px',
    padding: '2px 8px',
    borderRadius: '2px',
    letterSpacing: '1px',
  },

  hint: {
    fontSize: '9px',
    color: '#2a5a7a',
    letterSpacing: '1px',
    margin: '0 0 12px 0',
  },

  dropZone: {
    border: '1px dashed',
    padding: '28px 20px',
    textAlign: 'center',
    marginBottom: '14px',
    cursor: 'pointer',
    transition: 'border-color .2s, background .2s',
  },
  dropIcon: {
    fontSize: '22px',
    color: '#2a6fc4',
    marginBottom: '8px',
    display: 'block',
  },
  dropLabel: {
    fontSize: '11px',
    color: '#4a7aaa',
    letterSpacing: '1.5px',
    marginBottom: '4px',
  },
  dropMeta: {
    fontSize: '9px',
    color: '#2a4a6a',
    letterSpacing: '1px',
    marginTop: '4px',
  },

  btn: {
    width: '100%',
    padding: '12px',
    border: '1px solid',
    fontSize: '11px',
    fontWeight: '700',
    fontFamily: "'Courier New', monospace",
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },

  errorBox: {
    background: '#1a0505',
    border: '1px solid #4a1a1a',
    color: '#e05050',
    padding: '10px 14px',
    fontSize: '10px',
    letterSpacing: '1px',
    marginBottom: '14px',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
    marginBottom: '18px',
  },
  statCard: {
    background: '#0d1526',
    border: '1px solid #1a3a5c',
    padding: '14px 16px',
  },
  statLabel: {
    fontSize: '9px',
    color: '#4a7aaa',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    marginBottom: '6px',
  },
  statVal: {
    fontWeight: '700',
    letterSpacing: '1px',
    fontFamily: "'Courier New', monospace",
    fontSize: '22px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  alertBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#1a0505',
    border: '1px solid #4a1a1a',
    color: '#e05050',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '2px',
    padding: '10px 14px',
    marginBottom: '10px',
  },
  alertDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#e05050',
    flexShrink: 0,
  },

  noMatch: {
    background: '#071510',
    border: '1px solid #1a3a1a',
    color: '#22c55e',
    padding: '16px',
    fontSize: '11px',
    letterSpacing: '2px',
    textAlign: 'center',
  },

  tableWrap: {
    background: '#0d1526',
    border: '1px solid #1a3a5c',
    marginBottom: '16px',
    overflowX: 'auto',
  },
  table:  { width: '100%', borderCollapse: 'collapse', fontSize: '11px' },
  thead:  { background: '#0a1020', borderBottom: '2px solid #1a3a5c' },
  th: {
    padding: '10px 12px',
    textAlign: 'left',
    color: '#2a5a8a',
    letterSpacing: '2px',
    fontSize: '9px',
    textTransform: 'uppercase',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid #0f1e35' },
  td: { padding: '11px 12px', color: '#a0c0e8', verticalAlign: 'middle' },

  nameCell: { color: '#ddeeff', fontWeight: '600', letterSpacing: '0.5px' },
  monoCell: { fontFamily: "'Courier New', monospace", color: '#6a9abf' },
  hashCell: { fontFamily: "'Courier New', monospace", fontSize: '9px', color: '#2a5a7a', letterSpacing: '1px' },
  chainIcon: { color: '#7a5af8', fontSize: '9px' },

  idTag: {
    background: '#0a1a30',
    border: '1px solid #1a3a5c',
    color: '#3a8adc',
    fontSize: '10px',
    padding: '3px 8px',
    letterSpacing: '1px',
    borderRadius: '2px',
    fontFamily: "'Courier New', monospace",
  },
  confTag: {
    background: '#1a0a0a',
    border: '1px solid #4a1a1a',
    color: '#e05050',
    fontSize: '10px',
    padding: '3px 8px',
    letterSpacing: '1px',
    borderRadius: '2px',
  },
  occTag: {
    display: 'inline-block',
    background: '#1a1200',
    border: '1px solid #3a2a00',
    color: '#c0a030',
    fontSize: '9px',
    padding: '2px 6px',
    borderRadius: '2px',
    letterSpacing: '1px',
    marginRight: '4px',
    textTransform: 'uppercase',
  },
  noneTag: { color: '#2a5a7a', fontSize: '9px', letterSpacing: '1px' },

  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '14px',
    paddingTop: '12px',
    borderTop: '1px solid #0f1e35',
  },
  footerTxt:   { fontSize: '9px', color: '#1a3a5a', letterSpacing: '1.5px' },
  secureBadge: {
    background: '#071020',
    border: '1px solid #0f2040',
    color: '#2a5a7a',
    fontSize: '9px',
    padding: '3px 10px',
    letterSpacing: '2px',
  },
};
