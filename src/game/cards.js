// ── Offensive cards ───────────────────────────────────────────────────────────
export const CARD_LIBRARY = [
  {
    id: 'playmaker',
    name: 'Playmaker',
    stars: 2,
    eligible: ['small', 'medium', 'large'],
    description: 'All passes cost 1 clock',
    effect: { free_passes: true },
  },
  {
    id: 'shooter',
    name: 'Sharpshooter',
    stars: 2,
    eligible: ['small', 'medium', 'large'],
    description: 'Best threshold on any perimeter shot',
    effect: { remove_perimeter_penalty: true },
  },
  {
    id: 'wing_shooter',
    name: 'Wing Shooter',
    stars: 1,
    eligible: ['large'],
    description: 'Big uses Medium thresholds on Wing/Corner',
    effect: { perimeter_upgrade: 'medium' },
  },
  {
    id: 'paint_beast',
    name: 'Paint Beast',
    stars: 2,
    eligible: ['small'],
    description: '+1 die in paint when not contested; ignores paint vulnerability',
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
    eligible: ['large'],
    description: 'Passes from paint or elbow always cost 1 clock',
    effect: { safe_paint_pass: true },
  },
  {
    id: 'post_up',
    name: 'Post Up',
    stars: 1,
    eligible: ['small', 'medium'],
    description: 'Screens by this player are harder for defenders to navigate',
    effect: { post_up: true },
  },
  {
    id: 'screen_wall',
    name: 'Screen Wall',
    stars: 2,
    eligible: ['medium'],
    description: 'Screens displace the screened defender further',
    effect: { screen_wall: true },
  },
  {
    id: 'first_step',
    name: 'First Step',
    stars: 2,
    eligible: ['medium'],
    description: 'Speed 2 — move 2 tiles per action',
    effect: { speed_boost: true },
  },
  {
    id: 'ball_handler',
    name: 'Ball Handler',
    stars: 1,
    eligible: ['medium'],
    description: 'Can start possession with the ball',
    effect: { can_start_ball: true },
  },
  {
    id: 'post_threat',
    name: 'Post Threat',
    stars: 1,
    eligible: ['small'],
    description: 'Guard uses Large thresholds in elbow/paint',
    effect: { post_threat: true },
  },
  {
    id: 'mobile_big',
    name: 'Mobile Big',
    stars: 2,
    eligible: ['large'],
    description: 'Big gets speed 2 — move 2 tiles per action',
    effect: { speed_boost: true },
  },
  {
    id: 'mismatch_hunter',
    name: 'Mismatch Hunter',
    stars: 3,
    eligible: ['small'],
    description: 'Once per possession: free 2-tile burst when guarded by a Large',
    effect: { mismatch_burst: true },
  },
];

// ── Defensive cards (CPU only) ────────────────────────────────────────────────
export const DEF_CARDS = [
  {
    id: 'rim_anchor',
    name: 'Rim Anchor',
    stars: 2,
    eligible: ['medium', 'large'],
    description: 'Paint shots: threshold +1',
    effect: { rim_anchor: true },
  },
  {
    id: 'enforcer',
    name: 'Enforcer',
    stars: 3,
    eligible: ['large'],
    description: 'Negates attacker size advantage; paint threshold +1',
    effect: { enforcer: true },
  },
  {
    id: 'perimeter_defender',
    name: 'Perimeter Defender',
    stars: 2,
    eligible: ['medium', 'large'],
    description: 'Wing/corner shots: attacker loses 1 die',
    effect: { perimeter_defender: true },
  },
  {
    id: 'lockdown',
    name: 'Lockdown',
    stars: 2,
    eligible: ['small', 'medium'],
    description: 'Nearest man always loses 1 die',
    effect: { lockdown: true },
  },
  {
    id: 'zone_dropper',
    name: 'Zone Dropper',
    stars: 1,
    eligible: ['medium', 'large'],
    description: 'Threshold +1 for shots within 2 tiles of this defender',
    effect: { zone_dropper: true },
  },
  {
    id: 'hard_close',
    name: 'Hard Close',
    stars: 2,
    eligible: ['small', 'medium', 'large'],
    description: 'Extends contest range: contested at dist ≤ 2',
    effect: { hard_close: true },
  },
];

export function rollCard() {
  const idx = Math.floor(Math.random() * CARD_LIBRARY.length);
  return CARD_LIBRARY[idx];
}

export function generateCPUCards(cpuRoster, difficulty) {
  const result = cpuRoster.map(d => ({ ...d, card: null }));

  if (difficulty === 'rookie') return result;

  if (difficulty === 'legend') {
    // Fixed cards: Enforcer + Perimeter Defender + Lockdown + 1 random
    const fixed = ['enforcer', 'perimeter_defender', 'lockdown']
      .map(id => DEF_CARDS.find(c => c.id === id))
      .filter(Boolean);

    const assigned = new Set();

    fixed.forEach(card => {
      const idx = result.findIndex((d, i) =>
        !assigned.has(i) && card.eligible.includes(d.size)
      );
      if (idx >= 0) {
        result[idx] = { ...result[idx], card };
        assigned.add(idx);
      }
    });

    // 1 random from remaining def cards
    const remainingCards = DEF_CARDS.filter(
      c => !['enforcer', 'perimeter_defender', 'lockdown'].includes(c.id)
    );
    const unassignedIdx = result.findIndex((_, i) => !assigned.has(i));
    if (unassignedIdx >= 0 && remainingCards.length) {
      const eligible = remainingCards.filter(
        c => c.eligible.includes(result[unassignedIdx].size)
      );
      if (eligible.length) {
        result[unassignedIdx] = {
          ...result[unassignedIdx],
          card: eligible[Math.floor(Math.random() * eligible.length)],
        };
      }
    }

    return result;
  }

  // Pro: 1, Allstar: 2, HOF: 3
  const counts = { pro: 1, allstar: 2, hof: 3 };
  const count = counts[difficulty] || 0;

  return result.map((defender, i) => {
    if (i >= count) return defender;
    const eligible = DEF_CARDS.filter(c => c.eligible.includes(defender.size));
    if (!eligible.length) return defender;
    return {
      ...defender,
      card: eligible[Math.floor(Math.random() * eligible.length)],
    };
  });
}
