import React, { useState } from 'react';
import { DIFFICULTIES } from '../game/constants';

export default function ResultScreen({ G, moves }) {
  const won = G.score >= G.target;
  const diffKeys = Object.keys(DIFFICULTIES);
  const currentIdx = diffKeys.indexOf(G.difficulty);
  const nextDifficulty = currentIdx < diffKeys.length - 1 ? diffKeys[currentIdx + 1] : null;
  const diffInfo = DIFFICULTIES[G.difficulty];
  const [shared, setShared] = useState(false);

  const resultEmoji = won ? '✅' : '❌';
  const diffLabel = diffInfo?.label || G.difficulty.toUpperCase();
  const shareText =
    `🏀 FIVE ON THE FLOOR\n` +
    `${resultEmoji} ${won ? 'WIN' : 'LOSS'} · ${diffLabel}\n` +
    `Score: ${G.score}/${G.target} in ${G.possession} possessions\n` +
    `five-on-the-floor-poc.pages.dev`;

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Five on the Floor', text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch (_) {}
  }

  return (
    <div className="result-screen">
      <div className="result-title" style={{ color: won ? '#3dba6e' : '#e85050' }}>
        {won ? 'YOU WIN!' : 'GAME OVER'}
      </div>

      <div className="result-score">
        <span className="result-score-num">{G.score}</span>
        <span className="result-score-target">/ {G.target}</span>
      </div>

      <div className="result-subtitle">
        {won ? 'Target reached!' : `Needed ${G.target - G.score} more`}
      </div>

      <div className="result-stats">
        <div className="result-stat">
          <span className="result-stat-val">{G.possession}</span>
          <span className="result-stat-label">POSSESSIONS</span>
        </div>
        <div className="result-stat">
          <span className="result-stat-val">{diffLabel}</span>
          <span className="result-stat-label">DIFFICULTY</span>
        </div>
        <div className="result-stat">
          <span className="result-stat-val">{G.score > 0 ? ((G.score / G.target) * 100).toFixed(0) : 0}%</span>
          <span className="result-stat-label">TARGET MET</span>
        </div>
      </div>

      {/* Card summary */}
      {G.playerRoster.some(p => p.card) && (
        <div className="result-cards">
          <div className="result-cards-title">YOUR CARDS</div>
          {G.playerRoster.filter(p => p.card).map(p => (
            <div key={p.id} className="result-card-row">
              <span className="result-card-player">{p.size[0].toUpperCase()}{p.id.slice(1)}</span>
              <span className="result-card-name">{p.card.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="result-buttons">
        <button className="share-btn" onClick={handleShare}>
          {shared ? '✓ COPIED!' : '↗ SHARE RESULT'}
        </button>
        <button className="confirm-btn" onClick={() => moves.returnToMenu()}>
          MAIN MENU
        </button>
        {won && nextDifficulty && (
          <button
            className="confirm-btn next-tier"
            onClick={() => {
              const next = DIFFICULTIES[nextDifficulty];
              moves.setDifficulty(nextDifficulty, next.target);
            }}
          >
            NEXT: {DIFFICULTIES[nextDifficulty].label}
          </button>
        )}
        {!won && (
          <button
            className="confirm-btn"
            onClick={() => {
              const current = DIFFICULTIES[G.difficulty];
              moves.setDifficulty(G.difficulty, current.target);
            }}
          >
            TRY AGAIN
          </button>
        )}
      </div>
    </div>
  );
}
