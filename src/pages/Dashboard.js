import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000';

// ── Theme / Style tokens ──────────────────────────────────────────────────────
const T = {
  bg:        '#070b14',
  surface:   '#0d1526',
  surface2:  '#0a1020',
  border:    '#1a3a5c',
  borderMid: '#2a5a7a',
  blue:      '#3a8adc',
  blueDark:  '#2a6fc4',
  blueMid:   '#1a4a8a',
  red:       '#e05050',
  green:     '#22c55e',
  purple:    '#7a5af8',
  text:      '#c8d8f0',
  textMid:   '#a0c0e8',
  textDim:   '#4a7aaa',
  textFaint: '#2a5a7a',
  font:      "'Courier New', monospace",
};

const base = {
  background: T.bg,
  minHeight: '100vh',
  padding: '20px',
  color: T.text,
  fontFamily: T.font,
  boxSizing: 'border-box',
};

// ── Shared UI atoms ──────────────────────────────────────────────────────────

function TopBar({ time }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
      borderBottom:`1px solid ${T.border}`, paddingBottom:'14px', marginBottom:'22px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
        <div style={{ width:'36px', height:'36px', background:T.surface, border:`2px solid ${T.blueDark}`,
          borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>⚖</div>
        <div>
          <div style={{ fontSize:'13px', fontWeight:'700', color:'#e0ecff',
            letterSpacing:'2px', textTransform:'uppercase' }}>Law Enforcement Command System</div>
          <div style={{ fontSize:'10px', color:T.textDim, letterSpacing:'1px', marginTop:'2px' }}>
            BLOCKCHAIN CRIMINAL REGISTRY — CLASSIFIED
          </div>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
        <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:T.green }} />
        <span style={{ fontSize:'10px', color:T.green, letterSpacing:'2px' }}>LIVE</span>
        <span style={{ fontSize:'12px', color:T.textDim, letterSpacing:'1px' }}>{time}</span>
      </div>
    </div>
  );
}

function TabBar({ tabs, active, setActive }) {
  return (
    <div style={{ display:'flex', gap:'4px', marginBottom:'22px',
      borderBottom:`1px solid ${T.border}`, paddingBottom:'0' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setActive(t.id)} style={{
          background: active === t.id ? T.surface : 'transparent',
          border: active === t.id ? `1px solid ${T.border}` : '1px solid transparent',
          borderBottom: active === t.id ? `1px solid ${T.surface}` : '1px solid transparent',
          color: active === t.id ? T.blue : T.textDim,
          padding:'8px 18px', cursor:'pointer', fontSize:'10px',
          letterSpacing:'2px', fontFamily:T.font, textTransform:'uppercase',
          marginBottom: active === t.id ? '-1px' : '0',
          transition:'color 0.15s',
        }}>{t.icon} {t.label}</button>
      ))}
    </div>
  );
}

function StatCard({ label, value, accent, sub, small }) {
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`,
      borderTop:`2px solid ${accent}`, padding:'14px 16px' }}>
      <div style={{ fontSize:'9px', color:T.textDim, letterSpacing:'2px',
        textTransform:'uppercase', marginBottom:'6px' }}>{label}</div>
      <div style={{ color:accent, fontWeight:'700', letterSpacing:'1px',
        fontSize: small ? '14px' : '26px', fontFamily:T.font,
        paddingTop: small ? '6px' : 0 }}>{value}</div>
      <div style={{ fontSize:'9px', color:T.textFaint, marginTop:'4px', letterSpacing:'1px' }}>{sub}</div>
    </div>
  );
}

function SectionHead({ title, badge }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
      <div style={{ fontSize:'10px', fontWeight:'700', color:T.blue, letterSpacing:'3px',
        textTransform:'uppercase', borderLeft:`3px solid ${T.blueDark}`, paddingLeft:'10px' }}>{title}</div>
      {badge != null && (
        <span style={{ background:'#0d2040', border:`1px solid #2a4a6a`, color:T.blue,
          fontSize:'10px', padding:'2px 8px', borderRadius:'2px', letterSpacing:'1px' }}>{badge} RECORDS</span>
      )}
    </div>
  );
}

function PhotoDisplay({ criminal_id, large, thumb }) {
  const [err, setErr] = useState(false);
  const size = large ? { width:'140px', height:'180px' }
             : thumb  ? { width:'44px',  height:'52px'  }
             :          { width:'100%',  height:'180px' };
  if (err) return (
    <div style={{ ...size, background:T.surface2, border:`1px solid ${T.border}`,
      display:'flex', alignItems:'center', justifyContent:'center',
      color:T.textFaint, fontSize: large ? '48px' : thumb ? '20px' : '36px' }}>👤</div>
  );
  return (
    <img src={`${API}/api/enrollment/photo/${criminal_id}`} alt={criminal_id}
      style={{ ...size, objectFit:'cover', objectPosition:'top',
        borderRadius: large ? '6px' : thumb ? '3px' : '0',
        border: large ? `2px solid ${T.blueDark}` : `1px solid ${T.border}`, display:'block' }}
      onError={() => setErr(true)} />
  );
}

function FieldRow({ label, value }) {
  return (
    <div style={{ display:'flex', gap:'12px', padding:'6px 0', borderBottom:`1px solid #0f1e35` }}>
      <div style={{ fontSize:'9px', color:T.textDim, letterSpacing:'1px',
        textTransform:'uppercase', width:'110px', flexShrink:0, paddingTop:'2px' }}>{label}</div>
      <div style={{ fontSize:'11px', color:'#c0d8f0', fontFamily:T.font, lineHeight:'1.5' }}>
        {value || '—'}
      </div>
    </div>
  );
}

function Alert({ type, msg }) {
  if (!msg) return null;
  const color = type === 'success' ? T.green : T.red;
  return (
    <div style={{ background: type === 'success' ? '#051a0a' : '#1a0505',
      border:`1px solid ${color}`, color, padding:'10px 14px',
      fontSize:'11px', letterSpacing:'1px', marginBottom:'14px', borderRadius:'2px' }}>
      {type === 'success' ? '✓' : '✗'} {msg}
    </div>
  );
}

function Btn({ children, onClick, loading, accent, style: extra }) {
  const col = accent || T.blueDark;
  return (
    <button onClick={onClick} disabled={loading} style={{
      background: col, border:'none', color:'#fff', padding:'10px 22px',
      fontSize:'10px', letterSpacing:'2px', fontFamily:T.font, cursor: loading ? 'wait' : 'pointer',
      textTransform:'uppercase', opacity: loading ? 0.6 : 1, ...extra }}>
      {loading ? 'PROCESSING...' : children}
    </button>
  );
}

function Input({ label, id, required, ...rest }) {
  return (
    <div style={{ marginBottom:'12px' }}>
      <label style={{ display:'block', fontSize:'9px', color:T.textDim,
        letterSpacing:'2px', textTransform:'uppercase', marginBottom:'5px' }}>
        {label}{required && <span style={{ color:T.red }}> *</span>}
      </label>
      <input id={id} {...rest} style={{
        width:'100%', background:T.surface2, border:`1px solid ${T.border}`,
        color:T.text, padding:'8px 10px', fontSize:'11px', fontFamily:T.font,
        boxSizing:'border-box', outline:'none', ...rest.style }} />
    </div>
  );
}

function Select({ label, children, required, ...rest }) {
  return (
    <div style={{ marginBottom:'12px' }}>
      <label style={{ display:'block', fontSize:'9px', color:T.textDim,
        letterSpacing:'2px', textTransform:'uppercase', marginBottom:'5px' }}>
        {label}{required && <span style={{ color:T.red }}> *</span>}
      </label>
      <select {...rest} style={{
        width:'100%', background:T.surface2, border:`1px solid ${T.border}`,
        color:T.text, padding:'8px 10px', fontSize:'11px', fontFamily:T.font,
        boxSizing:'border-box', outline:'none' }}>
        {children}
      </select>
    </div>
  );
}

function Textarea({ label, required, ...rest }) {
  return (
    <div style={{ marginBottom:'12px' }}>
      <label style={{ display:'block', fontSize:'9px', color:T.textDim,
        letterSpacing:'2px', textTransform:'uppercase', marginBottom:'5px' }}>
        {label}{required && <span style={{ color:T.red }}> *</span>}
      </label>
      <textarea {...rest} style={{
        width:'100%', background:T.surface2, border:`1px solid ${T.border}`,
        color:T.text, padding:'8px 10px', fontSize:'11px', fontFamily:T.font,
        boxSizing:'border-box', outline:'none', resize:'vertical', ...rest.style }} />
    </div>
  );
}

function GridCols({ cols, children }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:'14px' }}>
      {children}
    </div>
  );
}

function FormSection({ title }) {
  return (
    <div style={{ fontSize:'9px', color:T.blue, letterSpacing:'3px',
      textTransform:'uppercase', margin:'18px 0 10px',
      borderLeft:`2px solid ${T.blueDark}`, paddingLeft:'8px' }}>{title}</div>
  );
}

// ── Tab 1: Dashboard ─────────────────────────────────────────────────────────

function DashboardTab() {
  const [stats, setStats]         = useState(null);
  const [criminals, setCriminals] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);

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

  if (loading) return <p style={{ color:T.blue, textAlign:'center',
    marginTop:'3rem', letterSpacing:'3px', fontSize:'12px' }}>LOADING SECURE DATA...</p>;

  return (
    <>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'20px' }}>
        <StatCard label="Registered Criminals"
          value={String(stats?.total_criminals ?? 0).padStart(4,'0')} accent={T.blue} sub="TOTAL RECORDS" />
        <StatCard label="Identifications"
          value={stats?.total_identifications?.toLocaleString() ?? 0} accent={T.red} sub="TOTAL MATCHES" />
        <StatCard label="Blockchain Block"
          value={`#${stats?.blockchain_block ?? 0}`} accent={T.purple} sub="CURRENT HEIGHT" />
        <StatCard label="System Status"
          value={stats?.blockchain_connected ? 'ONLINE' : 'OFFLINE'}
          accent={stats?.blockchain_connected ? T.green : T.red} sub="NODE STATUS" small />
      </div>

      {/* Criminal Card Grid */}
      <SectionHead title="Criminal Registry — Blockchain Verified" badge={criminals.length} />
      {criminals.length === 0
        ? <div style={{ background:T.surface, border:`1px solid ${T.border}`, padding:'2rem',
            textAlign:'center', color:T.textFaint, fontSize:'11px', letterSpacing:'3px' }}>
            NO RECORDS FOUND
          </div>
        : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))',
            gap:'12px', marginBottom:'20px' }}>
            {criminals.map(c => (
              <div key={c.criminal_id} onClick={() => setSelected(c)}
                style={{ background:T.surface, border:`1px solid ${T.border}`,
                  cursor:'pointer', overflow:'hidden' }}>
                <div style={{ position:'relative', height:'180px', background:'#050a14' }}>
                  <PhotoDisplay criminal_id={c.criminal_id} />
                  <div style={{ position:'absolute', bottom:'6px', left:'6px',
                    background:'rgba(0,0,0,0.85)', color:T.red,
                    fontSize:'9px', padding:'2px 8px', letterSpacing:'1px', fontWeight:'700' }}>
                    {c.is_active ? '● WANTED' : '✓ INACTIVE'}
                  </div>
                </div>
                <div style={{ padding:'10px 12px' }}>
                  <div style={{ fontSize:'13px', fontWeight:'700', color:'#ddeeff',
                    marginBottom:'3px' }}>{c.name}</div>
                  <div style={{ fontSize:'10px', color:T.blue, marginBottom:'6px',
                    letterSpacing:'1px' }}>{c.criminal_id}</div>
                  <div style={{ fontSize:'9px', color:T.red, letterSpacing:'0.5px',
                    marginBottom:'6px', textTransform:'uppercase' }}>
                    {c.crime_history?.slice(0,50)}...
                  </div>
                  <div style={{ fontSize:'9px', color:T.textFaint, fontFamily:T.font }}>
                    ⬡ {c.embedding_hash?.slice(0,14)}...
                  </div>
                </div>
                <div style={{ background:T.surface2, borderTop:`1px solid ${T.border}`,
                  color:T.blueDark, fontSize:'9px', padding:'7px 12px',
                  letterSpacing:'2px', textAlign:'center' }}>VIEW FULL RECORD →</div>
              </div>
            ))}
          </div>
      }

      {/* Table */}
      {criminals.length > 0 && <>
        <SectionHead title="Registry Table View" />
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'11px' }}>
            <thead>
              <tr style={{ background:T.surface2, borderBottom:`2px solid ${T.border}` }}>
                {['Photo','Subject ID','Full Name','Age','Crime History','Registered','Hash']
                  .map(h => <th key={h} style={{ padding:'10px 12px', textAlign:'left',
                    color:T.textFaint, letterSpacing:'2px', fontSize:'9px',
                    textTransform:'uppercase', fontWeight:'700' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {criminals.map(c => (
                <tr key={c.criminal_id} onClick={() => setSelected(c)}
                  style={{ borderBottom:`1px solid #0f1e35`, cursor:'pointer' }}>
                  <td style={{ padding:'10px 12px', verticalAlign:'middle' }}>
                    <PhotoDisplay criminal_id={c.criminal_id} thumb />
                  </td>
                  <td style={{ padding:'10px 12px', verticalAlign:'middle' }}>
                    <span style={{ background:'#0a1a30', border:`1px solid ${T.border}`,
                      color:T.blue, fontSize:'10px', padding:'3px 8px',
                      letterSpacing:'1px', borderRadius:'2px' }}>{c.criminal_id}</span>
                  </td>
                  <td style={{ padding:'10px 12px', color:'#ddeeff', fontWeight:'600' }}>{c.name}</td>
                  <td style={{ padding:'10px 12px', color:'#6a9abf' }}>{c.age}</td>
                  <td style={{ padding:'10px 12px' }}>
                    <span style={{ background:'#1a0a0a', border:`1px solid #4a1a1a`,
                      color:T.red, fontSize:'9px', padding:'2px 8px',
                      borderRadius:'2px', letterSpacing:'1px', textTransform:'uppercase' }}>
                      {c.crime_history?.slice(0,40)}...
                    </span>
                  </td>
                  <td style={{ padding:'10px 12px', fontSize:'10px', color:T.textFaint }}>
                    {new Date(c.registered_at * 1000).toLocaleString('en-GB', { hour12:false })}
                  </td>
                  <td style={{ padding:'10px 12px', fontSize:'9px', color:T.textFaint }}>
                    <span style={{ color:T.purple }}>⬡ </span>{c.embedding_hash?.slice(0,14)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>}

      {/* Detail Modal */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{
          position:'fixed', top:0, left:0, right:0, bottom:0,
          background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center',
          justifyContent:'center', zIndex:1000 }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:T.surface, border:`1px solid ${T.blueDark}`,
            width:'620px', maxWidth:'95vw', maxHeight:'88vh', overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'16px 20px', background:T.surface2, borderBottom:`1px solid ${T.border}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'32px', height:'32px', background:T.surface,
                  border:`2px solid ${T.blueDark}`, borderRadius:'4px',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>⚖</div>
                <div>
                  <div style={{ fontSize:'12px', fontWeight:'700', color:'#e0ecff',
                    letterSpacing:'3px', textTransform:'uppercase' }}>CRIMINAL RECORD</div>
                  <div style={{ fontSize:'9px', color:T.textDim, letterSpacing:'1px', marginTop:'2px' }}>
                    BLOCKCHAIN VERIFIED — CLASSIFIED
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{
                background:'none', border:`1px solid #2a4a6a`, color:T.textDim,
                cursor:'pointer', fontSize:'14px', padding:'4px 10px', fontFamily:T.font }}>✕</button>
            </div>
            <div style={{ height:'1px', background:T.border }} />
            <div style={{ display:'flex', gap:'20px', padding:'20px' }}>
              <div style={{ width:'160px', flexShrink:0, display:'flex', flexDirection:'column',
                alignItems:'center', gap:'10px' }}>
                <PhotoDisplay criminal_id={selected.criminal_id} large />
                <div style={{ background:'#0a1a30', border:`1px solid ${T.border}`, color:T.blue,
                  fontSize:'11px', padding:'4px 12px', letterSpacing:'2px',
                  textAlign:'center', width:'100%', boxSizing:'border-box' }}>{selected.criminal_id}</div>
                <div style={{ background:'#1a0505', border:`1px solid #4a1a1a`, color:T.red,
                  fontSize:'10px', padding:'4px 12px', letterSpacing:'2px',
                  textAlign:'center', width:'100%', boxSizing:'border-box', fontWeight:'700' }}>
                  {selected.is_active ? '● WANTED' : '✓ INACTIVE'}
                </div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'18px', fontWeight:'700', color:'#e0ecff',
                  letterSpacing:'1px', marginBottom:'16px', textTransform:'uppercase',
                  borderBottom:`1px solid ${T.border}`, paddingBottom:'12px' }}>{selected.name}</div>
                <FormSection title="PERSONAL" />
                <FieldRow label="Age" value={selected.age} />
                <FieldRow label="Status" value={selected.is_active ? 'ACTIVE / WANTED' : 'INACTIVE'} />
                <FormSection title="CRIME RECORD" />
                <FieldRow label="History" value={selected.crime_history} />
                <FormSection title="BLOCKCHAIN" />
                <FieldRow label="Registered"
                  value={new Date(selected.registered_at * 1000).toLocaleString('en-GB', { hour12:false })} />
                <FieldRow label="Officer" value={selected.registered_by?.slice(0,22) + '...'} />
                <FieldRow label="Embedding Hash" value={selected.embedding_hash?.slice(0,32) + '...'} />
              </div>
            </div>
            <div style={{ height:'1px', background:T.border }} />
            <div style={{ padding:'10px 20px', background:T.surface2, textAlign:'center',
              fontSize:'9px', color:T.textFaint, letterSpacing:'2px' }}>
              RECORD IMMUTABLE — STORED ON ETHEREUM BLOCKCHAIN
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Tab 2: Enrollment ────────────────────────────────────────────────────────

function EnrollmentTab() {
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const [form, setForm] = useState({
    full_name:'', age:'', dob:'', nic_number:'', gender:'', nationality:'Sri Lankan',
    address:'', phone:'', occupation:'', height_cm:'', weight_kg:'', eye_color:'',
    distinguishing_marks:'', crime_type:'', case_id:'', crime_description:'',
    crime_date:'', crime_location:'', crime_status:'Wanted', weapons_used:'',
    victims_count:'', damage_value:'', officer_id:'', officer_name:'', badge_number:'',
    station:'', rank:'',
  });
  const [photo, setPhoto]   = useState(null);
  const [video, setVideo]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [err, setErr]         = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.full_name || !form.age || !form.crime_type) {
      setErr('Full name, age, and crime type are required.'); return;
    }
    setLoading(true); setErr(null); setResult(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      if (photo) fd.append('photo', photo);
      if (video) fd.append('video', video);
      const r = await axios.post(`${API}/api/enrollment/enroll`, fd);
      setResult(r.data);
    } catch (e) {
      setErr(e.response?.data?.detail || 'Enrollment failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'20px' }}>
      {/* Left: Form */}
      <div>
        <Alert type="success" msg={result ? `Enrolled: ${result.name} — ID: ${result.criminal_id} | TX: ${result.blockchain_tx?.slice(0,20)}...` : null} />
        <Alert type="error" msg={err} />

        <FormSection title="PERSONAL INFORMATION" />
        <GridCols cols={2}>
          <Input label="Full Name" value={form.full_name} required
            onChange={e => set('full_name', e.target.value)} />
          <Input label="Age" type="number" value={form.age} required
            onChange={e => set('age', e.target.value)} />
          <Input label="Date of Birth" type="date" value={form.dob}
            onChange={e => set('dob', e.target.value)} />
          <Input label="NIC Number" value={form.nic_number}
            onChange={e => set('nic_number', e.target.value)} />
        </GridCols>
        <GridCols cols={3}>
          <Select label="Gender" value={form.gender} onChange={e => set('gender', e.target.value)}>
            <option value="">Select</option>
            <option>Male</option><option>Female</option><option>Other</option>
          </Select>
          <Input label="Nationality" value={form.nationality}
            onChange={e => set('nationality', e.target.value)} />
          <Input label="Occupation" value={form.occupation}
            onChange={e => set('occupation', e.target.value)} />
        </GridCols>
        <Textarea label="Address" rows={2} value={form.address}
          onChange={e => set('address', e.target.value)} />
        <GridCols cols={4}>
          <Input label="Phone" value={form.phone}
            onChange={e => set('phone', e.target.value)} />
          <Input label="Height (cm)" type="number" value={form.height_cm}
            onChange={e => set('height_cm', e.target.value)} />
          <Input label="Weight (kg)" type="number" value={form.weight_kg}
            onChange={e => set('weight_kg', e.target.value)} />
          <Input label="Eye Color" value={form.eye_color}
            onChange={e => set('eye_color', e.target.value)} />
        </GridCols>
        <Textarea label="Distinguishing Marks" rows={2} value={form.distinguishing_marks}
          onChange={e => set('distinguishing_marks', e.target.value)} />

        <FormSection title="CRIME DETAILS" />
        <GridCols cols={2}>
          <Input label="Case ID" value={form.case_id}
            onChange={e => set('case_id', e.target.value)} />
          <Input label="Crime Type" value={form.crime_type} required
            onChange={e => set('crime_type', e.target.value)} />
          <Input label="Crime Date" type="date" value={form.crime_date}
            onChange={e => set('crime_date', e.target.value)} />
          <Input label="Crime Location" value={form.crime_location}
            onChange={e => set('crime_location', e.target.value)} />
          <Select label="Crime Status" value={form.crime_status}
            onChange={e => set('crime_status', e.target.value)}>
            <option>Wanted</option><option>Under Investigation</option>
            <option>Arrested</option><option>Convicted</option><option>Released</option>
          </Select>
          <Input label="Weapons Used" value={form.weapons_used}
            onChange={e => set('weapons_used', e.target.value)} />
          <Input label="Victims Count" type="number" value={form.victims_count}
            onChange={e => set('victims_count', e.target.value)} />
          <Input label="Damage Value (LKR)" value={form.damage_value}
            onChange={e => set('damage_value', e.target.value)} />
        </GridCols>
        <Textarea label="Crime Description" rows={3} value={form.crime_description}
          onChange={e => set('crime_description', e.target.value)} />

        <FormSection title="OFFICER INFORMATION" />
        <GridCols cols={3}>
          <Input label="Officer ID" value={form.officer_id}
            onChange={e => set('officer_id', e.target.value)} />
          <Input label="Officer Name" value={form.officer_name}
            onChange={e => set('officer_name', e.target.value)} />
          <Input label="Badge Number" value={form.badge_number}
            onChange={e => set('badge_number', e.target.value)} />
          <Input label="Station" value={form.station}
            onChange={e => set('station', e.target.value)} />
          <Input label="Rank" value={form.rank}
            onChange={e => set('rank', e.target.value)} />
        </GridCols>

        <div style={{ marginTop:'20px', display:'flex', gap:'10px' }}>
          <Btn onClick={handleSubmit} loading={loading} accent={T.blueDark}>
            REGISTER CRIMINAL
          </Btn>
        </div>
      </div>

      {/* Right: File uploads */}
      <div>
        <FormSection title="BIOMETRIC PHOTO" />
        <div onClick={() => fileRef.current.click()} style={{
          background:T.surface, border:`2px dashed ${T.border}`,
          height:'220px', display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', cursor:'pointer',
          color:T.textDim, fontSize:'11px', letterSpacing:'1px', gap:'10px',
          marginBottom:'14px', position:'relative', overflow:'hidden' }}>
          {photo
            ? <img src={URL.createObjectURL(photo)} alt="preview"
                style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top' }} />
            : <>
                <div style={{ fontSize:'36px', color:T.textFaint }}>📷</div>
                <span>CLICK TO UPLOAD PHOTO</span>
                <span style={{ fontSize:'9px', color:T.textFaint }}>JPG, PNG, JPEG</span>
              </>
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
          onChange={e => setPhoto(e.target.files[0])} />
        {photo && (
          <div style={{ fontSize:'9px', color:T.textDim, marginBottom:'14px', letterSpacing:'1px' }}>
            ✓ {photo.name} ({(photo.size/1024).toFixed(1)} KB)
            <span onClick={() => setPhoto(null)}
              style={{ color:T.red, cursor:'pointer', marginLeft:'10px' }}>✕ REMOVE</span>
          </div>
        )}

        <FormSection title="VIDEO FOR ENROLLMENT" />
        <div onClick={() => videoRef.current.click()} style={{
          background:T.surface, border:`2px dashed ${T.border}`,
          height:'120px', display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', cursor:'pointer',
          color:T.textDim, fontSize:'11px', letterSpacing:'1px', gap:'8px' }}>
          <div style={{ fontSize:'28px', color:T.textFaint }}>🎥</div>
          <span>CLICK TO UPLOAD VIDEO</span>
          <span style={{ fontSize:'9px', color:T.textFaint }}>MP4, AVI, MOV</span>
        </div>
        <input ref={videoRef} type="file" accept="video/*" style={{ display:'none' }}
          onChange={e => setVideo(e.target.files[0])} />
        {video && (
          <div style={{ fontSize:'9px', color:T.textDim, marginTop:'8px', letterSpacing:'1px' }}>
            ✓ {video.name} ({(video.size/1024/1024).toFixed(1)} MB)
            <span onClick={() => setVideo(null)}
              style={{ color:T.red, cursor:'pointer', marginLeft:'10px' }}>✕ REMOVE</span>
          </div>
        )}

        {result && (
          <div style={{ marginTop:'20px', background:'#051a0a', border:`1px solid ${T.green}`,
            padding:'14px', fontSize:'10px', letterSpacing:'1px' }}>
            <div style={{ color:T.green, marginBottom:'8px', fontWeight:'700' }}>
              ✓ ENROLLMENT COMPLETE
            </div>
            <div style={{ color:T.textMid, marginBottom:'4px' }}>ID: {result.criminal_id}</div>
            <div style={{ color:T.textMid, marginBottom:'4px' }}>NAME: {result.name}</div>
            <div style={{ color:T.textFaint, wordBreak:'break-all', fontSize:'9px' }}>
              TX: {result.blockchain_tx}
            </div>
          </div>
        )}

        <div style={{ marginTop:'20px', background:T.surface2, border:`1px solid ${T.border}`,
          padding:'14px', fontSize:'9px', color:T.textFaint, lineHeight:'1.8', letterSpacing:'0.5px' }}>
          <div style={{ color:T.textDim, marginBottom:'6px', letterSpacing:'2px' }}>INSTRUCTIONS</div>
          — All photos stored encrypted on local server<br/>
          — Face embeddings hashed and stored on Ethereum blockchain<br/>
          — Minimum 1 clear frontal photo required<br/>
          — Video used to generate multiple face embeddings<br/>
          — Record is immutable once submitted
        </div>
      </div>
    </div>
  );
}

// ── Tab 3: Evidence & Court Decisions ────────────────────────────────────────

function RecordsTab() {
  const evidFileRef = useRef(null);
  const [subTab, setSubTab] = useState('evidence');
  const [criminalId, setCriminalId] = useState('');

  // Evidence form
  const [evForm, setEvForm] = useState({
    evidence_type:'', description:'', collected_by:'', collected_date:'' });
  const [evFile, setEvFile]     = useState(null);
  const [evLoad, setEvLoad]     = useState(false);
  const [evRes, setEvRes]       = useState(null);
  const [evErr, setEvErr]       = useState(null);

  // Court form
  const [ctForm, setCtForm] = useState({
    court_name:'', judge_name:'', case_number:'', hearing_date:'',
    verdict:'Pending', sentence:'', sentence_start:'', sentence_end:'',
    appeal_status:'', notes:'' });
  const [ctLoad, setCtLoad] = useState(false);
  const [ctRes, setCtRes]   = useState(null);
  const [ctErr, setCtErr]   = useState(null);

  const setEv = (k, v) => setEvForm(f => ({ ...f, [k]: v }));
  const setCt = (k, v) => setCtForm(f => ({ ...f, [k]: v }));

  const submitEvidence = async () => {
    if (!criminalId || !evForm.evidence_type) {
      setEvErr('Criminal ID and evidence type are required.'); return;
    }
    setEvLoad(true); setEvErr(null); setEvRes(null);
    try {
      const fd = new FormData();
      Object.entries(evForm).forEach(([k,v]) => v && fd.append(k, v));
      if (evFile) fd.append('file', evFile);
      const r = await axios.post(`${API}/api/records/evidence/${criminalId}`, fd);
      setEvRes(r.data);
    } catch (e) {
      setEvErr(e.response?.data?.detail || 'Failed to add evidence.');
    } finally { setEvLoad(false); }
  };

  const submitCourt = async () => {
    if (!criminalId || !ctForm.court_name || !ctForm.verdict) {
      setCtErr('Criminal ID, court name, and verdict are required.'); return;
    }
    setCtLoad(true); setCtErr(null); setCtRes(null);
    try {
      const fd = new FormData();
      Object.entries(ctForm).forEach(([k,v]) => v && fd.append(k, v));
      const r = await axios.post(`${API}/api/records/court/${criminalId}`, fd);
      setCtRes(r.data);
    } catch (e) {
      setCtErr(e.response?.data?.detail || 'Failed to add court decision.');
    } finally { setCtLoad(false); }
  };

  return (
    <>
      {/* Criminal ID input */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`,
        padding:'16px 20px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'16px' }}>
        <div style={{ fontSize:'9px', color:T.textDim, letterSpacing:'2px',
          textTransform:'uppercase', flexShrink:0 }}>CRIMINAL ID</div>
        <input value={criminalId} onChange={e => setCriminalId(e.target.value)}
          placeholder="e.g. CRM-000001" style={{ flex:1, background:T.surface2,
          border:`1px solid ${T.border}`, color:T.text, padding:'8px 10px',
          fontSize:'12px', fontFamily:T.font, outline:'none', letterSpacing:'2px' }} />
        <div style={{ fontSize:'9px', color:T.textDim, letterSpacing:'1px' }}>
          Target criminal must be registered first
        </div>
      </div>

      {/* Sub tabs */}
      <div style={{ display:'flex', gap:'4px', marginBottom:'20px',
        borderBottom:`1px solid ${T.border}` }}>
        {[['evidence','EVIDENCE'],['court','COURT DECISION']].map(([id,label]) => (
          <button key={id} onClick={() => setSubTab(id)} style={{
            background: subTab===id ? T.surface : 'transparent',
            border: subTab===id ? `1px solid ${T.border}` : '1px solid transparent',
            borderBottom: subTab===id ? `1px solid ${T.surface}` : '1px solid transparent',
            color: subTab===id ? T.blue : T.textDim,
            padding:'7px 16px', cursor:'pointer', fontSize:'10px',
            letterSpacing:'2px', fontFamily:T.font, textTransform:'uppercase',
            marginBottom: subTab===id ? '-1px' : 0 }}>{label}</button>
        ))}
      </div>

      {subTab === 'evidence' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'20px' }}>
          <div>
            <Alert type="success" msg={evRes ? `Evidence ${evRes.evidence_id} logged. Hash: ${evRes.file_hash?.slice(0,20) || 'N/A'}...` : null} />
            <Alert type="error" msg={evErr} />
            <FormSection title="EVIDENCE DETAILS" />
            <GridCols cols={2}>
              <Select label="Evidence Type" required value={evForm.evidence_type}
                onChange={e => setEv('evidence_type', e.target.value)}>
                <option value="">Select Type</option>
                <option>image</option><option>video</option>
                <option>document</option><option>forensic</option><option>audio</option>
              </Select>
              <Input label="Collected By" value={evForm.collected_by}
                onChange={e => setEv('collected_by', e.target.value)} />
              <Input label="Collection Date" type="date" value={evForm.collected_date}
                onChange={e => setEv('collected_date', e.target.value)} />
            </GridCols>
            <Textarea label="Description" rows={4} value={evForm.description}
              onChange={e => setEv('description', e.target.value)} />
            <Btn onClick={submitEvidence} loading={evLoad}>LOG EVIDENCE ON BLOCKCHAIN</Btn>
          </div>
          <div>
            <FormSection title="EVIDENCE FILE" />
            <div onClick={() => evidFileRef.current.click()} style={{
              background:T.surface, border:`2px dashed ${T.border}`,
              height:'160px', display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', cursor:'pointer',
              color:T.textDim, fontSize:'11px', letterSpacing:'1px', gap:'10px' }}>
              <div style={{ fontSize:'32px', color:T.textFaint }}>📎</div>
              <span>UPLOAD EVIDENCE FILE</span>
              <span style={{ fontSize:'9px', color:T.textFaint }}>Any file type</span>
            </div>
            <input ref={evidFileRef} type="file" style={{ display:'none' }}
              onChange={e => setEvFile(e.target.files[0])} />
            {evFile && (
              <div style={{ fontSize:'9px', color:T.green, marginTop:'8px', letterSpacing:'1px' }}>
                ✓ {evFile.name}
                <span onClick={() => setEvFile(null)}
                  style={{ color:T.red, cursor:'pointer', marginLeft:'10px' }}>✕</span>
              </div>
            )}
            {evRes && (
              <div style={{ marginTop:'16px', background:'#051a0a', border:`1px solid ${T.green}`,
                padding:'12px', fontSize:'9px', letterSpacing:'1px' }}>
                <div style={{ color:T.green, marginBottom:'6px' }}>✓ LOGGED ON BLOCKCHAIN</div>
                <div style={{ color:T.textMid }}>ID: {evRes.evidence_id}</div>
                <div style={{ color:T.textFaint, wordBreak:'break-all', marginTop:'4px' }}>
                  TX: {evRes.blockchain_tx?.slice(0,30)}...
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'court' && (
        <>
          <Alert type="success" msg={ctRes ? `Court decision ${ctRes.decision_id} logged on blockchain.` : null} />
          <Alert type="error" msg={ctErr} />
          <FormSection title="COURT INFORMATION" />
          <GridCols cols={3}>
            <Input label="Court Name" required value={ctForm.court_name}
              onChange={e => setCt('court_name', e.target.value)} />
            <Input label="Judge Name" value={ctForm.judge_name}
              onChange={e => setCt('judge_name', e.target.value)} />
            <Input label="Case Number" value={ctForm.case_number}
              onChange={e => setCt('case_number', e.target.value)} />
            <Input label="Hearing Date" type="date" value={ctForm.hearing_date}
              onChange={e => setCt('hearing_date', e.target.value)} />
            <Select label="Verdict" required value={ctForm.verdict}
              onChange={e => setCt('verdict', e.target.value)}>
              <option>Pending</option><option>Guilty</option>
              <option>Not Guilty</option><option>Acquitted</option><option>Dismissed</option>
            </Select>
            <Select label="Appeal Status" value={ctForm.appeal_status}
              onChange={e => setCt('appeal_status', e.target.value)}>
              <option value="">None</option><option>Filed</option>
              <option>Granted</option><option>Denied</option><option>Withdrawn</option>
            </Select>
          </GridCols>
          <FormSection title="SENTENCE DETAILS" />
          <GridCols cols={3}>
            <Input label="Sentence" value={ctForm.sentence}
              onChange={e => setCt('sentence', e.target.value)} placeholder="e.g. 5 years imprisonment" />
            <Input label="Sentence Start" type="date" value={ctForm.sentence_start}
              onChange={e => setCt('sentence_start', e.target.value)} />
            <Input label="Sentence End" type="date" value={ctForm.sentence_end}
              onChange={e => setCt('sentence_end', e.target.value)} />
          </GridCols>
          <Textarea label="Notes" rows={3} value={ctForm.notes}
            onChange={e => setCt('notes', e.target.value)} />
          <Btn onClick={submitCourt} loading={ctLoad}>LOG COURT DECISION ON BLOCKCHAIN</Btn>
        </>
      )}
    </>
  );
}

// ── Tab 4: Full Record Viewer ────────────────────────────────────────────────

function RecordViewerTab() {
  const [id, setId]       = useState('');
  const [rec, setRec]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr]     = useState(null);
  const [panel, setPanel] = useState('personal');

  const fetchRecord = async () => {
    if (!id.trim()) return;
    setLoading(true); setErr(null); setRec(null);
    try {
      const r = await axios.get(`${API}/api/records/full/${id.trim()}`);
      setRec(r.data); setPanel('personal');
    } catch (e) {
      setErr(e.response?.data?.detail || 'Record not found.');
    } finally { setLoading(false); }
  };

  return (
    <>
      {/* Search */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`,
        padding:'16px 20px', marginBottom:'20px', display:'flex', gap:'12px', alignItems:'center' }}>
        <input value={id} onChange={e => setId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchRecord()}
          placeholder="Enter Criminal ID (e.g. CRM-000001)"
          style={{ flex:1, background:T.surface2, border:`1px solid ${T.border}`,
          color:T.text, padding:'10px 14px', fontSize:'12px', fontFamily:T.font,
          outline:'none', letterSpacing:'2px' }} />
        <Btn onClick={fetchRecord} loading={loading}>RETRIEVE RECORD</Btn>
      </div>

      <Alert type="error" msg={err} />

      {rec && (
        <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:'20px' }}>
          {/* Left sidebar */}
          <div>
            <div style={{ background:'#050a14', height:'240px', marginBottom:'10px',
              display:'flex', alignItems:'center', justifyContent:'center',
              border:`1px solid ${T.border}`, overflow:'hidden' }}>
              <PhotoDisplay criminal_id={rec.criminal_id} large />
            </div>
            <div style={{ background:T.surface2, border:`1px solid ${T.border}`,
              padding:'10px 12px', marginBottom:'10px' }}>
              <div style={{ fontSize:'9px', color:T.textDim, marginBottom:'4px' }}>SUBJECT ID</div>
              <div style={{ fontSize:'13px', color:T.blue, letterSpacing:'2px',
                fontWeight:'700' }}>{rec.criminal_id}</div>
            </div>
            <div style={{ background: rec.is_active ? '#1a0505' : '#051a0a',
              border:`1px solid ${rec.is_active ? '#4a1a1a' : T.textFaint}`,
              padding:'10px 12px', textAlign:'center', marginBottom:'14px' }}>
              <div style={{ fontSize:'11px', fontWeight:'700', letterSpacing:'2px',
                color: rec.is_active ? T.red : T.green }}>
                {rec.is_active ? '● WANTED' : '✓ INACTIVE'}
              </div>
            </div>
            {/* Panel nav */}
            {[['personal','PERSONAL'],['crimes','CRIMES'],['evidence','EVIDENCE'],
              ['court','COURT'],['blockchain','BLOCKCHAIN']].map(([id,label]) => (
              <button key={id} onClick={() => setPanel(id)} style={{
                display:'block', width:'100%', background: panel===id ? T.blueMid : 'transparent',
                border:`1px solid ${panel===id ? T.blueDark : T.border}`,
                color: panel===id ? '#e0ecff' : T.textDim, padding:'8px 12px',
                fontSize:'9px', letterSpacing:'2px', fontFamily:T.font,
                cursor:'pointer', textAlign:'left', textTransform:'uppercase',
                marginBottom:'4px' }}>
                {label}
                {id==='crimes' && rec.crimes?.length > 0 &&
                  <span style={{ float:'right', background:T.red, color:'#fff',
                    fontSize:'8px', padding:'1px 5px', borderRadius:'2px' }}>{rec.crimes.length}</span>}
                {id==='evidence' && rec.evidences?.length > 0 &&
                  <span style={{ float:'right', background:T.blue, color:'#fff',
                    fontSize:'8px', padding:'1px 5px', borderRadius:'2px' }}>{rec.evidences.length}</span>}
                {id==='court' && rec.court_decisions?.length > 0 &&
                  <span style={{ float:'right', background:T.purple, color:'#fff',
                    fontSize:'8px', padding:'1px 5px', borderRadius:'2px' }}>{rec.court_decisions.length}</span>}
              </button>
            ))}
          </div>

          {/* Right panel */}
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, padding:'20px' }}>
            {panel === 'personal' && <>
              <FormSection title="PERSONAL INFORMATION" />
              <FieldRow label="Full Name" value={rec.name} />
              <FieldRow label="Age" value={rec.age} />
              <FieldRow label="Date of Birth" value={rec.dob} />
              <FieldRow label="NIC Number" value={rec.nic_number} />
              <FieldRow label="Gender" value={rec.gender} />
              <FieldRow label="Nationality" value={rec.nationality} />
              <FieldRow label="Address" value={rec.address} />
              <FieldRow label="Phone" value={rec.phone} />
              <FieldRow label="Occupation" value={rec.occupation} />
              <FieldRow label="Height" value={rec.height_cm ? `${rec.height_cm} cm` : null} />
              <FieldRow label="Weight" value={rec.weight_kg ? `${rec.weight_kg} kg` : null} />
              <FieldRow label="Eye Color" value={rec.eye_color} />
              <FieldRow label="Marks" value={rec.distinguishing_marks} />
              <FormSection title="OFFICER" />
              <FieldRow label="Officer ID" value={rec.officer_id} />
              <FieldRow label="Officer Name" value={rec.officer_name} />
              <FieldRow label="Badge" value={rec.badge_number} />
              <FieldRow label="Station" value={rec.station} />
              <FieldRow label="Rank" value={rec.rank} />
            </>}

            {panel === 'crimes' && <>
              <FormSection title={`CRIME RECORDS (${rec.crimes?.length || 0})`} />
              {!rec.crimes?.length
                ? <div style={{ color:T.textFaint, fontSize:'11px', padding:'20px 0' }}>No crime records found.</div>
                : rec.crimes.map((c, i) => (
                    <div key={i} style={{ background:T.surface2, border:`1px solid ${T.border}`,
                      padding:'14px', marginBottom:'12px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between',
                        marginBottom:'10px', paddingBottom:'8px', borderBottom:`1px solid #0f1e35` }}>
                        <span style={{ color:T.blue, fontSize:'11px', letterSpacing:'1px' }}>
                          {c.case_id || `CRIME-${i+1}`}
                        </span>
                        <span style={{ background:'#1a0a0a', border:`1px solid #4a1a1a`,
                          color:T.red, fontSize:'9px', padding:'2px 8px', letterSpacing:'1px' }}>
                          {c.crime_status}
                        </span>
                      </div>
                      <FieldRow label="Type" value={c.crime_type} />
                      <FieldRow label="Date" value={c.crime_date} />
                      <FieldRow label="Location" value={c.crime_location} />
                      <FieldRow label="Weapons" value={c.weapons_used} />
                      <FieldRow label="Victims" value={c.victims_count} />
                      <FieldRow label="Damage" value={c.damage_value} />
                      <FieldRow label="Description" value={c.crime_description} />
                    </div>
                  ))
              }
            </>}

            {panel === 'evidence' && <>
              <FormSection title={`EVIDENCE (${rec.evidences?.length || 0})`} />
              {!rec.evidences?.length
                ? <div style={{ color:T.textFaint, fontSize:'11px', padding:'20px 0' }}>No evidence records found.</div>
                : rec.evidences.map((e, i) => (
                    <div key={i} style={{ background:T.surface2, border:`1px solid ${T.border}`,
                      padding:'14px', marginBottom:'12px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between',
                        marginBottom:'10px', paddingBottom:'8px', borderBottom:`1px solid #0f1e35` }}>
                        <span style={{ color:T.blue, fontSize:'11px', letterSpacing:'1px' }}>{e.evidence_id}</span>
                        <span style={{ background:'#0a1a30', border:`1px solid ${T.border}`,
                          color:T.blue, fontSize:'9px', padding:'2px 8px', letterSpacing:'1px' }}>
                          {e.evidence_type?.toUpperCase()}
                        </span>
                      </div>
                      <FieldRow label="Description" value={e.description} />
                      <FieldRow label="Collected By" value={e.collected_by} />
                      <FieldRow label="Collected On" value={e.collected_date} />
                      <FieldRow label="File Hash" value={e.file_hash} />
                      <FieldRow label="Blockchain TX" value={e.blockchain_tx} />
                    </div>
                  ))
              }
            </>}

            {panel === 'court' && <>
              <FormSection title={`COURT DECISIONS (${rec.court_decisions?.length || 0})`} />
              {!rec.court_decisions?.length
                ? <div style={{ color:T.textFaint, fontSize:'11px', padding:'20px 0' }}>No court decisions recorded.</div>
                : rec.court_decisions.map((d, i) => (
                    <div key={i} style={{ background:T.surface2, border:`1px solid ${T.border}`,
                      padding:'14px', marginBottom:'12px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between',
                        marginBottom:'10px', paddingBottom:'8px', borderBottom:`1px solid #0f1e35` }}>
                        <span style={{ color:T.blue, fontSize:'11px', letterSpacing:'1px' }}>{d.decision_id}</span>
                        <span style={{
                          background: d.verdict==='Guilty' ? '#1a0505'
                            : d.verdict==='Not Guilty' ? '#051a0a' : '#0d1020',
                          border:`1px solid ${d.verdict==='Guilty' ? '#4a1a1a'
                            : d.verdict==='Not Guilty' ? T.textFaint : T.border}`,
                          color: d.verdict==='Guilty' ? T.red
                            : d.verdict==='Not Guilty' ? T.green : T.textDim,
                          fontSize:'9px', padding:'2px 8px', letterSpacing:'1px' }}>
                          {d.verdict}
                        </span>
                      </div>
                      <FieldRow label="Court" value={d.court_name} />
                      <FieldRow label="Judge" value={d.judge_name} />
                      <FieldRow label="Case No." value={d.case_number} />
                      <FieldRow label="Hearing" value={d.hearing_date} />
                      <FieldRow label="Sentence" value={d.sentence} />
                      <FieldRow label="Start" value={d.sentence_start} />
                      <FieldRow label="End" value={d.sentence_end} />
                      <FieldRow label="Appeal" value={d.appeal_status} />
                      <FieldRow label="Notes" value={d.notes} />
                    </div>
                  ))
              }
            </>}

            {panel === 'blockchain' && <>
              <FormSection title="BLOCKCHAIN RECORD" />
              <FieldRow label="Criminal ID" value={rec.criminal_id} />
              <FieldRow label="Registered At"
                value={new Date(rec.registered_at * 1000).toLocaleString('en-GB', { hour12:false })} />
              <FieldRow label="Embedding Hash" value={rec.embedding_hash} />
              <FieldRow label="Active" value={rec.is_active ? 'YES' : 'NO'} />
              {rec.bc_evidence?.length > 0 && <>
                <FormSection title={`ON-CHAIN EVIDENCE (${rec.bc_evidence.length})`} />
                {rec.bc_evidence.map((e, i) => (
                  <div key={i} style={{ background:T.surface2, border:`1px solid ${T.border}`,
                    padding:'10px 14px', marginBottom:'8px', fontSize:'9px' }}>
                    <div style={{ color:T.blue, marginBottom:'4px' }}>{e.evidence_id}</div>
                    <div style={{ color:T.textDim }}>Hash: {e.file_hash || '—'}</div>
                    <div style={{ color:T.textFaint }}>
                      {new Date(Number(e.logged_at) * 1000).toLocaleString('en-GB', { hour12:false })}
                    </div>
                  </div>
                ))}
              </>}
              {rec.bc_court?.length > 0 && <>
                <FormSection title={`ON-CHAIN COURT DECISIONS (${rec.bc_court.length})`} />
                {rec.bc_court.map((d, i) => (
                  <div key={i} style={{ background:T.surface2, border:`1px solid ${T.border}`,
                    padding:'10px 14px', marginBottom:'8px', fontSize:'9px' }}>
                    <div style={{ color:T.blue, marginBottom:'4px' }}>{d.decision_id} — {d.verdict}</div>
                    <div style={{ color:T.textDim }}>{d.court_name}</div>
                    <div style={{ color:T.textFaint }}>
                      {new Date(Number(d.logged_at) * 1000).toLocaleString('en-GB', { hour12:false })}
                    </div>
                  </div>
                ))}
              </>}
            </>}
          </div>
        </div>
      )}
    </>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────

const TABS = [
  { id:'dashboard', label:'Dashboard',   icon:'▣' },
  { id:'enroll',    label:'Enroll',       icon:'+' },
  { id:'records',   label:'Evidence / Court', icon:'📁' },
  { id:'viewer',    label:'Record Viewer', icon:'🔍' },
];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString('en-GB', { hour12:false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={base}>
      <TopBar time={time} />
      <TabBar tabs={TABS} active={tab} setActive={setTab} />
      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'enroll'    && <EnrollmentTab />}
      {tab === 'records'   && <RecordsTab />}
      {tab === 'viewer'    && <RecordViewerTab />}
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:'24px',
        paddingTop:'12px', borderTop:`1px solid #0f1e35` }}>
        <span style={{ fontSize:'9px', color:'#1a3a5a', letterSpacing:'1.5px' }}>
          LECS v2.4.1 — RESTRICTED ACCESS ONLY
        </span>
        <span style={{ background:'#071020', border:`1px solid #0f2040`,
          color:'#2a5a7a', fontSize:'9px', padding:'3px 10px', letterSpacing:'2px' }}>
          ENCRYPTED — AES-256
        </span>
      </div>
    </div>
  );
}
