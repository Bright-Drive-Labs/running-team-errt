export interface PaceZones {
  E: string; // Easy
  M: string; // Marathon
  T: string; // Threshold
  I: string; // Interval
  R: string; // Repetition
}

export interface AthletePBs {
  pb_5k?: string;
  pb_10k?: string;
  pb_21k?: string;
  pb_42k?: string;
}

/**
 * Parses time string (MM:SS or HH:MM:SS) to minutes.
 */
function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] + parts[1] / 60;
  } else if (parts.length === 3) {
    return parts[0] * 60 + parts[1] + parts[2] / 60;
  }
  return 0;
}

/**
 * Formats pace in minutes per km to MM:SS string.
 */
function formatPace(minutesPerKm: number): string {
  const mins = Math.floor(minutesPerKm);
  const secs = Math.round((minutesPerKm - mins) * 60);
  if (secs === 60) {
    return `${(mins + 1).toString().padStart(2, '0')}:00`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculates Jack Daniels VDOT based on distance (meters) and time (minutes).
 */
function calculateVDOT(distanceMeters: number, timeMinutes: number): number {
  const velocity = distanceMeters / timeMinutes; // meters/min
  const vo2 = -4.60 + 0.182258 * velocity + 0.000104 * Math.pow(velocity, 2);
  const percentMax = 0.8 + 0.1894393 * Math.exp(-0.012778 * timeMinutes) + 0.2989558 * Math.exp(-0.1932605 * timeMinutes);
  return vo2 / percentMax;
}

/**
 * Converts a target VO2 to velocity (meters/min) using inverted quadratic formula.
 */
function vo2ToVelocity(targetVO2: number): number {
  const a = 0.000104;
  const b = 0.182258;
  const c = -4.60 - targetVO2;
  const discriminant = Math.pow(b, 2) - 4 * a * c;
  return (-b + Math.sqrt(discriminant)) / (2 * a);
}

/**
 * Calculates training zones given an athlete's PBs, picking the shortest distance.
 */
export function calculatePaceZones(pbs: AthletePBs): Record<string, string> | null {
  const distances = [
    { key: 'pb_5k', meters: 5000 },
    { key: 'pb_10k', meters: 10000 },
    { key: 'pb_21k', meters: 21097 },
    { key: 'pb_42k', meters: 42195 }
  ];

  let bestVdot = 0;
  let selectedDistance = '';

  // Calculate VDOT for all available PBs and pick the shortest distance's VDOT
  // Or we could pick the HIGHEST VDOT which is a common practice, but user requested SHORTEST distance
  for (const d of distances) {
    const timeStr = pbs[d.key as keyof AthletePBs];
    if (timeStr && timeStr.trim() !== '') {
      const minutes = parseTimeToMinutes(timeStr);
      if (minutes > 0) {
        bestVdot = calculateVDOT(d.meters, minutes);
        selectedDistance = d.key;
        break; // Stop at the shortest distance because the array is sorted 5k -> 42k
      }
    }
  }

  if (bestVdot === 0) return null;

  // Constants for % VDOT per zone (approximate Jack Daniels values)
  // E = 65-79% (using 70%)
  // M = 80-85% (using 82%)
  // T = 88-92% (using 90%)
  // I = 98-100% (using 98%)
  // R = 105-110% (using 105%)
  
  const vE = vo2ToVelocity(bestVdot * 0.70);
  const vM = vo2ToVelocity(bestVdot * 0.82);
  const vT = vo2ToVelocity(bestVdot * 0.90);
  const vI = vo2ToVelocity(bestVdot * 0.98);
  const vR = vo2ToVelocity(bestVdot * 1.05);

  return {
    "Z1 / E": formatPace(1000 / vE),
    "Z2 / M": formatPace(1000 / vM),
    "Z3 / T": formatPace(1000 / vT),
    "Z4 / I": formatPace(1000 / vI),
    "Z5 / R": formatPace(1000 / vR)
  };
}
