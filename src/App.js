import React from 'react';
import {
  BrowserRouter, Routes, Route,
  Link, useLocation
} from 'react-router-dom';
import Dashboard      from './pages/Dashboard';
import Enrollment     from './pages/Enrollment';
import Identification from './pages/Identification';
import AuditLog       from './pages/AuditLog';
import CriminalRecord from './pages/CriminalRecord';

const NAV_ITEMS = [
  { path: '/',               label: 'Dashboard',       icon: '▣' },
  { path: '/enrollment',     label: 'Enroll Criminal', icon: '+' },
  { path: '/identification', label: 'Identify Video',  icon: '◉' },
  { path: '/records',        label: 'Criminal Records',icon: '≡' },
  { path: '/audit',          label: 'Blockchain Log',  icon: '⬡' },
];

/* ── Inject styles once ── */
if (!document.getElementById('lecs-app-styles')) {
  const tag = document.createElement('style');
  tag.id = 'lecs-app-styles';
  tag.textContent = `
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
    .lecs-nav-link:hover { color: #a0c8f0 !important; background: #0a1525 !important; }
  `;
  document.head.appendChild(tag);
}

function LiveClock() {
  const [time, setTime] = React.useState(
    new Date().toLocaleTimeString('en-GB', { hour12: false })
  );
  React.useEffect(() => {
    const id = setInterval(() =>
      setTime(new Date().toLocaleTimeString('en-GB', { hour12: false })), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        width: '6px', height: '6px', borderRadius: '50%',
        background: '#22c55e', animation: 'pulse 2s infinite',
      }} />
      <span style={{ fontSize: '9px', color: '#22c55e', letterSpacing: '2px' }}>
        {time}
      </span>
    </div>
  );
}

function NavBar() {
  const location = useLocation();
  return (
    <nav style={{ backgroundColor: '#0a0f1e', borderBottom: '1px solid #1a3a5c', position: 'sticky', top: 0, zIndex: 100 }}>

      {/* ── Top classified strip ── */}
      <div style={{
        background: '#050810', borderBottom: '1px solid #0f1e35',
        padding: '4px 2rem', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '9px', color: '#1a3a5a', letterSpacing: '3px', textTransform: 'uppercase' }}>
          Sri Lanka Police — Criminal Identification &amp; Surveillance System
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <LiveClock />
          <span style={{ fontSize: '9px', color: '#1a3a5a', letterSpacing: '2px' }}>
            CLEARANCE: RESTRICTED
          </span>
        </div>
      </div>

      {/* ── Main nav row ── */}
      <div style={{
        padding: '0 2rem', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', height: '52px',
      }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px', height: '32px', border: '2px solid #2a6fc4',
            background: '#0a1830', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '15px',
          }}>⚖</div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#e0ecff', letterSpacing: '2px', textTransform: 'uppercase' }}>
              C·I·S·S
            </div>
            <div style={{ fontSize: '9px', color: '#2a5a8a', letterSpacing: '1.5px', marginTop: '1px' }}>
              Blockchain Registry v2.4
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: '2px' }}>
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="lecs-nav-link"
                style={{
                  color: isActive ? '#e0ecff' : '#4a7aaa',
                  textDecoration: 'none',
                  padding: '6px 14px',
                  fontSize: '10px',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isActive ? '#0d1a2e' : 'transparent',
                  borderTop: `2px solid ${isActive ? '#3a8adc' : 'transparent'}`,
                  transition: 'color 0.15s, background 0.15s',
                }}
              >
                <span style={{ fontSize: '10px', color: isActive ? '#3a8adc' : '#2a4a6a' }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Status pill */}
        <div style={{
          background: '#051a0a', border: '1px solid #1a4a1a',
          color: '#22c55e', fontSize: '9px',
          padding: '3px 10px', letterSpacing: '2px',
        }}>
          ● BLOCKCHAIN ONLINE
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#070b14',
        color: '#c8d8f0',
        fontFamily: "'Courier New', monospace",
      }}>
        <NavBar />
        <main style={{ padding: '24px 2rem', maxWidth: '1320px', margin: '0 auto' }}>
          <Routes>
            <Route path="/"               element={<Dashboard />}      />
            <Route path="/enrollment"     element={<Enrollment />}     />
            <Route path="/identification" element={<Identification />} />
            <Route path="/records"        element={<CriminalRecord />} />
            <Route path="/audit"          element={<AuditLog />}       />
          </Routes>
        </main>

        {/* Footer */}
        <footer style={{
          borderTop: '1px solid #0f1e35', padding: '10px 2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: '40px',
        }}>
          <span style={{ fontSize: '9px', color: '#1a3a5a', letterSpacing: '1.5px' }}>
            LECS v2.4.1 — RESTRICTED ACCESS ONLY — UNAUTHORISED ACCESS IS A CRIMINAL OFFENCE
          </span>
          <span style={{
            background: '#071020', border: '1px solid #0f2040',
            color: '#2a5a7a', fontSize: '9px', padding: '3px 10px', letterSpacing: '2px',
          }}>
            AES-256 ENCRYPTED
          </span>
        </footer>
      </div>
    </BrowserRouter>
  );
}