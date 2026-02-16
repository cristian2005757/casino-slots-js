/**
 * Entidad Reel — animación “de verdad” con timeline y easing
 * Acelera → velocidad constante → frena → cae en símbolo final
 * requestAnimationFrame + easing para desaceleración
 */

/**
 * Easing 3 fases: acelera → constante → frena
 * @param {number} t - progreso 0..1
 * @param {number} p1 - fin fase aceleración (ej. 0.15)
 * @param {number} p2 - inicio fase frenado (ej. 0.75)
 */
function reelEase(t, p1 = 0.15, p2 = 0.75) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  if (t < p1) {
    const x = t / p1;
    return 0.05 * x * x;
  }
  if (t < p2) {
    const x = (t - p1) / (p2 - p1);
    return 0.05 + 0.7 * x;
  }
  const x = (t - p2) / (1 - p2);
  return 0.75 + 0.25 * (1 - (1 - x) * (1 - x));
}

function buildStripHTML(symbols) {
  return symbols
    .map(s => `<div class="symbol">${s}</div>`)
    .join("");
}

/**
 * Crea un reel animado con física real
 * @param {Object} opts
 * @param {HTMLElement} opts.stripEl - elemento .strip
 * @param {number} opts.symbolHeight - altura por símbolo (px)
 * @param {number} opts.stripPadding - padding top del strip
 * @param {number} opts.reelHeight - altura visible del reel
 * @param {string[]} opts.symbolPool - pool de símbolos
 * @param {Function} opts.pickSymbol - () => symbol
 * @param {Object} opts.config - config spin
 * @param {Function} [opts.onTick] - callback cada frame (para sonido)
 */
export function createReel({
  stripEl,
  symbolHeight,
  stripPadding,
  reelHeight,
  symbolPool,
  pickSymbol,
  config,
  onTick,
}) {
  const symbolCount = Array.isArray(symbolPool) ? symbolPool.length : 7;
  const centerY = reelHeight / 2;
  const firstSymbolCenter = stripPadding + symbolHeight / 2;

  /**
   * Construye la tira con el símbolo final en posición calculada
   * targetIndex: índice del símbolo que debe quedar en el centro
   */
  function buildStripForTarget(targetSymbol) {
    const extra = Math.max(5, Math.ceil(reelHeight / symbolHeight) + 2);
    const minTargetIndex = Math.ceil((centerY - firstSymbolCenter) / symbolHeight);
    const targetIndex = minTargetIndex + extra + Math.floor(Math.random() * 3);

    const symbols = [];
    for (let i = 0; i < targetIndex + extra; i++) {
      symbols.push(i === targetIndex ? targetSymbol : pickSymbol());
    }
    return { symbols, targetIndex };
  }

  function getTargetOffset(targetIndex) {
    return targetIndex * symbolHeight + firstSymbolCenter - centerY;
  }

  let rafId = null;
  let lastTickTime = 0;

  /**
   * Animación del reel con requestAnimationFrame
   */
  function spin(targetSymbol) {
    return new Promise((resolve) => {
      const { symbols, targetIndex } = buildStripForTarget(targetSymbol);
      const targetOffset = getTargetOffset(targetIndex);
      const minRevolutions = config.minRevolutions ?? 3;
      const totalDistance =
        minRevolutions * symbolCount * symbolHeight + targetOffset;

      const durationMs = config.spinDurationMs ?? 2000;
      const p1 = config.spinPhaseAccel ?? 0.15;
      const p2 = 1 - (config.spinPhaseDecel ?? 0.25);

      stripEl.innerHTML = buildStripHTML(symbols);
      stripEl.style.transform = "translateY(0)";

      const startTime = performance.now();
      let lastProgress = 0;

      function animate(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        const easedProgress = reelEase(progress, p1, p2);
        const offsetY = easedProgress * totalDistance;

        stripEl.style.transform = `translateY(-${offsetY}px)`;

        if (onTick && progress < 1) {
          const tickThresh = 0.08;
          if (easedProgress - lastTickTime >= tickThresh || lastTickTime === 0) {
            lastTickTime = easedProgress;
            onTick();
          }
        }

        if (progress < 1) {
          rafId = requestAnimationFrame(animate);
        } else {
          stripEl.style.transform = `translateY(-${targetOffset}px)`;
          rafId = null;
          lastTickTime = 0;
          resolve();
        }
      }

      lastTickTime = 0;
      rafId = requestAnimationFrame(animate);
    });
  }

  /**
   * Muestra símbolos estáticos (inicio/reset)
   */
  function showStatic(symbols) {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    stripEl.innerHTML = buildStripHTML(symbols);
    stripEl.style.transform = "translateY(0)";
  }

  return { spin, showStatic };
}
