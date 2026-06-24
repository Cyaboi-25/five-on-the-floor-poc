import React, { useMemo } from 'react';
import { getTileZone, ZONE_TINTS, ZONE_BOUNDS } from '../game/constants';
import { ZONE_TERRITORIES } from '../game/cpuLogic';
import Piece from './Piece';

const COLS = 16;
const ROWS = 14;

const ZONE_DEF_COLORS = {
  d0: 'rgba(74,158,232,0.18)',
  d1: 'rgba(74,158,232,0.18)',
  d2: 'rgba(140,90,200,0.15)',
  d3: 'rgba(232,80,80,0.18)',
  d4: 'rgba(232,80,80,0.18)',
};

const hashRows = [8.5, 10, 11.5];

export default function Court({ G, moves }) {
  const courtWidth  = 390;
  const courtHeight = 340;
  const tileW = courtWidth  / COLS;
  const tileH = courtHeight / ROWS;

  const selectedPiece = G.pieces.find(p => p.id === G.selectedPieceId);
  const hasShootQueued = G.actionQueue?.some(a => a.type === 'shoot');

  const validMoves = useMemo(() => {
    if (!selectedPiece || selectedPiece.role !== 'offense' || hasShootQueued)
      return [];
    const result = [];
    for (let dc = -selectedPiece.speed; dc <= selectedPiece.speed; dc++) {
      for (let dr = -selectedPiece.speed; dr <= selectedPiece.speed; dr++) {
        if (dc === 0 && dr === 0) continue;
        const col = selectedPiece.col + dc;
        const row = selectedPiece.row + dr;
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) continue;
        const dist = Math.max(Math.abs(dc), Math.abs(dr));
        result.push({ col, row, dist });
      }
    }
    return result;
  }, [selectedPiece, hasShootQueued]);

  function handleTileClick(col, row) {
    if (!selectedPiece || hasShootQueued) return;
    const isValid = validMoves.some(m => m.col === col && m.row === row);
    if (isValid) moves.queueMove(selectedPiece.id, col, row);
  }

  const sortedPieces = useMemo(() => {
    const def = G.pieces.filter(p => p.role === 'defense');
    const off = G.pieces.filter(p => p.role === 'offense');
    return [...def, ...off];
  }, [G.pieces]);

  // Precompute ghost positions and path data from actionQueue
  const moveActions  = (G.actionQueue || []).filter(a => a.type === 'move');
  const screenAction = (G.actionQueue || []).find(a => a.type === 'screen');

  // Screen tile: screener's planned position (if they also have a move queued)
  const screenTile = screenAction ? (() => {
    const m = moveActions.find(a => a.pieceId === screenAction.pieceId);
    const p = G.pieces.find(p => p.id === screenAction.pieceId);
    if (!p) return null;
    return m ? { col: m.toCol, row: m.toRow } : { col: p.col, row: p.row };
  })() : null;

  return (
    <div className="court-container" style={{ width: courtWidth, height: courtHeight }}>
      {/* ── SVG background layer ── */}
      <svg className="court-svg" viewBox={`0 0 ${courtWidth} ${courtHeight}`}>
        <defs>
          <pattern id="grain" x="0" y="0" width={courtWidth} height="8" patternUnits="userSpaceOnUse">
            <rect width={courtWidth} height="8" fill="transparent" />
            <rect width={courtWidth} height="2" y="0" fill="rgba(0,0,0,0.038)" />
          </pattern>
          <radialGradient id="vignette" cx="50%" cy="50%" r="72%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.10)" />
          </radialGradient>
        </defs>

        {/* Hardwood */}
        <rect width={courtWidth} height={courtHeight} fill="#C8924A" />
        <rect width={courtWidth} height={courtHeight} fill="url(#grain)" />
        <rect width={courtWidth} height={courtHeight} fill="url(#vignette)" />

        {/* Court outline */}
        <rect x={3} y={3} width={courtWidth - 6} height={courtHeight - 6}
              fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />

        {/* Zone defense territory outlines */}
        {G.cpuScheme === 'zone' && Object.entries(ZONE_TERRITORIES).map(([defId, zones]) =>
          zones.map(zoneName => {
            const b = ZONE_BOUNDS[zoneName];
            if (!b) return null;
            const [c0, c1, r0, r1] = b;
            return (
              <rect key={`${defId}-${zoneName}`}
                x={c0 * tileW} y={r0 * tileH}
                width={(c1 - c0 + 1) * tileW} height={(r1 - r0 + 1) * tileH}
                fill="none"
                stroke={ZONE_DEF_COLORS[defId] || 'rgba(255,255,255,0.1)'}
                strokeWidth={1.5} />
            );
          })
        )}

        {/* Paint */}
        <rect x={5 * tileW} y={7 * tileH} width={6 * tileW} height={courtHeight - 7 * tileH}
              fill="rgba(140,42,20,0.22)" stroke="rgba(255,255,255,0.45)" strokeWidth={1} />

        {/* Free throw line */}
        <line x1={5 * tileW} y1={7 * tileH} x2={11 * tileW} y2={7 * tileH}
              stroke="rgba(255,255,255,0.5)" strokeWidth={1} />

        {/* Lane hash marks */}
        {hashRows.map((r, i) => (
          <React.Fragment key={i}>
            <line x1={5 * tileW - 8} y1={r * tileH} x2={5 * tileW} y2={r * tileH}
                  stroke="rgba(255,255,255,0.45)" strokeWidth={1.2} />
            <line x1={11 * tileW} y1={r * tileH} x2={11 * tileW + 8} y2={r * tileH}
                  stroke="rgba(255,255,255,0.45)" strokeWidth={1.2} />
          </React.Fragment>
        ))}

        {/* Free throw circle */}
        <circle cx={8 * tileW} cy={7 * tileH} r={2 * tileW}
                fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1}
                strokeDasharray="4 3" />

        {/* Three-point line */}
        <line x1={2 * tileW} y1={courtHeight} x2={2 * tileW} y2={10 * tileH}
              stroke="rgba(255,255,255,0.52)" strokeWidth={1.2} />
        <line x1={14 * tileW} y1={courtHeight} x2={14 * tileW} y2={10 * tileH}
              stroke="rgba(255,255,255,0.52)" strokeWidth={1.2} />
        <path d={`M ${2 * tileW} ${10 * tileH} A 163 163 0 0 1 ${14 * tileW} ${10 * tileH}`}
              fill="none" stroke="rgba(255,255,255,0.52)" strokeWidth={1.2} />

        {/* Restricted area arc */}
        <path d={`M ${6.5 * tileW} ${13.3 * tileH} A ${1.5 * tileW} ${tileH} 0 0 1 ${9.5 * tileW} ${13.3 * tileH}`}
              fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.9} />

        {/* Rim */}
        <circle cx={8 * tileW} cy={13.15 * tileH} r={0.48 * tileW}
                fill="rgba(255,100,30,0.18)" stroke="rgba(255,145,50,0.9)" strokeWidth={1.8} />

        {/* Backboard */}
        <rect x={6.5 * tileW} y={13.15 * tileH + 0.48 * tileW + 2}
              width={3 * tileW} height={4}
              fill="rgba(255,255,255,0.80)" rx={1} />

        {/* Screen indicator tile */}
        {screenTile && (
          <rect
            x={screenTile.col * tileW + 2} y={screenTile.row * tileH + 2}
            width={tileW - 4} height={tileH - 4}
            fill="rgba(232,160,48,0.45)" stroke="rgba(232,160,48,0.85)" strokeWidth={2}
          />
        )}

        {/* Path lines for queued moves */}
        {moveActions.map(action => {
          const piece = G.pieces.find(p => p.id === action.pieceId);
          if (!piece) return null;
          return (
            <line key={action.pieceId + '-path'}
              x1={piece.col * tileW + tileW / 2}
              y1={piece.row * tileH + tileH / 2}
              x2={action.toCol * tileW + tileW / 2}
              y2={action.toRow * tileH + tileH / 2}
              stroke="rgba(232,160,48,0.7)" strokeWidth={1.5} strokeDasharray="5 3" />
          );
        })}
      </svg>

      {/* ── Tile grid ── */}
      <div className="tile-grid" style={{
        position: 'absolute', top: 0, left: 0,
        width: courtWidth, height: courtHeight,
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, ${tileW}px)`,
        gridTemplateRows: `repeat(${ROWS}, ${tileH}px)`,
      }}>
        {Array.from({ length: ROWS }, (_, row) =>
          Array.from({ length: COLS }, (_, col) => {
            const zone       = getTileZone(col, row);
            const tint       = ZONE_TINTS[zone] || 'transparent';
            const moveInfo   = validMoves.find(m => m.col === col && m.row === row);
            const isValid    = !!moveInfo;
            const isBurst    = moveInfo && moveInfo.dist > 1;
            return (
              <div
                key={`${col}-${row}`}
                className={`tile ${isValid ? 'tile-valid' : ''} ${isBurst ? 'tile-burst' : ''}`}
                style={{ background: tint }}
                onClick={() => handleTileClick(col, row)}
              />
            );
          })
        )}
      </div>

      {/* ── Ghost pieces (planned destinations) ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
        {moveActions.map((action, idx) => {
          const x = action.toCol * tileW + tileW / 2;
          const y = action.toRow * tileH + tileH / 2;
          return (
            <div key={action.pieceId + '-ghost'} style={{
              position: 'absolute',
              left: x - 13, top: y - 13,
              width: 26, height: 26,
              borderRadius: '50%',
              background: 'rgba(232,160,48,0.22)',
              border: '2px dashed rgba(232,160,48,0.75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 'bold',
              fontFamily: '"Courier New", monospace',
              color: 'rgba(232,160,48,0.9)',
              zIndex: 3,
            }}>
              {idx + 1}
            </div>
          );
        })}
      </div>

      {/* ── Pieces layer ── */}
      <div className="pieces-layer" style={{
        position: 'absolute', top: 0, left: 0,
        width: courtWidth, height: courtHeight,
        pointerEvents: 'none',
      }}>
        {sortedPieces.map(piece => (
          <Piece
            key={piece.id}
            piece={piece}
            tileW={tileW}
            tileH={tileH}
            isSelected={G.selectedPieceId === piece.id}
            isBallCarrier={G.ballCarrierId === piece.id}
            hasQueuedMove={moveActions.some(a => a.pieceId === piece.id)}
            onClick={() => {
              if (piece.role === 'offense') moves.selectPiece(piece.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}
