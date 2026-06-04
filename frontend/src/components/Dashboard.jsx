import React, { useState, useEffect, useRef } from 'react';
import MeshSimulation from './MeshSimulation';
import ControlPanel from './ControlPanel';
import MessagePanel from './MessagePanel';
import FrequencySimulation from './FrequencySimulation';

const API_BASE = 'http://localhost:5000/api';

export default function Dashboard() {
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const pollInterval = useRef(null);

  const fetchState = async () => {
    try {
      const res = await fetch(`${API_BASE}/state`);
      const data = await res.json();
      setState(data);
      if (data.running && !pollInterval.current) {
        startPolling();
      } else if (!data.running && pollInterval.current) {
        stopPolling();
      }
    } catch (err) {
      setError('Cannot connect to simulation backend. Ensure Flask is running.');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchState();
    return () => stopPolling();
  }, []);

  const startPolling = () => {
    if (!pollInterval.current) {
      pollInterval.current = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/step`, { method: 'POST' });
          const data = await res.json();
          setState(data);
          if (!data.running) {
            stopPolling();
          }
        } catch (err) {
          console.error(err);
          stopPolling();
        }
      }, 800); // Slower polling so the animation is clearly visible
    }
  };

  const stopPolling = () => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  };

  const handleStep = async () => {
    await fetch(`${API_BASE}/step`, { method: 'POST' });
    fetchState();
  };

  const handleReset = async () => {
    await fetch(`${API_BASE}/reset`, { method: 'POST' });
    fetchState();
  };

  const handleSetRoute = async (source, target) => {
    await fetch(`${API_BASE}/set_route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, target })
    });
    fetchState();
  };

  const handleToggleJam = async (freq, is_jammed) => {
    await fetch(`${API_BASE}/toggle_jam`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ freq, is_jammed })
    });
    fetchState();
  };

  const handleToggleDynamicJammer = async (enabled) => {
    await fetch(`${API_BASE}/toggle_dynamic_jammer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    fetchState();
  };

  if (error) {
    return <div style={{color: 'var(--danger-color)', padding: '24px'}}>{error}</div>;
  }

  if (!state) {
    return <div style={{padding: '24px'}}>Loading simulation...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Tactical Mesh Network</h1>
          <div style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px'}}>
            Powered by Hybrid Adaptive Frequency Optimization (HAFO)
          </div>
        </div>
        <div className="controls">
          <button 
            className="primary" 
            onClick={handleStep}
            disabled={state.running || (state.state && state.state.message_idx >= state.full_message?.length)}
          >
            {state.running ? 'Transmitting...' : 'Start Transmission'}
          </button>
          <button className="danger" onClick={handleReset}>Reset Network</button>
        </div>
      </div>

      <ControlPanel 
        state={state} 
        frequencies={state.frequencies}
        jammedFreqs={state.jammed_freqs}
        dynamicMode={state.dynamic_mode}
        onSetRoute={handleSetRoute}
        onToggleJam={handleToggleJam}
        onToggleDynamic={handleToggleDynamicJammer}
      />

      <FrequencySimulation state={state} frequencies={state.frequencies} jammedFreqs={state.jammed_freqs} />

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px', marginBottom: '24px'}}>
        <MeshSimulation nodes={state.nodes} edges={state.edges} state={state} />
        <MessagePanel state={state} />
      </div>
      
    </div>
  );
}
