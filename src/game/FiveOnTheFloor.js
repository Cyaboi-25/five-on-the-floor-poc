import { INVALID_MOVE } from 'boardgame.io/core';
import { getTileZone, PAINT_ZONES, chebyshev } from './constants';
import { calculateShot } from './shotCalculator';
import { cpuCommit, chooseCPUScheme, applyHedge } from './cpuLogic';
import { resolveScreens } from './screenResolver';

export { chebyshev };

export const FiveOnTheFloor = {
  name: 'FiveOnTheFloor',

  setup: ({ ctx }, setupData) => ({
    difficulty: setupData?.difficulty || 'rookie',
    target: setupData?.target || 10,
    gamePhase: 'menu',

    playerRoster: [],
    cpuRoster: [],

    pieces: [],
    score: 0,
    possession: 0,
    totalPossessions: 10,
    clock: 24,
    ballCarrierId: null,
    selectedPieceId: null,
    momentum: 0,
    lastPossessionWasMake: false,
    lastPassDistance: 0,

    // Per-possession tracking
    mismatchBurstUsed: false,

    // Plan phase
    actionQueue: [],
    cpuCommitted: [],
    isExecuting: false,
    screenersThisTurn: [],
    lastTurnUsedScreen: false,
    ballReversal: false,
    lastPassedRight: false,
    lastPassedLeft: false,

    // CPU scheme
    cpuScheme: 'man',
    cpuSchemeReason: '',
    playHistory: [],

    // DDA streak tracking
    playerScoreStreak: 0,
    playerScorelessStreak: 0,

    // Shot flow
    shotPending: null,
    shotResult: null,
    catchAndShootAvailable: null,
  }),

  moves: {

    // ── SCREEN NAVIGATION ──────────────────────────────────────────

    setDifficulty: {
      move: ({ G }, difficulty, target) => {
        G.difficulty = difficulty;
        G.target = target;
        G.gamePhase = 'lineup';
      },
      noLimit: true,
    },

    setRosters: {
      move: ({ G }, playerRoster, cpuRoster) => {
        G.playerRoster = playerRoster;
        G.cpuRoster = cpuRoster;
        G.gamePhase = 'scout';
      },
      noLimit: true,
    },

    startGame: {
      move: ({ G }) => {
        G.gamePhase = 'playing';
        G.score = 0;
        G.momentum = 0;
        G.possession = 0;
        G.playHistory = [];
        G.cpuScheme = 'man';
        G.cpuSchemeReason = '';
        G.playerScoreStreak = 0;
        G.playerScorelessStreak = 0;
        startNewPossession(G);
      },
      noLimit: true,
    },

    returnToMenu: {
      move: ({ G }) => { G.gamePhase = 'menu'; },
      noLimit: true,
    },

    // ── PIECE SELECTION ────────────────────────────────────────────

    selectPiece: {
      move: ({ G }, pieceId) => {
        const piece = G.pieces.find(p => p.id === pieceId);
        if (!piece || piece.role !== 'offense') return INVALID_MOVE;
        G.selectedPieceId = G.selectedPieceId === pieceId ? null : pieceId;
      },
      noLimit: true,
    },

    // ── PLAN PHASE ─────────────────────────────────────────────────

    queueMove: {
      move: ({ G }, pieceId, toCol, toRow) => {
        if (G.actionQueue.some(a => a.type === 'shoot')) return INVALID_MOVE;
        const piece = G.pieces.find(p => p.id === pieceId);
        if (!piece || piece.role !== 'offense') return INVALID_MOVE;
        if (toCol < 0 || toCol > 15 || toRow < 0 || toRow > 13) return INVALID_MOVE;
        const dist = chebyshev(piece, { col: toCol, row: toRow });
        const defenders = G.pieces.filter(p => p.role === 'defense');
        const nearestDefSize = defenders.length
          ? defenders.reduce((best, d) => {
              const dd = chebyshev(d, piece);
              return dd < chebyshev(best, piece) ? d : best;
            }, defenders[0]).size
          : null;
        const burstEligible = piece.card?.effect?.mismatch_burst &&
          !G.mismatchBurstUsed && nearestDefSize === 'large';
        const maxDist = burstEligible ? piece.speed + 2 : piece.speed;
        if (dist < 1 || dist > maxDist) return INVALID_MOVE;
        if (burstEligible && dist > piece.speed) G.mismatchBurstUsed = true;

        G.actionQueue = G.actionQueue.filter(
          a => !(a.type === 'move' && a.pieceId === pieceId)
        );
        G.actionQueue.push({ type: 'move', pieceId, toCol, toRow });
        G.selectedPieceId = null;
      },
      noLimit: true,
    },

    queueSpecialAction: {
      move: ({ G }, action) => {
        G.actionQueue = G.actionQueue.filter(
          a => !['pass', 'screen', 'shoot', 'hold'].includes(a.type)
        );
        G.actionQueue.push(action);
        G.selectedPieceId = null;
      },
      noLimit: true,
    },

    undoLastAction: {
      move: ({ G }) => {
        G.actionQueue.pop();
      },
      noLimit: true,
    },

    clearQueue: {
      move: ({ G }) => {
        G.actionQueue = [];
        G.selectedPieceId = null;
      },
      noLimit: true,
    },

    // ── EXECUTE ────────────────────────────────────────────────────

    execute: {
      move: ({ G }) => {
        if (G.actionQueue.length === 0) return INVALID_MOVE;

        // Clear last-turn state
        G.ballReversal = false;
        G.lastPassedRight = false;
        G.lastPassedLeft = false;

        // SHOOT as first action → open shot preview and exit
        const firstAction = G.actionQueue[0];
        if (firstAction?.type === 'shoot') {
          const shooter = G.pieces.find(p => p.id === G.ballCarrierId);
          if (!shooter) return INVALID_MOVE;
          const defenders = G.pieces.filter(p => p.role === 'defense');
          G.shotPending = calculateShot(shooter, defenders, G);
          G.actionQueue = [];
          G.selectedPieceId = null;
          return;
        }

        // ── Step 1: CPU commits blind ──
        let cpuMoves = cpuCommit(G);
        const screensQueued = G.actionQueue
          .filter(a => a.type === 'screen')
          .map(a => a.pieceId);
        if (screensQueued.length > 0) {
          cpuMoves = applyHedge(cpuMoves, G, G.actionQueue);
        }
        G.cpuCommitted = cpuMoves;

        // ── Step 2: Save pre-move defender positions ──
        const preMoveDef = G.pieces
          .filter(p => p.role === 'defense')
          .map(p => ({ id: p.id, col: p.col, row: p.row }));

        // ── Step 3: Apply offensive movements ──
        G.actionQueue.filter(a => a.type === 'move').forEach(action => {
          const piece = G.pieces.find(p => p.id === action.pieceId);
          if (!piece) return;
          if (!piece.trail) piece.trail = [];
          piece.trail.push({ col: piece.col, row: piece.row });
          if (piece.trail.length > 6) piece.trail.shift();
          piece.col = action.toCol;
          piece.row = action.toRow;
          const zone = getTileZone(action.toCol, action.toRow);
          piece.paintTurns = PAINT_ZONES.includes(zone)
            ? (piece.paintTurns || 0) + 1
            : 0;
        });

        // ── Step 4: Apply special action ──
        const special = G.actionQueue.find(
          a => ['pass', 'screen', 'hold'].includes(a.type)
        );
        let clockCost = 1;
        G.screenersThisTurn = [];
        G.lastTurnUsedScreen = false;
        G.catchAndShootAvailable = null;

        if (special) {
          if (special.type === 'pass') {
            const passer   = G.pieces.find(p => p.id === G.ballCarrierId);
            const receiver = G.pieces.find(p => p.id === special.receiverId);
            if (passer && receiver) {
              G.lastPassDistance = chebyshev(passer, receiver);
              clockCost = getPassCost(G, passer, receiver);

              // Ball reversal
              if (
                (passer.col < 8 && receiver.col >= 8) ||
                (passer.col >= 8 && receiver.col < 8)
              ) {
                G.ballReversal = true;
              }

              G.lastPassedRight = receiver.col > passer.col;
              G.lastPassedLeft  = receiver.col < passer.col;

              G.ballCarrierId = receiver.id;

              // Catch & shoot: receiver didn't move this turn
              const receiverMoved = G.actionQueue.some(
                a => a.type === 'move' && a.pieceId === receiver.id
              );
              if (!receiverMoved) {
                const nearestDist = getNearestDefenderDist(G, receiver);
                if (nearestDist >= 4) {
                  G.catchAndShootAvailable = receiver.id;
                }
              }
            }
          }

          if (special.type === 'screen') {
            G.screenersThisTurn = [special.pieceId];
            G.lastTurnUsedScreen = true;
            clockCost = 2;
          }

          if (special.type === 'hold') {
            clockCost = 1;
          }
        }

        // ── Step 5: Apply CPU movements ──
        cpuMoves.forEach(move => {
          const def = G.pieces.find(p => p.id === move.defenderId);
          if (!def) return;
          if (!def.trail) def.trail = [];
          def.trail.push({ col: def.col, row: def.row });
          if (def.trail.length > 6) def.trail.shift();
          def.col = move.toCol;
          def.row = move.toRow;
        });

        // ── Step 6: Resolve screens ──
        if (G.screenersThisTurn.length > 0 && G.cpuScheme === 'man') {
          G.pieces = resolveScreens(
            G.pieces, preMoveDef, G.screenersThisTurn, G.cpuScheme
          );
        }

        // ── Step 7: Deduct clock ──
        G.clock -= clockCost;

        // ── Step 8: Three-second rule ──
        G.pieces.filter(p => p.role === 'offense').forEach(p => {
          if (p.paintTurns >= 3) {
            G.clock -= 3;
            p.paintTurns = 0;
            p.threeSecViolation = true;
          } else {
            p.threeSecViolation = false;
          }
        });

        // ── Step 9: Clear queue ──
        G.actionQueue = [];
        G.screenersThisTurn = [];
        G.selectedPieceId = null;

        // ── Step 10: Clock violation ──
        if (G.clock <= 0) {
          G.shotResult = { violation: true, made: false, rolls: [], points: 0 };
        }
      },
    },

    // ── SHOT FLOW ──────────────────────────────────────────────────

    confirmShot: {
      move: ({ G }) => {
        if (!G.shotPending) return INVALID_MOVE;
        const { dice, threshold, points } = G.shotPending;
        const rolls = Array.from({ length: dice },
          () => Math.floor(Math.random() * 6) + 1
        );
        const made = rolls.some(r => r >= threshold);

        G.shotResult = { ...G.shotPending, rolls, made };
        G.shotPending = null;

        if (made) {
          G.score += points;
          G.lastPossessionWasMake = true;
          G.momentum = Math.min(G.momentum + (points === 3 ? 2 : 1), 2);
          G.playerScoreStreak    = (G.playerScoreStreak    || 0) + 1;
          G.playerScorelessStreak = 0;
        } else {
          G.momentum = Math.max(G.momentum - 1, -2);
          G.lastPossessionWasMake = false;
          G.playerScorelessStreak = (G.playerScorelessStreak || 0) + 1;
          G.playerScoreStreak     = 0;
        }

        G.playHistory.push({
          possession: G.possession,
          scored: made,
          points: made ? points : 0,
          shotZone: G.shotResult.zone,
          usedScreen: G.lastTurnUsedScreen,
          passedRight: G.lastPassedRight,
          passedLeft:  G.lastPassedLeft,
        });
      },
    },

    cancelShot: {
      move: ({ G }) => { G.shotPending = null; },
      noLimit: true,
    },

    catchAndShoot: {
      move: ({ G }) => {
        if (!G.catchAndShootAvailable) return INVALID_MOVE;
        const receiver = G.pieces.find(p => p.id === G.catchAndShootAvailable);
        if (!receiver) return INVALID_MOVE;
        G.ballCarrierId = receiver.id;
        G.catchAndShootAvailable = null;
        const defenders = G.pieces.filter(p => p.role === 'defense');
        G.shotPending = calculateShot(receiver, defenders, G);
      },
    },

    declineCatchAndShoot: {
      move: ({ G }) => { G.catchAndShootAvailable = null; },
      noLimit: true,
    },

    dismissShotResult: {
      move: ({ G }) => {
        G.shotResult = null;
        if (G.score >= G.target) { G.gamePhase = 'result'; return; }
        if (G.possession >= G.totalPossessions) { G.gamePhase = 'result'; return; }
        const { scheme, reason } = chooseCPUScheme(G);
        G.cpuScheme = scheme;
        G.cpuSchemeReason = reason;
        startNewPossession(G);
      },
      noLimit: true,
    },
  },

  endIf: ({ G }) => {
    if (G.gamePhase === 'result') {
      return { won: G.score >= G.target };
    }
  },
};

// ── HELPERS ────────────────────────────────────────────────────────────

function startNewPossession(G) {
  G.possession += 1;
  G.clock = 24;
  G.mismatchBurstUsed = false;
  G.actionQueue = [];
  G.cpuCommitted = [];
  G.screenersThisTurn = [];
  G.lastTurnUsedScreen = false;
  G.shotPending = null;
  G.shotResult = null;
  G.catchAndShootAvailable = null;
  G.lastPassDistance = 0;
  G.ballReversal = false;
  G.lastPassedRight = false;
  G.lastPassedLeft  = false;
  G.selectedPieceId = null;

  const offPos = [
    { col: 8,  row: 0 },
    { col: 2,  row: 3 },
    { col: 8,  row: 3 },
    { col: 13, row: 3 },
    { col: 10, row: 6 },
  ];
  const defPos = [
    { col: 8,  row: 2 },
    { col: 2,  row: 3 },
    { col: 13, row: 3 },
    { col: 5,  row: 6 },
    { col: 10, row: 7 },
  ];
  const manAssignments = { d0: 'o0', d1: 'o1', d2: 'o3', d3: 'o4', d4: null };

  G.pieces = [
    ...G.playerRoster.map((p, i) => ({
      ...p,
      col: offPos[i].col,
      row: offPos[i].row,
      role: 'offense',
      trail: [],
      paintTurns: 0,
      threeSecViolation: false,
      wasScreened: false,
    })),
    ...G.cpuRoster.map((p, i) => ({
      ...p,
      col: defPos[i].col,
      row: defPos[i].row,
      role: 'defense',
      trail: [],
      manAssignment: manAssignments[p.id] ?? null,
      wasScreened: false,
    })),
  ];

  // Apply speed_boost cards and find ball_handler starter
  let ballStarterId = G.playerRoster[0]?.id || 'o0';
  G.pieces.forEach(p => {
    if (p.role !== 'offense') return;
    if (p.card?.effect?.speed_boost) p.speed = 2;
    if (p.card?.effect?.can_start_ball) ballStarterId = p.id;
  });
  G.ballCarrierId = ballStarterId;
  G.mismatchBurstUsed = false;
}

function getPassCost(G, passer, receiver) {
  if (passer.card?.effect?.free_passes) return 1;
  if (passer.card?.effect?.safe_paint_pass) {
    const zone = getTileZone(passer.col, passer.row);
    if (['paint', 'dunker_l', 'dunker_r', 'elbow_l', 'elbow_r'].includes(zone))
      return 1;
  }
  const defenders = G.pieces.filter(p => p.role === 'defense');
  const mid = {
    col: Math.round((passer.col + receiver.col) / 2),
    row: Math.round((passer.row + receiver.row) / 2),
  };
  return defenders.some(
    d => chebyshev(d, passer) <= 2 ||
         chebyshev(d, receiver) <= 2 ||
         chebyshev(d, mid) <= 2
  ) ? 2 : 1;
}

function getNearestDefenderDist(G, piece) {
  const defenders = G.pieces.filter(p => p.role === 'defense');
  return Math.min(...defenders.map(d => chebyshev(d, piece)));
}
