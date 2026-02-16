/**
 * Persistencia en LocalStorage
 * balance, bet, auto, mute, stats (spins, wins, biggestWin, winrate)
 */

const STORAGE_KEY = "casino-slots-v1";

const DEFAULT_STATS = {
  spins: 0,
  wins: 0,
  biggestWin: 0,
  totalGain: 0,
  totalLoss: 0,
  lossStreak: 0,
  maxLossStreak: 0,
};

function safeParse(json, fallback) {
  try {
    const data = JSON.parse(json);
    return data ?? fallback;
  } catch (_) {
    return fallback;
  }
}

/**
 * Carga datos guardados
 */
export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return safeParse(raw, null);
  } catch (_) {
    return null;
  }
}

/**
 * Guarda datos (merge con existentes)
 */
export function save(data) {
  try {
    const current = load() ?? {};
    const merged = { ...current, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Borra todos los datos guardados
 */
export function clear() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Devuelve la estructura por defecto para datos persistidos
 */
export function getDefaults() {
  return {
    balance: null,
    bet: null,
    auto: false,
    muted: true,
    stats: { ...DEFAULT_STATS },
  };
}
