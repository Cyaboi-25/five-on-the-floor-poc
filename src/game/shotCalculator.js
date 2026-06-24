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

  let coverage;
  if (nearestDist <= 1) coverage = 'contested';
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
    if (nearest.size === 'small' && shooter.size === 'large') {
      threshold = Math.max(threshold - 1, 3);
      modifiers.push('+ Easier over small defender (threshold -1)');
    }
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

  return {
    zone, dice, threshold, points,
    coverage, positioning, probability,
    quality, modifiers, nearestDist,
    shooterId: shooter.id,
  };
}
