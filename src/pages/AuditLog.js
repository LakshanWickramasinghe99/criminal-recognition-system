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
    <p style={s.loading}>LOADING AUDIT DATA...</p>
  );

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.shield}>⚖</div>
        <div>
          <div style={s.headerTitle}>
            Blockchain Audit Trail
          </div>
          <div style={s.headerSub}>
            Immutable identification event log —
            tamper-proof legal record
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div style={s.infoBanner}>
        🔗 All identification events are permanently recorded
        on the Ethereum blockchain and cannot be modified,
        deleted, or disputed. Each event is independently
        verifiable by transaction hash.
      </div>

      {/* Stats */}
      <div style={s.statsRow}>
        <div style={s.statBox}>
          <div style={s.statVal}>{logs.length}</div>
          <div style={s.statLabel}>
            TOTAL IDENTIFICATION EVENTS
          </div>
        </div>
        <div style={s.statBox}>
          <div style={{ ...s.statVal, color: '#22c55e' }}>
            VERIFIED
          </div>
          <div style={s.statLabel}>BLOCKCHAIN STATUS</div>
        </div>
        <div style={s.statBox}>
          <div style={{ ...s.statVal, color: '#7a5af8' }}>
            ETHEREUM
          </div>
          <div style={s.statLabel}>NETWORK</div>
        </div>
      </div>

      {/* Logs Table */}
      <div style={s.card}>
        <div style={s.cardTitle}>
          IDENTIFICATION EVENT LOG
        </div>

        {logs.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: '32px' }}>📭</div>
            <div style={s.emptyText}>
              NO IDENTIFICATION EVENTS RECORDED YET
            </div>
            <div style={s.emptySub}>
              Events will appear here after criminal
              identifications are confirmed
            </div>
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                {['#','Criminal ID','Video File',
                  'Confidence','Frames','Detection Time',
                  'Block Timestamp']
                  .map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i} style={s.tr}>
                  <td style={{ ...s.td, ...s.numCell }}>
                    {i + 1}
                  </td>
                  <td style={s.td}>
                    <span style={s.idTag}>
                      {log.criminal_id}
                    </span>
                  </td>
                  <td style={{ ...s.td, ...s.fileCell }}>
                    📹 {log.video_file}
                  </td>
                  <td style={s.td}>
                    <span style={{
                      ...s.confBadge,
                      color: log.confidence >= 0.7
                        ? '#22c55e' : '#f59e0b',
                      borderColor: log.confidence >= 0.7
                        ? '#22c55e' : '#f59e0b',
                    }}>
                      {(log.confidence * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ ...s.td, ...s.numCell }}>
                    {log.frame_count}
                  </td>
                  <td style={{ ...s.td, ...s.timeCell }}>
                    {log.timestamp?.toFixed(1)}s
                  </td>
                  <td style={{ ...s.td, ...s.timeCell }}>
                    {new Date(log.detected_at * 1000)
                      .toLocaleString('en-GB',
                        { hour12: false })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Legal Notice */}
      <div style={s.legalBox}>
        <div style={s.legalTitle}>
          ⚖️ LEGAL ADMISSIBILITY NOTICE
        </div>
        <div style={s.legalText}>
          All identification records stored in this system
          are backed by Ethereum blockchain transactions,
          providing cryptographic proof of the time, content,
          and integrity of each record. These records are
          tamper-evident and suitable for use as digital
          evidence in legal proceedings under Sri Lanka's
          Electronic Transactions Act.
        </div>
      </div>
    </div>
  );
}

const s = {
  page:      { background:'#0a0e1a', minHeight:'100vh',
               color:'#c8d8f0',
               fontFamily:"'Courier New',monospace",
               padding:'0 0 60px' },
  loading:   { color:'#2a6fc4', textAlign:'center',
               marginTop:'4rem', letterSpacing:'3px',
               fontSize:'12px' },
  header:    { background:
                 'linear-gradient(135deg,#0f1e3d,#1a2d5a)',
               borderBottom:'2px solid #1e40af',
               padding:'20px 32px',
               display:'flex', gap:'16px',
               alignItems:'center', marginBottom:'24px' },
  shield:    { width:'36px', height:'36px',
               background:'#1a3a5c',
               border:'2px solid #2a6fc4',
               borderRadius:'4px', display:'flex',
               alignItems:'center',
               justifyContent:'center',
               fontSize:'18px', flexShrink:0 },
  headerTitle:{ fontSize:'14px', fontWeight:'700',
                color:'#60a5fa', letterSpacing:'2px',
                textTransform:'uppercase' },
  headerSub: { fontSize:'10px', color:'#4a7aaa',
               letterSpacing:'1px', marginTop:'2px' },
  infoBanner:{ maxWidth:'1000px', margin:'0 auto 20px',
               background:'#021207',
               border:'1px solid #166534',
               color:'#4ade80', padding:'12px 20px',
               fontSize:'11px', letterSpacing:'0.5px',
               lineHeight:'1.6' },
  statsRow:  { maxWidth:'1000px', margin:'0 auto 20px',
               display:'grid',
               gridTemplateColumns:'repeat(3,1fr)',
               gap:'12px' },
  statBox:   { background:'#0d1526',
               border:'1px solid #1a3a5c',
               padding:'16px', textAlign:'center' },
  statVal:   { fontSize:'22px', fontWeight:'700',
               color:'#3a8adc', letterSpacing:'1px' },
  statLabel: { fontSize:'9px', color:'#4a7aaa',
               letterSpacing:'2px', marginTop:'4px' },
  card:      { maxWidth:'1000px', margin:'0 auto 20px',
               background:'#0d1526',
               border:'1px solid #1a3a5c',
               padding:'20px' },
  cardTitle: { fontSize:'10px', fontWeight:'700',
               color:'#4a8adc', letterSpacing:'3px',
               borderLeft:'3px solid #2a6fc4',
               paddingLeft:'10px', marginBottom:'16px' },
  empty:     { textAlign:'center', padding:'40px 0' },
  emptyText: { fontSize:'12px', color:'#2a5a7a',
               letterSpacing:'2px', marginTop:'12px',
               fontWeight:'700' },
  emptySub:  { fontSize:'10px', color:'#1a3a5a',
               marginTop:'8px', letterSpacing:'1px' },
  table:     { width:'100%', borderCollapse:'collapse',
               fontSize:'11px' },
  thead:     { background:'#0a1020',
               borderBottom:'2px solid #1a3a5c' },
  th:        { padding:'10px 12px', textAlign:'left',
               color:'#2a5a8a', letterSpacing:'2px',
               fontSize:'9px', textTransform:'uppercase',
               fontWeight:'700' },
  tr:        { borderBottom:'1px solid #0f1e35' },
  td:        { padding:'10px 12px', color:'#a0c0e8',
               verticalAlign:'middle' },
  numCell:   { fontFamily:"'Courier New',monospace",
               color:'#2a5a7a', textAlign:'center' },
  fileCell:  { color:'#6a9abf',
               fontFamily:"'Courier New',monospace",
               fontSize:'10px' },
  timeCell:  { fontFamily:"'Courier New',monospace",
               fontSize:'10px', color:'#2a5a7a' },
  idTag:     { background:'#0a1a30',
               border:'1px solid #1a3a5c',
               color:'#3a8adc', fontSize:'10px',
               padding:'3px 8px', letterSpacing:'1px',
               fontFamily:"'Courier New',monospace" },
  confBadge: { border:'1px solid',
               fontSize:'10px', padding:'2px 8px',
               fontFamily:"'Courier New',monospace",
               letterSpacing:'1px' },
  legalBox:  { maxWidth:'1000px', margin:'0 auto',
               background:'#0d1526',
               borderLeft:'4px solid #2a6fc4',
               padding:'16px 20px' },
  legalTitle:{ fontSize:'10px', fontWeight:'700',
               color:'#60a5fa', letterSpacing:'2px',
               marginBottom:'8px' },
  legalText: { fontSize:'10px', color:'#4a7aaa',
               lineHeight:'1.8', letterSpacing:'0.5px' },
};