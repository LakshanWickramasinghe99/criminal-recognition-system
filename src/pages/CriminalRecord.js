import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000';

/* ── Styles inject ── */
if (!document.getElementById('lecs-record-styles')) {
  const tag = document.createElement('style');
  tag.id = 'lecs-record-styles';
  tag.textContent = `
    @keyframes fadeIn    { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
    @keyframes flickerIn { 0%{opacity:0} 30%{opacity:0.9} 60%{opacity:0.3} 100%{opacity:1} }
    .lecs-rec  { animation: fadeIn 0.3s ease; }
    .lecs-ri:focus { border-color:#2a6fc4!important; outline:none; }
    .lecs-ri:hover { border-color:#1a4a6a!important; }
    .lecs-nb:hover { background:#0d1a2e!important; color:#a0c8f0!important; }
    .lecs-ph   { animation: flickerIn 0.5s ease forwards; }
  `;
  document.head.appendChild(tag);
}

/* ── Tiny atoms ── */
const inp  = { width:'100%', background:'#070d1a', border:'1px solid #1a3a5c', color:'#c8d8f0', fontFamily:"'Courier New',monospace", fontSize:'11px', padding:'8px 10px', boxSizing:'border-box' };
const Inp  = p => <input  className="lecs-ri" {...p} style={{...inp,...p.style}} />;
const Sel  = ({children,...p}) => <select className="lecs-ri" {...p} style={{...inp,...p.style}}>{children}</select>;
const Txt  = p => <textarea className="lecs-ri" {...p} style={{...inp,resize:'vertical',minHeight:'70px',...p.style}} />;
const G2   = ({children}) => <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 14px'}}>{children}</div>;
const G3   = ({children}) => <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0 14px'}}>{children}</div>;

function Lbl({label,required,children}) {
  return (
    <div style={{marginBottom:'12px'}}>
      <label style={{display:'block',fontSize:'9px',color:'#2a5a8a',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'5px'}}>
        {label}{required&&<span style={{color:'#e05050',marginLeft:'3px'}}>*</span>}
      </label>
      {children}
    </div>
  );
}

function SecHead({title}) {
  return <div style={{fontSize:'9px',color:'#3a8adc',letterSpacing:'3px',textTransform:'uppercase',margin:'16px 0 10px',borderLeft:'2px solid #2a6fc4',paddingLeft:'8px'}}>{title}</div>;
}

function FieldRow({label,value,mono,highlight}) {
  return (
    <div style={{display:'flex',gap:'12px',padding:'7px 0',borderBottom:'1px solid #0a1525'}}>
      <div style={{fontSize:'9px',color:'#2a5a8a',letterSpacing:'1.5px',textTransform:'uppercase',width:'130px',flexShrink:0,paddingTop:'2px'}}>{label}</div>
      <div style={{fontSize:'11px',lineHeight:'1.5',wordBreak:'break-all',fontFamily:mono?"'Courier New',monospace":'inherit',
        color:highlight==='red'?'#e05050':highlight==='green'?'#22c55e':highlight==='blue'?'#3a8adc':'#c0d8f0'}}>
        {value||'—'}
      </div>
    </div>
  );
}

function Badge({label,type}) {
  const C={red:{bg:'#1a0505',b:'#4a1a1a',c:'#e05050'},green:{bg:'#051a0a',b:'#1a4a1a',c:'#22c55e'},blue:{bg:'#0a1a30',b:'#1a3a5c',c:'#3a8adc'},purple:{bg:'#0f0a1a',b:'#2a1a4a',c:'#7a5af8'},amber:{bg:'#1a1000',b:'#3a2a00',c:'#d97706'},gray:{bg:'#0d1020',b:'#1a2040',c:'#4a7aaa'}};
  const c=C[type]||C.gray;
  return <span style={{background:c.bg,border:`1px solid ${c.b}`,color:c.c,fontSize:'9px',padding:'2px 8px',letterSpacing:'1px',textTransform:'uppercase',display:'inline-block'}}>{label}</span>;
}

function Empty({icon,text}) {
  return <div style={{textAlign:'center',padding:'36px 20px',color:'#1a3a5a',fontSize:'11px',letterSpacing:'2px'}}><div style={{fontSize:'28px',marginBottom:'10px',opacity:0.3}}>{icon}</div>{text}</div>;
}

function ResultAlert({type,msg,tx}) {
  if(!msg) return null;
  const ok=type==='success';
  return (
    <div style={{background:ok?'#060d09':'#0d0606',border:`1px solid ${ok?'#1a4a1a':'#3a1515'}`,borderLeft:`3px solid ${ok?'#22c55e':'#e05050'}`,padding:'12px 14px',margin:'12px 0'}}>
      <div style={{fontSize:'10px',fontWeight:'700',color:ok?'#22c55e':'#e05050',letterSpacing:'2px',textTransform:'uppercase',marginBottom:tx?'6px':0}}>
        {ok?'✓ ':'✕ '}{msg}
      </div>
      {tx&&<div style={{background:ok?'#050c07':'#0a0505',border:`1px solid ${ok?'#0f2a14':'#2a0f0f'}`,padding:'8px 10px',marginTop:'6px',fontSize:'9px',color:ok?'#1a6a3a':'#5a2020',letterSpacing:'1px',wordBreak:'break-all',fontFamily:"'Courier New',monospace"}}>⬡ TX: {tx}</div>}
    </div>
  );
}

function PhotoDisplay({criminal_id,large}) {
  const [err,setErr]=useState(false);
  const size=large?{width:'100%',height:'220px'}:{width:'60px',height:'72px'};
  if(err) return <div style={{...size,background:'#070d1a',border:'1px solid #1a3a5c',display:'flex',alignItems:'center',justifyContent:'center',color:'#1a3a5c',fontSize:large?'48px':'22px'}}>👤</div>;
  return <img className="lecs-ph" src={`${API}/api/enrollment/photo/${criminal_id}`} alt={criminal_id} onError={()=>setErr(true)} style={{...size,objectFit:'cover',objectPosition:'top center',display:'block',border:'1px solid #1a3a5c'}} />;
}

/* ── Status / verdict helpers ── */
const statusType=s=>{if(!s)return'gray';const l=s.toLowerCase();if(l==='wanted')return'red';if(l==='convicted')return'purple';if(l==='arrested')return'amber';if(l==='under investigation')return'blue';if(l==='released')return'green';return'gray';};
const verdictType=v=>{if(!v)return'gray';const l=v.toLowerCase();if(l==='guilty')return'red';if(l==='not guilty')return'green';if(l==='pending')return'amber';return'gray';};

/* ════════════════════════════════════════════════════════════
   VIEW PANELS
═══════════════════════════════════════════════════════════ */
function PersonalPanel({rec}) {
  return (<>
    <SecHead title="Personal Information"/>
    <FieldRow label="Full Name"   value={rec.name}       highlight="blue"/>
    <FieldRow label="Age"         value={rec.age}/>
    <FieldRow label="Date of Birth" value={rec.dob}/>
    <FieldRow label="NIC Number"  value={rec.nic_number} mono/>
    <FieldRow label="Gender"      value={rec.gender}/>
    <FieldRow label="Nationality" value={rec.nationality}/>
    <FieldRow label="Phone"       value={rec.phone}/>
    <FieldRow label="Occupation"  value={rec.occupation}/>
    <FieldRow label="Address"     value={rec.address}/>
    <SecHead title="Physical Description"/>
    <FieldRow label="Height"      value={rec.height_cm?`${rec.height_cm} cm`:null}/>
    <FieldRow label="Weight"      value={rec.weight_kg?`${rec.weight_kg} kg`:null}/>
    <FieldRow label="Eye Color"   value={rec.eye_color}/>
    <FieldRow label="Marks"       value={rec.distinguishing_marks}/>
    <SecHead title="Registering Officer"/>
    <FieldRow label="Officer ID"  value={rec.officer_id}   mono/>
    <FieldRow label="Officer Name" value={rec.officer_name}/>
    <FieldRow label="Badge No."   value={rec.badge_number} mono/>
    <FieldRow label="Station"     value={rec.station}/>
    <FieldRow label="Rank"        value={rec.rank}/>
  </>);
}

function CrimesPanel({crimes}) {
  if(!crimes?.length) return <Empty icon="📋" text="NO CRIME RECORDS FOUND"/>;
  return crimes.map((c,i)=>(
    <div key={i} style={{background:'#0a0f1e',border:'1px solid #1a3a5c',borderLeft:'3px solid #e05050',padding:'14px',marginBottom:'12px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px',paddingBottom:'8px',borderBottom:'1px solid #0f1e35'}}>
        <span style={{color:'#3a8adc',fontSize:'11px',letterSpacing:'1px'}}>{c.case_id||`CRIME-${i+1}`}</span>
        <Badge label={c.crime_status||'Unknown'} type={statusType(c.crime_status)}/>
      </div>
      <FieldRow label="Crime Type"   value={c.crime_type}       highlight="red"/>
      <FieldRow label="Date"         value={c.crime_date}/>
      <FieldRow label="Location"     value={c.crime_location}/>
      <FieldRow label="Weapons Used" value={c.weapons_used}/>
      <FieldRow label="Victims"      value={c.victims_count}/>
      <FieldRow label="Damage Value" value={c.damage_value}/>
      <FieldRow label="Description"  value={c.crime_description}/>
    </div>
  ));
}

function EvidencePanel({evidences}) {
  if(!evidences?.length) return <Empty icon="🗂️" text="NO EVIDENCE RECORDS FOUND"/>;
  const tc=t=>{if(!t)return'gray';const l=t.toLowerCase();if(l==='image'||l==='photograph')return'blue';if(l==='video'||l.includes('cctv'))return'purple';if(l==='forensic'||l.includes('report'))return'amber';if(l==='document')return'green';return'gray';};
  return evidences.map((e,i)=>(
    <div key={i} style={{background:'#0a0f1e',border:'1px solid #1a3a5c',borderLeft:'3px solid #3a8adc',padding:'14px',marginBottom:'12px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px',paddingBottom:'8px',borderBottom:'1px solid #0f1e35'}}>
        <span style={{color:'#3a8adc',fontSize:'11px',letterSpacing:'1px',fontFamily:"'Courier New',monospace"}}>{e.evidence_id}</span>
        <Badge label={e.evidence_type||'unknown'} type={tc(e.evidence_type)}/>
      </div>
      <FieldRow label="Description"  value={e.description}/>
      <FieldRow label="Collected By" value={e.collected_by}/>
      <FieldRow label="Collected On" value={e.collected_date}/>
      <FieldRow label="File Hash"    value={e.file_hash}    mono highlight="blue"/>
      <FieldRow label="Blockchain TX" value={e.blockchain_tx} mono/>
    </div>
  ));
}

function CourtPanel({court_decisions}) {
  if(!court_decisions?.length) return <Empty icon="⚖" text="NO COURT DECISIONS RECORDED"/>;
  return court_decisions.map((d,i)=>(
    <div key={i} style={{background:'#0a0f1e',border:'1px solid #1a3a5c',borderLeft:`3px solid ${d.verdict?.toLowerCase()==='guilty'?'#e05050':d.verdict?.toLowerCase()==='not guilty'?'#22c55e':'#7a5af8'}`,padding:'14px',marginBottom:'12px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px',paddingBottom:'8px',borderBottom:'1px solid #0f1e35'}}>
        <span style={{color:'#3a8adc',fontSize:'11px',fontFamily:"'Courier New',monospace"}}>{d.decision_id}</span>
        <Badge label={d.verdict||'Pending'} type={verdictType(d.verdict)}/>
      </div>
      <FieldRow label="Court Name"     value={d.court_name}/>
      <FieldRow label="Judge"          value={d.judge_name}/>
      <FieldRow label="Case Number"    value={d.case_number}    mono/>
      <FieldRow label="Hearing Date"   value={d.hearing_date}/>
      <FieldRow label="Sentence"       value={d.sentence}/>
      <FieldRow label="Sentence Start" value={d.sentence_start}/>
      <FieldRow label="Sentence End"   value={d.sentence_end}/>
      <FieldRow label="Appeal Status"  value={d.appeal_status}/>
      <FieldRow label="Notes"          value={d.notes}/>
      <FieldRow label="Blockchain TX"  value={d.blockchain_tx}  mono/>
    </div>
  ));
}

function BlockchainPanel({rec}) {
  return (<>
    <SecHead title="On-Chain Identity"/>
    <FieldRow label="Criminal ID"    value={rec.criminal_id}    mono highlight="blue"/>
    <FieldRow label="Embedding Hash" value={rec.embedding_hash} mono/>
    <FieldRow label="Registered At"  value={rec.registered_at?new Date(rec.registered_at*1000).toLocaleString('en-GB',{hour12:false}):null}/>
    <FieldRow label="Registered By"  value={rec.registered_by}  mono/>
    <FieldRow label="Active"         value={rec.is_active?'YES — WANTED':'NO — INACTIVE'} highlight={rec.is_active?'red':'green'}/>
    {rec.bc_evidence?.length>0&&<>
      <SecHead title={`On-Chain Evidence (${rec.bc_evidence.length})`}/>
      {rec.bc_evidence.map((e,i)=>(
        <div key={i} style={{background:'#070d1a',border:'1px solid #0f1e35',padding:'10px 14px',marginBottom:'8px'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
            <span style={{fontSize:'10px',color:'#3a8adc',fontFamily:"'Courier New',monospace"}}>{e.evidence_id}</span>
            <span style={{fontSize:'9px',color:'#4a7aaa'}}>{new Date(Number(e.logged_at)*1000).toLocaleString('en-GB',{hour12:false})}</span>
          </div>
          <div style={{fontSize:'9px',color:'#2a5a7a',wordBreak:'break-all'}}>Hash: {e.file_hash||'—'}</div>
        </div>
      ))}
    </>}
    {rec.bc_court?.length>0&&<>
      <SecHead title={`On-Chain Court Decisions (${rec.bc_court.length})`}/>
      {rec.bc_court.map((d,i)=>(
        <div key={i} style={{background:'#070d1a',border:'1px solid #0f1e35',padding:'10px 14px',marginBottom:'8px'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
            <span style={{fontSize:'10px',color:'#3a8adc',fontFamily:"'Courier New',monospace"}}>{d.decision_id}</span>
            <Badge label={d.verdict||'Pending'} type={verdictType(d.verdict)}/>
          </div>
          <div style={{fontSize:'9px',color:'#2a5a7a'}}>{d.court_name}</div>
          <div style={{fontSize:'9px',color:'#1a3a5a',marginTop:'4px'}}>{new Date(Number(d.logged_at)*1000).toLocaleString('en-GB',{hour12:false})}</div>
        </div>
      ))}
    </>}
  </>);
}

/* ════════════════════════════════════════════════════════════
   ADD PANELS
═══════════════════════════════════════════════════════════ */
const CRIME_TYPES=['Homicide','Assault','Robbery','Burglary','Theft','Drug Trafficking','Drug Possession','Fraud','Forgery','Sexual Assault','Kidnapping','Extortion','Money Laundering','Cybercrime','Terrorism','Arms Trafficking','Human Trafficking','Arson','Vandalism','Other'];
const CRIME_STATUSES=['Wanted','Under Investigation','Arrested','Convicted','Released','Deceased'];
const EVIDENCE_TYPES=['image','video','CCTV Footage','document','forensic','Fingerprint Report','DNA Report','Witness Statement','Medical Report','Financial Record','Digital Evidence','Physical Evidence','audio','other'];
const VERDICTS=['Pending','Guilty','Not Guilty','Partially Guilty','Case Dismissed','Acquitted','Referred'];

function AddCrimePanel({criminal_id,onSuccess}) {
  const [form,setForm]=useState({case_id:'',crime_type:'',crime_description:'',crime_date:'',crime_location:'',crime_status:'Wanted',weapons_used:'',victims_count:'',damage_value:''});
  const [loading,setLoading]=useState(false);
  const [res,setRes]=useState(null);
  const [err,setErr]=useState(null);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const submit=async()=>{
    if(!form.case_id||!form.crime_type){setErr('Case ID and Crime Type are required.');return;}
    setLoading(true);setErr(null);setRes(null);
    try{
      const fd=new FormData();
      Object.entries(form).forEach(([k,v])=>v&&fd.append(k,v));
      const r=await axios.post(`${API}/api/records/crime/${criminal_id}`,fd);
      setRes(r.data);onSuccess&&onSuccess();
      setForm({case_id:'',crime_type:'',crime_description:'',crime_date:'',crime_location:'',crime_status:'Wanted',weapons_used:'',victims_count:'',damage_value:''});
    }catch(e){setErr(e.response?.data?.detail||'Failed to add crime.');}
    finally{setLoading(false);}
  };

  return (
    <div>
      <div style={{background:'#0a1020',border:'1px solid #1a2040',borderLeft:'3px solid #e05050',padding:'10px 14px',marginBottom:'16px',fontSize:'9px',color:'#7a3030',letterSpacing:'1px',lineHeight:'1.8'}}>
        Adding a crime record logs it to SQLite and links it to the criminal's blockchain identity. Case ID must be unique.
      </div>
      <ResultAlert type={res?'success':null} msg={res?`Crime record ${res.case_id||form.case_id} added successfully.`:null}/>
      <ResultAlert type="error" msg={err}/>
      <SecHead title="Crime Details"/>
      <G2>
        <Lbl label="Case ID" required><Inp value={form.case_id} placeholder="e.g. CASE/2026/0001" onChange={e=>set('case_id',e.target.value)}/></Lbl>
        <Lbl label="Crime Type" required>
          <Sel value={form.crime_type} onChange={e=>set('crime_type',e.target.value)}>
            <option value="">— Select —</option>
            {CRIME_TYPES.map(t=><option key={t}>{t}</option>)}
          </Sel>
        </Lbl>
        <Lbl label="Crime Date"><Inp type="date" value={form.crime_date} onChange={e=>set('crime_date',e.target.value)}/></Lbl>
        <Lbl label="Crime Location"><Inp value={form.crime_location} placeholder="e.g. Colombo 07" onChange={e=>set('crime_location',e.target.value)}/></Lbl>
        <Lbl label="Crime Status">
          <Sel value={form.crime_status} onChange={e=>set('crime_status',e.target.value)}>
            {CRIME_STATUSES.map(s=><option key={s}>{s}</option>)}
          </Sel>
        </Lbl>
        <Lbl label="Weapons Used"><Inp value={form.weapons_used} placeholder="e.g. Firearm, Knife" onChange={e=>set('weapons_used',e.target.value)}/></Lbl>
        <Lbl label="Victims Count"><Inp type="number" value={form.victims_count} placeholder="e.g. 2" onChange={e=>set('victims_count',e.target.value)}/></Lbl>
        <Lbl label="Damage Value (LKR)"><Inp value={form.damage_value} placeholder="e.g. 1,500,000" onChange={e=>set('damage_value',e.target.value)}/></Lbl>
      </G2>
      <Lbl label="Crime Description"><Txt rows={3} value={form.crime_description} placeholder="Detailed description of the crime..." onChange={e=>set('crime_description',e.target.value)}/></Lbl>
      <button onClick={submit} disabled={loading} style={{...s.actionBtn,background:'#1a0505',borderColor:'#5a1515',color:'#e05050',opacity:loading?0.5:1,cursor:loading?'not-allowed':'pointer'}}>
        {loading?'SAVING...':'⚖ Add Crime Record'}
      </button>
    </div>
  );
}

function AddEvidencePanel({criminal_id,onSuccess}) {
  const fileRef=useRef();
  const [form,setForm]=useState({evidence_type:'',description:'',collected_by:'',collected_date:''});
  const [file,setFile]=useState(null);
  const [loading,setLoading]=useState(false);
  const [res,setRes]=useState(null);
  const [err,setErr]=useState(null);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const submit=async()=>{
    if(!form.evidence_type){setErr('Evidence type is required.');return;}
    setLoading(true);setErr(null);setRes(null);
    try{
      const fd=new FormData();
      Object.entries(form).forEach(([k,v])=>v&&fd.append(k,v));
      if(file) fd.append('file',file);
      const r=await axios.post(`${API}/api/records/evidence/${criminal_id}`,fd);
      setRes(r.data);onSuccess&&onSuccess();
      setForm({evidence_type:'',description:'',collected_by:'',collected_date:''});setFile(null);
    }catch(e){setErr(e.response?.data?.detail||'Failed to add evidence.');}
    finally{setLoading(false);}
  };

  return (
    <div>
      <div style={{background:'#0a1020',border:'1px solid #1a2a4a',borderLeft:'3px solid #3a8adc',padding:'10px 14px',marginBottom:'16px',fontSize:'9px',color:'#2a5a8a',letterSpacing:'1px',lineHeight:'1.8'}}>
        Evidence will be hashed (SHA-256) and logged permanently on Ethereum. The file is stored on the local server — only the hash goes on-chain.
      </div>
      <ResultAlert type={res?'success':null} msg={res?`Evidence ${res.evidence_id} logged on blockchain.`:null} tx={res?.blockchain_tx}/>
      <ResultAlert type="error" msg={err}/>
      <SecHead title="Evidence Details"/>
      <G2>
        <Lbl label="Evidence Type" required>
          <Sel value={form.evidence_type} onChange={e=>set('evidence_type',e.target.value)}>
            <option value="">— Select Type —</option>
            {EVIDENCE_TYPES.map(t=><option key={t}>{t}</option>)}
          </Sel>
        </Lbl>
        <Lbl label="Collected By"><Inp value={form.collected_by} placeholder="e.g. Sgt. Nimal Silva" onChange={e=>set('collected_by',e.target.value)}/></Lbl>
        <Lbl label="Collection Date"><Inp type="date" value={form.collected_date} onChange={e=>set('collected_date',e.target.value)}/></Lbl>
      </G2>
      <Lbl label="Description"><Txt rows={3} value={form.description} placeholder="Describe the evidence — what it shows, where found..." onChange={e=>set('description',e.target.value)}/></Lbl>
      <SecHead title="Evidence File (Optional)"/>
      <div onClick={()=>fileRef.current.click()} style={{background:'#070d1a',border:`2px dashed ${file?'#22c55e':'#1a3a5c'}`,padding:'20px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'6px',cursor:'pointer',marginBottom:'14px'}}>
        <input ref={fileRef} type="file" style={{display:'none'}} onChange={e=>setFile(e.target.files[0])}/>
        <div style={{fontSize:'22px',color:file?'#22c55e':'#1a3a5c'}}>📎</div>
        <div style={{fontSize:'9px',color:file?'#22c55e':'#1a4a6a',letterSpacing:'2px',textTransform:'uppercase'}}>{file?file.name:'Click to attach evidence file'}</div>
        <div style={{fontSize:'9px',color:'#0f2a40'}}>{file?`${(file.size/1024).toFixed(1)} KB`:'Any file type — image, video, document, forensic report'}</div>
      </div>
      {file&&<div style={{fontSize:'9px',color:'#2a5a7a',marginBottom:'12px'}}>✓ {file.name}<span onClick={()=>setFile(null)} style={{color:'#e05050',cursor:'pointer',marginLeft:'12px'}}>✕ Remove</span></div>}
      <button onClick={submit} disabled={loading} style={{...s.actionBtn,background:'#0a1a30',borderColor:'#2a5a9c',color:'#60a5fa',opacity:loading?0.5:1,cursor:loading?'not-allowed':'pointer'}}>
        {loading?'LOGGING ON BLOCKCHAIN...':'⬡ Log Evidence on Blockchain'}
      </button>
    </div>
  );
}

function AddCourtPanel({criminal_id,onSuccess}) {
  const [form,setForm]=useState({court_name:'',judge_name:'',case_number:'',hearing_date:'',verdict:'Pending',sentence:'',sentence_start:'',sentence_end:'',appeal_status:'',notes:''});
  const [loading,setLoading]=useState(false);
  const [res,setRes]=useState(null);
  const [err,setErr]=useState(null);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const vc=v=>v==='Guilty'?'#e05050':v==='Not Guilty'?'#22c55e':'#d97706';

  const submit=async()=>{
    if(!form.court_name){setErr('Court name is required.');return;}
    setLoading(true);setErr(null);setRes(null);
    try{
      const fd=new FormData();
      Object.entries(form).forEach(([k,v])=>v&&fd.append(k,v));
      const r=await axios.post(`${API}/api/records/court/${criminal_id}`,fd);
      setRes(r.data);onSuccess&&onSuccess();
      setForm({court_name:'',judge_name:'',case_number:'',hearing_date:'',verdict:'Pending',sentence:'',sentence_start:'',sentence_end:'',appeal_status:'',notes:''});
    }catch(e){setErr(e.response?.data?.detail||'Failed to add court decision.');}
    finally{setLoading(false);}
  };

  return (
    <div>
      <div style={{background:'#0a1020',border:'1px solid #1a1a4a',borderLeft:'3px solid #7a5af8',padding:'10px 14px',marginBottom:'16px',fontSize:'9px',color:'#2a2a8a',letterSpacing:'1px',lineHeight:'1.8'}}>
        Court decisions are logged permanently on Ethereum — immutable legal record. Ensure all details are accurate before submitting.
      </div>
      <ResultAlert type={res?'success':null} msg={res?`Court decision ${res.decision_id} logged on blockchain.`:null} tx={res?.blockchain_tx}/>
      <ResultAlert type="error" msg={err}/>
      <SecHead title="Court Information"/>
      <G2>
        <Lbl label="Court Name" required><Inp value={form.court_name} placeholder="e.g. Colombo High Court" onChange={e=>set('court_name',e.target.value)}/></Lbl>
        <Lbl label="Judge Name"><Inp value={form.judge_name} placeholder="e.g. Hon. Justice K. Perera" onChange={e=>set('judge_name',e.target.value)}/></Lbl>
        <Lbl label="Case Number"><Inp value={form.case_number} placeholder="e.g. HC/CR/244/2024" onChange={e=>set('case_number',e.target.value)}/></Lbl>
        <Lbl label="Hearing Date"><Inp type="date" value={form.hearing_date} onChange={e=>set('hearing_date',e.target.value)}/></Lbl>
      </G2>
      <SecHead title="Verdict & Sentence"/>
      <Lbl label="Verdict" required>
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'4px'}}>
          {VERDICTS.map(v=>(
            <button key={v} onClick={()=>set('verdict',v)} style={{background:form.verdict===v?'#0f0a1a':'#070d1a',border:`1px solid ${form.verdict===v?vc(v):'#1a3a5c'}`,color:form.verdict===v?vc(v):'#2a5a7a',fontSize:'9px',padding:'5px 10px',cursor:'pointer',letterSpacing:'1px',fontFamily:"'Courier New',monospace",textTransform:'uppercase'}}>{v}</button>
          ))}
        </div>
      </Lbl>
      <Lbl label="Sentence"><Inp value={form.sentence} placeholder="e.g. 7 years rigorous imprisonment" onChange={e=>set('sentence',e.target.value)}/></Lbl>
      <G3>
        <Lbl label="Sentence Start"><Inp type="date" value={form.sentence_start} onChange={e=>set('sentence_start',e.target.value)}/></Lbl>
        <Lbl label="Sentence End"><Inp type="date" value={form.sentence_end} onChange={e=>set('sentence_end',e.target.value)}/></Lbl>
        <Lbl label="Appeal Status">
          <Sel value={form.appeal_status} onChange={e=>set('appeal_status',e.target.value)}>
            <option value="">— None —</option>
            <option>No Appeal</option><option>Appeal Filed</option>
            <option>Appeal Pending</option><option>Appeal Rejected</option><option>Appeal Granted</option>
          </Sel>
        </Lbl>
      </G3>
      <Lbl label="Notes"><Txt rows={3} value={form.notes} placeholder="Additional notes, conditions of the court order..." onChange={e=>set('notes',e.target.value)}/></Lbl>
      <button onClick={submit} disabled={loading} style={{...s.actionBtn,background:'#0f0a1a',borderColor:'#3a1a7a',color:'#a07af8',opacity:loading?0.5:1,cursor:loading?'not-allowed':'pointer'}}>
        {loading?'LOGGING ON BLOCKCHAIN...':'⬡ Log Court Decision on Blockchain'}
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function CriminalRecord() {
  const [query,   setQuery]   = useState('');
  const [rec,     setRec]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [tab,     setTab]     = useState('personal');
  const [allCriminals, setAllCriminals] = useState([]);

  /* Load criminal list for dropdown */
  useEffect(()=>{
    axios.get(`${API}/api/dashboard/criminals`)
      .then(r=>setAllCriminals(r.data.criminals||[]))
      .catch(()=>{});
  },[]);

  const fetchRecord=async(id)=>{
    const target=(id||query).trim();
    if(!target) return;
    setLoading(true);setError(null);setRec(null);
    try{
      const r=await axios.get(`${API}/api/records/full/${target}`);
      setRec(r.data);setTab('personal');
    }catch(e){
      setError(e.response?.data?.detail||`Record "${target}" not found.`);
    }finally{setLoading(false);}
  };

  const handleDropdown=e=>{
    const val=e.target.value;
    setQuery(val);
    if(val) fetchRecord(val);
  };

  const refreshRecord=async()=>{
    if(!rec?.criminal_id) return;
    try{ const r=await axios.get(`${API}/api/records/full/${rec.criminal_id}`); setRec(r.data); }catch(_){}
  };

  const VIEW_TABS=[
    {id:'personal',  label:'Personal',        count:null,                         color:'#3a8adc'},
    {id:'crimes',    label:'Crimes',           count:rec?.crimes?.length,          color:'#e05050'},
    {id:'evidence',  label:'Evidence',         count:rec?.evidences?.length,       color:'#3a8adc'},
    {id:'court',     label:'Court Decisions',  count:rec?.court_decisions?.length, color:'#7a5af8'},
    {id:'blockchain',label:'Blockchain',       count:null,                         color:'#7a5af8'},
  ];
  const ADD_TABS=[
    {id:'add-crime',    label:'+ Add Crime',       color:'#e05050'},
    {id:'add-evidence', label:'+ Add Evidence',    color:'#22c55e'},
    {id:'add-court',    label:'+ Add Court Order', color:'#d97706'},
  ];

  return (
    <div className="lecs-rec" style={s.pg}>

      {/* Header */}
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

      {/* ── Search bar: dropdown + text input ── */}
      <div style={s.searchBar}>
        <div style={{fontSize:'14px',color:'#2a5a7a',flexShrink:0}}>🔍</div>

        {/* Dropdown */}
        <select value={query} onChange={handleDropdown} style={{...inp,flex:'0 0 280px',color:query?'#c8d8f0':'#2a5a7a'}}>
          <option value="">— Select from registry —</option>
          {allCriminals.map(c=>(
            <option key={c.criminal_id} value={c.criminal_id}>
              {c.criminal_id} — {c.name}
            </option>
          ))}
        </select>

        <span style={{fontSize:'9px',color:'#1a3a5a',letterSpacing:'2px',flexShrink:0}}>OR</span>

        {/* Text input */}
        <input className="lecs-ri" value={query}
          onChange={e=>setQuery(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&fetchRecord()}
          placeholder="Type Criminal ID  (e.g. CRM-A1B2C3D4)"
          style={{...inp,flex:1}}/>

        <button onClick={()=>fetchRecord()} disabled={loading} style={s.searchBtn}>
          {loading?'RETRIEVING...':'RETRIEVE RECORD'}
        </button>
      </div>

      {error&&<div style={s.errorStrip}><span style={{color:'#e05050',marginRight:'8px'}}>✕</span>{error}</div>}

      {!rec&&!loading&&!error&&(
        <div style={s.emptySearch}>
          <div style={{fontSize:'48px',marginBottom:'16px',opacity:0.1}}>◉</div>
          <div style={{fontSize:'11px',color:'#1a3a5a',letterSpacing:'3px'}}>SELECT OR SEARCH A CRIMINAL ID TO RETRIEVE FULL RECORD</div>
          <div style={{fontSize:'9px',color:'#0f2040',letterSpacing:'1px',marginTop:'8px'}}>Records retrieved from SQLite and verified against Ethereum blockchain</div>
        </div>
      )}

      {rec&&(
        <div style={s.recordGrid}>

          {/* ── Sidebar ── */}
          <div style={s.sidebar}>
            <div style={{background:'#050a14',border:'1px solid #1a3a5c',overflow:'hidden',marginBottom:'10px'}}>
              <PhotoDisplay criminal_id={rec.criminal_id} large/>
            </div>

            <div style={s.idBox}>
              <div style={{fontSize:'9px',color:'#2a5a8a',letterSpacing:'1px',marginBottom:'4px'}}>SUBJECT ID</div>
              <div style={{fontSize:'12px',color:'#3a8adc',fontWeight:'700',letterSpacing:'2px',fontFamily:"'Courier New',monospace"}}>{rec.criminal_id}</div>
            </div>

            <div style={{background:rec.is_active?'#1a0505':'#051a0a',border:`1px solid ${rec.is_active?'#4a1a1a':'#1a4a1a'}`,color:rec.is_active?'#e05050':'#22c55e',fontSize:'10px',fontWeight:'700',padding:'8px 12px',textAlign:'center',letterSpacing:'2px',marginBottom:'10px'}}>
              {rec.is_active?'● WANTED':'✓ INACTIVE'}
            </div>

            {/* Quick stats */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'5px',marginBottom:'8px'}}>
              {[{label:'Crimes',val:rec.crimes?.length||0,color:'#e05050'},{label:'Evidence',val:rec.evidences?.length||0,color:'#3a8adc'},{label:'Court',val:rec.court_decisions?.length||0,color:'#7a5af8'}].map(q=>(
                <div key={q.label} style={{background:'#0d1526',border:'1px solid #1a3a5c',padding:'8px 4px',textAlign:'center'}}>
                  <div style={{fontSize:'16px',fontWeight:'700',color:q.color}}>{q.val}</div>
                  <div style={{fontSize:'8px',color:'#2a5a7a',letterSpacing:'1px'}}>{q.label}</div>
                </div>
              ))}
            </div>

            {/* View nav */}
            <div style={{fontSize:'9px',color:'#1a3a5a',letterSpacing:'2px',padding:'6px 2px 3px',textTransform:'uppercase'}}>View</div>
            {VIEW_TABS.map(t=>(
              <button key={t.id} className="lecs-nb" onClick={()=>setTab(t.id)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%',background:tab===t.id?'#0d1a2e':'transparent',border:`1px solid ${tab===t.id?'#2a6fc4':'#1a2a3a'}`,borderLeft:`3px solid ${tab===t.id?t.color:'transparent'}`,color:tab===t.id?'#e0ecff':'#4a7aaa',padding:'8px 10px',cursor:'pointer',fontSize:'10px',letterSpacing:'1.5px',fontFamily:"'Courier New',monospace",textTransform:'uppercase',textAlign:'left',marginBottom:'3px'}}>
                <span>{t.label}</span>
                {t.count>0&&<span style={{background:tab===t.id?t.color:'#1a2a3a',color:tab===t.id?'#fff':'#4a7aaa',fontSize:'9px',padding:'1px 5px',borderRadius:'2px'}}>{t.count}</span>}
              </button>
            ))}

            {/* Add nav */}
            <div style={{fontSize:'9px',color:'#1a3a5a',letterSpacing:'2px',padding:'10px 2px 3px',textTransform:'uppercase',borderTop:'1px solid #0f1e35',marginTop:'8px'}}>Add Records</div>
            {ADD_TABS.map(t=>(
              <button key={t.id} className="lecs-nb" onClick={()=>setTab(t.id)} style={{display:'flex',alignItems:'center',gap:'6px',width:'100%',background:tab===t.id?'#0d1a2e':'transparent',border:`1px solid ${tab===t.id?t.color:'#1a2a3a'}`,borderLeft:`3px solid ${tab===t.id?t.color:'transparent'}`,color:tab===t.id?t.color:'#2a5a7a',padding:'8px 10px',cursor:'pointer',fontSize:'10px',letterSpacing:'1.5px',fontFamily:"'Courier New',monospace",textTransform:'uppercase',textAlign:'left',marginBottom:'3px'}}>
                {t.label}
              </button>
            ))}

            <div style={{background:'#0a0d1a',border:'1px solid #1a1a3a',borderLeft:'2px solid #7a5af8',padding:'10px 12px',marginTop:'10px'}}>
              <div style={{fontSize:'9px',color:'#7a5af8',letterSpacing:'1px',marginBottom:'4px'}}>⬡ BLOCKCHAIN VERIFIED</div>
              <div style={{fontSize:'9px',color:'#1a2a4a',lineHeight:'1.6'}}>Hash: {rec.embedding_hash?.slice(0,16)}...</div>
            </div>
          </div>

          {/* ── Content panel ── */}
          <div style={s.contentPanel}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'12px'}}>
              <div style={{fontSize:'20px',fontWeight:'700',color:'#e0ecff',letterSpacing:'1px',textTransform:'uppercase'}}>{rec.name}</div>
              <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                <Badge label={rec.crimes?.[0]?.crime_status||'Unknown'} type={statusType(rec.crimes?.[0]?.crime_status)}/>
                <span style={{fontSize:'9px',color:'#2a5a7a'}}>
                  Registered {rec.registered_at?new Date(rec.registered_at*1000).toLocaleDateString('en-GB'):'—'}
                </span>
              </div>
            </div>
            <div style={{height:'1px',background:'#1a3a5c',marginBottom:'16px'}}/>

            {tab==='personal'    &&<PersonalPanel    rec={rec}/>}
            {tab==='crimes'      &&<CrimesPanel      crimes={rec.crimes}/>}
            {tab==='evidence'    &&<EvidencePanel    evidences={rec.evidences}/>}
            {tab==='court'       &&<CourtPanel       court_decisions={rec.court_decisions}/>}
            {tab==='blockchain'  &&<BlockchainPanel  rec={rec}/>}
            {tab==='add-crime'   &&<AddCrimePanel    criminal_id={rec.criminal_id} onSuccess={()=>{refreshRecord();setTab('crimes');}}/>}
            {tab==='add-evidence'&&<AddEvidencePanel criminal_id={rec.criminal_id} onSuccess={()=>{refreshRecord();setTab('evidence');}}/>}
            {tab==='add-court'   &&<AddCourtPanel    criminal_id={rec.criminal_id} onSuccess={()=>{refreshRecord();setTab('court');}}/>}
          </div>
        </div>
      )}

      <div style={s.footer}>
        <span style={s.footerTxt}>LECS v2.4.1 — RECORDS MODULE — RESTRICTED</span>
        <span style={s.enc}>AES-256 ENCRYPTED</span>
      </div>
    </div>
  );
}

const s={
  pg:          {background:'#0a0e1a',color:'#c8d8f0',fontFamily:"'Courier New',monospace",minHeight:'100vh'},
  pageHeader:  {display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid #1a3a5c',paddingBottom:'14px',marginBottom:'18px'},
  phLeft:      {display:'flex',alignItems:'center',gap:'10px'},
  phIcon:      {width:'34px',height:'34px',background:'#0a1020',border:'2px solid #1a3a5c',borderRadius:'3px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'},
  phTitle:     {fontSize:'12px',fontWeight:'700',color:'#e0ecff',letterSpacing:'2px',textTransform:'uppercase'},
  phSub:       {fontSize:'9px',color:'#2a5a8a',letterSpacing:'2px',marginTop:'2px'},
  statusPill:  {background:'#0a1020',border:'1px solid #1a3a5c',color:'#3a8adc',fontSize:'9px',padding:'3px 10px',letterSpacing:'2px'},
  searchBar:   {display:'flex',alignItems:'center',gap:'8px',background:'#0d1526',border:'1px solid #1a3a5c',padding:'12px 16px',marginBottom:'18px'},
  searchBtn:   {background:'#0a1a30',border:'1px solid #2a5a9c',color:'#60a5fa',fontFamily:"'Courier New',monospace",fontSize:'10px',fontWeight:'700',letterSpacing:'2px',textTransform:'uppercase',padding:'10px 16px',cursor:'pointer',flexShrink:0},
  errorStrip:  {background:'#0d0606',border:'1px solid #3a1515',borderLeft:'3px solid #e05050',padding:'12px 14px',marginBottom:'14px',fontSize:'11px',color:'#7a3030',letterSpacing:'1px'},
  emptySearch: {background:'#0d1526',border:'1px solid #1a3a5c',padding:'60px 20px',textAlign:'center',marginTop:'20px'},
  recordGrid:  {display:'grid',gridTemplateColumns:'220px 1fr',gap:'16px',alignItems:'start'},
  sidebar:     {position:'sticky',top:'20px'},
  idBox:       {background:'#0d1526',border:'1px solid #1a3a5c',padding:'10px 12px',marginBottom:'8px'},
  contentPanel:{background:'#0d1526',border:'1px solid #1a3a5c',padding:'20px',minHeight:'500px'},
  actionBtn:   {fontFamily:"'Courier New',monospace",fontSize:'10px',fontWeight:'700',letterSpacing:'3px',textTransform:'uppercase',padding:'11px 24px',border:'1px solid',cursor:'pointer',marginTop:'6px'},
  footer:      {display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'20px',paddingTop:'10px',borderTop:'1px solid #0d1a2e'},
  footerTxt:   {fontSize:'9px',color:'#1a3a5a',letterSpacing:'1.5px'},
  enc:         {background:'#06090f',border:'1px solid #0d1f35',color:'#1e4a6a',fontSize:'9px',padding:'3px 10px',letterSpacing:'2px'},
};
