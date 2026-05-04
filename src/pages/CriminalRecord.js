import React, { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000';

/* ── Inject styles once ── */
if (!document.getElementById('lecs-record-styles')) {
  const tag = document.createElement('style');
  tag.id = 'lecs-record-styles';
  tag.textContent = `
    @keyframes fadeIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
    @keyframes flickerIn { 0%{opacity:0} 20%{opacity:0.8} 40%{opacity:0.2} 60%{opacity:1} 80%{opacity:0.6} 100%{opacity:1} }
    .lecs-rec { animation: fadeIn 0.3s ease; }
    .lecs-rec-inp:focus { border-color: #2a6fc4 !important; outline: none; }
    .lecs-rec-inp:hover { border-color: #1a4a6a !important; }
    .lecs-nav-btn:hover { background: #0d1a2e !important; color: #a0c8f0 !important; }
    .lecs-tab:hover { color: #a0c8f0 !important; }
    .lecs-card:hover { border-color: #2a5a7a !important; }
    .lecs-photo-flicker { animation: flickerIn 0.5s ease forwards; }
  `;
  document.head.appendChild(tag);
}

/* ── Shared atoms ── */
function FieldRow({ label, value, mono, highlight }) {
  return (
    <div style={{
      display: 'flex', gap: '12px', padding: '7px 0',
      borderBottom: '1px solid #0a1525',
    }}>
      <div style={{
        fontSize: '9px', color: '#2a5a8a', letterSpacing: '1.5px',
        textTransform: 'uppercase', width: '130px', flexShrink: 0, paddingTop: '2px',
      }}>{label}</div>
      <div style={{
        fontSize: '11px', lineHeight: '1.5', wordBreak: 'break-all',
        fontFamily: mono ? "'Courier New', monospace" : 'inherit',
        color: highlight === 'red'   ? '#e05050'
             : highlight === 'green' ? '#22c55e'
             : highlight === 'blue'  ? '#3a8adc'
             : '#c0d8f0',
      }}>{value || '—'}</div>
    </div>
  );
}

function SectionHead({ title }) {
  return (
    <div style={{
      fontSize: '9px', color: '#3a8adc', letterSpacing: '3px',
      textTransform: 'uppercase', margin: '18px 0 10px',
      borderLeft: '2px solid #2a6fc4', paddingLeft: '8px',
    }}>{title}</div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{
      textAlign: 'center', padding: '40px 20px',
      color: '#1a3a5a', fontSize: '11px', letterSpacing: '2px',
    }}>
      <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.4 }}>{icon}</div>
      {text}
    </div>
  );
}

function Badge({ label, type }) {
  const colors = {
    red:    { bg: '#1a0505', border: '#4a1a1a', color: '#e05050' },
    green:  { bg: '#051a0a', border: '#1a4a1a', color: '#22c55e' },
    blue:   { bg: '#0a1a30', border: '#1a3a5c', color: '#3a8adc' },
    purple: { bg: '#0f0a1a', border: '#2a1a4a', color: '#7a5af8' },
    amber:  { bg: '#1a1000', border: '#3a2a00', color: '#d97706' },
    gray:   { bg: '#0d1020', border: '#1a2040', color: '#4a7aaa' },
  };
  const c = colors[type] || colors.gray;
  return (
    <span style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      fontSize: '9px', padding: '2px 8px', letterSpacing: '1px',
      textTransform: 'uppercase', display: 'inline-block',
    }}>{label}</span>
  );
}

function verdictType(v) {
  if (!v) return 'gray';
  const vl = v.toLowerCase();
  if (vl === 'guilty')     return 'red';
  if (vl === 'not guilty') return 'green';
  if (vl === 'pending')    return 'amber';
  return 'gray';
}

function statusType(s) {
  if (!s) return 'gray';
  const sl = s.toLowerCase();
  if (sl === 'wanted')               return 'red';
  if (sl === 'convicted')            return 'purple';
  if (sl === 'arrested')             return 'amber';
  if (sl === 'under investigation')  return 'blue';
  if (sl === 'released')             return 'green';
  return 'gray';
}

function PhotoDisplay({ criminal_id, large }) {
  const [err, setErr] = useState(false);
  const size = large
    ? { width: '100%', height: '220px' }
    : { width: '60px', height: '72px' };
  if (err) return (
    <div style={{
      ...size, background: '#070d1a', border: '1px solid #1a3a5c',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#1a3a5c', fontSize: large ? '48px' : '22px',
    }}>👤</div>
  );
  return (
    <img
      className="lecs-photo-flicker"
      src={`${API}/api/enrollment/photo/${criminal_id}`}
      alt={criminal_id}
      onError={() => setErr(true)}
      style={{
        ...size, objectFit: 'cover', objectPosition: 'top center',
        display: 'block', border: '1px solid #1a3a5c',
      }}
    />
  );
}

/* ── Tab panels ── */

function PersonalPanel({ rec }) {
  return (
    <>
      <SectionHead title="Personal Information" />
      <FieldRow label="Full Name"    value={rec.name}       highlight="blue" />
      <FieldRow label="Age"          value={rec.age} />
      <FieldRow label="Date of Birth" value={rec.dob} />
      <FieldRow label="NIC Number"   value={rec.nic_number} mono />
      <FieldRow label="Gender"       value={rec.gender} />
      <FieldRow label="Nationality"  value={rec.nationality} />
      <FieldRow label="Phone"        value={rec.phone} />
      <FieldRow label="Occupation"   value={rec.occupation} />
      <FieldRow label="Address"      value={rec.address} />

      <SectionHead title="Physical Description" />
      <FieldRow label="Height"       value={rec.height_cm   ? `${rec.height_cm} cm`  : null} />
      <FieldRow label="Weight"       value={rec.weight_kg   ? `${rec.weight_kg} kg`  : null} />
      <FieldRow label="Eye Color"    value={rec.eye_color} />
      <FieldRow label="Marks"        value={rec.distinguishing_marks} />

      <SectionHead title="Registering Officer" />
      <FieldRow label="Officer ID"   value={rec.officer_id} mono />
      <FieldRow label="Officer Name" value={rec.officer_name} />
      <FieldRow label="Badge No."    value={rec.badge_number} mono />
      <FieldRow label="Station"      value={rec.station} />
      <FieldRow label="Rank"         value={rec.rank} />
    </>
  );
}

function CrimesPanel({ crimes }) {
  if (!crimes?.length) return <EmptyState icon="📋" text="NO CRIME RECORDS FOUND" />;
  return (
    <>
      {crimes.map((c, i) => (
        <div key={i} className="lecs-card" style={{
          background: '#0a0f1e', border: '1px solid #1a3a5c',
          padding: '14px', marginBottom: '12px',
          borderLeft: '3px solid #e05050',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '10px',
            paddingBottom: '8px', borderBottom: '1px solid #0f1e35',
          }}>
            <span style={{ color: '#3a8adc', fontSize: '11px', letterSpacing: '1px' }}>
              {c.case_id || `CRIME-${i + 1}`}
            </span>
            <Badge label={c.crime_status || 'Unknown'} type={statusType(c.crime_status)} />
          </div>
          <FieldRow label="Crime Type"    value={c.crime_type}        highlight="red" />
          <FieldRow label="Date"          value={c.crime_date} />
          <FieldRow label="Location"      value={c.crime_location} />
          <FieldRow label="Weapons Used"  value={c.weapons_used} />
          <FieldRow label="Victims"       value={c.victims_count} />
          <FieldRow label="Damage Value"  value={c.damage_value} />
          <FieldRow label="Description"   value={c.crime_description} />
        </div>
      ))}
    </>
  );
}

function EvidencePanel({ evidences }) {
  if (!evidences?.length) return <EmptyState icon="🗂️" text="NO EVIDENCE RECORDS FOUND" />;
  const typeColor = t => {
    if (!t) return 'gray';
    const tl = t.toLowerCase();
    if (tl === 'image')    return 'blue';
    if (tl === 'video')    return 'purple';
    if (tl === 'forensic') return 'amber';
    if (tl === 'document') return 'green';
    return 'gray';
  };
  return (
    <>
      {evidences.map((e, i) => (
        <div key={i} className="lecs-card" style={{
          background: '#0a0f1e', border: '1px solid #1a3a5c',
          padding: '14px', marginBottom: '12px',
          borderLeft: '3px solid #3a8adc',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '10px',
            paddingBottom: '8px', borderBottom: '1px solid #0f1e35',
          }}>
            <span style={{ color: '#3a8adc', fontSize: '11px', letterSpacing: '1px', fontFamily: "'Courier New', monospace" }}>
              {e.evidence_id}
            </span>
            <Badge label={e.evidence_type || 'unknown'} type={typeColor(e.evidence_type)} />
          </div>
          <FieldRow label="Description"    value={e.description} />
          <FieldRow label="Collected By"   value={e.collected_by} />
          <FieldRow label="Collected On"   value={e.collected_date} />
          <FieldRow label="File Hash"      value={e.file_hash}      mono highlight="blue" />
          <FieldRow label="Blockchain TX"  value={e.blockchain_tx}  mono />
        </div>
      ))}
    </>
  );
}

function CourtPanel({ court_decisions }) {
  if (!court_decisions?.length) return <EmptyState icon="⚖" text="NO COURT DECISIONS RECORDED" />;
  return (
    <>
      {court_decisions.map((d, i) => (
        <div key={i} className="lecs-card" style={{
          background: '#0a0f1e', border: '1px solid #1a3a5c',
          padding: '14px', marginBottom: '12px',
          borderLeft: `3px solid ${
            d.verdict?.toLowerCase() === 'guilty'     ? '#e05050' :
            d.verdict?.toLowerCase() === 'not guilty' ? '#22c55e' : '#7a5af8'
          }`,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '10px',
            paddingBottom: '8px', borderBottom: '1px solid #0f1e35',
          }}>
            <span style={{ color: '#3a8adc', fontSize: '11px', letterSpacing: '1px', fontFamily: "'Courier New', monospace" }}>
              {d.decision_id}
            </span>
            <Badge label={d.verdict || 'Pending'} type={verdictType(d.verdict)} />
          </div>
          <FieldRow label="Court Name"     value={d.court_name} />
          <FieldRow label="Judge"          value={d.judge_name} />
          <FieldRow label="Case Number"    value={d.case_number}    mono />
          <FieldRow label="Hearing Date"   value={d.hearing_date} />
          <FieldRow label="Sentence"       value={d.sentence} />
          <FieldRow label="Sentence Start" value={d.sentence_start} />
          <FieldRow label="Sentence End"   value={d.sentence_end} />
          <FieldRow label="Appeal Status"  value={d.appeal_status} />
          <FieldRow label="Notes"          value={d.notes} />
          <FieldRow label="Blockchain TX"  value={d.blockchain_tx}  mono />
        </div>
      ))}
    </>
  );
}

function BlockchainPanel({ rec }) {
  return (
    <>
      <SectionHead title="On-Chain Identity" />
      <FieldRow label="Criminal ID"    value={rec.criminal_id}    mono highlight="blue" />
      <FieldRow label="Embedding Hash" value={rec.embedding_hash} mono />
      <FieldRow label="Registered At"
        value={rec.registered_at
          ? new Date(rec.registered_at * 1000).toLocaleString('en-GB', { hour12: false })
          : null} />
      <FieldRow label="Registered By"  value={rec.registered_by}  mono />
      <FieldRow label="Active"
        value={rec.is_active ? 'YES — WANTED' : 'NO — INACTIVE'}
        highlight={rec.is_active ? 'red' : 'green'} />

      {rec.bc_evidence?.length > 0 && <>
        <SectionHead title={`On-Chain Evidence (${rec.bc_evidence.length})`} />
        {rec.bc_evidence.map((e, i) => (
          <div key={i} style={{
            background: '#070d1a', border: '1px solid #0f1e35',
            padding: '10px 14px', marginBottom: '8px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', color: '#3a8adc', fontFamily: "'Courier New', monospace" }}>
                {e.evidence_id}
              </span>
              <span style={{ fontSize: '9px', color: '#4a7aaa' }}>
                {new Date(Number(e.logged_at) * 1000).toLocaleString('en-GB', { hour12: false })}
              </span>
            </div>
            <div style={{ fontSize: '9px', color: '#2a5a7a', letterSpacing: '1px', wordBreak: 'break-all' }}>
              Hash: {e.file_hash || '—'}
            </div>
          </div>
        ))}
      </>}

      {rec.bc_court?.length > 0 && <>
        <SectionHead title={`On-Chain Court Decisions (${rec.bc_court.length})`} />
        {rec.bc_court.map((d, i) => (
          <div key={i} style={{
            background: '#070d1a', border: '1px solid #0f1e35',
            padding: '10px 14px', marginBottom: '8px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: '#3a8adc', fontFamily: "'Courier New', monospace" }}>
                {d.decision_id}
              </span>
              <Badge label={d.verdict || 'Pending'} type={verdictType(d.verdict)} />
            </div>
            <div style={{ fontSize: '9px', color: '#2a5a7a', letterSpacing: '1px' }}>{d.court_name}</div>
            <div style={{ fontSize: '9px', color: '#1a3a5a', marginTop: '4px' }}>
              {new Date(Number(d.logged_at) * 1000).toLocaleString('en-GB', { hour12: false })}
            </div>
          </div>
        ))}
      </>}
    </>
  );
}

/* ── Main component ── */
export default function CriminalRecord() {
  const [query,   setQuery]   = useState('');
  const [rec,     setRec]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [tab,     setTab]     = useState('personal');

  const fetchRecord = async (id) => {
    const target = (id || query).trim();
    if (!target) return;
    setLoading(true); setError(null); setRec(null);
    try {
      const r = await axios.get(`${API}/api/records/full/${target}`);
      setRec(r.data);
      setTab('personal');
    } catch (e) {
      setError(e.response?.data?.detail || `Record "${target}" not found.`);
    } finally {
      setLoading(false);
    }
  };

  const TABS = [
    { id: 'personal',   label: 'Personal',        count: null },
    { id: 'crimes',     label: 'Crimes',           count: rec?.crimes?.length },
    { id: 'evidence',   label: 'Evidence',         count: rec?.evidences?.length },
    { id: 'court',      label: 'Court Decisions',  count: rec?.court_decisions?.length },
    { id: 'blockchain', label: 'Blockchain',       count: null },
  ];

  return (
    <div className="lecs-rec" style={s.pg}>

      {/* ── Header ── */}
      <div style={s.pageHeader}>
        <div style={s.phLeft}>
          <div style={s.phIcon}>≡</div>
          <div>
            <div style={s.phTitle}>Criminal Records</div>
            <div style={s.phSub}>FULL RECORD VIEWER — BLOCKCHAIN VERIFIED</div>
          </div>
        </div>
        <span style={s.statusPill}>SECURE ACCESS</span>
      </div>

      {/* ── Search bar ── */}
      <div style={s.searchBar}>
        <div style={s.searchIcon}>🔍</div>
        <input
          className="lecs-rec-inp"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchRecord()}
          placeholder="Enter Criminal ID  (e.g. CRM-A1B2C3D4)"
          style={s.searchInp}
        />
        <button onClick={() => fetchRecord()} disabled={loading} style={s.searchBtn}>
          {loading ? 'RETRIEVING...' : 'RETRIEVE RECORD'}
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={s.errorStrip}>
          <span style={{ color: '#e05050', marginRight: '8px' }}>✕</span>
          {error}
        </div>
      )}

      {/* ── No record yet ── */}
      {!rec && !loading && !error && (
        <div style={s.emptySearch}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.15 }}>◉</div>
          <div style={{ fontSize: '11px', color: '#1a3a5a', letterSpacing: '3px' }}>
            ENTER A CRIMINAL ID TO RETRIEVE FULL RECORD
          </div>
          <div style={{ fontSize: '9px', color: '#0f2040', letterSpacing: '1px', marginTop: '8px' }}>
            Records are retrieved from SQLite database and verified against Ethereum blockchain
          </div>
        </div>
      )}

      {/* ── Record layout ── */}
      {rec && (
        <div style={s.recordGrid}>

          {/* ── Left sidebar ── */}
          <div style={s.sidebar}>

            {/* Photo */}
            <div style={{ background: '#050a14', border: '1px solid #1a3a5c', overflow: 'hidden', marginBottom: '10px' }}>
              <PhotoDisplay criminal_id={rec.criminal_id} large />
            </div>

            {/* ID + Status */}
            <div style={s.idBox}>
              <div style={{ fontSize: '9px', color: '#2a5a8a', letterSpacing: '1px', marginBottom: '4px' }}>SUBJECT ID</div>
              <div style={{ fontSize: '12px', color: '#3a8adc', fontWeight: '700', letterSpacing: '2px', fontFamily: "'Courier New', monospace" }}>
                {rec.criminal_id}
              </div>
            </div>

            <div style={{
              background: rec.is_active ? '#1a0505' : '#051a0a',
              border: `1px solid ${rec.is_active ? '#4a1a1a' : '#1a4a1a'}`,
              color: rec.is_active ? '#e05050' : '#22c55e',
              fontSize: '10px', fontWeight: '700', padding: '8px 12px',
              textAlign: 'center', letterSpacing: '2px', marginBottom: '10px',
            }}>
              {rec.is_active ? '● WANTED' : '✓ INACTIVE'}
            </div>

            {/* Quick stats */}
            <div style={s.quickStats}>
              {[
                { label: 'Crimes',    val: rec.crimes?.length        || 0, color: '#e05050' },
                { label: 'Evidence',  val: rec.evidences?.length     || 0, color: '#3a8adc' },
                { label: 'Court',     val: rec.court_decisions?.length || 0, color: '#7a5af8' },
              ].map(q => (
                <div key={q.label} style={s.quickStat}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: q.color }}>{q.val}</div>
                  <div style={{ fontSize: '9px', color: '#2a5a7a', letterSpacing: '1px' }}>{q.label}</div>
                </div>
              ))}
            </div>

            {/* Nav buttons */}
            <div style={{ marginTop: '10px' }}>
              {TABS.map(t => (
                <button key={t.id} className="lecs-nav-btn" onClick={() => setTab(t.id)} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  width: '100%', background: tab === t.id ? '#0d1a2e' : 'transparent',
                  border: `1px solid ${tab === t.id ? '#2a6fc4' : '#1a2a3a'}`,
                  borderLeft: `3px solid ${tab === t.id ? '#3a8adc' : 'transparent'}`,
                  color: tab === t.id ? '#e0ecff' : '#4a7aaa',
                  padding: '9px 12px', cursor: 'pointer', fontSize: '10px',
                  letterSpacing: '1.5px', fontFamily: "'Courier New', monospace",
                  textTransform: 'uppercase', textAlign: 'left', marginBottom: '3px',
                }}>
                  <span>{t.label}</span>
                  {t.count > 0 && (
                    <span style={{
                      background: tab === t.id ? '#2a6fc4' : '#1a2a3a',
                      color: tab === t.id ? '#fff' : '#4a7aaa',
                      fontSize: '9px', padding: '1px 6px', borderRadius: '2px',
                    }}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Blockchain verified badge */}
            <div style={s.chainBadge}>
              <div style={{ fontSize: '9px', color: '#7a5af8', letterSpacing: '1px', marginBottom: '4px' }}>⬡ BLOCKCHAIN VERIFIED</div>
              <div style={{ fontSize: '9px', color: '#1a2a4a', letterSpacing: '0.5px', lineHeight: '1.6' }}>
                Record is immutable and stored on Ethereum. Hash: {rec.embedding_hash?.slice(0, 16)}...
              </div>
            </div>
          </div>

          {/* ── Right content panel ── */}
          <div style={s.contentPanel}>

            {/* Panel header */}
            <div style={s.panelHeaderRow}>
              <div style={s.panelHeaderName}>{rec.name}</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Badge label={rec.crimes?.[0]?.crime_status || 'Unknown'} type={statusType(rec.crimes?.[0]?.crime_status)} />
                <span style={{ fontSize: '9px', color: '#2a5a7a' }}>
                  Registered {rec.registered_at
                    ? new Date(rec.registered_at * 1000).toLocaleDateString('en-GB')
                    : '—'}
                </span>
              </div>
            </div>

            <div style={{ height: '1px', background: '#1a3a5c', marginBottom: '16px' }} />

            {/* Tab content */}
            {tab === 'personal'   && <PersonalPanel   rec={rec} />}
            {tab === 'crimes'     && <CrimesPanel     crimes={rec.crimes} />}
            {tab === 'evidence'   && <EvidencePanel   evidences={rec.evidences} />}
            {tab === 'court'      && <CourtPanel      court_decisions={rec.court_decisions} />}
            {tab === 'blockchain' && <BlockchainPanel rec={rec} />}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div style={s.footer}>
        <span style={s.footerTxt}>LECS v2.4.1 — RECORDS MODULE — RESTRICTED</span>
        <span style={s.enc}>AES-256 ENCRYPTED</span>
      </div>
    </div>
  );
}

/* ── Styles ── */
const s = {
  pg: {
    background: '#0a0e1a', color: '#c8d8f0',
    fontFamily: "'Courier New', monospace", minHeight: '100vh',
  },

  pageHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid #1a3a5c', paddingBottom: '14px', marginBottom: '18px',
  },
  phLeft:  { display: 'flex', alignItems: 'center', gap: '10px' },
  phIcon:  {
    width: '34px', height: '34px', background: '#0a1020',
    border: '2px solid #1a3a5c', borderRadius: '3px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
  },
  phTitle: { fontSize: '12px', fontWeight: '700', color: '#e0ecff', letterSpacing: '2px', textTransform: 'uppercase' },
  phSub:   { fontSize: '9px', color: '#2a5a8a', letterSpacing: '2px', marginTop: '2px' },
  statusPill: {
    background: '#0a1020', border: '1px solid #1a3a5c',
    color: '#3a8adc', fontSize: '9px', padding: '3px 10px', letterSpacing: '2px',
  },

  searchBar: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: '#0d1526', border: '1px solid #1a3a5c',
    padding: '12px 16px', marginBottom: '18px',
  },
  searchIcon: { fontSize: '14px', color: '#2a5a7a', flexShrink: 0 },
  searchInp: {
    flex: 1, background: '#070d1a', border: '1px solid #1a3a5c',
    color: '#c8d8f0', fontFamily: "'Courier New', monospace",
    fontSize: '12px', letterSpacing: '2px', padding: '9px 12px', outline: 'none',
  },
  searchBtn: {
    background: '#0a1a30', border: '1px solid #2a5a9c',
    color: '#60a5fa', fontFamily: "'Courier New', monospace",
    fontSize: '10px', fontWeight: '700', letterSpacing: '2px',
    textTransform: 'uppercase', padding: '10px 18px', cursor: 'pointer', flexShrink: 0,
  },

  errorStrip: {
    background: '#0d0606', border: '1px solid #3a1515',
    borderLeft: '3px solid #e05050', padding: '12px 14px',
    marginBottom: '14px', fontSize: '11px', color: '#7a3030', letterSpacing: '1px',
  },

  emptySearch: {
    background: '#0d1526', border: '1px solid #1a3a5c',
    padding: '60px 20px', textAlign: 'center', marginTop: '20px',
  },

  recordGrid: {
    display: 'grid', gridTemplateColumns: '220px 1fr',
    gap: '16px', alignItems: 'start',
  },

  sidebar: { position: 'sticky', top: '20px' },

  idBox: {
    background: '#0d1526', border: '1px solid #1a3a5c',
    padding: '10px 12px', marginBottom: '8px',
  },

  quickStats: {
    display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
    gap: '6px', marginBottom: '10px',
  },
  quickStat: {
    background: '#0d1526', border: '1px solid #1a3a5c',
    padding: '10px 6px', textAlign: 'center',
  },

  chainBadge: {
    background: '#0a0d1a', border: '1px solid #1a1a3a',
    borderLeft: '2px solid #7a5af8', padding: '10px 12px', marginTop: '10px',
  },

  contentPanel: {
    background: '#0d1526', border: '1px solid #1a3a5c', padding: '20px',
    minHeight: '500px',
  },
  panelHeaderRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: '12px',
  },
  panelHeaderName: {
    fontSize: '20px', fontWeight: '700', color: '#e0ecff',
    letterSpacing: '1px', textTransform: 'uppercase',
  },

  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #0d1a2e',
  },
  footerTxt: { fontSize: '9px', color: '#1a3a5a', letterSpacing: '1.5px' },
  enc: {
    background: '#06090f', border: '1px solid #0d1f35',
    color: '#1e4a6a', fontSize: '9px', padding: '3px 10px', letterSpacing: '2px',
  },
};
