import { chebyshev, getTileZone, PAINT_ZONES, COLS, ROWS, BASKET } from './constants';

export const ZONE_TERRITORIES = {
  d0: ['corner_l', 'wing_l'],
  d1: ['corner_r', 'wing_r'],
  d2: ['tok', 'half'],
  d3: ['elbow_l', 'dunker_l'],
  d4: ['paint', 'elbow_r', 'dunker_r'],
};

const DIFF_ORDER = ['rookie', 'pro', 'allstar', 'hof', 'legend'];

// DDA: secretly adjusts effective difficulty based on scoring streaks
function getDDADifficulty(G) {
  const diff     = G.difficulty;
  const streak   = G.playerScoreStreak   || 0;
  const scoreless = G.playerScorelessStreak || 0;
  const idx = DIFF_ORDER.indexOf(diff);

  // Hot streak on easy/mid difficulties → CPU tightens up one tier
  if (streak >= 3 && idx <= 2) return DIFF_ORDER[Math.min(idx + 1, 4)];

  // Cold streak on hard difficulties → CPU eases off one tier (pity)
  if (scoreless >= 2 && idx >= 3) return DIFF_ORDER[Math.max(idx - 1, 0)];

  return diff;
}

// Position defender 40% of the way between their man and the basket
// Forces them to front/shade instead of sitting on the man
function denialPosition(target) {
  return {
    col: Math.round(target.col * 0.6 + BASKET.col * 0.4),
    row: Math.round(target.row * 0.6 + BASKET.row * 0.4),
  };
}

// d4 (free helper): cut the passing lane to the most dangerous receiver
function passingLaneDenial(ballCarrier, offPlayers) {
  if (!ballCarrier) return { col: 7, row: 10 };
  const receivers = offPlayers.filter(p => p.id !== ballCarrier.id);
  if (receivers.length === 0) return { col: 7, row: 10 };
  // Most dangerous = deepest toward basket (highest row)
  const hotspot = receivers.reduce((best, p) => p.row > best.row ? p : best, receivers[0]);
  return {
    col: Math.round((ballCarrier.col + hotspot.col) / 2),
    row: Math.round((ballCarrier.row + hotspot.row) / 2),
  };
}

export function cpuCommit(G) {
  const defenders   = G.pieces.filter(p => p.role === 'defense');
  const offPlayers  = G.pieces.filter(p => p.role === 'offense');
  const ballCarrier = offPlayers.find(p => p.id === G.ballCarrierId);
  const scheme      = G.cpuScheme;
  const diff        = getDDADifficulty(G);

  if (scheme === 'zone') return commitZone(defenders, offPlayers, ballCarrier, diff, G);
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
  const ballInPaint = ballCarrier &&
    PAINT_ZONES.includes(getTileZone(ballCarrier.col, ballCarrier.row));
  const paintCenter = { col: 7, row: 10 };

  return defenders.map(def => {
    const target    = offPlayers.find(p => p.id === def.manAssignment);
    const isBallDef = target && def.manAssignment === G.ballCarrierId;

    // d4: free helper with no man assignment
    if (!target) {
      let toCol = def.col;
      let toRow = def.row;

      if (ballInPaint) {
        // Always collapse toward paint when ball is there
        ({ toCol, toRow } = step1(def, paintCenter));
      } else if (['allstar', 'hof', 'legend'].includes(diff) && ballCarrier) {
        // Cut the most dangerous passing lane
        ({ toCol, toRow } = step1(def, passingLaneDenial(ballCarrier, offPlayers)));
      }
      return { defenderId: def.id, toCol, toRow };
    }

    let toCol = def.col;
    let toRow = def.row;

    if (diff === 'rookie') {
      // Rookies: straight man-follow, no tactics
      ({ toCol, toRow } = step1(def, target));

    } else if (diff === 'pro') {
      // Pro: ball defender chases; off-ball shades toward basket (denial)
      ({ toCol, toRow } = step1(def, isBallDef ? target : denialPosition(target)));

    } else if (diff === 'allstar') {
      // Allstar: denial stance + paint collapse for off-ball
      if (isBallDef) {
        ({ toCol, toRow } = step1(def, target));
      } else {
        const denial = denialPosition(target);
        if (ballInPaint) {
          // Collapse halfway between denial spot and paint center
          ({ toCol, toRow } = step1(def, {
            col: Math.round((denial.col + paintCenter.col) / 2),
            row: Math.round((denial.row + paintCenter.row) / 2),
          }));
        } else {
          ({ toCol, toRow } = step1(def, denial));
        }
      }

    } else if (diff === 'hof') {
      // HOF: anticipate where the man is going, apply denial to off-ball
      const anticipated = anticipateTarget(target, ballCarrier);
      ({ toCol, toRow } = step1(def, isBallDef ? anticipated : denialPosition(anticipated)));

    } else if (diff === 'legend') {
      // Legend: full pattern read, denial on all off-ball
      const legendTgt = legendAnticipate(def, target, ballCarrier, G);
      ({ toCol, toRow } = step1(def, isBallDef ? legendTgt : denialPosition(legendTgt)));
    }

    // HOF+: sag off far men — if assigned man is 5+ tiles from ball, cheat toward paint
    if (['hof', 'legend'].includes(diff) && !isBallDef && target && ballCarrier) {
      const manToBall = chebyshev(target, ballCarrier);
      if (manToBall >= 5) {
        ({ toCol, toRow } = step1({ col: toCol, row: toRow }, paintCenter));
      }
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

  if (diff === 'rookie') return { scheme: 'man', reason: '' };

  if (diff === 'pro') {
    if (Math.random() < 0.7) return { scheme: 'man', reason: '' };
    return { scheme: 'zone', reason: 'mixing in zone' };
  }

  if (diff === 'allstar') {
    const last = history[history.length - 1];
    if (!last) return { scheme: 'man', reason: '' };
    if (last.scored && last.usedScreen)
      return { scheme: 'zone', reason: 'switching to zone — screen threat' };
    if (last.scored && last.shotZone?.includes('corner'))
      return { scheme: 'man', reason: 'doubling corner pressure' };
    return { scheme: G.cpuScheme || 'man', reason: '' };
  }

  if (diff === 'hof') {
    const lastTwo = history.slice(-2);
    if (lastTwo.length === 2 && lastTwo.every(h => h.scored)) {
      const next = G.cpuScheme === 'man' ? 'zone' : 'man';
      return { scheme: next, reason: 'adjusting after 2 straight scores' };
    }
    return { scheme: G.cpuScheme || 'man', reason: 'reading your tendencies' };
  }

  if (diff === 'legend') {
    if (history.length >= 3) return { scheme: 'zone', reason: 'lockdown zone' };
    return { scheme: 'man', reason: 'tight man coverage' };
  }

  return { scheme: 'man', reason: '' };
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
