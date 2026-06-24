import React, { useState, useEffect } from 'react';

export default function DiceOverlay({ result, onDismiss }) {
  const [phase, setPhase] = useState('rolling');
  const [displayRolls, setDisplayRolls] = useState(result.rolls.map(() => '?'));

  useEffect(() => {
    if (result.violation) {
      setPhase('done');
      return;
    }

    let flickerCount = 0;
    const flickerInterval = setInterval(() => {
      setDisplayRolls(result.rolls.map(() => Math.floor(Math.random() * 6) + 1));
      flickerCount++;
      if (flickerCount >= 8) {
        clearInterval(flickerInterval);
        setDisplayRolls(result.rolls);
        setPhase('landed');
        setTimeout(() => setPhase('done'), 400);
      }
    }, 100);

    return () => clearInterval(flickerInterval);
  }, [result]);

  if (result.violation) {
    return (
      <div className="overlay" onClick={onDismiss}>
        <div className="overlay-card">
          <div className="dice-result-text" style={{ color: '#e85050' }}>
            SHOT CLOCK VIOLATION
          </div>
          <div className="dice-subtitle">Turnover — no points</div>
          <button className="dice-dismiss" onClick={onDismiss}>CONTINUE</button>
        </div>
      </div>
    );
  }

  const made = result.made;
  const is3 = result.points === 3;

  return (
    <div className="overlay" onClick={phase === 'done' ? onDismiss : undefined}>
      <div className="overlay-card">
        <div className="dice-row">
          {displayRolls.map((val, i) => {
            const hit = phase !== 'rolling' && result.rolls[i] >= result.threshold;
            return (
              <span
                key={i}
                className={`die ${phase !== 'rolling' ? (hit ? 'die-hit' : 'die-miss') : 'die-rolling'}`}
              >
                {val}
              </span>
            );
          })}
        </div>

        {phase === 'done' && (
          <>
            <div
              className="dice-result-text"
              style={{ color: made ? (is3 ? '#FFD700' : '#3dba6e') : '#e85050' }}
            >
              {made ? (is3 ? 'THREE!' : 'BUCKET!') : 'MISS'}
            </div>
            {made && (
              <div className="dice-points">+{result.points}</div>
            )}
            <button className="dice-dismiss" onClick={onDismiss}>CONTINUE</button>
          </>
        )}
      </div>
    </div>
  );
}
