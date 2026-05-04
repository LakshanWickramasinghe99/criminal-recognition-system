import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000';

export default function Dashboard() {
  const [stats, setStats]         = useState(null);
  const [criminals, setCriminals] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [time, setTime]           = useState('');
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString(
        'en-GB', { hour12: false }
      ));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/dashboard/stats`),
      axios.get(`${API}/api/dashboard/criminals`),
    ]).then(([s, c]) => {
      setStats(s.data);
      setCriminals(c.data.criminals || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <p style={s.loading}>LOADING SECURE DATA...</p>
  );

  return (
    <div style={s.dash}>

      {/* Top bar */}
      <div style={s.topbar}>
        <div style={s.agency}>
          <div style={s.shield}>⚖</div>
          <div>
            <div style={s.agencyName}>
              Law Enforcement Command System
            </div>
            <div style={s.agencySub}>
              BLOCKCHAIN CRIMINAL REGISTRY — CLASSIFIED
            </div>
          </div>
        </div>
        <div style={s.statusBar}>
          <div style={s.liveDot} />
          <span style={s.liveLabel}>LIVE</span>
          <span style={s.clock}>{time}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div style={s.statsGrid}>
        <StatCard
          label="Registered Criminals"
          value={String(stats?.total_criminals ?? 0)
            .padStart(4, '0')}
          accent="#3a8adc" sub="TOTAL RECORDS" />
        <StatCard
          label="Identifications"
          value={stats?.total_identifications ?? 0}
          accent="#e05050" sub="TOTAL MATCHES" />
        <StatCard
          label="Blockchain Block"
          value={`#${stats?.blockchain_block ?? 0}`}
          accent="#7a5af8" sub="CURRENT HEIGHT" />
        <StatCard
          label="System Status"
          value={stats?.blockchain_connected
            ? 'ONLINE' : 'OFFLINE'}
          accent={stats?.blockchain_connected
            ? '#22c55e' : '#e05050'}
          sub="NODE STATUS" small />
      </div>

      {/* Criminal Cards */}
      <div style={s.panelHeader}>
        <div style={s.panelTitle}>
          Criminal Registry — Blockchain Verified
        </div>
        <span style={s.badgeCount}>
          {criminals.length} RECORDS
        </span>
      </div>

      {criminals.length === 0 ? (
        <div style={s.tableWrap}>
          <p style={s.empty}>NO RECORDS FOUND</p>
        </div>
      ) : (
        <div style={s.criminalGrid}>
          {criminals.map(c => (
            <CriminalCard
              key={c.criminal_id}
              criminal={c}
              onClick={() => setSelected(c)}
            />
          ))}
        </div>
      )}

      {/* Table View */}
      {criminals.length > 0 && (
        <>
          <div style={{ ...s.panelHeader, marginTop: '24px' }}>
            <div style={s.panelTitle}>Registry Table View</div>
          </div>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  {['Photo', 'Subject ID', 'Full Name',
                    'Age', 'Crime History',
                    'Registered', 'Hash'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {criminals.map(c => (
                  <TableRow
                    key={c.criminal_id}
                    c={c}
                    onClick={() => setSelected(c)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div style={s.footer}>
        <span style={s.footerTxt}>
          LECS v2.4.1 — RESTRICTED ACCESS ONLY
        </span>
        <span style={s.secureBadge}>ENCRYPTED — AES-256</span>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={s.overlay}
          onClick={() => setSelected(null)}>
          <div style={s.modal}
            onClick={e => e.stopPropagation()}>

            <div style={s.modalHeader}>
              <div style={s.modalHeaderLeft}>
                <div style={s.shield}>⚖</div>
                <div>
                  <div style={s.modalTitle}>
                    CRIMINAL RECORD
                  </div>
                  <div style={s.modalSubtitle}>
                    BLOCKCHAIN VERIFIED — CLASSIFIED
                  </div>
                </div>
              </div>
              <button style={s.closeBtn}
                onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>

            <div style={s.modalDivider} />

            <div style={s.modalBody}>
              <div style={s.modalLeft}>
                <PhotoDisplay
                  criminal_id={selected.criminal_id}
                  large />
                <div style={s.modalIdTag}>
                  {selected.criminal_id}
                </div>
                <div style={s.wantedBadge}>
                  {selected.is_active
                    ? '🔴 WANTED' : '✅ INACTIVE'}
                </div>
              </div>
              <div style={s.modalRight}>
                <div style={s.modalName}>
                  {selected.name}
                </div>
                <div style={s.modalSection}>PERSONAL</div>
                <ModalRow label="Age"
                  value={selected.age} />
                <ModalRow label="Status"
                  value={selected.is_active
                    ? 'ACTIVE / WANTED' : 'INACTIVE'} />
                <div style={s.modalSection}>
                  CRIME RECORD
                </div>
                <ModalRow label="History"
                  value={selected.crime_history} />
                <div style={s.modalSection}>BLOCKCHAIN</div>
                <ModalRow label="Registered"
                  value={new Date(
                    selected.registered_at * 1000
                  ).toLocaleString('en-GB',
                    { hour12: false })} />
                <ModalRow label="Officer"
                  value={selected.registered_by
                    ?.slice(0, 20) + '...'} />
                <ModalRow label="Hash"
                  value={selected.embedding_hash
                    ?.slice(0, 32) + '...'} />
              </div>
            </div>

            <div style={s.modalDivider} />
            <div style={s.modalFooter}>
              <span style={s.modalFooterTxt}>
                RECORD IMMUTABLE — STORED ON ETHEREUM BLOCKCHAIN
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CriminalCard({ criminal, onClick }) {
  return (
    <div style={s.card} onClick={onClick}>
      <div style={s.cardPhotoWrap}>
        <PhotoDisplay criminal_id={criminal.criminal_id} />
        <div style={s.cardWantedTag}>
          {criminal.is_active ? '🔴 WANTED' : '✅ INACTIVE'}
        </div>
      </div>
      <div style={s.cardBody}>
        <div style={s.cardName}>{criminal.name}</div>
        <div style={s.cardId}>{criminal.criminal_id}</div>
        <div style={s.cardCrime}>
          {criminal.crime_history?.slice(0, 50)}...
        </div>
        <div style={s.cardHash}>
          ⬡ {criminal.embedding_hash?.slice(0, 14)}...
        </div>
      </div>
      <div style={s.cardFooter}>VIEW FULL RECORD →</div>
    </div>
  );
}

function TableRow({ c, onClick }) {
  return (
    <tr style={{ ...s.tr, cursor: 'pointer' }}
      onClick={onClick}>
      <td style={s.td}>
        <PhotoDisplay criminal_id={c.criminal_id} thumb />
      </td>
      <td style={s.td}>
        <span style={s.idTag}>{c.criminal_id}</span>
      </td>
      <td style={{ ...s.td, ...s.nameCell }}>{c.name}</td>
      <td style={{ ...s.td, ...s.ageCell }}>{c.age}</td>
      <td style={s.td}>
        <span style={s.crimeTag}>
          {c.crime_history?.slice(0, 40)}...
        </span>
      </td>
      <td style={{ ...s.td, ...s.dateCell }}>
        {new Date(c.registered_at * 1000)
          .toLocaleString('en-GB', { hour12: false })}
      </td>
      <td style={{ ...s.td, ...s.hashCell }}>
        <span style={s.chainIcon}>⬡ </span>
        {c.embedding_hash?.slice(0, 14)}...
      </td>
    </tr>
  );
}

function PhotoDisplay({ criminal_id, large, thumb }) {
  const [error, setError] = useState(false);
  const size = large
    ? { width: '140px', height: '180px' }
    : thumb
    ? { width: '44px',  height: '52px'  }
    : { width: '100%',  height: '180px' };

  if (error) {
    return (
      <div style={{
        ...s.photoFallback, ...size,
        fontSize: large ? '48px'
          : thumb ? '20px' : '36px',
      }}>👤</div>
    );
  }
  return (
    <img
      src={`${API}/api/enrollment/photo/${criminal_id}`}
      alt={criminal_id}
      style={{
        ...size,
        objectFit: 'cover',
        objectPosition: 'top',
        borderRadius: large ? '4px' : thumb ? '2px' : '0',
        border: large
          ? '2px solid #2a6fc4'
          : '1px solid #1a3a5c',
        display: 'block',
      }}
      onError={() => setError(true)}
    />
  );
}

function StatCard({ label, accent, value, sub, small }) {
  return (
    <div style={{
      ...s.statCard,
      borderTop: `2px solid ${accent}`
    }}>
      <div style={s.statLabel}>{label}</div>
      <div style={{
        ...s.statVal, color: accent,
        fontSize: small ? '14px' : '26px',
        paddingTop: small ? '6px' : 0,
      }}>{value}</div>
      <div style={s.statSub}>{sub}</div>
    </div>
  );
}

function ModalRow({ label, value }) {
  return (
    <div style={s.modalRow}>
      <div style={s.modalRowLabel}>{label}</div>
      <div style={s.modalRowValue}>{value || '—'}</div>
    </div>
  );
}

const s = {
  dash:       { background:'#0a0e1a', minHeight:'100vh',
                color:'#c8d8f0',
                fontFamily:"'Courier New', monospace" },
  loading:    { color:'#2a6fc4', textAlign:'center',
                marginTop:'4rem', letterSpacing:'3px',
                fontSize:'12px' },
  topbar:     { display:'flex', alignItems:'center',
                justifyContent:'space-between',
                borderBottom:'1px solid #1a3a5c',
                paddingBottom:'14px', marginBottom:'20px' },
  agency:     { display:'flex', alignItems:'center',
                gap:'12px' },
  shield:     { width:'36px', height:'36px',
                background:'#1a3a5c',
                border:'2px solid #2a6fc4',
                borderRadius:'4px', display:'flex',
                alignItems:'center', justifyContent:'center',
                fontSize:'18px' },
  agencyName: { fontSize:'13px', fontWeight:'700',
                color:'#e0ecff', letterSpacing:'2px',
                textTransform:'uppercase' },
  agencySub:  { fontSize:'10px', color:'#4a7aaa',
                letterSpacing:'1px', marginTop:'2px' },
  statusBar:  { display:'flex', alignItems:'center',
                gap:'12px' },
  liveDot:    { width:'8px', height:'8px',
                borderRadius:'50%', background:'#22c55e' },
  liveLabel:  { fontSize:'10px', color:'#22c55e',
                letterSpacing:'2px' },
  clock:      { fontSize:'12px', color:'#4a7aaa',
                letterSpacing:'1px' },
  statsGrid:  { display:'grid',
                gridTemplateColumns:'repeat(4,1fr)',
                gap:'10px', marginBottom:'18px' },
  statCard:   { background:'#0d1526',
                border:'1px solid #1a3a5c',
                padding:'14px 16px' },
  statLabel:  { fontSize:'9px', color:'#4a7aaa',
                letterSpacing:'2px',
                textTransform:'uppercase',
                marginBottom:'6px' },
  statVal:    { fontWeight:'700', letterSpacing:'1px',
                fontFamily:"'Courier New', monospace" },
  statSub:    { fontSize:'9px', color:'#2a4a6a',
                marginTop:'4px', letterSpacing:'1px' },
  panelHeader:{ display:'flex', alignItems:'center',
                justifyContent:'space-between',
                marginBottom:'14px' },
  panelTitle: { fontSize:'10px', fontWeight:'700',
                color:'#4a8adc', letterSpacing:'3px',
                textTransform:'uppercase',
                borderLeft:'3px solid #2a6fc4',
                paddingLeft:'10px' },
  badgeCount: { background:'#0d2040',
                border:'1px solid #2a4a6a',
                color:'#4a8adc', fontSize:'10px',
                padding:'2px 8px', borderRadius:'2px',
                letterSpacing:'1px' },
  criminalGrid:{ display:'grid',
                gridTemplateColumns:
                  'repeat(auto-fill, minmax(200px,1fr))',
                gap:'12px', marginBottom:'8px' },
  card:       { background:'#0d1526',
                border:'1px solid #1a3a5c',
                cursor:'pointer', overflow:'hidden' },
  cardPhotoWrap:{ position:'relative', height:'180px',
                  background:'#050a14', overflow:'hidden' },
  cardWantedTag:{ position:'absolute', bottom:'6px',
                  left:'6px',
                  background:'rgba(0,0,0,0.8)',
                  color:'#e05050', fontSize:'9px',
                  padding:'2px 8px', letterSpacing:'1px',
                  fontWeight:'700' },
  cardBody:   { padding:'10px 12px' },
  cardName:   { fontSize:'13px', fontWeight:'700',
                color:'#ddeeff', marginBottom:'3px',
                letterSpacing:'0.5px' },
  cardId:     { fontSize:'10px', color:'#3a8adc',
                fontFamily:"'Courier New', monospace",
                marginBottom:'6px', letterSpacing:'1px' },
  cardCrime:  { fontSize:'9px', color:'#e05050',
                letterSpacing:'0.5px', marginBottom:'6px',
                textTransform:'uppercase' },
  cardHash:   { fontSize:'9px', color:'#2a5a7a',
                fontFamily:"'Courier New', monospace" },
  cardFooter: { background:'#0a1020',
                borderTop:'1px solid #1a3a5c',
                color:'#2a6fc4', fontSize:'9px',
                padding:'7px 12px', letterSpacing:'2px',
                textAlign:'center' },
  photoFallback:{ background:'#0d1a2d',
                  border:'1px solid #1a3a5c',
                  display:'flex', alignItems:'center',
                  justifyContent:'center',
                  color:'#2a5a7a' },
  tableWrap:  { background:'#0d1526',
                border:'1px solid #1a3a5c' },
  table:      { width:'100%', borderCollapse:'collapse',
                fontSize:'11px' },
  thead:      { background:'#0a1020',
                borderBottom:'2px solid #1a3a5c' },
  th:         { padding:'10px 12px', textAlign:'left',
                color:'#2a5a8a', letterSpacing:'2px',
                fontSize:'9px', textTransform:'uppercase',
                fontWeight:'700' },
  tr:         { borderBottom:'1px solid #0f1e35' },
  td:         { padding:'10px 12px', color:'#a0c0e8',
                verticalAlign:'middle' },
  idTag:      { background:'#0a1a30',
                border:'1px solid #1a3a5c',
                color:'#3a8adc', fontSize:'10px',
                padding:'3px 8px', letterSpacing:'1px',
                borderRadius:'2px',
                fontFamily:"'Courier New', monospace" },
  nameCell:   { color:'#ddeeff', fontWeight:'600',
                letterSpacing:'0.5px' },
  ageCell:    { color:'#6a9abf',
                fontFamily:"'Courier New', monospace" },
  crimeTag:   { display:'inline-block',
                background:'#1a0a0a',
                border:'1px solid #4a1a1a',
                color:'#e05050', fontSize:'9px',
                padding:'2px 8px', borderRadius:'2px',
                letterSpacing:'1px',
                textTransform:'uppercase' },
  hashCell:   { fontFamily:"'Courier New', monospace",
                fontSize:'9px', color:'#2a5a7a',
                letterSpacing:'1px' },
  chainIcon:  { color:'#7a5af8', fontSize:'9px',
                marginRight:'4px' },
  dateCell:   { fontFamily:"'Courier New', monospace",
                fontSize:'10px', color:'#2a5a7a' },
  empty:      { color:'#2a5a7a', textAlign:'center',
                padding:'2rem', letterSpacing:'3px',
                fontSize:'11px' },
  footer:     { display:'flex', alignItems:'center',
                justifyContent:'space-between',
                marginTop:'14px', paddingTop:'12px',
                borderTop:'1px solid #0f1e35' },
  footerTxt:  { fontSize:'9px', color:'#1a3a5a',
                letterSpacing:'1.5px' },
  secureBadge:{ background:'#071020',
                border:'1px solid #0f2040',
                color:'#2a5a7a', fontSize:'9px',
                padding:'3px 10px', letterSpacing:'2px' },
  overlay:    { position:'fixed', top:0, left:0,
                right:0, bottom:0,
                background:'rgba(0,0,0,0.85)',
                display:'flex', alignItems:'center',
                justifyContent:'center', zIndex:1000 },
  modal:      { background:'#0d1526',
                border:'1px solid #2a6fc4',
                width:'600px', maxWidth:'95vw',
                maxHeight:'90vh', overflowY:'auto',
                position:'relative' },
  modalHeader:{ display:'flex', alignItems:'center',
                justifyContent:'space-between',
                padding:'16px 20px', background:'#0a1020',
                borderBottom:'1px solid #1a3a5c' },
  modalHeaderLeft:{ display:'flex', alignItems:'center',
                    gap:'12px' },
  modalTitle: { fontSize:'12px', fontWeight:'700',
                color:'#e0ecff', letterSpacing:'3px',
                textTransform:'uppercase' },
  modalSubtitle:{ fontSize:'9px', color:'#4a7aaa',
                  letterSpacing:'1px', marginTop:'2px' },
  closeBtn:   { background:'none',
                border:'1px solid #2a4a6a',
                color:'#4a7aaa', cursor:'pointer',
                fontSize:'14px', padding:'4px 10px',
                fontFamily:'inherit' },
  modalDivider:{ height:'1px', background:'#1a3a5c' },
  modalBody:  { display:'flex', gap:'20px',
                padding:'20px' },
  modalLeft:  { width:'160px', flexShrink:0,
                display:'flex', flexDirection:'column',
                alignItems:'center', gap:'10px' },
  modalIdTag: { background:'#0a1a30',
                border:'1px solid #1a3a5c',
                color:'#3a8adc', fontSize:'11px',
                padding:'4px 12px', letterSpacing:'2px',
                fontFamily:"'Courier New', monospace",
                textAlign:'center', width:'100%',
                boxSizing:'border-box' },
  wantedBadge:{ background:'#1a0505',
                border:'1px solid #4a1a1a',
                color:'#e05050', fontSize:'10px',
                padding:'4px 12px', letterSpacing:'2px',
                textAlign:'center', width:'100%',
                boxSizing:'border-box', fontWeight:'700' },
  modalRight: { flex:1 },
  modalName:  { fontSize:'18px', fontWeight:'700',
                color:'#e0ecff', letterSpacing:'1px',
                marginBottom:'16px',
                textTransform:'uppercase',
                borderBottom:'1px solid #1a3a5c',
                paddingBottom:'12px' },
  modalSection:{ fontSize:'9px', color:'#2a6fc4',
                 letterSpacing:'3px',
                 textTransform:'uppercase',
                 marginTop:'14px', marginBottom:'8px',
                 borderLeft:'2px solid #2a6fc4',
                 paddingLeft:'8px' },
  modalRow:   { display:'flex', gap:'12px',
                padding:'6px 0',
                borderBottom:'1px solid #0f1e35' },
  modalRowLabel:{ fontSize:'9px', color:'#4a7aaa',
                  letterSpacing:'1px',
                  textTransform:'uppercase',
                  width:'90px', flexShrink:0,
                  paddingTop:'2px' },
  modalRowValue:{ fontSize:'11px', color:'#c0d8f0',
                  fontFamily:"'Courier New', monospace",
                  lineHeight:'1.5' },
  modalFooter:{ padding:'10px 20px',
                background:'#0a1020', textAlign:'center' },
  modalFooterTxt:{ fontSize:'9px', color:'#1a3a5a',
                   letterSpacing:'2px' },
};