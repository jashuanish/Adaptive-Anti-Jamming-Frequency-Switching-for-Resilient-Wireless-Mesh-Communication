import React from 'react';

export default function FrequencySimulation({ state, frequencies, jammedFreqs }) {
  if (!state || !state.state) return null;
  
  const s = state.state;
  const macro_path = state.macro_path || [];
  
  // Find which segment the packet is currently on
  let currentSegmentIdx = -1;
  for (let i = 0; i < macro_path.length - 1; i++) {
      if (macro_path[i] === s.current_host && macro_path[i+1] === s.target_host) {
          currentSegmentIdx = i;
          break;
      }
  }

  return (
    <div className="glass-panel" style={{marginTop: '24px'}}>
      <h2>📻 Link-Specific Trial & Error (Layer 2)</h2>
      <div style={{color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem', lineHeight: '1.5'}}>
        The sender does not know the Jammer's state. It must blind-test frequencies on each link. <br/>
        <strong style={{color: 'var(--danger-color)'}}>Red Bounce:</strong> Frequency is jammed. Retrying on next tick. <br/>
        <strong style={{color: 'var(--success-color)'}}>Green Shoot:</strong> Frequency is clear. Moving to next host.
      </div>
      
      <div style={{display: 'flex', alignItems: 'center', width: '100%', overflowX: 'auto', padding: '20px 20px', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px'}}>
        {macro_path.map((node, i) => {
            const isLast = i === macro_path.length - 1;
            const isCurrentSegment = i === currentSegmentIdx;
            
            // Get jammed frequencies for this specific edge
            let edgeJammed = {};
            if (!isLast && jammedFreqs) {
                const n1 = [node, macro_path[i+1]].sort()[0];
                const n2 = [node, macro_path[i+1]].sort()[1];
                edgeJammed = jammedFreqs[`${n1}-${n2}`] || {};
            }

            return (
                <React.Fragment key={i}>
                    {/* The Node */}
                    <div className={isCurrentSegment ? "node host-start" : "node"} style={{
                        position: 'relative', 
                        transform: 'none', 
                        left: 'auto', 
                        top: 'auto',
                        background: '#1e293b',
                        flexShrink: 0,
                        zIndex: 10
                    }}>
                        {node}
                    </div>

                    {/* The Link between nodes */}
                    {!isLast && (
                        <div style={{
                            position: 'relative',
                            width: '200px',
                            height: '140px',
                            flexShrink: 0,
                            margin: '0 5px'
                        }}>
                            {/* 5 Frequencies */}
                            {frequencies.map((f, fIdx) => {
                                const isJammed = edgeJammed[f];
                                const top = `${(fIdx + 1) * (100 / (frequencies.length + 1))}%`;
                                return (
                                    <div key={f} style={{
                                        position: 'absolute', top, left: '0', right: '0', 
                                        height: isJammed ? '3px' : '1px', 
                                        background: isJammed ? 'var(--danger-color)' : 'var(--border-color)',
                                        opacity: isJammed ? 0.8 : 0.3,
                                        boxShadow: isJammed ? '0 0 5px var(--danger-color)' : 'none'
                                    }}>
                                        <span style={{position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: isJammed ? 'var(--danger-color)' : 'var(--text-secondary)'}}>
                                            {f}
                                        </span>
                                    </div>
                                );
                            })}
                            
                            {/* The Packet (only render in current segment) */}
                            {isCurrentSegment && s.freq_tried && (
                                <div 
                                    key={`${state.step}-${s.hop_success}`}
                                    className={s.hop_success ? "packet" : "packet jammed"}
                                    style={{
                                        top: `${(frequencies.indexOf(s.freq_tried) + 1) * (100 / (frequencies.length + 1))}%`,
                                        animation: s.hop_success 
                                            ? 'hopSuccess 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                                            : 'hopFail 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                                    }} 
                                />
                            )}
                        </div>
                    )}
                </React.Fragment>
            );
        })}
      </div>
    </div>
  );
}
