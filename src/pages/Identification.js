import React, { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000';

export default function Identification() {
  const [video, setVideo]       = useState(null);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [progress, setProgress] = useState('');

  const handleVideo = e => setVideo(e.target.files[0]);

  const handleSubmit = async () => {
    if (!video) {
      setError('Please upload a video file');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress('Uploading video...');

    const data = new FormData();
    data.append('video', video);

    try {
      setProgress(
        'Analyzing video — detecting faces and occlusions...'
      );
      const res = await axios.post(
        `${API}/api/identification/analyze-video`,
        data, { timeout: 600000 }
      );
      setResult(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Analysis failed'
      );
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.shield}>⚖</div>
        <div>
          <div style={s.headerTitle}>
            Criminal Identification — Video Analysis
          </div>
          <div style={s.headerSub}>
            Upload surveillance footage for AI-powered identification
          </div>
        </div>
      </div>

      {/* Upload Card */}
      <div style={s.card}>
        <div style={s.cardTitle}>
          🎥 UPLOAD VIDEO FILE
        </div>
        <div style={s.hint}>
          Supported: MP4, MOV, AVI — Mobile phone,
          CCTV, dashcam footage
        </div>

        <label style={s.uploadArea}>
          <input type="file" accept="video/*"
            onChange={handleVideo}
            style={{ display: 'none' }} />
          <div style={s.uploadIcon}>📹</div>
          <div style={s.uploadText}>
            {video ? video.name : 'Click to select video file'}
          </div>
          {video && (
            <div style={s.uploadSize}>
              {(video.size / 1024 / 1024).toFixed(1)} MB
            </div>
          )}
        </label>

        <button onClick={handleSubmit} disabled={loading}
          style={{
            ...s.btn,
            opacity: loading ? 0.6 : 1
          }}>
          {loading
            ? `⏳ ${progress}`
            : '🔍 ANALYZE VIDEO'}
        </button>

        {loading && (
          <div style={s.progressBox}>
            <div style={s.progressBar}>
              <div style={s.progressFill} />
            </div>
            <div style={s.progressText}>
              Processing frames — this may take several
              minutes on CPU hardware...
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={s.errorBox}>⚠️ {error}</div>
      )}

      {/* Results */}
      {result && (
        <div>
          {/* Summary */}
          <div style={s.summaryCard}>
            <div style={s.summaryTitle}>
              ANALYSIS COMPLETE — CASE {result.case_id}
            </div>
            <div style={s.summaryGrid}>
              <SummaryItem label="Video File"
                value={result.video_file} />
              <SummaryItem label="Duration"
                value={`${result.duration?.toFixed(1)}s`} />
              <SummaryItem label="Total Frames"
                value={result.total_frames} />
              <SummaryItem label="Frames Analysed"
                value={result.processed_frames} />
            </div>
          </div>

          {/* Matches */}
          {result.confirmed_matches.length === 0 ? (
            <div style={s.noMatch}>
              <div style={{ fontSize: '32px' }}>✅</div>
              <div style={s.noMatchText}>
                NO REGISTERED CRIMINALS IDENTIFIED
              </div>
              <div style={s.noMatchSub}>
                No matches found in criminal registry
              </div>
            </div>
          ) : (
            <div>
              <div style={s.alertBanner}>
                🚨 {result.confirmed_matches.length} CRIMINAL(S)
                IDENTIFIED IN FOOTAGE
              </div>
              {result.confirmed_matches.map((m, i) => (
                <div key={i} style={s.matchCard}>
                  <div style={s.matchHeader}>
                    <div style={s.matchLeft}>
                      <img
                        src={`${API}/api/enrollment/photo/${m.criminal_id}`}
                        alt={m.name}
                        style={s.matchPhoto}
                        onError={e => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div>
                        <div style={s.matchName}>{m.name}</div>
                        <div style={s.matchId}>
                          {m.criminal_id}
                        </div>
                      </div>
                    </div>
                    <div style={s.matchConf}>
                      {(m.avg_confidence * 100).toFixed(1)}%
                      <div style={s.matchConfLabel}>
                        CONFIDENCE
                      </div>
                    </div>
                  </div>

                  <div style={s.matchGrid}>
                    <MatchItem label="Frames Matched"
                      value={m.frame_count} />
                    <MatchItem label="First Seen"
                      value={`${m.first_seen_at?.toFixed(1)}s`} />
                    <MatchItem label="Occlusions"
                      value={m.occlusions?.join(', ')
                        || 'None detected'} />
                    <MatchItem label="Status"
                      value="CONFIRMED" highlight />
                  </div>

                  {m.blockchain_tx && (
                    <div style={s.txBox}>
                      <div style={s.txLabel}>
                        🔗 BLOCKCHAIN TRANSACTION HASH
                      </div>
                      <div style={s.txValue}>
                        {m.blockchain_tx}
                      </div>
                      <div style={s.txNote}>
                        This identification is permanently
                        recorded on the Ethereum blockchain
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div style={s.summaryItem}>
      <div style={s.summaryVal}>{value}</div>
      <div style={s.summaryLabel}>{label}</div>
    </div>
  );
}

function MatchItem({ label, value, highlight }) {
  return (
    <div style={s.matchItem}>
      <div style={s.matchItemLabel}>{label}</div>
      <div style={{
        ...s.matchItemVal,
        color: highlight ? '#22c55e' : '#c8d8f0'
      }}>
        {value}
      </div>
    </div>
  );
}

const s = {
  page:        { background:'#0a0e1a', minHeight:'100vh',
                 color:'#c8d8f0',
                 fontFamily:"'Courier New',monospace",
                 padding:'0 0 60px' },
  header:      { background:
                   'linear-gradient(135deg,#0f1e3d,#1a2d5a)',
                 borderBottom:'2px solid #1e40af',
                 padding:'20px 32px',
                 display:'flex', gap:'16px',
                 alignItems:'center',
                 marginBottom:'24px' },
  shield:      { width:'36px', height:'36px',
                 background:'#1a3a5c',
                 border:'2px solid #2a6fc4',
                 borderRadius:'4px', display:'flex',
                 alignItems:'center',
                 justifyContent:'center',
                 fontSize:'18px', flexShrink:0 },
  headerTitle: { fontSize:'14px', fontWeight:'700',
                 color:'#60a5fa', letterSpacing:'2px',
                 textTransform:'uppercase' },
  headerSub:   { fontSize:'10px', color:'#4a7aaa',
                 letterSpacing:'1px', marginTop:'2px' },
  card:        { maxWidth:'700px', margin:'0 auto 24px',
                 background:'#0d1526',
                 border:'1px solid #1a3a5c',
                 padding:'24px' },
  cardTitle:   { fontSize:'10px', fontWeight:'700',
                 color:'#4a8adc', letterSpacing:'3px',
                 borderLeft:'3px solid #2a6fc4',
                 paddingLeft:'10px', marginBottom:'8px' },
  hint:        { fontSize:'10px', color:'#4a7aaa',
                 marginBottom:'20px', letterSpacing:'0.5px' },
  uploadArea:  { display:'flex', flexDirection:'column',
                 alignItems:'center', justifyContent:'center',
                 border:'2px dashed #1a3a5c',
                 padding:'40px', cursor:'pointer',
                 marginBottom:'20px',
                 background:'#0a1020',
                 transition:'border-color 0.2s' },
  uploadIcon:  { fontSize:'40px', marginBottom:'12px' },
  uploadText:  { fontSize:'12px', color:'#4a7aaa',
                 letterSpacing:'1px', textAlign:'center' },
  uploadSize:  { fontSize:'10px', color:'#22c55e',
                 marginTop:'6px' },
  btn:         { width:'100%', padding:'14px',
                 background:'#1d4ed8', color:'#fff',
                 border:'none', cursor:'pointer',
                 fontSize:'12px', fontWeight:'700',
                 fontFamily:"'Courier New',monospace",
                 letterSpacing:'3px',
                 textTransform:'uppercase' },
  progressBox: { marginTop:'16px' },
  progressBar: { height:'2px', background:'#1a3a5c',
                 marginBottom:'10px', overflow:'hidden' },
  progressFill:{ height:'100%', width:'60%',
                 background:'#2a6fc4',
                 animation:'none' },
  progressText:{ fontSize:'10px', color:'#4a7aaa',
                 letterSpacing:'1px',
                 textAlign:'center', lineHeight:'1.6' },
  errorBox:    { maxWidth:'700px', margin:'0 auto 16px',
                 background:'#1c0000',
                 border:'1px solid #ef4444',
                 color:'#fca5a5', padding:'12px 16px',
                 fontSize:'12px' },
  summaryCard: { maxWidth:'700px', margin:'0 auto 16px',
                 background:'#0d1526',
                 border:'1px solid #1a3a5c',
                 padding:'20px' },
  summaryTitle:{ fontSize:'10px', fontWeight:'700',
                 color:'#22c55e', letterSpacing:'3px',
                 marginBottom:'16px',
                 borderLeft:'3px solid #22c55e',
                 paddingLeft:'10px' },
  summaryGrid: { display:'grid',
                 gridTemplateColumns:'repeat(4,1fr)',
                 gap:'12px' },
  summaryItem: { textAlign:'center' },
  summaryVal:  { fontSize:'18px', fontWeight:'700',
                 color:'#60a5fa' },
  summaryLabel:{ fontSize:'9px', color:'#4a7aaa',
                 letterSpacing:'1px', marginTop:'2px' },
  noMatch:     { maxWidth:'700px', margin:'0 auto',
                 background:'#021207',
                 border:'1px solid #166534',
                 padding:'40px', textAlign:'center' },
  noMatchText: { fontSize:'13px', fontWeight:'700',
                 color:'#22c55e', letterSpacing:'2px',
                 marginTop:'12px' },
  noMatchSub:  { fontSize:'10px', color:'#4a7aaa',
                 marginTop:'6px', letterSpacing:'1px' },
  alertBanner: { maxWidth:'700px', margin:'0 auto 12px',
                 background:'#450a0a',
                 border:'1px solid #dc2626',
                 color:'#fca5a5', padding:'14px 20px',
                 fontSize:'12px', fontWeight:'700',
                 letterSpacing:'2px',
                 textAlign:'center' },
  matchCard:   { maxWidth:'700px', margin:'0 auto 12px',
                 background:'#0d1526',
                 border:'2px solid #dc2626',
                 padding:'20px' },
  matchHeader: { display:'flex', justifyContent:'space-between',
                 alignItems:'center', marginBottom:'16px' },
  matchLeft:   { display:'flex', alignItems:'center',
                 gap:'14px' },
  matchPhoto:  { width:'60px', height:'75px',
                 objectFit:'cover', objectPosition:'top',
                 border:'2px solid #dc2626' },
  matchName:   { fontSize:'16px', fontWeight:'700',
                 color:'#f1f5f9', letterSpacing:'1px',
                 textTransform:'uppercase' },
  matchId:     { fontSize:'11px', color:'#dc2626',
                 fontFamily:"'Courier New',monospace",
                 marginTop:'4px', letterSpacing:'1px' },
  matchConf:   { textAlign:'center', color:'#ef4444',
                 fontSize:'24px', fontWeight:'700' },
  matchConfLabel:{ fontSize:'9px', color:'#4a7aaa',
                   letterSpacing:'1px' },
  matchGrid:   { display:'grid',
                 gridTemplateColumns:'repeat(4,1fr)',
                 gap:'12px', marginBottom:'16px' },
  matchItem:   { },
  matchItemLabel:{ fontSize:'9px', color:'#4a7aaa',
                   letterSpacing:'1px',
                   textTransform:'uppercase' },
  matchItemVal:{ fontSize:'12px', marginTop:'4px',
                 fontFamily:"'Courier New',monospace" },
  txBox:       { background:'#0a1020',
                 border:'1px solid #1e40af',
                 padding:'14px' },
  txLabel:     { fontSize:'9px', color:'#60a5fa',
                 letterSpacing:'2px', marginBottom:'8px',
                 fontWeight:'700' },
  txValue:     { fontSize:'11px', color:'#e2e8f0',
                 fontFamily:"'Courier New',monospace",
                 wordBreak:'break-all',
                 background:'#0d1526',
                 padding:'10px', marginBottom:'8px' },
  txNote:      { fontSize:'9px', color:'#4a7aaa',
                 letterSpacing:'0.5px', lineHeight:'1.6' },
};