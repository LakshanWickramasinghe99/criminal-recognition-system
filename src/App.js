import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard      from './pages/Dashboard';
import Enrollment     from './pages/Enrollment';
import Identification from './pages/Identification';
import AuditLog       from './pages/AuditLog';
import CriminalRecord from './pages/CriminalRecord';

const NAV_ITEMS = [
  { path: '/',               label: 'Dashboard',        icon: '▣' },
  { path: '/enrollment',    label: 'Enroll Criminal',   icon: '+' },
  { path: '/identification', label: 'Identify Video',   icon: '◉' },
  { path: '/records',       label: 'Criminal Records',  icon: '≡' },
  { path: '/audit',         label: 'Blockchain Log',    icon: '⬡' },
];

const T = {
  bg:        '#070b14',
  nav:       '#0a0f1e',
  surface:   '#0d1526',
  border:    '#1a3a5c',
  blue:      '#3a8adc',
  blueDark:  '#2a6fc4',
  text:      '#c8d8f0',
  textDim:   '#4a7aaa',
  textFaint: '#2a5a7a',
  red:       '#e05050',
  green:     '#22c55e',
  font:      "'Courier New', monospace",
};

function NavBar() {
  const location = useLocation();

  return (
    <nav style={{
      backgroundColor: T.nav,
      borderBottom: `1px solid ${T.border}`,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Top strip */}
      <div style={{
        background: '#050810',
        borderBottom: `1px solid #0f1e35`,
        padding: '4px 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: '9px', color: T.textFaint,
          letterSpacing: '3px', fontFamily: T.font,
          textTransform: 'uppercase',
        }}>
          Sri Lanka Police — Criminal Identification & Surveillance System
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <LiveIndicator />
          <span style={{ fontSize: '9px', color: T.textFaint,
            letterSpacing: '2px', fontFamily: T.font }}>
            CLEARANCE: RESTRICTED
          </span>
        </div>
      </div>

      {/* Main nav row */}
      <div style={{
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '34px', height: '34px',
            border: `2px solid ${T.blueDark}`,
            background: '#0a1830',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px',
          }}>⚖</div>
          <div>
            <div style={{
              fontSize: '13px', fontWeight: '700', color: '#e0ecff',
              letterSpacing: '2px', textTransform: 'uppercase',
              fontFamily: T.font,
            }}>
              C·I·S·S
            </div>
            <div style={{
              fontSize: '9px', color: T.textDim,
              letterSpacing: '1.5px', marginTop: '1px',
              fontFamily: T.font, textTransform: 'uppercase',
            }}>
              Blockchain Registry v2.4
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: '2px' }}>
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{
                color: isActive ? '#e0ecff' : T.textDim,
                textDecoration: 'none',
                padding: '6px 14px',
                fontSize: '10px',
                letterSpacing: '1.5px',
                fontFamily: T.font,
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: isActive ? '#0d1a2e' : 'transparent',
                borderTop: isActive ? `2px solid ${T.blue}` : '2px solid transparent',
                borderBottom: 'none',
                transition: 'color 0.15s, background 0.15s',
                position: 'relative',
              }}>
                <span style={{
                  fontSize: '10px',
                  color: isActive ? T.blue : T.textFaint,
                  fontFamily: T.font,
                }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: '#051a0a',
            border: `1px solid #1a4a1a`,
            color: T.green,
            fontSize: '9px',
            padding: '3px 10px',
            letterSpacing: '2px',
            fontFamily: T.font,
          }}>
            ● BLOCKCHAIN ONLINE
          </div>
        </div>
      </div>
    </nav>
  );
}

function LiveIndicator() {
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
        background: T.green,
        boxShadow: `0 0 0 2px rgba(34,197,94,0.2)`,
        animation: 'pulse 2s infinite',
      }} />
      <span style={{ fontSize: '9px', color: T.green,
        letterSpacing: '2px', fontFamily: T.font }}>{time}</span>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{
        minHeight: '100vh',
        backgroundColor: T.bg,
        color: T.text,
        fontFamily: T.font,
      }}>
        <NavBar />
        <main style={{
          padding: '24px 2rem',
          maxWidth: '1320px',
          margin: '0 auto',
        }}>
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
          borderTop: `1px solid #0f1e35`,
          padding: '10px 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '40px',
        }}>
          <span style={{ fontSize: '9px', color: '#1a3a5a',
            letterSpacing: '1.5px', fontFamily: T.font }}>
            LECS v2.4.1 — RESTRICTED ACCESS ONLY — UNAUTHORISED ACCESS IS A CRIMINAL OFFENCE
          </span>
          <span style={{
            background: '#071020', border: `1px solid #0f2040`,
            color: T.textFaint, fontSize: '9px',
            padding: '3px 10px', letterSpacing: '2px', fontFamily: T.font,
          }}>
            AES-256 ENCRYPTED
          </span>
        </footer>
      </div>
    </BrowserRouter>
  );
}
