import { chebyshev } from './constants';

export function resolveScreens(pieces, preMoveDef, screeners, cpuScheme) {
  if (screeners.length === 0 || cpuScheme === 'zone') return pieces;

  const result = pieces.map(p => ({ ...p }));

  screeners.forEach(screenerId => {
    const screener = result.find(p => p.id === screenerId);
    if (!screener) return;

    result
      .filter(p => p.role === 'defense')
      .forEach(def => {
        if (def.manAssignment !== screenerId) return;
        const preDef = preMoveDef.find(d => d.id === def.id);
        if (!preDef) return;

        if (chebyshev(def, screener) <= 1) {
          def.col = preDef.col;
          def.row = preDef.row;
          def.wasScreened = true;
        }
      });
  });

  return result;
}

export function applyHedge(committedMoves, G, actionQueue) {
  if (!['hof', 'legend'].includes(G.difficulty)) return committedMoves;

  const hasScreen   = actionQueue.some(a => a.type === 'screen');
  const ballCarrier = G.pieces.find(p => p.id === G.ballCarrierId);
  if (!hasScreen || !ballCarrier) return committedMoves;

  const result  = committedMoves.map(m => ({ ...m }));
  const ballDef = G.pieces.find(
    p => p.role === 'defense' && p.manAssignment === G.ballCarrierId
  );
  if (!ballDef) return result;

  const hedgeMove = result.find(m => m.defenderId === ballDef.id);
  if (hedgeMove) {
    hedgeMove.toCol = ballCarrier.col;
    hedgeMove.toRow = Math.min(13, ballCarrier.row + 3);
  }
  return result;
}
