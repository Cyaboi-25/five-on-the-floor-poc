import React from 'react';
import { DIFFICULTIES } from '../game/constants';

const SIZE_LABEL = { small: 'S', medium: 'M', large: 'L' };
const SIZE_COLOR = { small: '#3dba6e', medium: '#E8A030', large: '#e85050' };
const STAR_COLORS = { 1: '#8a8799', 2: '#E8A030', 3: '#a060e0' };

export default function ScoutScreen({ G, moves }) {
  const diffInfo = DIFFICULTIES[G.difficulty];

  return (
    <div className="scout-screen">
      <div className="scout-title">SCOUTING REPORT</div>
      <div className="scout-difficulty">{diffInfo?.label || G.difficulty.toUpperCase()} — Target: {G.target} pts</div>

      <div className="scout-columns">
        {/* Your squad */}
        <div className="scout-team">
          <div className="scout-team-label" style={{ color: '#E8A030' }}>YOUR SQUAD</div>
          {G.playerRoster.map(p => (
            <div key={p.id} className="scout-player">
              <span className="scout-circle" style={{ background: SIZE_COLOR[p.size] }}>
                {SIZE_LABEL[p.size]}{p.id.slice(1)}
              </span>
              <span className="scout-info">
                <span className="scout-size">{p.size} · SPD {p.speed}</span>
                {p.card
                  ? <span className="scout-card" style={{ color: STAR_COLORS[p.card.stars] }}>
                      {p.card.name}
                    </span>
                  : <span className="scout-no-card">no card</span>
                }
              </span>
            </div>
          ))}
        </div>

        <div className="scout-vs">VS</div>

        {/* Defense */}
        <div className="scout-team">
          <div className="scout-team-label" style={{ color: '#4A9EE8' }}>DEFENSE</div>
          {G.cpuRoster.map(p => (
            <div key={p.id} className="scout-player scout-player-def">
              {/* Defense uses diamond badge */}
              <span className="scout-diamond" style={{ background: SIZE_COLOR[p.size] }}>
                {SIZE_LABEL[p.size]}
              </span>
              <span className="scout-info">
                <span className="scout-size">{p.size}</span>
                {p.card
                  ? <span className="scout-card" style={{ color: STAR_COLORS[p.card.stars] }}>
                      {p.card.name}
                    </span>
                  : <span className="scout-no-card">no card</span>
                }
              </span>
            </div>
          ))}
        </div>
      </div>

      <button className="confirm-btn" onClick={() => moves.startGame()}>
        TIP OFF
      </button>
    </div>
  );
}
