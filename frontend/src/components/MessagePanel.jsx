import React from 'react';

export default function MessagePanel({ state }) {
  if (!state.full_message) return null;
  const s = state.state;
  if (!s) return null;
  
  const progress = (s.message_idx / state.full_message.length) * 100;

  return (
    <div className="glass-panel" style={{marginTop: '24px'}}>
      <h2>🔐 Secure Host-to-Host Transmission</h2>
      
      <div style={{display: 'flex', gap: '24px', flexWrap: 'wrap'}}>
        
        {/* Metrics Box */}
        <div style={{flex: 1, minWidth: '300px', background: 'rgba(0,0,0,0.5)', padding: '16px', borderRadius: '4px', borderLeft: '4px solid var(--accent-color)', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'}}>
          <h3 style={{margin: '0 0 16px 0'}}>Link Metrics</h3>
          
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
            <span style={{color: 'var(--text-secondary)'}}>Packets Dropped:</span>
            <span style={{color: s.packet_loss > 0 ? 'var(--danger-color)' : 'var(--success-color)', fontWeight: 'bold'}}>{s.packet_loss}</span>
          </div>
          
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
            <span style={{color: 'var(--text-secondary)'}}>Transmission Progress:</span>
            <span style={{fontWeight: 'bold'}}>{Math.round(progress)}%</span>
          </div>
          
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
            <span style={{color: 'var(--text-secondary)'}}>Hops Executed:</span>
            <span style={{fontWeight: 'bold'}}>{state.macro_path ? state.macro_path.length - 1 : 0}</span>
          </div>
        </div>

        {/* Transmission Box */}
        <div style={{flex: 2, minWidth: '400px', background: 'rgba(0,0,0,0.5)', padding: '16px', borderRadius: '4px', borderLeft: '4px solid var(--success-color)', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'}}>
          <h3 style={{margin: '0 0 16px 0'}}>Payload Decoding</h3>
          
          <div style={{marginBottom: '12px'}}>
            <strong style={{color: 'var(--text-secondary)', display: 'block', marginBottom: '4px'}}>Raw Intercepted Signal:</strong>
            <span style={{fontFamily: 'var(--font-mono)', letterSpacing: '2px', color: s.received_message.includes('_') ? 'var(--danger-color)' : 'var(--text-primary)', wordBreak: 'break-all'}}>
              {s.received_message || "Awaiting Signal..."}
            </span>
          </div>
          
          <div>
            <strong style={{color: 'var(--text-secondary)', display: 'block', marginBottom: '4px'}}>Auto-Corrected Output (Levenshtein):</strong>
            <span style={{fontFamily: 'var(--font-mono)', letterSpacing: '2px', color: 'var(--success-color)', wordBreak: 'break-all'}}>
              {s.corrected_message || "..."}
            </span>
          </div>
        </div>
        
      </div>
    </div>
  );
}
