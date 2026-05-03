// frontend/src/pages/CriminalRecord.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000';

const EVIDENCE_TYPES = [
  'Select Type', 'Photograph', 'Video Recording',
  'CCTV Footage', 'Forensic Report', 'DNA Report',
  'Fingerprint Report', 'Witness Statement',
  'Medical Report', 'Financial Record',
  'Digital Evidence', 'Physical Evidence', 'Other'
];

const VERDICTS = [
  'Pending', 'Guilty', 'Not Guilty',
  'Partially Guilty', 'Case Dismissed',
  'Acquitted', 'Referred'
];

export default function CriminalRecord() {
  const [searchId, setSearchId]     = useState('');
  const [record, setRecord]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [activeTab, setActiveTab]   = useState('overview');
  const [allIds, setAllIds]         = useState([]);

  // Evidence form
  const [evForm, setEvForm] = useState({
    evidence_type: '', description: '',
    collected_by: '', collected_date: ''
  });
  const [evFile, setEvFile]     = useState(null);
  const [evLoading, setEvLoading] = useState(false);
  const [evResult, setEvResult]   = useState(null);

  // Court form
  const [ctForm, setCtForm] = useState({
    court_name: '', judge_name: '', case_number: '',
    hearing_date: '', verdict: '', sentence: '',
    sentence_start: '', sentence_end: '',
    appeal_status: '', notes: ''
  });
  const [ctLoading, setCtLoading] = useState(false);
  const [ctResult, setCtResult]   = useState(null);

  // Load all criminal IDs for dropdown
  useEffect(() => {
    axios.get(`${API}/api/dashboard/criminals`)
      .then(r => setAllIds(r.data.criminals || []))
      .catch(() => {});
  }, []);

  const searchCriminal = async () => {
    if (!searchId.trim()) return;
    setLoading(true);
    setError(null);
    setRecord(null);
    try {
      const r = await axios.get(
        `${API}/api/records/full/${searchId.trim()}`
      );
      setRecord(r.data);
      setActiveTab('overview');
    } catch (e) {
      setError(e.response?.data?.detail || 'Criminal not found');
    } finally {
      setLoading(false);
    }
  };

  const submitEvidence = async () => {
    if (!evForm.evidence_type ||
        evForm.evidence_type === 'Select Type') {
      alert('Please select evidence type');
      return;
    }
    setEvLoading(true);
    setEvResult(null);
    const data = new FormData();
    Object.entries(evForm).forEach(([k, v]) => data.append(k, v));
    if (evFile) data.append('file', evFile);
    try {
      const r = await axios.post(
        `${API}/api/records/evidence/${record.criminal_id}`,
        data
      );
      setEvResult(r.data);
      // Refresh record
      const updated = await axios.get(
        `${API}/api/records/full/${record.criminal_id}`
      );
      setRecord(updated.data);
      setEvForm({
        evidence_type: '', description: '',
        collected_by: '', collected_date: ''
      });
      setEvFile(null);
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to add evidence');
    } finally {
      setEvLoading(false);
    }
  };

  const submitCourt = async () => {
    if (!ctForm.court_name || !ctForm.verdict) {
      alert('Court name and verdict are required');
      return;
    }
    setCtLoading(true);
    setCtResult(null);
    const data = new FormData();
    Object.entries(ctForm).forEach(([k, v]) => data.append(k, v));
    try {
      const r = await axios.post(
        `${API}/api/records/court/${record.criminal_id}`,
        data
      );
      setCtResult(r.data);
      const updated = await axios.get(
        `${API}/api/records/full/${record.criminal_id}`
      );
      setRecord(updated.data);
      setCtForm({
        court_name: '', judge_name: '', case_number: '',
        hearing_date: '', verdict: '', sentence: '',
        sentence_start: '', sentence_end: '',
        appeal_status: '', notes: ''
      });
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to add court decision');
    } finally {
      setCtLoading(false);
    }
  };

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.shield}>⚖</div>
          <div>
            <div style={s.headerTitle}>Criminal Record Management</div>
            <div style={s.headerSub}>
              Evidence · Court Decisions · Full Record View
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={s.searchBox}>
        <div style={s.searchLabel}>SEARCH CRIMINAL RECORD</div>
        <div style={s.searchRow}>
          <select
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            style={s.searchSelect}
          >
            <option value="">— Select Criminal ID —</option>
            {allIds.map(c => (
              <option key={c.criminal_id} value={c.criminal_id}>
                {c.criminal_id} — {c.name}
              </option>
            ))}
          </select>
          <div style={s.searchOr}>OR</div>
          <input
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchCriminal()}
            placeholder="Type Criminal ID manually..."
            style={s.searchInput}
          />
          <button onClick={searchCriminal}
            disabled={loading} style={s.searchBtn}>
            {loading ? '⏳ SEARCHING...' : '🔍 SEARCH'}
          </button>
        </div>
        {error && <div style={s.errorMsg}>⚠️ {error}</div>}
      </div>

      {/* Record View */}
      {record && (
        <div style={s.recordWrap}>

          {/* Criminal Header Card */}
          <div style={s.criminalHeader}>
            <div style={s.criminalPhotoBox}>
              <img
                src={`${API}/api/enrollment/photo/${record.criminal_id}`}
                alt={record.name}
                style={s.criminalPhoto}
                onError={e => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div style={{ ...s.photoFallback, display: 'none' }}>👤</div>
            </div>
            <div style={s.criminalMeta}>
              <div style={s.criminalName}>{record.name}</div>
              <div style={s.criminalIdBadge}>{record.criminal_id}</div>
              <div style={s.metaGrid}>
                <MetaItem label="NIC" value={record.nic_number} />
                <MetaItem label="Age" value={record.age} />
                <MetaItem label="Gender" value={record.gender} />
                <MetaItem label="Nationality" value={record.nationality} />
                <MetaItem label="Station" value={record.station} />
                <MetaItem label="Officer" value={record.officer_name} />
              </div>
            </div>
            <div style={s.criminalStats}>
              <StatBubble
                label="Crimes" value={record.crimes?.length || 0}
                color="#e05050" />
              <StatBubble
                label="Evidence" value={record.evidences?.length || 0}
                color="#f59e0b" />
              <StatBubble
                label="Court Records"
                value={record.court_decisions?.length || 0}
                color="#7a5af8" />
            </div>
          </div>

          {/* Tabs */}
          <div style={s.tabs}>
            {[
              { id: 'overview',  label: '📋 Overview'         },
              { id: 'crimes',    label: '⚖️ Crimes'            },
              { id: 'evidence',  label: '🗂️ Evidence'          },
              { id: 'court',     label: '🏛️ Court Decisions'   },
              { id: 'blockchain',label: '🔗 Blockchain'        },
            ].map(tab => (
              <button key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...s.tab,
                  ...(activeTab === tab.id ? s.tabActive : {})
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── TAB: Overview ── */}
          {activeTab === 'overview' && (
            <div style={s.tabContent}>
              <Section title="Personal Information">
                <Grid2>
                  <InfoRow label="Full Name"    value={record.name} />
                  <InfoRow label="Criminal ID"  value={record.criminal_id} />
                  <InfoRow label="NIC Number"   value={record.nic_number} />
                  <InfoRow label="Date of Birth" value={record.dob} />
                  <InfoRow label="Age"          value={record.age} />
                  <InfoRow label="Gender"       value={record.gender} />
                  <InfoRow label="Nationality"  value={record.nationality} />
                  <InfoRow label="Phone"        value={record.phone} />
                  <InfoRow label="Occupation"   value={record.occupation} />
                  <InfoRow label="Height"
                    value={record.height_cm
                      ? `${record.height_cm} cm` : null} />
                  <InfoRow label="Weight"
                    value={record.weight_kg
                      ? `${record.weight_kg} kg` : null} />
                  <InfoRow label="Eye Color"    value={record.eye_color} />
                </Grid2>
                <InfoRow label="Address" value={record.address} wide />
                <InfoRow label="Distinguishing Marks"
                  value={record.distinguishing_marks} wide />
              </Section>

              <Section title="Arresting Officer">
                <Grid2>
                  <InfoRow label="Officer ID"   value={record.officer_id} />
                  <InfoRow label="Officer Name" value={record.officer_name} />
                  <InfoRow label="Badge Number" value={record.badge_number} />
                  <InfoRow label="Rank"         value={record.rank} />
                  <InfoRow label="Station"      value={record.station} />
                  <InfoRow label="Registered"
                    value={record.registered_at
                      ? new Date(record.registered_at * 1000)
                          .toLocaleString() : null} />
                </Grid2>
              </Section>

              <Section title="Blockchain Record">
                <InfoRow label="Embedding Hash"
                  value={record.embedding_hash} mono />
                <InfoRow label="Registered By"
                  value={record.registered_by} mono />
              </Section>
            </div>
          )}

          {/* ── TAB: Crimes ── */}
          {activeTab === 'crimes' && (
            <div style={s.tabContent}>
              <Section title={`Crime Records (${record.crimes?.length || 0})`}>
                {!record.crimes?.length ? (
                  <EmptyState msg="No crime records found" />
                ) : record.crimes.map((crime, i) => (
                  <div key={i} style={s.crimeCard}>
                    <div style={s.crimeHeader}>
                      <span style={s.crimeType}>{crime.crime_type}</span>
                      <span style={{
                        ...s.statusBadge,
                        background: crime.crime_status === 'Convicted'
                          ? '#14532d' : crime.crime_status === 'Wanted'
                          ? '#450a0a' : '#1c1007',
                        color: crime.crime_status === 'Convicted'
                          ? '#22c55e' : crime.crime_status === 'Wanted'
                          ? '#ef4444' : '#f59e0b',
                      }}>
                        {crime.crime_status}
                      </span>
                    </div>
                    <Grid2>
                      <InfoRow label="Case ID"  value={crime.case_id} />
                      <InfoRow label="Date"     value={crime.crime_date} />
                      <InfoRow label="Location" value={crime.crime_location} />
                      <InfoRow label="Weapons"  value={crime.weapons_used} />
                      <InfoRow label="Victims"  value={crime.victims_count} />
                      <InfoRow label="Damage"   value={crime.damage_value} />
                    </Grid2>
                    <InfoRow label="Description"
                      value={crime.crime_description} wide />
                  </div>
                ))}
              </Section>
            </div>
          )}

          {/* ── TAB: Evidence ── */}
          {activeTab === 'evidence' && (
            <div style={s.tabContent}>

              {/* Add Evidence Form */}
              <Section title="Add New Evidence">
                <div style={s.formGrid}>
                  <FormField label="Evidence Type *">
                    <select
                      value={evForm.evidence_type}
                      onChange={e => setEvForm({
                        ...evForm, evidence_type: e.target.value
                      })}
                      style={s.select}>
                      {EVIDENCE_TYPES.map(t => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Collected By">
                    <input
                      value={evForm.collected_by}
                      onChange={e => setEvForm({
                        ...evForm, collected_by: e.target.value
                      })}
                      placeholder="Officer name or lab"
                      style={s.input} />
                  </FormField>
                  <FormField label="Collection Date">
                    <input type="date"
                      value={evForm.collected_date}
                      onChange={e => setEvForm({
                        ...evForm, collected_date: e.target.value
                      })}
                      style={s.input} />
                  </FormField>
                  <FormField label="Evidence File">
                    <label style={s.fileLabel}>
                      📎 Choose File
                      <input type="file"
                        onChange={e => setEvFile(e.target.files[0])}
                        style={{ display: 'none' }} />
                    </label>
                    {evFile && (
                      <span style={s.fileName}>✅ {evFile.name}</span>
                    )}
                  </FormField>
                </div>
                <FormField label="Description">
                  <textarea
                    value={evForm.description}
                    onChange={e => setEvForm({
                      ...evForm, description: e.target.value
                    })}
                    placeholder="Detailed description of evidence..."
                    style={{ ...s.input, height: '80px',
                             resize: 'vertical' }} />
                </FormField>
                <button onClick={submitEvidence}
                  disabled={evLoading} style={s.submitBtn}>
                  {evLoading
                    ? '⏳ Logging on Blockchain...'
                    : '🔗 Add Evidence to Blockchain'}
                </button>
                {evResult && (
                  <div style={s.successBox}>
                    ✅ Evidence {evResult.evidence_id} logged!
                    <div style={s.txLine}>
                      TX: {evResult.blockchain_tx}
                    </div>
                  </div>
                )}
              </Section>

              {/* Existing Evidence */}
              <Section
                title={`Evidence Records (${record.evidences?.length || 0})`}>
                {!record.evidences?.length ? (
                  <EmptyState msg="No evidence records found" />
                ) : record.evidences.map((ev, i) => (
                  <div key={i} style={s.evidenceCard}>
                    <div style={s.evidenceHeader}>
                      <span style={s.evidenceType}>
                        {ev.evidence_type === 'Photograph'   ? '🖼️' :
                         ev.evidence_type === 'Video Recording' ||
                         ev.evidence_type === 'CCTV Footage' ? '🎥' :
                         ev.evidence_type === 'DNA Report' ||
                         ev.evidence_type === 'Forensic Report' ? '🧪' :
                         ev.evidence_type === 'Digital Evidence' ? '💾' : '📄'}
                        {' '}{ev.evidence_type}
                      </span>
                      <span style={s.evidenceId}>{ev.evidence_id}</span>
                    </div>
                    <Grid2>
                      <InfoRow label="Collected By"
                        value={ev.collected_by} />
                      <InfoRow label="Date"
                        value={ev.collected_date} />
                    </Grid2>
                    <InfoRow label="Description"
                      value={ev.description} wide />
                    {ev.file_hash && (
                      <InfoRow label="File Hash"
                        value={ev.file_hash} mono />
                    )}
                    {ev.blockchain_tx && (
                      <div style={s.blockchainRef}>
                        🔗 Blockchain TX: {ev.blockchain_tx?.slice(0, 40)}...
                      </div>
                    )}
                  </div>
                ))}
              </Section>
            </div>
          )}

          {/* ── TAB: Court Decisions ── */}
          {activeTab === 'court' && (
            <div style={s.tabContent}>

              {/* Add Court Decision Form */}
              <Section title="Add Court Decision">
                <div style={s.formGrid}>
                  <FormField label="Court Name *">
                    <input
                      value={ctForm.court_name}
                      onChange={e => setCtForm({
                        ...ctForm, court_name: e.target.value
                      })}
                      placeholder="e.g. Colombo High Court"
                      style={s.input} />
                  </FormField>
                  <FormField label="Judge Name">
                    <input
                      value={ctForm.judge_name}
                      onChange={e => setCtForm({
                        ...ctForm, judge_name: e.target.value
                      })}
                      placeholder="Presiding judge"
                      style={s.input} />
                  </FormField>
                  <FormField label="Case Number">
                    <input
                      value={ctForm.case_number}
                      onChange={e => setCtForm({
                        ...ctForm, case_number: e.target.value
                      })}
                      placeholder="e.g. HC/CR/2026/001"
                      style={s.input} />
                  </FormField>
                  <FormField label="Hearing Date">
                    <input type="date"
                      value={ctForm.hearing_date}
                      onChange={e => setCtForm({
                        ...ctForm, hearing_date: e.target.value
                      })}
                      style={s.input} />
                  </FormField>
                  <FormField label="Verdict *">
                    <select
                      value={ctForm.verdict}
                      onChange={e => setCtForm({
                        ...ctForm, verdict: e.target.value
                      })}
                      style={s.select}>
                      <option value="">Select Verdict</option>
                      {VERDICTS.map(v => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Appeal Status">
                    <select
                      value={ctForm.appeal_status}
                      onChange={e => setCtForm({
                        ...ctForm, appeal_status: e.target.value
                      })}
                      style={s.select}>
                      <option value="">Select Status</option>
                      <option>No Appeal</option>
                      <option>Appeal Filed</option>
                      <option>Appeal Pending</option>
                      <option>Appeal Rejected</option>
                      <option>Appeal Granted</option>
                    </select>
                  </FormField>
                  <FormField label="Sentence">
                    <input
                      value={ctForm.sentence}
                      onChange={e => setCtForm({
                        ...ctForm, sentence: e.target.value
                      })}
                      placeholder="e.g. 10 years imprisonment"
                      style={s.input} />
                  </FormField>
                  <FormField label="Sentence Start">
                    <input type="date"
                      value={ctForm.sentence_start}
                      onChange={e => setCtForm({
                        ...ctForm, sentence_start: e.target.value
                      })}
                      style={s.input} />
                  </FormField>
                  <FormField label="Sentence End">
                    <input type="date"
                      value={ctForm.sentence_end}
                      onChange={e => setCtForm({
                        ...ctForm, sentence_end: e.target.value
                      })}
                      style={s.input} />
                  </FormField>
                </div>
                <FormField label="Notes">
                  <textarea
                    value={ctForm.notes}
                    onChange={e => setCtForm({
                      ...ctForm, notes: e.target.value
                    })}
                    placeholder="Additional court notes..."
                    style={{ ...s.input, height: '80px',
                             resize: 'vertical' }} />
                </FormField>
                <button onClick={submitCourt}
                  disabled={ctLoading} style={s.submitBtn}>
                  {ctLoading
                    ? '⏳ Logging on Blockchain...'
                    : '🔗 Add Court Decision to Blockchain'}
                </button>
                {ctResult && (
                  <div style={s.successBox}>
                    ✅ Court decision {ctResult.decision_id} logged!
                    <div style={s.txLine}>
                      TX: {ctResult.blockchain_tx}
                    </div>
                  </div>
                )}
              </Section>

              {/* Existing Court Decisions */}
              <Section
                title={`Court Records (${record.court_decisions?.length || 0})`}>
                {!record.court_decisions?.length ? (
                  <EmptyState msg="No court records found" />
                ) : record.court_decisions.map((cd, i) => (
                  <div key={i} style={s.courtCard}>
                    <div style={s.courtHeader}>
                      <span style={s.courtName}>{cd.court_name}</span>
                      <span style={{
                        ...s.verdictBadge,
                        background:
                          cd.verdict === 'Guilty'     ? '#450a0a' :
                          cd.verdict === 'Not Guilty' ? '#052e16' :
                          '#1c1007',
                        color:
                          cd.verdict === 'Guilty'     ? '#ef4444' :
                          cd.verdict === 'Not Guilty' ? '#22c55e' :
                          '#f59e0b',
                      }}>
                        {cd.verdict || 'Pending'}
                      </span>
                    </div>
                    <Grid2>
                      <InfoRow label="Decision ID"
                        value={cd.decision_id} />
                      <InfoRow label="Case Number"
                        value={cd.case_number} />
                      <InfoRow label="Judge"
                        value={cd.judge_name} />
                      <InfoRow label="Hearing Date"
                        value={cd.hearing_date} />
                      <InfoRow label="Sentence"
                        value={cd.sentence} />
                      <InfoRow label="Appeal"
                        value={cd.appeal_status} />
                      <InfoRow label="Sentence Start"
                        value={cd.sentence_start} />
                      <InfoRow label="Sentence End"
                        value={cd.sentence_end} />
                    </Grid2>
                    <InfoRow label="Notes" value={cd.notes} wide />
                    {cd.blockchain_tx && (
                      <div style={s.blockchainRef}>
                        🔗 Blockchain TX: {cd.blockchain_tx?.slice(0,40)}...
                      </div>
                    )}
                  </div>
                ))}
              </Section>
            </div>
          )}

          {/* ── TAB: Blockchain ── */}
          {activeTab === 'blockchain' && (
            <div style={s.tabContent}>
              <Section title="Blockchain Verification">
                <div style={s.blockchainPanel}>
                  <div style={s.blockchainIcon}>⛓️</div>
                  <div style={s.blockchainTitle}>
                    IMMUTABLE RECORD ON ETHEREUM
                  </div>
                  <div style={s.blockchainSub}>
                    All records below are permanently stored and
                    tamper-proof
                  </div>
                </div>
                <Grid2>
                  <InfoRow label="Criminal ID"
                    value={record.criminal_id} />
                  <InfoRow label="Name" value={record.name} />
                  <InfoRow label="Registered At"
                    value={record.registered_at
                      ? new Date(record.registered_at * 1000)
                          .toLocaleString() : null} />
                  <InfoRow label="Registered By"
                    value={record.registered_by} mono />
                </Grid2>
                <InfoRow label="Embedding Hash"
                  value={record.embedding_hash} mono />

                {/* Blockchain Evidence */}
                {record.bc_evidence?.length > 0 && (
                  <>
                    <div style={s.sectionDivider}>
                      EVIDENCE TRANSACTIONS
                    </div>
                    {record.bc_evidence.map((ev, i) => (
                      <div key={i} style={s.txRecord}>
                        <div style={s.txType}>
                          🗂️ {ev.evidence_type}
                        </div>
                        <div style={s.txDetail}>
                          ID: {ev.evidence_id} |
                          File Hash: {ev.file_hash?.slice(0,20)}...
                        </div>
                        <div style={s.txTime}>
                          {ev.logged_at
                            ? new Date(ev.logged_at * 1000)
                                .toLocaleString()
                            : '—'}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Blockchain Court Decisions */}
                {record.bc_court?.length > 0 && (
                  <>
                    <div style={s.sectionDivider}>
                      COURT DECISION TRANSACTIONS
                    </div>
                    {record.bc_court.map((cd, i) => (
                      <div key={i} style={s.txRecord}>
                        <div style={s.txType}>
                          🏛️ {cd.court_name}
                        </div>
                        <div style={s.txDetail}>
                          Verdict: {cd.verdict} |
                          Sentence: {cd.sentence || 'N/A'}
                        </div>
                        <div style={s.txTime}>
                          {cd.logged_at
                            ? new Date(cd.logged_at * 1000)
                                .toLocaleString()
                            : '—'}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </Section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helper Components ─────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

function Grid2({ children }) {
  return <div style={s.grid2}>{children}</div>;
}

function InfoRow({ label, value, mono, wide }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ ...s.infoRow, ...(wide ? s.infoRowWide : {}) }}>
      <div style={s.infoLabel}>{label}</div>
      <div style={{ ...s.infoValue, ...(mono ? s.monoFont : {}) }}>
        {value}
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div style={s.formField}>
      <label style={s.formLabel}>{label}</label>
      {children}
    </div>
  );
}

function MetaItem({ label, value }) {
  if (!value) return null;
  return (
    <div style={s.metaItem}>
      <div style={s.metaLabel}>{label}</div>
      <div style={s.metaValue}>{value}</div>
    </div>
  );
}

function StatBubble({ label, value, color }) {
  return (
    <div style={s.statBubble}>
      <div style={{ ...s.statBubbleVal, color }}>{value}</div>
      <div style={s.statBubbleLabel}>{label}</div>
    </div>
  );
}

function EmptyState({ msg }) {
  return (
    <div style={s.emptyState}>
      <div style={{ fontSize: '32px' }}>📭</div>
      <div style={{ color: '#4a7aaa', fontSize: '11px',
                    letterSpacing: '2px', marginTop: '8px' }}>
        {msg.toUpperCase()}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────
const s = {
  page:       { background: '#0a0e1a', minHeight: '100vh',
                color: '#c8d8f0',
                fontFamily: "'Courier New', monospace",
                padding: '0 0 60px' },
  header:     { background: 'linear-gradient(135deg,#0f1e3d,#1a2d5a,#0f1e3d)',
                borderBottom: '2px solid #1e40af',
                padding: '20px 32px',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '24px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  shield:     { width: '36px', height: '36px', background: '#1a3a5c',
                border: '2px solid #2a6fc4', borderRadius: '4px',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '18px' },
  headerTitle:{ fontSize: '14px', fontWeight: '700', color: '#60a5fa',
                letterSpacing: '2px', textTransform: 'uppercase' },
  headerSub:  { fontSize: '10px', color: '#4a7aaa', letterSpacing: '1px' },

  searchBox:  { maxWidth: '900px', margin: '0 auto 24px',
                background: '#0d1526',
                border: '1px solid #1a3a5c', padding: '20px 24px' },
  searchLabel:{ fontSize: '9px', color: '#2a6fc4',
                letterSpacing: '3px', marginBottom: '12px',
                borderLeft: '3px solid #2a6fc4', paddingLeft: '8px' },
  searchRow:  { display: 'flex', gap: '10px', alignItems: 'center',
                flexWrap: 'wrap' },
  searchSelect:{ flex: 1, minWidth: '200px', padding: '10px 12px',
                background: '#0a1020', border: '1px solid #1a3a5c',
                color: '#c8d8f0', fontSize: '12px',
                fontFamily: "'Courier New', monospace", outline: 'none' },
  searchOr:   { fontSize: '10px', color: '#2a5a7a',
                letterSpacing: '2px' },
  searchInput:{ flex: 1, minWidth: '160px', padding: '10px 12px',
                background: '#0a1020', border: '1px solid #1a3a5c',
                color: '#c8d8f0', fontSize: '12px', outline: 'none',
                fontFamily: "'Courier New', monospace" },
  searchBtn:  { padding: '10px 20px', background: '#1d4ed8',
                color: '#fff', border: 'none', cursor: 'pointer',
                fontSize: '11px', fontWeight: '700',
                fontFamily: "'Courier New', monospace",
                letterSpacing: '1px' },
  errorMsg:   { marginTop: '10px', color: '#ef4444',
                fontSize: '11px', letterSpacing: '1px' },

  recordWrap: { maxWidth: '900px', margin: '0 auto' },

  criminalHeader:{ background: '#0d1526', border: '1px solid #2a6fc4',
                   display: 'flex', gap: '20px',
                   padding: '20px', marginBottom: '16px',
                   alignItems: 'flex-start' },
  criminalPhotoBox:{ flexShrink: 0 },
  criminalPhoto:{ width: '120px', height: '150px',
                  objectFit: 'cover', objectPosition: 'top',
                  border: '2px solid #2a6fc4', display: 'block' },
  photoFallback:{ width: '120px', height: '150px',
                  background: '#0a1020',
                  border: '2px solid #1a3a5c',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '48px', color: '#2a5a7a' },
  criminalMeta: { flex: 1 },
  criminalName: { fontSize: '20px', fontWeight: '700',
                  color: '#e0ecff', letterSpacing: '2px',
                  textTransform: 'uppercase', marginBottom: '6px' },
  criminalIdBadge:{ display: 'inline-block',
                    background: '#0a1a30',
                    border: '1px solid #2a6fc4', color: '#3a8adc',
                    fontSize: '11px', padding: '3px 12px',
                    letterSpacing: '2px', marginBottom: '12px' },
  metaGrid:   { display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' },
  metaItem:   { },
  metaLabel:  { fontSize: '9px', color: '#4a7aaa',
                letterSpacing: '1px', textTransform: 'uppercase' },
  metaValue:  { fontSize: '11px', color: '#c8d8f0', marginTop: '2px' },
  criminalStats:{ display: 'flex', flexDirection: 'column',
                  gap: '10px', flexShrink: 0 },
  statBubble: { background: '#0a1020', border: '1px solid #1a3a5c',
                padding: '12px 16px', textAlign: 'center',
                minWidth: '80px' },
  statBubbleVal:{ fontSize: '22px', fontWeight: '700' },
  statBubbleLabel:{ fontSize: '9px', color: '#4a7aaa',
                    letterSpacing: '1px', marginTop: '2px' },

  tabs:       { display: 'flex', gap: '2px',
                marginBottom: '2px', flexWrap: 'wrap' },
  tab:        { padding: '10px 18px',
                background: '#0d1526',
                border: '1px solid #1a3a5c',
                color: '#4a7aaa', cursor: 'pointer',
                fontSize: '10px', letterSpacing: '1px',
                fontFamily: "'Courier New', monospace",
                textTransform: 'uppercase', transition: 'all 0.2s' },
  tabActive:  { background: '#1a3a5c', color: '#60a5fa',
                borderColor: '#2a6fc4' },
  tabContent: { background: '#0d1526',
                border: '1px solid #1a3a5c', padding: '24px' },

  section:    { marginBottom: '24px' },
  sectionTitle:{ fontSize: '10px', fontWeight: '700',
                 color: '#4a8adc', letterSpacing: '3px',
                 textTransform: 'uppercase',
                 borderLeft: '3px solid #2a6fc4',
                 paddingLeft: '10px', marginBottom: '16px' },
  sectionDivider:{ fontSize: '9px', color: '#2a5a7a',
                   letterSpacing: '3px', textTransform: 'uppercase',
                   textAlign: 'center', padding: '12px 0',
                   borderTop: '1px solid #0f1e35',
                   marginTop: '16px' },

  grid2:      { display: 'grid',
                gridTemplateColumns: '1fr 1fr', gap: '0 24px' },
  infoRow:    { padding: '7px 0',
                borderBottom: '1px solid #0f1e35' },
  infoRowWide:{ gridColumn: '1 / -1' },
  infoLabel:  { fontSize: '9px', color: '#4a7aaa',
                letterSpacing: '1px', textTransform: 'uppercase' },
  infoValue:  { fontSize: '11px', color: '#c8d8f0', marginTop: '2px' },
  monoFont:   { fontFamily: "'Courier New', monospace",
                fontSize: '10px', color: '#2a8adc',
                wordBreak: 'break-all' },

  crimeCard:  { background: '#0a1020',
                border: '1px solid #2a1a1a',
                padding: '16px', marginBottom: '12px' },
  crimeHeader:{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '12px' },
  crimeType:  { fontSize: '13px', fontWeight: '700',
                color: '#e05050', letterSpacing: '1px',
                textTransform: 'uppercase' },
  statusBadge:{ fontSize: '9px', padding: '3px 10px',
                letterSpacing: '1px', fontWeight: '700' },

  evidenceCard:{ background: '#0a100a',
                 border: '1px solid #1a2a1a',
                 padding: '16px', marginBottom: '12px' },
  evidenceHeader:{ display: 'flex', justifyContent: 'space-between',
                   alignItems: 'center', marginBottom: '12px' },
  evidenceType:{ fontSize: '12px', fontWeight: '700',
                 color: '#f59e0b', letterSpacing: '1px' },
  evidenceId: { fontSize: '10px', color: '#2a6fc4',
                fontFamily: "'Courier New', monospace" },

  courtCard:  { background: '#0a0a18',
                border: '1px solid #1a1a3a',
                padding: '16px', marginBottom: '12px' },
  courtHeader:{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '12px' },
  courtName:  { fontSize: '13px', fontWeight: '700',
                color: '#7a5af8', letterSpacing: '1px' },
  verdictBadge:{ fontSize: '10px', padding: '3px 12px',
                 fontWeight: '700', letterSpacing: '1px' },

  blockchainRef:{ fontSize: '9px', color: '#2a6fc4',
                  fontFamily: "'Courier New', monospace",
                  marginTop: '8px', wordBreak: 'break-all',
                  borderTop: '1px solid #0f1e35', paddingTop: '8px' },

  blockchainPanel:{ textAlign: 'center', padding: '24px 0',
                    marginBottom: '16px' },
  blockchainIcon: { fontSize: '40px', marginBottom: '8px' },
  blockchainTitle:{ fontSize: '13px', fontWeight: '700',
                    color: '#22c55e', letterSpacing: '3px' },
  blockchainSub:  { fontSize: '10px', color: '#4a7aaa',
                    marginTop: '4px', letterSpacing: '1px' },

  txRecord:   { background: '#0a1020',
                border: '1px solid #1a3a5c',
                padding: '12px', marginBottom: '8px' },
  txType:     { fontSize: '11px', color: '#60a5fa',
                marginBottom: '4px', fontWeight: '700' },
  txDetail:   { fontSize: '10px', color: '#4a7aaa',
                fontFamily: "'Courier New', monospace" },
  txTime:     { fontSize: '9px', color: '#2a4a6a', marginTop: '4px' },

  formGrid:   { display: 'grid',
                gridTemplateColumns: '1fr 1fr', gap: '0 24px' },
  formField:  { marginBottom: '14px' },
  formLabel:  { display: 'block', fontSize: '9px', color: '#4a7aaa',
                letterSpacing: '1px', textTransform: 'uppercase',
                marginBottom: '5px' },
  input:      { width: '100%', padding: '9px 11px',
                background: '#0a1020',
                border: '1px solid #1a3a5c', color: '#c8d8f0',
                fontSize: '12px', outline: 'none',
                fontFamily: "'Courier New', monospace",
                boxSizing: 'border-box' },
  select:     { width: '100%', padding: '9px 11px',
                background: '#0a1020',
                border: '1px solid #1a3a5c', color: '#c8d8f0',
                fontSize: '12px', outline: 'none', cursor: 'pointer',
                fontFamily: "'Courier New', monospace",
                boxSizing: 'border-box' },
  fileLabel:  { display: 'inline-block', padding: '8px 14px',
                background: '#0a1020',
                border: '1px solid #2a6fc4', color: '#3a8adc',
                fontSize: '11px', cursor: 'pointer',
                letterSpacing: '1px', fontFamily: 'inherit' },
  fileName:   { fontSize: '10px', color: '#22c55e',
                marginLeft: '10px' },
  submitBtn:  { padding: '12px 24px', background: '#dc2626',
                color: '#fff', border: 'none', cursor: 'pointer',
                fontSize: '11px', fontWeight: '700',
                fontFamily: "'Courier New', monospace",
                letterSpacing: '2px', marginTop: '8px' },
  successBox: { marginTop: '12px', padding: '12px 16px',
                background: '#021207',
                border: '1px solid #166534', color: '#22c55e',
                fontSize: '11px' },
  txLine:     { fontSize: '10px', color: '#4a7aaa',
                marginTop: '6px', wordBreak: 'break-all',
                fontFamily: "'Courier New', monospace" },

  emptyState: { textAlign: 'center', padding: '32px 0' },
};