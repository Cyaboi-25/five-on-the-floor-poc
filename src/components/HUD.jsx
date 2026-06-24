import React from 'react';

export default function HUD({ G }) {
  const clockClass = G.clock > 12 ? 'clock-safe' : G.clock > 6 ? 'clock-mid' : 'clock-danger';

  return (
    <div className="hud">
      <div className="hud-left">
        <span className="hud-possession">POSS {G.possession}/{G.totalPossessions}</span>
      </div>
      <div className="hud-center">
        <span className="hud-score">{G.score}</span>
        <span className="hud-target">/ {G.target}</span>
      </div>
      <div className="hud-right">
        <span className={`hud-clock ${clockClass}`}>{G.clock}</span>
      </div>
    </div>
  );
}
