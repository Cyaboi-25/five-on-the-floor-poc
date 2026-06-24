import React from 'react';

const SIZE_RADIUS = { small: 12, medium: 14, large: 17 };
const SIZE_LETTER = { small: 'S', medium: 'M', large: 'L' };

export default function Piece({ piece, tileW, tileH, isSelected, isBallCarrier, hasQueuedMove, onClick }) {
  const r = SIZE_RADIUS[piece.size];
  const x = piece.col * tileW + tileW / 2;
  const y = piece.row * tileH + tileH / 2;
  const isOffense = piece.role === 'offense';

  // Defense pieces are diamond-shaped (rotated square) — instantly distinguishable from circles
  const defenseSize = r * 1.55; // slightly larger so label fits after rotation
  const defStyle = isOffense ? {} : { borderRadius: 3, transform: 'rotate(45deg)' };
  const labelStyle = isOffense ? {} : { transform: 'rotate(-45deg)' };

  const selectedStyle = isSelected
    ? { boxShadow: '0 0 0 3px #fff, 0 0 10px rgba(255,255,255,0.4)' }
    : hasQueuedMove && isOffense
      ? { boxShadow: '0 0 0 2px rgba(232,160,48,0.8)' }
      : {};
  const carrierStyle = isBallCarrier
    ? { boxShadow: '0 0 14px rgba(232,160,48,0.7), 0 0 0 2px rgba(232,160,48,0.4)' }
    : {};

  const size = isOffense ? r * 2 : defenseSize;

  return (
    <div
      className={`piece ${isOffense ? 'piece-offense' : 'piece-defense'}`}
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: isOffense ? '50%' : 3,
        transform: isOffense ? 'none' : 'rotate(45deg)',
        transition: 'left 0.2s ease, top 0.2s ease',
        pointerEvents: 'auto',
        cursor: isOffense ? 'pointer' : 'default',
        zIndex: isOffense ? 4 : 2,
        border: isOffense ? '2px solid rgba(255,255,255,0.6)' : '1.5px solid rgba(255,255,255,0.4)',
        ...selectedStyle,
        ...(isBallCarrier && isOffense ? carrierStyle : {}),
      }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {/* Counter-rotate label so text is always upright */}
      <span
        className="piece-label"
        style={{
          ...labelStyle,
          color: isOffense ? '#1a1000' : '#fff',
          fontSize: piece.size === 'large' ? 10 : 8,
        }}
      >
        {SIZE_LETTER[piece.size]}{piece.id.slice(1)}
      </span>

      {isBallCarrier && (
        <span className="ball-icon">🏀</span>
      )}

      {piece.paintTurns >= 2 && (
        <span className="paint-warning" style={isOffense ? {} : { transform: 'rotate(-45deg)' }}>
          {piece.paintTurns >= 3 ? '!' : piece.paintTurns}
        </span>
      )}

      {isOffense && piece.card && (
        <span className={`card-dot rarity-${piece.card.stars}`} />
      )}
    </div>
  );
}
