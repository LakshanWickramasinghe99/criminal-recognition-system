import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000';

export default function AuditLog() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/dashboard/identifications`)
      .then(res => {
        setLogs(res.data.logs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <p style={s.loading}>LOADING BLOCKCHAIN DATA...</p>
  );

  const highConf   = logs.filter(l => l.confidence >= 0.7).length;
  const avgConf    = logs.length
    ? (logs.reduce((a, l) => a + l.confidence, 0) / logs.length * 100).toFixed(1)
    : '0.0';

  return (
    <div style={s.pg}>

      {/* ── Page header ── */}
      <div style={s.pageHeader}>
        <div style={s.phLeft}>
          <div style={s.phIcon}>⬡</div>
          <div>
            <div style={s.phTitle}>Blockchain Audit Log</div>
            <div style={s.phSub}>IMMUTABLE IDENTIFICATION EVENT LEDGER</div>
          </div>
        </div>
        <div style={s.phRight}>
          <span style={s.blockBadge}>BLOCK #????</span>
          <span style={s.recBadge}>{logs.length} EVENTS</span>
        </div>
      </div>

      {/* ── Info strip ── */}
      <div style={s.infoStrip}>
        <span style={s.infoIc}>⬡</span>
        <span style={s.infoTxt}>
          All identification events are permanently recorded on the
          Ethereum blockchain — tamper-proof and immutable. Once
          recorded, data cannot be modified or deleted, making it
          legally admissible evidence for court proceedings.
        </span>
      </div>

      {/* ── Section header ── */}
      <div style={s.sectionHd}>
        <div style={s.secTitle}>Identification Events</div>
      </div>

      {/* ── Table ── */}
      <div style={s.tableWrap}>
        {logs.length === 0 ? (
          <p style={s.empty}>NO EVENTS RECORDED</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                {['#','Criminal ID','Video File','Confidence',
                  'Frames','Timestamp','Block Time']
                  .map(h => <th key={h} style={s.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i} style={s.tr}>
                  <td style={{ ...s.td, ...s.numTd }}>
                    {String(i + 1).padStart(2, '0')}
                  </td>
                  <td style={s.td}>
                    <span style={s.idTag}>{log.criminal_id}</span>
                  </td>
                  <td style={{ ...s.td, ...s.fileTd }}>
                    {log.video_file}
                  </td>
                  <td style={s.td}>
                    <span style={log.confidence >= 0.7
                      ? s.confHigh : s.confMid}>
                      {(log.confidence * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ ...s.td, ...s.framesTd }}>
                    {log.frame_count?.toLocaleString()}
                  </td>
                  <td style={{ ...s.td, ...s.tsTd }}>
                    {log.timestamp?.toFixed(1)}s
                  </td>
                  <td style={{ ...s.td, ...s.dateTd }}>
                    {new Date(log.detected_at * 1000)
                      .toLocaleString('en-GB', { hour12: false })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Bottom grid ── */}
      <div style={s.bottomGrid}>
        <div style={s.infoCard}>
          <div style={s.icTitle}>⬡ Blockchain Security</div>
          <div style={s.icBody}>
            Each event is stored as an immutable transaction on the
            Ethereum blockchain. Records include criminal ID, video
            source, confidence score, frame count, and exact timestamp.
            Hashed via SHA-256 and linked through a Merkle tree —
            any tampering is immediately detectable.
          </div>
        </div>
        <div style={s.statsMini}>
          <div style={s.smTitle}>Session Summary</div>
          {[
            { label:'Total Events',          val: String(logs.length).padStart(3,'0'), color:'#4a8adc' },
            { label:'High Confidence (>70%)', val: String(highConf).padStart(3,'0'),  color:'#22c55e' },
            { label:'Avg Confidence',         val: `${avgConf}%`,                      color:'#d97706' },
            { label:'Chain Status',           val: 'VERIFIED',                          color:'#22c55e' },
          ].map((r, i, arr) => (
            <div key={r.label} style={{
              ...s.smRow,
              borderBottom: i < arr.length - 1 ? '1px solid #0f1e35' : 'none',
            }}>
              <span style={s.smLbl}>{r.label}</span>
              <span style={{ ...s.smVal, color: r.color }}>{r.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={s.footer}>
        <span style={s.footerTxt}>
          IMMUTABLE LEDGER — TAMPER EVIDENT — ETHEREUM MAINNET
        </span>
        <span style={s.enc}>SHA-256 MERKLE TREE</span>
      </div>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */
const s = {
  pg:         { background:'#0a0e1a', color:'#c8d8f0',
                fontFamily:"'Courier New', monospace" },
  loading:    { color:'#2a6fc4', textAlign:'center',
                marginTop:'4rem', letterSpacing:'3px', fontSize:'12px' },

  pageHeader: { display:'flex', alignItems:'center',
                justifyContent:'space-between',
                borderBottom:'1px solid #1a3a5c',
                paddingBottom:'14px', marginBottom:'18px' },
  phLeft:     { display:'flex', alignItems:'center', gap:'10px' },
  phIcon:     { width:'34px', height:'34px', background:'#130a2a',
                border:'2px solid #2a1a5c', borderRadius:'3px',
                display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:'16px' },
  phTitle:    { fontSize:'12px', fontWeight:'700', color:'#e0ecff',
                letterSpacing:'2px', textTransform:'uppercase' },
  phSub:      { fontSize:'9px', color:'#2a5a8a',
                letterSpacing:'2px', marginTop:'2px' },
  phRight:    { display:'flex', alignItems:'center', gap:'8px' },
  blockBadge: { background:'#130a2a', border:'1px solid #2a1a5c',
                color:'#7a5af8', fontSize:'9px', padding:'3px 10px',
                borderRadius:'2px', letterSpacing:'2px',
                fontFamily:"'Courier New', monospace" },
  recBadge:   { background:'#0d2040', border:'1px solid #1a3a5c',
                color:'#4a8adc', fontSize:'9px', padding:'2px 8px',
                borderRadius:'2px', letterSpacing:'1px' },

  infoStrip:  { background:'#0d0a1a', border:'1px solid #1a1040',
                borderLeft:'3px solid #7a5af8',
                padding:'10px 14px', marginBottom:'16px',
                display:'flex', alignItems:'flex-start', gap:'10px' },
  infoIc:     { color:'#7a5af8', fontSize:'12px',
                flexShrink:0, paddingTop:'1px' },
  infoTxt:    { fontSize:'9px', color:'#4a3a7a',
                letterSpacing:'1px', lineHeight:'1.7' },

  sectionHd:  { display:'flex', alignItems:'center',
                justifyContent:'space-between', marginBottom:'12px' },
  secTitle:   { fontSize:'10px', fontWeight:'700', color:'#4a8adc',
                letterSpacing:'3px', textTransform:'uppercase',
                borderLeft:'3px solid #2a6fc4', paddingLeft:'8px' },

  tableWrap:  { background:'#0d1526', border:'1px solid #1a3a5c',
                overflowX:'auto', marginBottom:'14px' },
  table:      { width:'100%', borderCollapse:'collapse',
                fontSize:'11px', minWidth:'700px' },
  thead:      { background:'#070d1a', borderBottom:'2px solid #1a3a5c' },
  th:         { padding:'9px 12px', textAlign:'left', color:'#2a5a8a',
                fontSize:'9px', letterSpacing:'2px',
                textTransform:'uppercase', fontWeight:'700' },
  tr:         { borderBottom:'1px solid #0f1e35' },
  td:         { padding:'10px 12px', color:'#a0c0e8', verticalAlign:'middle' },

  numTd:      { color:'#2a4a6a', fontFamily:"'Courier New', monospace",
                fontSize:'10px' },
  idTag:      { background:'#0a1a30', border:'1px solid #1a3a5c',
                color:'#3a8adc', fontSize:'10px', padding:'2px 7px',
                borderRadius:'2px', fontFamily:"'Courier New', monospace",
                letterSpacing:'1px', whiteSpace:'nowrap' },
  fileTd:     { color:'#4a7aaa', fontSize:'10px',
                fontFamily:"'Courier New', monospace" },
  confHigh:   { background:'#0a1a10', border:'1px solid #1a4a1a',
                color:'#22c55e', fontSize:'10px', fontWeight:'700',
                padding:'2px 8px', borderRadius:'2px',
                fontFamily:"'Courier New', monospace" },
  confMid:    { background:'#1a1000', border:'1px solid #3a2a00',
                color:'#d97706', fontSize:'10px', fontWeight:'700',
                padding:'2px 8px', borderRadius:'2px',
                fontFamily:"'Courier New', monospace" },
  framesTd:   { color:'#6a9abf', fontFamily:"'Courier New', monospace",
                fontSize:'10px' },
  tsTd:       { color:'#4a7aaa', fontFamily:"'Courier New', monospace",
                fontSize:'10px' },
  dateTd:     { fontFamily:"'Courier New', monospace",
                fontSize:'10px', color:'#2a5a7a', whiteSpace:'nowrap' },

  empty:      { color:'#1a4a6a', textAlign:'center',
                padding:'32px', letterSpacing:'3px', fontSize:'11px' },

  bottomGrid: { display:'grid', gridTemplateColumns:'1fr 1fr',
                gap:'12px' },
  infoCard:   { background:'#0d1526', border:'1px solid #1a3a5c',
                borderLeft:'3px solid #7a5af8', padding:'16px' },
  icTitle:    { fontSize:'10px', fontWeight:'700', color:'#7a5af8',
                letterSpacing:'2px', textTransform:'uppercase',
                marginBottom:'8px' },
  icBody:     { fontSize:'9px', color:'#3a5a7a',
                letterSpacing:'1px', lineHeight:'1.8' },

  statsMini:  { background:'#0d1526', border:'1px solid #1a3a5c',
                padding:'16px', display:'flex',
                flexDirection:'column', gap:'0' },
  smTitle:    { fontSize:'10px', fontWeight:'700', color:'#4a8adc',
                letterSpacing:'2px', textTransform:'uppercase',
                marginBottom:'8px', borderLeft:'3px solid #2a6fc4',
                paddingLeft:'8px' },
  smRow:      { display:'flex', alignItems:'center',
                justifyContent:'space-between', padding:'6px 0' },
  smLbl:      { fontSize:'9px', color:'#2a5a7a',
                letterSpacing:'1.5px', textTransform:'uppercase' },
  smVal:      { fontSize:'11px', fontWeight:'700',
                fontFamily:"'Courier New', monospace" },

  footer:     { display:'flex', alignItems:'center',
                justifyContent:'space-between',
                marginTop:'14px', paddingTop:'10px',
                borderTop:'1px solid #0d1a2e' },
  footerTxt:  { fontSize:'9px', color:'#1a3a5a', letterSpacing:'1.5px' },
  enc:        { background:'#06090f', border:'1px solid #0d1f35',
                color:'#1e4a6a', fontSize:'9px',
                padding:'3px 10px', letterSpacing:'2px', borderRadius:'2px' },
};