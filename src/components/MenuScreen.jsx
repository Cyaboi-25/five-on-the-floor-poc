import React from 'react';
import { DIFFICULTIES } from '../game/constants';

export default function MenuScreen({ moves }) {
  return (
    <div className="menu-screen">
      <div className="menu-title">FIVE ON THE FLOOR</div>
      <div className="menu-subtitle">Basketball Strategy Game</div>
      <div className="menu-difficulties">
        {Object.entries(DIFFICULTIES).map(([key, diff]) => (
          <button
            key={key}
            className="menu-diff-btn"
            onClick={() => moves.setDifficulty(key, diff.target)}
          >
            <span className="diff-label">{diff.label}</span>
            <span className="diff-target">Target: {diff.target} pts</span>
          </button>
        ))}
      </div>
    </div>
  );
}
