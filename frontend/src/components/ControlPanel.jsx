import React from 'react';

export default function ControlPanel({ state, dynamicMode, onSetRoute, onToggleDynamic }) {
  if (!state) return null;

  const handleRoute = (type, val) => {
    let src = state.macro_path[0];
    let tgt = state.macro_path[state.macro_path.length - 1];
    if (type === 'source') src = val;
    if (type === 'target') tgt = val;
    if (src !== tgt) {
        onSetRoute(src, tgt);
    }
  };

  const hosts = Array.from({length: 9}, (_, i) => `H${i+1}`);

  return (
    <div className="glass-panel" style={{marginBottom: '24px'}}>
      <div style={{display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'flex-start'}}>
        
        {/* Routing Controls */}
        <div style={{flex: 1}}>
          <h2 style={{color: 'var(--accent-color)'}}>📍 Macro Routing</h2>
          <div style={{display: 'flex', gap: '16px'}}>
            <div>
              <label style={{display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>Source Host</label>
              <select className="ui-select" value={state.macro_path[0]} onChange={(e) => handleRoute('source', e.target.value)}>
                {hosts.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label style={{display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>Target Host</label>
              <select className="ui-select" value={state.macro_path[state.macro_path.length - 1]} onChange={(e) => handleRoute('target', e.target.value)}>
                {hosts.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Jammer Controls */}
        <div style={{flex: 1}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h2 style={{color: 'var(--danger-color)'}}>🎯 Edge-Specific AI Jamming</h2>
          </div>
          <div style={{marginTop: '12px'}}>
            <label style={{display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: dynamicMode ? 'var(--danger-color)' : 'rgba(0,0,0,0.3)', color: dynamicMode ? '#000' : 'var(--text-primary)', padding: '12px 24px', borderRadius: '24px', fontSize: '1rem', fontWeight: 'bold', transition: 'all 0.3s'}}>
              <input type="checkbox" checked={dynamicMode || false} onChange={(e) => onToggleDynamic(e.target.checked)} style={{margin:0, width: '20px', height: '20px'}} />
              {dynamicMode ? 'DYNAMIC MODE ACTIVE' : 'ENABLE DYNAMIC AI JAMMER'}
            </label>
            <div style={{color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '12px', lineHeight: '1.5'}}>
              The Jammer actively scrambles frequencies independently on *every physical link* between nodes. The sender must use trial-and-error to find an open frequency on each hop.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
