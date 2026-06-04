import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function MetricsCharts({ algorithms, step }) {
  const algoNames = Object.keys(algorithms);
  
  const packetLossData = {
    labels: algoNames,
    datasets: [
      {
        label: 'Packet Loss Count',
        data: algoNames.map(name => algorithms[name].packet_loss),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      }
    ],
  };

  const costData = {
    labels: algoNames,
    datasets: [
      {
        label: 'Total Switching Cost',
        data: algoNames.map(name => algorithms[name].total_cost),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#f8fafc' }
      }
    },
    scales: {
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.1)' } },
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.1)' } }
    }
  };

  return (
    <div>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Time Step</div>
          <div className="metric-value">{step}</div>
        </div>
      </div>
      
      <div className="chart-container">
        <Bar data={packetLossData} options={chartOptions} />
      </div>

      <div className="chart-container" style={{marginTop: '20px'}}>
        <Bar data={costData} options={chartOptions} />
      </div>
    </div>
  );
}
