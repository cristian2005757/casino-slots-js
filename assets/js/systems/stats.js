/**
 * Panel de estadísticas / telemetría local
 * Spins, winrate, ganancia/pérdida total, biggest win, racha de pérdidas
 */

export const DEFAULT_STATS = {
  spins: 0,
  wins: 0,
  biggestWin: 0,
  totalGain: 0,
  totalLoss: 0,
  lossStreak: 0,
  maxLossStreak: 0,
};

/**
 * Valores por defecto para stats nuevos (compatibilidad con datos viejos)
 */
export function normalizeStats(raw = {}) {
  return {
    spins: Math.max(0, ~~raw.spins),
    wins: Math.max(0, ~~raw.wins),
    biggestWin: Math.max(0, ~~raw.biggestWin),
    totalGain: Math.max(0, ~~raw.totalGain),
    totalLoss: Math.max(0, ~~raw.totalLoss),
    lossStreak: Math.max(0, ~~raw.lossStreak),
    maxLossStreak: Math.max(0, ~~raw.maxLossStreak),
  };
}

/**
 * Registra un spin en las stats
 * @param {Object} stats - objeto stats mutable
 * @param {number} betPaid - apuesta cobrada (0 si free spin)
 * @param {number} win - premio obtenido
 */
export function recordSpin(stats, betPaid, win) {
  stats.spins += 1;
  if (win > 0) {
    stats.wins += 1;
    if (win > stats.biggestWin) stats.biggestWin = win;
    stats.totalGain += win;
    stats.lossStreak = 0;
  } else {
    stats.lossStreak += 1;
    if (stats.lossStreak > stats.maxLossStreak) {
      stats.maxLossStreak = stats.lossStreak;
    }
  }
  if (betPaid > 0) stats.totalLoss += betPaid;
}

/**
 * Devuelve stats computadas para display
 */
export function getDisplayStats(stats, fmt) {
  const s = stats ?? DEFAULT_STATS;
  const winrate = s.spins > 0 ? Math.round((100 * s.wins) / s.spins) : null;
  const net = (s.totalGain ?? 0) - (s.totalLoss ?? 0);
  return {
    spins: s.spins,
    winrate: winrate != null ? `${winrate}%` : "—",
    totalGain: fmt ? fmt(s.totalGain ?? 0) : s.totalGain,
    totalLoss: fmt ? fmt(s.totalLoss ?? 0) : s.totalLoss,
    net: fmt ? fmt(net) : net,
    netRaw: net,
    biggestWin: fmt ? fmt(s.biggestWin ?? 0) : s.biggestWin,
    lossStreak: s.lossStreak ?? 0,
    maxLossStreak: s.maxLossStreak ?? 0,
  };
}
