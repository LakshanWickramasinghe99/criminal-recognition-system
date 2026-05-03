import React, { useState, useRef } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000';

/* ── Inject styles once ── */
if (!document.getElementById('lecs-enroll-styles')) {
  const tag = document.createElement('style');
  tag.id = 'lecs-enroll-styles';
  tag.textContent = `
    @keyframes fadeIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
    .lecs-enroll { animation: fadeIn 0.3s ease; }
    .lecs-inp:focus { border-color: #2a6fc4 !important; outline: none; }
    .lecs-inp:hover { border-color: #1a4a6a !important; }
    .lecs-upload:hover { border-color: #2a6fc4 !important; background: #060e1a !important; }
    .lecs-btn-reg:hover:not(:disabled) { background: #0a1a30 !important; border-color: #3a7acc !important; color: #90c5ff !important; }
    .lecs-tab-btn { transition: color 0.15s, background 0.15s, border-color 0.15s; }
    .lecs-tab-btn:hover { color: #a0c8f0 !important; }
  `;
  document.head.appendChild(tag);
}

/* ── Reusable atoms ── */
function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: '13px' }}>
      <label style={s.lbl}>
        {label}
        {required && <span style={{ color: '#e05050', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Inp({ ...props }) {
  return (
    <input
      className="lecs-inp"
      {...props}
      style={{ ...s.inp, ...props.style }}
    />
  );
}

function Sel({ children, ...props }) {
  return (
    <select
      className="lecs-inp"
      {...props}
      style={{ ...s.inp, ...props.style }}
    >
      {children}
    </select>
  );
}

function Txt({ ...props }) {
  return (
    <textarea
      className="lecs-inp"
      {...props}
      style={{ ...s.inp, resize: 'vertical', minHeight: '70px', ...props.style }}
    />
  );
}

function Grid2({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
      {children}
    </div>
  );
}

function Grid3({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 14px' }}>
      {children}
    </div>
  );
}

function SectionHead({ title }) {
  return (
    <div style={s.sectionHead}>{title}</div>
  );
}

function Alert({ type, title, msg, tx }) {
  const isOk = type === 'success';
  return (
    <div style={{
      background: isOk ? '#060d09' : '#0d0606',
      border: `1px solid ${isOk ? '#1a4a1a' : '#3a1515'}`,
      borderLeft: `3px solid ${isOk ? '#22c55e' : '#e05050'}`,
      padding: '14px', marginBottom: '14px',
    }}>
      <div style={{ fontSize: '10px', fontWeight: '700',
        color: isOk ? '#22c55e' : '#e05050',
        letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
        {isOk ? '◉ ' : '✕ '}{title}
      </div>
      {msg && <div style={{ fontSize: '10px', color: isOk ? '#3a8a5a' : '#7a3030',
        letterSpacing: '1px', marginBottom: tx ? '8px' : 0 }}>{msg}</div>}
      {tx && (
        <div style={{ background: isOk ? '#050c07' : '#0a0505',
          border: `1px solid ${isOk ? '#0f2a14' : '#2a0f0f'}`,
          padding: '8px 10px', marginTop: '6px' }}>
          <div style={{ fontSize: '9px', color: isOk ? '#1a4a2a' : '#3a1515',
            letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
            ⬡ Blockchain TX Hash
          </div>
          <div style={{ fontSize: '9px', color: isOk ? '#1a6a3a' : '#5a2020',
            letterSpacing: '1px', wordBreak: 'break-all' }}>{tx}</div>
        </div>
      )}
    </div>
  );
}

/* ── Main component ── */
export default function Enrollment() {
  const photoRef = useRef();
  const videoRef = useRef();

  /* Active tab */
  const [tab, setTab] = useState('personal');

  /* Photo / video */
  const [photo,   setPhoto]   = useState(null);
  const [video,   setVideo]   = useState(null);
  const [preview, setPreview] = useState(null);

  /* API state */
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);

  /* ── Form state ── */
  const [personal, setPersonal] = useState({
    full_name: '', dob: '', nic_number: '', gender: '',
    nationality: 'Sri Lankan', address: '', phone: '',
    occupation: '', height_cm: '', weight_kg: '',
    eye_color: '', distinguishing_marks: '',
  });

  const [crime, setCrime] = useState({
    case_id: '', crime_type: '', crime_description: '',
    crime_date: '', crime_location: '', crime_status: 'Wanted',
    weapons_used: '', victims_count: '', damage_value: '',
  });

  const [officer, setOfficer] = useState({
    officer_id: '', officer_name: '', badge_number: '',
    station: '', rank: '',
  });

  const [age, setAge] = useState('');

  const setP = (k, v) => setPersonal(f => ({ ...f, [k]: v }));
  const setC = (k, v) => setCrime(f => ({ ...f, [k]: v }));
  const setO = (k, v) => setOfficer(f => ({ ...f, [k]: v }));

  /* ── Handlers ── */
  const pickPhoto = f => {
    if (!f || !f.type.startsWith('image/')) return;
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
  };

  const pickVideo = f => {
    if (!f || !f.type.startsWith('video/')) return;
    setVideo(f);
  };

  const validate = () => {
    if (!personal.full_name.trim()) return 'Full name is required.';
    if (!age)                        return 'Age is required.';
    if (!crime.crime_type.trim())    return 'Crime type is required.';
    if (!photo)                      return 'A biometric photo is required.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true); setError(null); setResult(null);

    const fd = new FormData();

    /* Core */
    fd.append('age', age);

    /* Personal */
    Object.entries(personal).forEach(([k, v]) => v && fd.append(k, v));

    /* Crime */
    Object.entries(crime).forEach(([k, v]) => v && fd.append(k, v));

    /* Officer */
    Object.entries(officer).forEach(([k, v]) => v && fd.append(k, v));

    /* Files */
    fd.append('photo', photo);
    if (video) fd.append('video', video);

    try {
      const res = await axios.post(`${API}/api/enrollment/enroll`, fd);
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Enrollment failed. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const TABS = [
    { id: 'personal', label: 'Personal'       },
    { id: 'crime',    label: 'Crime Details'   },
    { id: 'officer',  label: 'Officer Info'    },
    { id: 'files',    label: 'Biometric Files' },
  ];

  /* Tab completion indicators */
  const tabOk = {
    personal: !!personal.full_name && !!age,
    crime:    !!crime.crime_type,
    officer:  !!officer.officer_name,
    files:    !!photo,
  };

  return (
    <div className="lecs-enroll" style={s.pg}>

      {/* ── Page header ── */}
      <div style={s.pageHeader}>
        <div style={s.phLeft}>
          <div style={s.phIcon}>◉</div>
          <div>
            <div style={s.phTitle}>Criminal Enrollment</div>
            <div style={s.phSub}>REGISTER NEW SUBJECT — BIOMETRIC CAPTURE</div>
          </div>
        </div>
        <span style={s.statusPill}>MODULE ACTIVE</span>
      </div>

      {/* ── Main layout ── */}
      <div style={s.outerGrid}>

        {/* ── Left: tabbed form ── */}
        <div>

          {/* Tab bar */}
          <div style={s.tabBar}>
            {TABS.map(t => (
              <button key={t.id} className="lecs-tab-btn" onClick={() => setTab(t.id)} style={{
                ...s.tabBtn,
                color:       tab === t.id ? '#e0ecff' : '#4a7aaa',
                background:  tab === t.id ? '#0d1a2e' : 'transparent',
                borderTop:   `2px solid ${tab === t.id ? '#3a8adc' : 'transparent'}`,
                borderBottom: 'none',
              }}>
                {tabOk[t.id] && <span style={{ color: '#22c55e', marginRight: '5px', fontSize: '9px' }}>✓</span>}
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Personal tab ── */}
          {tab === 'personal' && (
            <div style={s.panel}>
              <div style={s.panelTitle}>Personal Information</div>

              <Field label="Full Name" required>
                <Inp value={personal.full_name} placeholder="e.g. Kamal Perera"
                  onChange={e => setP('full_name', e.target.value)} />
              </Field>

              <Grid2>
                <Field label="Age" required>
                  <Inp type="number" value={age} placeholder="e.g. 34"
                    onChange={e => setAge(e.target.value)} />
                </Field>
                <Field label="Date of Birth">
                  <Inp type="date" value={personal.dob}
                    onChange={e => setP('dob', e.target.value)} />
                </Field>
                <Field label="NIC Number">
                  <Inp value={personal.nic_number} placeholder="e.g. 199034502345"
                    onChange={e => setP('nic_number', e.target.value)} />
                </Field>
                <Field label="Gender">
                  <Sel value={personal.gender} onChange={e => setP('gender', e.target.value)}>
                    <option value="">— Select —</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </Sel>
                </Field>
                <Field label="Nationality">
                  <Inp value={personal.nationality}
                    onChange={e => setP('nationality', e.target.value)} />
                </Field>
                <Field label="Occupation">
                  <Inp value={personal.occupation} placeholder="e.g. Driver"
                    onChange={e => setP('occupation', e.target.value)} />
                </Field>
              </Grid2>

              <Field label="Address">
                <Txt rows={2} value={personal.address}
                  placeholder="e.g. 12/A, Galle Road, Colombo 03"
                  onChange={e => setP('address', e.target.value)} />
              </Field>

              <Grid3>
                <Field label="Phone">
                  <Inp value={personal.phone} placeholder="e.g. 0712345678"
                    onChange={e => setP('phone', e.target.value)} />
                </Field>
                <Field label="Height (cm)">
                  <Inp type="number" value={personal.height_cm} placeholder="e.g. 172"
                    onChange={e => setP('height_cm', e.target.value)} />
                </Field>
                <Field label="Weight (kg)">
                  <Inp type="number" value={personal.weight_kg} placeholder="e.g. 68"
                    onChange={e => setP('weight_kg', e.target.value)} />
                </Field>
                <Field label="Eye Color">
                  <Inp value={personal.eye_color} placeholder="e.g. Brown"
                    onChange={e => setP('eye_color', e.target.value)} />
                </Field>
              </Grid3>

              <Field label="Distinguishing Marks">
                <Txt rows={2} value={personal.distinguishing_marks}
                  placeholder="e.g. Scar on left cheek, tattoo on right forearm"
                  onChange={e => setP('distinguishing_marks', e.target.value)} />
              </Field>
            </div>
          )}

          {/* ── Crime tab ── */}
          {tab === 'crime' && (
            <div style={s.panel}>
              <div style={s.panelTitle}>Crime Details</div>

              <Grid2>
                <Field label="Case ID">
                  <Inp value={crime.case_id} placeholder="e.g. CASE-2024-001"
                    onChange={e => setC('case_id', e.target.value)} />
                </Field>
                <Field label="Crime Type" required>
                  <Inp value={crime.crime_type} placeholder="e.g. Armed Robbery"
                    onChange={e => setC('crime_type', e.target.value)} />
                </Field>
                <Field label="Crime Date">
                  <Inp type="date" value={crime.crime_date}
                    onChange={e => setC('crime_date', e.target.value)} />
                </Field>
                <Field label="Crime Location">
                  <Inp value={crime.crime_location} placeholder="e.g. Colombo 07"
                    onChange={e => setC('crime_location', e.target.value)} />
                </Field>
                <Field label="Crime Status">
                  <Sel value={crime.crime_status} onChange={e => setC('crime_status', e.target.value)}>
                    <option>Wanted</option>
                    <option>Under Investigation</option>
                    <option>Arrested</option>
                    <option>Convicted</option>
                    <option>Released</option>
                    <option>Deceased</option>
                  </Sel>
                </Field>
                <Field label="Weapons Used">
                  <Inp value={crime.weapons_used} placeholder="e.g. Firearm, Knife"
                    onChange={e => setC('weapons_used', e.target.value)} />
                </Field>
                <Field label="Victims Count">
                  <Inp type="number" value={crime.victims_count} placeholder="e.g. 2"
                    onChange={e => setC('victims_count', e.target.value)} />
                </Field>
                <Field label="Damage Value (LKR)">
                  <Inp value={crime.damage_value} placeholder="e.g. 1,500,000"
                    onChange={e => setC('damage_value', e.target.value)} />
                </Field>
              </Grid2>

              <Field label="Crime Description">
                <Txt rows={4} value={crime.crime_description}
                  placeholder="Detailed description of the crime..."
                  onChange={e => setC('crime_description', e.target.value)} />
              </Field>
            </div>
          )}

          {/* ── Officer tab ── */}
          {tab === 'officer' && (
            <div style={s.panel}>
              <div style={s.panelTitle}>Registering Officer</div>

              <Grid2>
                <Field label="Officer ID">
                  <Inp value={officer.officer_id} placeholder="e.g. OFF-0042"
                    onChange={e => setO('officer_id', e.target.value)} />
                </Field>
                <Field label="Officer Name">
                  <Inp value={officer.officer_name} placeholder="e.g. Sgt. Nimal Silva"
                    onChange={e => setO('officer_name', e.target.value)} />
                </Field>
                <Field label="Badge Number">
                  <Inp value={officer.badge_number} placeholder="e.g. SLP-2234"
                    onChange={e => setO('badge_number', e.target.value)} />
                </Field>
                <Field label="Station">
                  <Inp value={officer.station} placeholder="e.g. Colombo Central"
                    onChange={e => setO('station', e.target.value)} />
                </Field>
                <Field label="Rank">
                  <Sel value={officer.rank} onChange={e => setO('rank', e.target.value)}>
                    <option value="">— Select Rank —</option>
                    <option>Constable</option>
                    <option>Senior Constable</option>
                    <option>Sergeant</option>
                    <option>Inspector</option>
                    <option>Sub-Inspector</option>
                    <option>Chief Inspector</option>
                    <option>Superintendent</option>
                    <option>DIG</option>
                    <option>IGP</option>
                  </Sel>
                </Field>
              </Grid2>

              <SectionHead title="Authorization Notice" />
              <div style={s.noticeBox}>
                By submitting this enrollment, the registering officer confirms that
                all information is accurate to the best of their knowledge. This record
                will be written immutably to the Ethereum blockchain. Falsification of
                records is a criminal offence under Sri Lanka Police regulations.
              </div>
            </div>
          )}

          {/* ── Files tab ── */}
          {tab === 'files' && (
            <div style={s.panel}>
              <div style={s.panelTitle}>Biometric Files</div>

              <SectionHead title="Face Photo (Required)" />
              <div className="lecs-upload" onClick={() => photoRef.current.click()}
                style={{
                  ...s.uploadZone,
                  borderColor: photo ? '#22c55e' : '#1a3a5c',
                  background:  photo ? '#060d06' : '#070d1a',
                  marginBottom: '14px',
                }}>
                <input ref={photoRef} type="file" accept="image/*"
                  style={{ display: 'none' }} onChange={e => pickPhoto(e.target.files[0])} />
                <div style={{ fontSize: '24px', color: photo ? '#22c55e' : '#1a3a5c' }}>◉</div>
                <div style={s.uzMain}>{photo ? photo.name : 'Click to Upload Face Photo'}</div>
                <div style={s.uzSub}>
                  {photo
                    ? `${(photo.size / 1024).toFixed(0)} KB — click to change`
                    : 'JPG, PNG, JPEG — Clear frontal face required'}
                </div>
              </div>

              <SectionHead title="Video for Enrollment (Optional)" />
              <div className="lecs-upload" onClick={() => videoRef.current.click()}
                style={{
                  ...s.uploadZone,
                  borderColor: video ? '#22c55e' : '#1a3a5c',
                  background:  video ? '#060d06' : '#070d1a',
                  marginBottom: '14px',
                }}>
                <input ref={videoRef} type="file" accept="video/*"
                  style={{ display: 'none' }} onChange={e => pickVideo(e.target.files[0])} />
                <div style={{ fontSize: '24px', color: video ? '#22c55e' : '#1a3a5c' }}>▶</div>
                <div style={s.uzMain}>{video ? video.name : 'Click to Upload Video'}</div>
                <div style={s.uzSub}>
                  {video
                    ? `${(video.size / 1024 / 1024).toFixed(1)} MB — click to change`
                    : 'MP4, MOV, AVI — Used to generate multiple face embeddings'}
                </div>
              </div>

              <div style={s.chainInfo}>
                <div style={s.ciTitle}>⬡ Blockchain Storage</div>
                <div style={s.ciBody}>
                  Face embeddings are hashed with SHA-256 and written to the Ethereum smart
                  contract. Photos are stored encrypted on the local server — only the hash
                  is on-chain. Records are immutable once submitted.
                </div>
              </div>
            </div>
          )}

          {/* ── Nav buttons ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <button onClick={() => {
              const idx = TABS.findIndex(t => t.id === tab);
              if (idx > 0) setTab(TABS[idx - 1].id);
            }} style={{
              ...s.navBtn, opacity: tab === 'personal' ? 0.3 : 1,
              cursor: tab === 'personal' ? 'default' : 'pointer',
            }} disabled={tab === 'personal'}>← Previous</button>

            {tab !== 'files' ? (
              <button onClick={() => {
                const idx = TABS.findIndex(t => t.id === tab);
                setTab(TABS[idx + 1].id);
              }} style={{ ...s.navBtn, color: '#3a8adc', borderColor: '#1a3a5c' }}>
                Next →
              </button>
            ) : (
              <button className="lecs-btn-reg" onClick={handleSubmit} disabled={loading}
                style={{ ...s.btnRegister, opacity: loading ? 0.5 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'ENROLLING...' : '⬡ Register to Blockchain'}
              </button>
            )}
          </div>
        </div>

        {/* ── Right: preview + result ── */}
        <div>

          {/* Photo preview */}
          <div style={s.panel}>
            <div style={s.panelTitle}>Biometric Preview</div>

            {preview ? (
              <div style={s.previewWrap}>
                <img src={preview} alt="preview" style={s.previewImg} />
                {/* Scan line overlay */}
                <div style={s.scanOverlay}>
                  <div style={s.scanCorner('tl')} />
                  <div style={s.scanCorner('tr')} />
                  <div style={s.scanCorner('bl')} />
                  <div style={s.scanCorner('br')} />
                </div>
                <div style={s.previewLabel}>
                  {photo?.name} — {(photo?.size / 1024).toFixed(0)} KB
                </div>
              </div>
            ) : (
              <div style={s.previewPlaceholder}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', color: '#0f1e35', marginBottom: '8px' }}>◉</div>
                  <div style={{ fontSize: '9px', color: '#0f1e35', letterSpacing: '2px' }}>NO IMAGE UPLOADED</div>
                </div>
              </div>
            )}

            {/* Form summary */}
            <div style={s.summaryBox}>
              <div style={s.sumTitle}>Record Summary</div>
              {[
                { l: 'Name',    v: personal.full_name || '—' },
                { l: 'Age',     v: age || '—' },
                { l: 'NIC',     v: personal.nic_number || '—' },
                { l: 'Crime',   v: crime.crime_type || '—' },
                { l: 'Status',  v: crime.crime_status },
                { l: 'Station', v: officer.station || '—' },
                { l: 'Photo',   v: photo ? '✓ Uploaded' : '✗ Missing' },
                { l: 'Video',   v: video ? '✓ Uploaded' : 'Optional' },
              ].map(r => (
                <div key={r.l} style={s.sumRow}>
                  <span style={s.sumLbl}>{r.l}</span>
                  <span style={{
                    ...s.sumVal,
                    color: r.v === '✗ Missing' ? '#e05050'
                         : r.v === '✓ Uploaded' ? '#22c55e'
                         : '#a0c0e8',
                  }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Result / Error */}
          {error && (
            <Alert type="error" title="Enrollment Failed" msg={error} />
          )}
          {result && (
            <Alert
              type="success"
              title="Enrolled Successfully"
              msg={`${result.name} registered as ${result.criminal_id}. ${result.message}`}
              tx={result.blockchain_tx}
            />
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={s.footer}>
        <span style={s.footerTxt}>LECS v2.4.1 — ENROLLMENT MODULE — RESTRICTED</span>
        <span style={s.enc}>AES-256 ENCRYPTED</span>
      </div>
    </div>
  );
}

/* ── Styles ── */
const s = {
  pg: {
    background: '#0a0e1a', color: '#c8d8f0',
    fontFamily: "'Courier New', monospace",
  },
  pageHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid #1a3a5c', paddingBottom: '14px', marginBottom: '18px',
  },
  phLeft:  { display: 'flex', alignItems: 'center', gap: '10px' },
  phIcon:  {
    width: '34px', height: '34px', background: '#0a1a10',
    border: '2px solid #1a4a1a', borderRadius: '3px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
  },
  phTitle: { fontSize: '12px', fontWeight: '700', color: '#e0ecff', letterSpacing: '2px', textTransform: 'uppercase' },
  phSub:   { fontSize: '9px', color: '#2a5a8a', letterSpacing: '2px', marginTop: '2px' },
  statusPill: {
    background: '#0a1a10', border: '1px solid #1a4a1a',
    color: '#22c55e', fontSize: '9px', padding: '3px 10px', letterSpacing: '2px',
  },

  outerGrid: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '14px', alignItems: 'start' },

  tabBar: {
    display: 'flex', gap: '2px',
    borderBottom: '1px solid #1a3a5c', marginBottom: '0',
  },
  tabBtn: {
    padding: '7px 14px', fontSize: '10px', letterSpacing: '1.5px',
    fontFamily: "'Courier New', monospace", textTransform: 'uppercase',
    cursor: 'pointer', border: '1px solid transparent', borderBottom: 'none',
    marginBottom: '-1px',
  },

  panel: {
    background: '#0d1526', border: '1px solid #1a3a5c',
    padding: '18px', marginBottom: '14px',
    borderTop: 'none',
  },
  panelTitle: {
    fontSize: '10px', fontWeight: '700', color: '#4a8adc',
    letterSpacing: '3px', textTransform: 'uppercase',
    borderLeft: '3px solid #2a6fc4', paddingLeft: '8px', marginBottom: '16px',
  },

  sectionHead: {
    fontSize: '9px', color: '#2a6fc4', letterSpacing: '3px',
    textTransform: 'uppercase', margin: '16px 0 10px',
    borderLeft: '2px solid #1a3a5c', paddingLeft: '8px',
  },

  lbl: {
    display: 'block', fontSize: '9px', color: '#2a5a8a',
    letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '5px',
  },
  inp: {
    width: '100%', background: '#070d1a',
    border: '1px solid #1a3a5c', color: '#c8d8f0',
    fontFamily: "'Courier New', monospace", fontSize: '11px',
    letterSpacing: '1px', padding: '8px 10px',
    borderRadius: '2px', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },

  uploadZone: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: '6px', border: '2px dashed',
    padding: '22px 16px', cursor: 'pointer', borderRadius: '2px',
  },
  uzMain: { fontSize: '9px', color: '#1a4a6a', letterSpacing: '2px', textTransform: 'uppercase' },
  uzSub:  { fontSize: '9px', color: '#0f2a40', letterSpacing: '1px', textAlign: 'center' },

  noticeBox: {
    background: '#070d1a', border: '1px solid #1a2a1a',
    borderLeft: '3px solid #2a5a2a', padding: '12px 14px',
    fontSize: '9px', color: '#2a5a3a', letterSpacing: '0.5px', lineHeight: '1.8',
  },

  chainInfo: {
    background: '#0d1020', border: '1px solid #1a2040',
    borderLeft: '3px solid #3a8adc', padding: '10px 14px',
  },
  ciTitle: {
    fontSize: '9px', fontWeight: '700', color: '#2a5a8a',
    letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '5px',
  },
  ciBody: { fontSize: '9px', color: '#1a3a5a', letterSpacing: '1px', lineHeight: '1.7' },

  navBtn: {
    background: 'transparent', border: '1px solid #1a2a3a',
    color: '#2a5a7a', fontFamily: "'Courier New', monospace",
    fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase',
    padding: '7px 16px', cursor: 'pointer',
  },
  btnRegister: {
    background: '#0a1a30', border: '1px solid #2a5a9c',
    color: '#60a5fa', fontFamily: "'Courier New', monospace",
    fontSize: '10px', fontWeight: '700', letterSpacing: '3px',
    textTransform: 'uppercase', padding: '10px 24px', cursor: 'pointer',
  },

  previewWrap: {
    background: '#050a10', border: '1px solid #1a3a5c',
    marginBottom: '14px', overflow: 'hidden', position: 'relative',
  },
  previewImg: { width: '100%', maxHeight: '220px', objectFit: 'cover', objectPosition: 'top', display: 'block' },
  scanOverlay: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  scanCorner: (pos) => ({
    position: 'absolute',
    width: '12px', height: '12px',
    borderColor: '#2a6fc4', borderStyle: 'solid', borderWidth: 0,
    ...(pos === 'tl' ? { top: '6px', left: '6px', borderTopWidth: '2px', borderLeftWidth: '2px' } : {}),
    ...(pos === 'tr' ? { top: '6px', right: '6px', borderTopWidth: '2px', borderRightWidth: '2px' } : {}),
    ...(pos === 'bl' ? { bottom: '6px', left: '6px', borderBottomWidth: '2px', borderLeftWidth: '2px' } : {}),
    ...(pos === 'br' ? { bottom: '6px', right: '6px', borderBottomWidth: '2px', borderRightWidth: '2px' } : {}),
  }),
  previewLabel: {
    padding: '6px 10px', fontSize: '9px', color: '#2a5a7a',
    letterSpacing: '2px', textTransform: 'uppercase', borderTop: '1px solid #1a3a5c',
  },
  previewPlaceholder: {
    background: '#070d1a', border: '2px dashed #0f1e35',
    height: '180px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', marginBottom: '14px',
  },

  summaryBox: {
    background: '#070d1a', border: '1px solid #0f1e35', padding: '12px',
  },
  sumTitle: {
    fontSize: '9px', color: '#2a5a8a', letterSpacing: '2px',
    textTransform: 'uppercase', marginBottom: '8px',
    borderLeft: '2px solid #1a3a5c', paddingLeft: '8px',
  },
  sumRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '4px 0', borderBottom: '1px solid #0a1220',
  },
  sumLbl: { fontSize: '9px', color: '#1a3a5a', letterSpacing: '1px', textTransform: 'uppercase' },
  sumVal: { fontSize: '10px', fontFamily: "'Courier New', monospace", letterSpacing: '0.5px' },

  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginTop: '16px', paddingTop: '10px', borderTop: '1px solid #0d1a2e',
  },
  footerTxt: { fontSize: '9px', color: '#1a3a5a', letterSpacing: '1.5px' },
  enc: {
    background: '#06090f', border: '1px solid #0d1f35',
    color: '#1e4a6a', fontSize: '9px', padding: '3px 10px', letterSpacing: '2px',
  },
};
