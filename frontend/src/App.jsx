import React from 'react';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="App">
      <header className="dashboard-header">
        <h1 className="text-gradient">Anti-Jamming Frequency Optimization</h1>
        <p>Comparative Analysis of Adaptive Algorithms for Secure Military Communication</p>
      </header>
      <main>
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
