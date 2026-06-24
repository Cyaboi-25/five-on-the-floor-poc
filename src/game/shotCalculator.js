import {
  THRESHOLDS, PAINT_ZONES, PERIMETER_ZONES,
  getTileZone, getShotProbability, getShotQualityLabel, BASKET, chebyshev
} from './constants';

export function calculateShot(shooter, defenders, G) {
  const zone = getTileZone(shooter.col, shooter.row);
  const zoneData = THRESHOLDS[zone] || THRESHOLDS.half;
  const sizeIdx = { small: 0, medium: 1, large: 2 }[shooter.size] ?? 0;
  const points = zoneData[3];
  const modifiers = [];

  let threshold = zoneData[sizeIdx];

  if (shooter.card?.effect?.no_size_rules) {
    threshold = zoneData[0];
    modifiers.push('Positionless — Small thresholds');
  }
  // post_threat: small guard uses Large (index 2) thresholds in paint/elbow
  if (shooter.card?.effect?.post_threat && PAINT_ZONES.includes(zone)) {
    threshold = zoneData[2];
    modifiers.push('Post Threat — Large thresholds in paint');
  }
  if (shooter.card?.effect?.remove_perimeter_penalty && PERIMETER_ZONES.includes(zone)) {
    const best = Math.min(zoneData[0], zoneData[1], zoneData[2]);
    if (best < threshold) {
      threshold = best;
      modifiers.push('Shooter card — best threshold');
    }
  }
  if (shooter.card?.effect?.perimeter_upgrade === 'medium' && PERIMETER_ZONES.includes(zone)) {
    if (zoneData[1] < threshold) {
      threshold = zoneData[1];
      modifiers.push('Wing Shooter — Medium threshold');
    }
  }

  let nearestDist = 99;
  let nearest = null;
  defenders.forEach(d => {
    const dist = chebyshev(d, shooter);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = d;
    }
  });

  // hard_close card extends contest range to dist ≤ 2
  const contestDist = nearest?.card?.effect?.hard_close ? 2 : 1;

  let coverage;
  if (nearestDist <= contestDist) coverage = 'contested';
  else if (nearestDist <= 3) coverage = 'open';
  else coverage = 'wide_open';

  let dice = { contested: 1, open: 2, wide_open: 3 }[coverage];

  let positioning = 'lateral';
  if (nearest) {
    const sDist = chebyshev(shooter, BASKET);
    const dDist = chebyshev(nearest, BASKET);
    if (dDist > sDist + 1) {
      positioning = 'behind';
      dice += 1;
      modifiers.push('+ Defender behind you (+1 die)');
    } else if (dDist < sDist - 1) {
      positioning = 'between';
      dice = Math.max(dice - 1, 1);
      modifiers.push('- Defender in shooting lane (-1 die)');
      if (coverage === 'contested') {
        threshold += 1;
        modifiers.push('- Lane blocked (threshold +1)');
      }
    }
  }

  if (nearest) {
    if (nearest.size === 'large' && shooter.size === 'small' &&
        PERIMETER_ZONES.includes(zone) &&
        !nearest.card?.effect?.remove_closeout_penalty) {
      dice = Math.max(dice, 2);
      modifiers.push("+ Large can't close out (min 2 dice)");
    }
    if (nearest.size === 'small' && shooter.size === 'large' && !nearest.card?.effect?.enforcer) {
      threshold = Math.max(threshold - 1, 3);
      modifiers.push('+ Easier over small defender (threshold -1)');
    }
  }

  // ── Defensive card effects ──────────────────────────────────────────
  if (nearest) {
    // lockdown: nearest man always costs attacker 1 die
    if (nearest.card?.effect?.lockdown) {
      dice = Math.max(dice - 1, 1);
      modifiers.push('- Lockdown defender (-1 die)');
    }

    // rim_anchor: paint shots threshold +1
    if (nearest.card?.effect?.rim_anchor && PAINT_ZONES.includes(zone)) {
      threshold += 1;
      modifiers.push('- Rim Anchor (threshold +1)');
    }

    // enforcer: paint threshold +1 AND negates large-over-small threshold bonus
    if (nearest.card?.effect?.enforcer) {
      if (PAINT_ZONES.includes(zone)) {
        threshold += 1;
        modifiers.push('- Enforcer (threshold +1)');
      }
      // Negates size advantage (small def on large shooter threshold reduction)
      // — handled by skipping that modifier, flagged on the enforcer itself
    }

    // perimeter_defender: wing/corner shots lose 1 die
    if (nearest.card?.effect?.perimeter_defender && PERIMETER_ZONES.includes(zone)) {
      dice = Math.max(dice - 1, 1);
      modifiers.push('- Perimeter Defender (-1 die)');
    }
  }

  // zone_dropper: any defender within 2 tiles adds threshold +1
  const hasZoneDropper = defenders.some(
    d => d.card?.effect?.zone_dropper && chebyshev(d, shooter) <= 2
  );
  if (hasZoneDropper) {
    threshold += 1;
    modifiers.push('- Zone Dropper (threshold +1)');
  }

  if (PAINT_ZONES.includes(zone)) {
    if (shooter.size === 'large') {
      dice += 1;
      modifiers.push('+ Paint bonus — Large (+1 die)');
    } else if (shooter.card?.effect?.paint_bonus && coverage !== 'contested') {
      dice += 1;
      modifiers.push('+ Paint Beast card (+1 die)');
    }
  }

  if (PAINT_ZONES.includes(zone) && shooter.card?.effect?.lob_auto_open && G.lastPassDistance >= 3) {
    dice = 3;
    modifiers.push('+ Lob Finisher — auto Wide Open');
  }

  if (G.momentum >= 2) {
    dice += 1;
    modifiers.push('+ Momentum (+1 die)');
  }

  if (G.clock <= 6) {
    dice = Math.max(dice - 1, 1);
    modifiers.push('- Clock pressure (-1 die)');
  }

  dice = Math.min(dice, 5);

  const probability = getShotProbability(dice, threshold);
  const quality = getShotQualityLabel(probability);

  // Override DESPERATION label for non-contested shots (wide open / open bad spots)
  if (quality.label === 'DESPERATION') {
    if (coverage === 'wide_open') quality.label = 'LOW % ZONE';
    else if (coverage === 'open')  quality.label = 'BAD SPOT';
  }

  return {
    zone, dice, threshold, points,
    coverage, positioning, probability,
    quality, modifiers, nearestDist,
    shooterId: shooter.id,
  };
}
