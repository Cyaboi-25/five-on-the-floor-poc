import { chebyshev, getTileZone, PAINT_ZONES, COLS, ROWS } from './constants';

export const ZONE_TERRITORIES = {
  d0: ['corner_l', 'wing_l'],
  d1: ['corner_r', 'wing_r'],
  d2: ['tok', 'half'],
  d3: ['elbow_l', 'dunker_l'],
  d4: ['paint', 'elbow_r', 'dunker_r'],
};

export function cpuCommit(G) {
  const defenders   = G.pieces.filter(p => p.role === 'defense');
  const offPlayers  = G.pieces.filter(p => p.role === 'offense');
  const ballCarrier = offPlayers.find(p => p.id === G.ballCarrierId);
  const scheme      = G.cpuScheme;
  const diff        = G.difficulty;

  if (scheme === 'zone') {
    return commitZone(defenders, offPlayers, ballCarrier, diff, G);
  }
  return commitMan(defenders, offPlayers, ballCarrier, diff, G);
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function step1(def, target) {
  return {
    toCol: clamp(def.col + Math.sign(target.col - def.col), 0, COLS - 1),
    toRow: clamp(def.row + Math.sign(target.row - def.row), 0, ROWS - 1),
  };
}

function commitMan(defenders, offPlayers, ballCarrier, diff, G) {
  return defenders.map(def => {
    const target = offPlayers.find(p => p.id === def.manAssignment);
    let toCol = def.col;
    let toRow  = def.row;

    if (!target) return { defenderId: def.id, toCol, toRow };

    if (diff === 'rookie' || diff === 'pro') {
      ({ toCol, toRow } = step1(def, target));
    }

    if (diff === 'allstar') {
      if (def.id === 'd4' && ballCarrier &&
          PAINT_ZONES.includes(getTileZone(ballCarrier.col, ballCarrier.row))) {
        toCol = 7; toRow = 10;
      } else {
        ({ toCol, toRow } = step1(def, target));
      }
    }

    if (diff === 'hof') {
      const anticipated = anticipateTarget(target, ballCarrier);
      ({ toCol, toRow } = step1(def, anticipated));
    }

    if (diff === 'legend') {
      const legendTarget = legendAnticipate(def, target, ballCarrier, G);
      ({ toCol, toRow } = step1(def, legendTarget));
    }

    return { defenderId: def.id, toCol, toRow };
  });
}

function commitZone(defenders, offPlayers, ballCarrier, diff, G) {
  return defenders.map(def => {
    const myZones = ZONE_TERRITORIES[def.id] || [];
    let toCol = def.col;
    let toRow  = def.row;

    const threats = offPlayers.filter(p =>
      myZones.includes(getTileZone(p.col, p.row))
    );

    const moveTarget = threats.length > 0
      ? threats.reduce((a, b) => chebyshev(def, a) < chebyshev(def, b) ? a : b)
      : getZoneCenter(myZones[0]);

    ({ toCol, toRow } = step1(def, moveTarget));

    if (['hof', 'legend'].includes(diff) && ballCarrier) {
      const ballSide = ballCarrier.col < 8 ? -1 : 1;
      toCol = clamp(toCol + ballSide, 0, COLS - 1);
    }

    return { defenderId: def.id, toCol, toRow };
  });
}

export function chooseCPUScheme(G) {
  const diff    = G.difficulty;
  const history = G.playHistory || [];

  if (diff === 'rookie') return 'man';

  if (diff === 'pro') return Math.random() < 0.7 ? 'man' : 'zone';

  if (diff === 'allstar') {
    const last = history[history.length - 1];
    if (!last) return 'man';
    if (last.scored && last.usedScreen) return 'zone';
    if (last.scored && last.shotZone?.includes('corner')) return 'man';
    return G.cpuScheme || 'man';
  }

  if (diff === 'hof') {
    const lastTwo = history.slice(-2);
    if (lastTwo.length === 2 && lastTwo.every(h => h.scored)) {
      return G.cpuScheme === 'man' ? 'zone' : 'man';
    }
    return G.cpuScheme || 'man';
  }

  if (diff === 'legend') {
    if (history.length >= 3) return 'zone';
    return 'man';
  }

  return 'man';
}

export function applyHedge(committedMoves, G, actionQueue) {
  if (!['hof', 'legend'].includes(G.difficulty)) return committedMoves;

  const hasScreen   = actionQueue.some(a => a.type === 'screen');
  const ballCarrier = G.pieces.find(p => p.id === G.ballCarrierId);
  if (!hasScreen || !ballCarrier) return committedMoves;

  const result   = committedMoves.map(m => ({ ...m }));
  const ballDef  = G.pieces.find(
    p => p.role === 'defense' && p.manAssignment === G.ballCarrierId
  );
  if (!ballDef) return result;

  const hedgeMove = result.find(m => m.defenderId === ballDef.id);
  if (hedgeMove) {
    hedgeMove.toCol = ballCarrier.col;
    hedgeMove.toRow = clamp(ballCarrier.row + 3, 0, ROWS - 1);
  }
  return result;
}

function getZoneCenter(zone) {
  const centers = {
    paint:    { col: 7,  row: 10 },
    dunker_l: { col: 3,  row: 11 },
    dunker_r: { col: 12, row: 11 },
    elbow_l:  { col: 4,  row: 5  },
    elbow_r:  { col: 11, row: 5  },
    corner_l: { col: 1,  row: 9  },
    corner_r: { col: 14, row: 9  },
    wing_l:   { col: 2,  row: 3  },
    wing_r:   { col: 13, row: 3  },
    tok:      { col: 7,  row: 3  },
    half:     { col: 7,  row: 0  },
  };
  return centers[zone] || { col: 7, row: 7 };
}

function anticipateTarget(target, ballCarrier) {
  if (!ballCarrier) return target;
  if (target.row < ballCarrier.row) {
    return { col: target.col, row: Math.min(ROWS - 1, target.row + 2) };
  }
  return target;
}

function legendAnticipate(defender, target, ballCarrier, G) {
  const history = G.playHistory || [];
  if (history.length < 3) return target;
  const drivesRight = history.filter(h => h.driveDirection === 'right').length;
  const drivesLeft  = history.filter(h => h.driveDirection === 'left').length;
  if (drivesRight > drivesLeft * 2) {
    return { col: clamp(target.col + 2, 0, COLS - 1), row: target.row };
  }
  return target;
}
