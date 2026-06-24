export const THRESHOLDS = {
  paint:     [4, 4, 4, 2],
  dunker_l:  [4, 5, 4, 2],
  dunker_r:  [4, 5, 4, 2],
  elbow_l:   [5, 5, 6, 2],
  elbow_r:   [5, 5, 6, 2],
  corner_l:  [3, 4, 5, 3],
  corner_r:  [3, 4, 5, 3],
  wing_l:    [4, 5, 6, 3],
  wing_r:    [4, 5, 6, 3],
  tok:       [6, 6, 7, 3],
  half:      [7, 7, 7, 3],
};

export const ZONE_BOUNDS = {
  half:      [0, 15, 0, 1],
  tok:       [5, 10, 2, 4],
  wing_l:    [0, 4,  1, 5],
  wing_r:    [11, 15, 1, 5],
  elbow_l:   [3, 5,  4, 7],
  elbow_r:   [10, 12, 4, 7],
  paint:     [5, 10, 7, 13],
  dunker_l:  [3, 4,  9, 13],
  dunker_r:  [11, 12, 9, 13],
  corner_l:  [0, 2,  5, 13],
  corner_r:  [13, 15, 5, 13],
};

export function getTileZone(col, row) {
  const order = ['paint', 'dunker_l', 'dunker_r', 'corner_l', 'corner_r',
                 'elbow_l', 'elbow_r', 'wing_l', 'wing_r', 'tok', 'half'];
  for (const zone of order) {
    const [c0, c1, r0, r1] = ZONE_BOUNDS[zone];
    if (col >= c0 && col <= c1 && row >= r0 && row <= r1) return zone;
  }
  return 'half';
}

export const PAINT_ZONES = ['paint', 'dunker_l', 'dunker_r'];
export const PERIMETER_ZONES = ['wing_l', 'wing_r', 'corner_l', 'corner_r', 'tok'];

export const SHOT_PROBABILITIES = {
  1: { 3: 67, 4: 50, 5: 33, 6: 17, 7: 0 },
  2: { 3: 89, 4: 75, 5: 56, 6: 31, 7: 0 },
  3: { 3: 96, 4: 88, 5: 70, 6: 42, 7: 0 },
  4: { 3: 98, 4: 94, 5: 80, 6: 52, 7: 0 },
  5: { 3: 99, 4: 97, 5: 87, 6: 60, 7: 0 },
};

export function getShotProbability(dice, threshold) {
  if (threshold >= 7 || dice <= 0) return 0;
  const d = Math.min(Math.max(dice, 1), 5);
  return SHOT_PROBABILITIES[d]?.[threshold] ?? 0;
}

export function getShotQualityLabel(prob) {
  if (prob >= 88) return { label: 'GREAT LOOK',   color: '#3dba6e' };
  if (prob >= 70) return { label: 'GOOD LOOK',    color: '#3dba6e' };
  if (prob >= 50) return { label: 'DECENT LOOK',  color: '#E8A030' };
  if (prob >= 33) return { label: 'TOUGH SHOT',   color: '#E8A030' };
  if (prob >= 17) return { label: 'BAD SHOT',     color: '#e85050' };
  return                   { label: 'DESPERATION', color: '#e85050' };
}

export const ZONE_TINTS = {
  paint:    'rgba(220,70,50,0.14)',
  dunker_l: 'rgba(220,70,50,0.10)',
  dunker_r: 'rgba(220,70,50,0.10)',
  corner_l: 'rgba(61,186,110,0.10)',
  corner_r: 'rgba(61,186,110,0.10)',
  wing_l:   'rgba(74,158,232,0.08)',
  wing_r:   'rgba(74,158,232,0.08)',
  elbow_l:  'rgba(232,160,48,0.08)',
  elbow_r:  'rgba(232,160,48,0.08)',
  tok:      'rgba(140,90,200,0.08)',
  half:     'rgba(100,100,120,0.06)',
};

export const DIFFICULTIES = {
  rookie:  { label: 'ROOKIE',   target: 10, cpuRoster: ['large','large','medium','medium','small'],   cpuCardCount: 1 },
  pro:     { label: 'PRO',      target: 14, cpuRoster: ['large','medium','medium','small','small'],   cpuCardCount: 2 },
  allstar: { label: 'ALL-STAR', target: 18, cpuRoster: null,                                          cpuCardCount: 2 },
  hof:     { label: 'HOF',      target: 21, cpuRoster: ['medium','medium','small','small','large'],   cpuCardCount: 3 },
  legend:  { label: 'LEGEND',   target: 24, cpuRoster: ['medium','medium','small','small','large'],   cpuCardCount: 3 },
};

export const BASKET = { col: 7, row: 13 };
export const COLS = 16;
export const ROWS = 14;

export function chebyshev(a, b) {
  return Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
}

export const COLORS = {
  bg: '#0a0d12',
  surface: '#1a1d27',
  surface2: '#22263a',
  border: 'rgba(255,255,255,0.08)',
  text: '#f0ede6',
  muted: '#8a8799',
  court: '#C8924A',
  offense: '#E8A030',
  defense: '#4A9EE8',
  make: '#3dba6e',
  miss: '#e85050',
  clockSafe: '#3dba6e',
  clockMid: '#E8A030',
  clockDanger: '#e85050',
};
