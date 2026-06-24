import React, { useState } from 'react';

const ZONE_SHORT = {
  paint: 'PAINT', dunker_l: 'DNK-L', dunker_r: 'DNK-R',
  elbow_l: 'ELB-L', elbow_r: 'ELB-R',
  corner_l: 'CRN-L', corner_r: 'CRN-R',
  wing_l: 'WNG-L', wing_r: 'WNG-R',
  tok: 'TOK', half: 'HALF',
};

export default function HUD({ G }) {
  const [showLog, setShowLog] = useState(false);
  const clockClass = G.clock > 12 ? 'clock-safe' : G.clock > 6 ? 'clock-mid' : 'clock-danger';

  return (
    <div className="hud-wrap">
      <div className="hud">
        <div className="hud-left">
          <span className="hud-possession" onClick={() => setShowLog(v => !v)} style={{ cursor: 'pointer' }}>
            POSS {G.possession}/{G.totalPossessions} {G.playHistory?.length > 0 ? '▾' : ''}
          </span>
        </div>
        <div className="hud-center">
          <span className="hud-score">{G.score}</span>
          <span className="hud-target">/ {G.target}</span>
        </div>
        <div className="hud-right">
          <span className={`hud-clock ${clockClass}`}>{G.clock}</span>
        </div>
      </div>

      {showLog && G.playHistory?.length > 0 && (
        <div className="poss-log">
          {G.playHistory.map((h, i) => (
            <div key={i} className={`poss-log-row ${h.scored ? 'log-made' : 'log-miss'}`}>
              <span className="log-poss">P{h.possession}</span>
              <span className="log-zone">{ZONE_SHORT[h.shotZone] || h.shotZone}</span>
              <span className="log-pts">{h.scored ? `+${h.points}` : 'MISS'}</span>
              {h.usedScreen && <span className="log-tag">SCR</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
