export const CARD_LIBRARY = [
  {
    id: 'playmaker',
    name: 'Playmaker',
    stars: 2,
    eligible: ['small', 'medium'],
    description: 'All passes cost 1 AP',
    effect: { free_passes: true },
  },
  {
    id: 'shooter',
    name: 'Sharpshooter',
    stars: 2,
    eligible: ['small', 'medium'],
    description: 'Best threshold on any perimeter shot',
    effect: { remove_perimeter_penalty: true },
  },
  {
    id: 'wing_shooter',
    name: 'Wing Shooter',
    stars: 1,
    eligible: ['small', 'medium'],
    description: 'Medium threshold on perimeter shots',
    effect: { perimeter_upgrade: 'medium' },
  },
  {
    id: 'paint_beast',
    name: 'Paint Beast',
    stars: 2,
    eligible: ['large', 'medium'],
    description: '+1 die in paint when not contested',
    effect: { paint_bonus: true },
  },
  {
    id: 'positionless',
    name: 'Positionless',
    stars: 3,
    eligible: ['small', 'medium', 'large'],
    description: 'Always uses Small player thresholds',
    effect: { no_size_rules: true },
  },
  {
    id: 'lob_finisher',
    name: 'Lob Finisher',
    stars: 2,
    eligible: ['large', 'medium'],
    description: 'Auto wide-open in paint after pass of 3+ tiles',
    effect: { lob_auto_open: true },
  },
  {
    id: 'high_low',
    name: 'High-Low Passer',
    stars: 1,
    eligible: ['large', 'medium'],
    description: 'Passes from paint or elbow always cost 1 AP',
    effect: { safe_paint_pass: true },
  },
  {
    id: 'lockdown',
    name: 'Lockdown',
    stars: 2,
    eligible: ['small', 'medium', 'large'],
    description: 'No closeout penalty for Large defenders',
    effect: { remove_closeout_penalty: true },
  },
];

export function rollCard() {
  const idx = Math.floor(Math.random() * CARD_LIBRARY.length);
  return CARD_LIBRARY[idx];
}

export function generateCPUCards(cpuRoster, difficulty) {
  const counts = { rookie: 0, pro: 1, allstar: 1, hof: 2, legend: 2 };
  const count = counts[difficulty] || 0;

  return cpuRoster.map((defender, i) => {
    if (i >= count) return { ...defender, card: null };
    const eligible = CARD_LIBRARY.filter(c => c.eligible.includes(defender.size));
    if (!eligible.length) return { ...defender, card: null };
    const card = eligible[Math.floor(Math.random() * eligible.length)];
    return { ...defender, card };
  });
}
