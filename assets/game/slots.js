import { calculatePayout } from "../js/systems/paytable.js";
import { createReel } from "../js/entities/reel.js";

const weighted = [
  "🍋", "🍋", "🍋", "🍋", "🍋",
  "🍒", "🍒", "🍒", "🍒",
  "🔔", "🔔", "🔔",
  "🎰", "🎰",
  "7️⃣",
  "🌟", "⭐",
];

function pickFromPool(rng) {
  return rng.pick(weighted);
}

export function createSlotsEngine({ config, rng, audio }) {
  let reels = null;

  function initReels(stripElements) {
    const strips = Array.isArray(stripElements) ? stripElements : [...(stripElements || [])];
    const valid = strips.filter(Boolean);
    if (valid.length !== 3) return reels;
    if (reels && reels.length === 3) return reels;

    // Medir del DOM para responsive (CSS con clamp/aspect-ratio)
    const reelEl = valid[0]?.closest?.(".reel");
    const reelHeight = reelEl ? reelEl.offsetHeight : (config.reelHeight ?? 280);
    const stripPadding = reelEl
      ? parseFloat(getComputedStyle(valid[0]).paddingTop) || (config.reelStripPadding ?? 16)
      : (config.reelStripPadding ?? 16);
    const firstSym = valid[0]?.querySelector?.(".symbol");
    const symbolHeight = firstSym
      ? firstSym.offsetHeight + (parseFloat(getComputedStyle(valid[0]).gap) || 10)
      : (config.reelSymbolHeight ?? 80);

    reels = valid.map((stripEl, i) =>
      createReel({
        stripEl,
        symbolHeight,
        stripPadding,
        reelHeight,
        symbolPool: weighted,
        pickSymbol: () => pickFromPool(rng),
        config: {
          ...config,
          spinDurationMs:
            (config.spinDurationMs ?? 2400) + i * (config.reelStopDelayMs ?? 180),
        },
        onTick: () => {
          try {
            audio?.tick?.();
          } catch (_) {}
        },
      })
    );
    return reels;
  }

  async function spin({ bet, strips, onTick }) {
    try {
      audio?.spinStart?.();
    } catch (_) {}

    const finalLine = [
      rng.pick(weighted),
      rng.pick(weighted),
      rng.pick(weighted),
    ];

    const r = initReels(strips);
    if (!r || r.length !== 3) {
      strips?.forEach((el, i) => {
        if (el && finalLine[i])
          el.innerHTML = `<div class="symbol">${finalLine[i]}</div>`;
      });
      await Promise.resolve();
      const payout = calculatePayout(finalLine, bet);
      try {
        if (payout.win > 0) audio?.win?.();
        else audio?.lose?.();
      } catch (_) {}
      return { line: finalLine, ...payout };
    }

    const [r0, r1, r2] = r;
    await Promise.all([
      r0.spin(finalLine[0]),
      r1.spin(finalLine[1]),
      r2.spin(finalLine[2]),
    ]);

    const payout = calculatePayout(finalLine, bet);

    try {
      if (payout.win > 0) audio?.win?.();
      else audio?.lose?.();
    } catch (_) {}

    return { line: finalLine, ...payout };
  }

  function showReels(line) {
    const r = reels;
    if (r && r.length === 3) {
      r[0].showStatic([line[0]]);
      r[1].showStatic([line[1]]);
      r[2].showStatic([line[2]]);
    }
  }

  return { spin, showReels, initReels };
}
