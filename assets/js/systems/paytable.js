/**
 * Sistema de Paytable — lógica de negocio para premios
 * Símbolos: CHERRY x10, SEVEN x50, BAR x25, WILD (comodín), SCATTER (bonus)
 * Reglas: 3 iguales, 2 iguales, comodín sustituye, scatter paga en cualquier posición
 */

const WILD_ID = "wild";
const SCATTER_ID = "scatter";

/** Definición de símbolos con multiplicadores por número en línea */
export const SYMBOLS = [
  { id: "seven", symbol: "7️⃣", name: "Seven", mult3: 50, mult2: 5, isWild: false, isScatter: false },
  { id: "bar", symbol: "🎰", name: "Bar", mult3: 25, mult2: 3, isWild: false, isScatter: false },
  { id: "cherry", symbol: "🍒", name: "Cherry", mult3: 10, mult2: 2, isWild: false, isScatter: false },
  { id: "bell", symbol: "🔔", name: "Bell", mult3: 8, mult2: 2, isWild: false, isScatter: false },
  { id: "lemon", symbol: "🍋", name: "Lemon", mult3: 5, mult2: 1, isWild: false, isScatter: false },
  { id: "wild", symbol: "🌟", name: "Wild", mult3: 0, mult2: 0, isWild: true, isScatter: false },
  { id: "scatter", symbol: "⭐", name: "Scatter", mult3: 5, mult2: 2, isWild: false, isScatter: true },
];

/** Paytable plano para UI (compatibilidad con tabla existente) */
export const PAYTABLE = SYMBOLS.filter(s => !s.isWild).map(s => ({
  symbol: s.symbol,
  name: s.name,
  mult: s.mult3,
  mult2: s.mult2,
  isScatter: s.isScatter,
  isWild: s.isWild,
}));

/** Símbolos normales (para reel, sin WILD/SCATTER en peso alto) */
export const REEL_SYMBOLS = SYMBOLS.filter(s => !s.isScatter && !s.isWild);

/** Lookup por emoji */
const BY_SYMBOL = new Map(SYMBOLS.map(s => [s.symbol, s]));

function getSymbol(sym) {
  return BY_SYMBOL.get(sym) ?? null;
}

/**
 * Resuelve una línea [a,b,c] con WILD como comodín.
 * Devuelve { matched, baseSymbol } o null si no hay match.
 */
function resolveLine(line) {
  const [a, b, c] = line.map(getSymbol);
  if (!a || !b || !c) return null;

  const syms = [a, b, c];
  const wilds = syms.filter(s => s.isWild).length;
  const regular = syms.filter(s => !s.isWild);

  if (regular.length === 0) return null; // 3 wilds: no paga (o se puede dar premio máx)

  const base = regular[0];
  if (regular.length === 1) return { matched: 3, baseSymbol: base };
  if (regular.length === 2) {
    if (regular[0].id === regular[1].id) return { matched: 3, baseSymbol: base };
    return null;
  }
  if (a.id === b.id && b.id === c.id) return { matched: 3, baseSymbol: base };
  if (a.id === b.id || b.id === c.id || a.id === c.id) {
    const pair = a.id === b.id ? a : (b.id === c.id ? b : a);
    return { matched: 2, baseSymbol: pair };
  }
  return null;
}

/**
 * Cuenta scatters en la línea
 */
function countScatters(line) {
  return line.filter(s => {
    const def = getSymbol(s);
    return def?.isScatter;
  }).length;
}

/**
 * Calcula el payout total para una línea central [r0, r1, r2]
 * @param {string[]} line - 3 símbolos (centro de cada reel)
 * @param {number} bet
 * @returns {{ win: number, wins: { symbol: string, count: number, mult: number }[] }}
 */
export function calculatePayout(line, bet) {
  let totalWin = 0;
  const wins = [];

  // 1) Scatter: paga en cualquier posición
  const scatterCount = countScatters(line);
  if (scatterCount >= 2) {
    const mult = scatterCount === 3 ? 5 : 2;
    const win = bet * mult;
    totalWin += win;
    wins.push({ symbol: "⭐", count: scatterCount, mult, win });
  }

  // 2) Línea regular (con WILD)
  const resolved = resolveLine(line);
  if (resolved && !resolved.baseSymbol.isScatter) {
    const { matched, baseSymbol } = resolved;
    const mult = matched === 3 ? baseSymbol.mult3 : baseSymbol.mult2;
    if (mult > 0) {
      const win = bet * mult;
      totalWin += win;
      wins.push({ symbol: baseSymbol.symbol, count: matched, mult, win });
    }
  }

  const freeSpinsTriggered = scatterCount === 3;
  return { win: totalWin, wins, freeSpinsTriggered };
}

/**
 * Devuelve la lista de símbolos para mostrar en la paytable (ordenados por premio)
 */
export function getPaytableForDisplay() {
  return PAYTABLE;
}
