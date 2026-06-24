import React, { useState } from 'react';
import { chebyshev, getTileZone } from '../game/constants';

export default function ActionBar({ G, moves }) {
  const [passMode,   setPassMode]   = useState(false);
  const [screenMode, setScreenMode] = useState(false);

  const queue        = G.actionQueue || [];
  const hasSpecial   = queue.some(a => ['pass','screen','shoot','hold'].includes(a.type));
  const hasShoot     = queue.some(a => a.type === 'shoot');
  const hasAnyAction = queue.length > 0;

  const offensePieces = G.pieces.filter(p => p.role === 'offense');
  const teammates     = offensePieces.filter(p => p.id !== G.ballCarrierId);

  function computePassCost(receiverId) {
    const passer   = G.pieces.find(p => p.id === G.ballCarrierId);
    const receiver = G.pieces.find(p => p.id === receiverId);
    if (!passer || !receiver) return 1;
    if (passer.card?.effect?.free_passes) return 1;
    if (passer.card?.effect?.safe_paint_pass) {
      const zone = getTileZone(passer.col, passer.row);
      if (['paint','dunker_l','dunker_r','elbow_l','elbow_r'].includes(zone)) return 1;
    }
    const defenders = G.pieces.filter(p => p.role === 'defense');
    const mid = {
      col: Math.round((passer.col + receiver.col) / 2),
      row: Math.round((passer.row + receiver.row) / 2),
    };
    return defenders.some(
      d => chebyshev(d, passer) <= 2 || chebyshev(d, receiver) <= 2 || chebyshev(d, mid) <= 2
    ) ? 2 : 1;
  }

  function queuePass(receiverId) {
    moves.queueSpecialAction({ type: 'pass', receiverId });
    setPassMode(false);
  }

  function queueScreen(pieceId) {
    moves.queueSpecialAction({ type: 'screen', pieceId });
    setScreenMode(false);
  }

  if (passMode) {
    return (
      <div className="action-bar">
        <div className="pass-targets">
          <span className="action-label">PASS TO:</span>
          {teammates.map(p => {
            const cost = computePassCost(p.id);
            return (
              <button key={p.id} className="action-btn" onClick={() => queuePass(p.id)}>
                {p.size[0].toUpperCase()}{p.id.slice(1)}
                <span className="action-cost" style={{ color: cost === 2 ? '#e85050' : '#3dba6e' }}>
                  {cost} clk
                </span>
              </button>
            );
          })}
          <button className="action-btn" onClick={() => setPassMode(false)}>✕</button>
        </div>
      </div>
    );
  }

  if (screenMode) {
    return (
      <div className="action-bar">
        <div className="pass-targets">
          <span className="action-label">SCREEN BY:</span>
          {teammates.map(p => (
            <button key={p.id} className="action-btn" onClick={() => queueScreen(p.id)}>
              {p.size[0].toUpperCase()}{p.id.slice(1)}
            </button>
          ))}
          <button className="action-btn" onClick={() => setScreenMode(false)}>✕</button>
        </div>
      </div>
    );
  }

  return (
    <div className="action-bar">
      {/* SHOOT: only available as first action (queue must be empty) */}
      <button
        className="action-btn shoot"
        disabled={hasAnyAction}
        onClick={() => moves.queueSpecialAction({ type: 'shoot' })}
        title="Must be first action"
      >
        <span>SHOOT</span>
        <span className="action-cost">FREE</span>
      </button>

      {/* PASS */}
      <button
        className={`action-btn ${hasSpecial && queue.some(a => a.type === 'pass') ? 'action-active' : ''}`}
        disabled={hasSpecial && !queue.some(a => a.type === 'pass') || hasShoot}
        onClick={() => {
          if (queue.some(a => a.type === 'pass')) {
            // already queued — cancel it
            moves.queueSpecialAction({ type: 'hold' });
            moves.undoLastAction();
          } else {
            setPassMode(true);
          }
        }}
      >
        <span>PASS</span>
        <span className="action-cost">1-2 clk</span>
      </button>

      {/* SCREEN */}
      <button
        className={`action-btn ${hasSpecial && queue.some(a => a.type === 'screen') ? 'action-active' : ''}`}
        disabled={hasSpecial && !queue.some(a => a.type === 'screen') || hasShoot}
        onClick={() => {
          if (queue.some(a => a.type === 'screen')) {
            moves.undoLastAction();
          } else {
            setScreenMode(true);
          }
        }}
      >
        <span>SCREEN</span>
        <span className="action-cost">2 clk</span>
      </button>

      {/* HOLD */}
      <button
        className="action-btn"
        disabled={hasSpecial || hasShoot}
        onClick={() => moves.queueSpecialAction({ type: 'hold' })}
      >
        <span>HOLD</span>
        <span className="action-cost">1 clk</span>
      </button>
    </div>
  );
}
