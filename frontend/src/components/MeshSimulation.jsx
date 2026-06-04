import React from 'react';

export default function MeshSimulation({ nodes, edges, state }) {
  const getLineStyle = (n1, n2) => {
    const pos1 = nodes[n1];
    const pos2 = nodes[n2];
    
    const x1 = pos1.x; const y1 = pos1.y;
    const x2 = pos2.x; const y2 = pos2.y;
    
    const aspect = 2.4; 
    const dx = (x2 - x1) * aspect;
    const dy = (y2 - y1);
    
    const length = Math.sqrt(dx*dx + dy*dy) / aspect;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    const path = state.macro_path || [];
    let isPath = false;
    for (let i = 0; i < path.length - 1; i++) {
        if ((n1 === path[i] && n2 === path[i+1]) || (n1 === path[i+1] && n2 === path[i])) {
            isPath = true;
            break;
        }
    }

    return {
      left: `${x1}%`,
      top: `${y1}%`,
      width: `${length}%`,
      transform: `rotate(${angle}deg)`,
      className: isPath ? 'edge active' : 'edge',
      animation: isPath ? 'edgePulse 1.5s infinite' : 'none'
    };
  };

  return (
    <div className="network-graph" style={{height: '350px'}}>
      {edges.map((edge, idx) => {
        const style = getLineStyle(edge.source, edge.target);
        return <div key={idx} className={style.className} style={style} />;
      })}
      
      {Object.entries(nodes).map(([nodeId, pos]) => {
        let cls = "node";
        if (nodeId === state.macro_path[0]) cls += " host-start";
        if (nodeId === state.macro_path[state.macro_path.length-1]) cls += " host-end";
        
        return (
          <div key={nodeId} className={cls} style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
            {nodeId}
          </div>
        );
      })}
    </div>
  );
}
