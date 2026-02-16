import { CONFIG } from "./core/config.js";
import { createState } from "./core/state.js";
import { createRng } from "./core/rng.js";
import { GAME_STATE, createGameStateMachine } from "./systems/state.js";

import { PAYTABLE } from "./systems/paytable.js";
import { createSlotsEngine } from "../game/slots.js";

import { bindUI, renderAll } from "../ui/doom.js";
import { createAudio } from "../ui/audio.js";

import { clamp } from "../utils/helpers.js";
import { recordSpin } from "./systems/stats.js";
import { load as loadStorage, save as saveStorage, clear as clearStorage } from "./utils/storage.js";

const saved = loadStorage();
const state = createState(CONFIG, saved);
const rng = createRng(state.seed);
const audio = createAudio({ muted: state.muted });

const engine = createSlotsEngine({
  config: CONFIG,
  rng,
  audio,
});

function persist() {
  saveStorage({
    balance: state.balance,
    bet: state.bet,
    auto: state.auto,
    muted: state.muted,
    stats: state.stats,
  });
}

let ui;
const flow = createGameStateMachine(() => ui?.syncControls?.(flow));

ui = bindUI({
  onSpin: () => spin(),
  onBetUp: () => changeBet(+CONFIG.betStep),
  onBetDown: () => changeBet(-CONFIG.betStep),
  onReset: () => reset(),
  onMute: () => toggleMute(),
  onAuto: () => toggleAuto(),
  onNewSeed: () => newSeed(),
  onCopyProof: () => copyProof(),
  onResetData: () => resetData(),
}, { flow });

renderAll({ ui, state, paytable: PAYTABLE });

async function spin() {
  if (!flow.canSpin()) return;
  if (flow.state === GAME_STATE.BONUS && state.freeSpinsRemaining <= 0) {
    flow.transition(GAME_STATE.IDLE);
    return;
  }
  const isFreeSpin = flow.state === GAME_STATE.BONUS;
  if (!isFreeSpin && state.balance < state.bet) {
    ui.setMessage("No hay balance suficiente. Baja la apuesta o haz Reset.", "bad");
    ui.showToast?.("No hay balance suficiente", "bad");
    audio.uiError();
    return;
  }

  flow.transition(GAME_STATE.SPINNING);

  if (!isFreeSpin) {
    state.balance -= state.bet;
  }
  state.lastWin = 0;
  state.spinId += 1;
  ui.setMessage(
    isFreeSpin ? `Free Spin! 🎁 (${state.freeSpinsRemaining} restantes)` : "Girando... 🎰",
    isFreeSpin ? "warn" : ""
  );
  renderAll({ ui, state, paytable: PAYTABLE });

  const betForPayout = state.bet;
  const result = await engine.spin({
    bet: betForPayout,
    strips: ui.strips,
  });

  state.lastWin = result.win;
  state.balance += result.win;

  if (result.freeSpinsTriggered) {
    const extra = isFreeSpin ? CONFIG.freeSpinsRetrigger : CONFIG.freeSpinsCount;
    if (isFreeSpin) state.freeSpinsRemaining -= 1;
    state.freeSpinsRemaining += extra;
    flow.transition(GAME_STATE.BONUS);
    ui.setMessage(
      `¡3 SCATTER! ⭐ Bonus activado: ${state.freeSpinsRemaining} free spins`,
      "good"
    );
    ui.showToast?.(`Bonus activado: ${state.freeSpinsRemaining} free spins`, "good");
  } else if (isFreeSpin) {
    state.freeSpinsRemaining -= 1;
    if (state.freeSpinsRemaining === 0) {
      flow.transition(GAME_STATE.RESULT);
      ui.setMessage(
        result.win > 0
          ? `¡Ganaste <b>${ui.fmt(result.win)}</b> — Bonus terminado 🎉`
          : "Bonus terminado. ¡Gracias por jugar! 🎰",
        result.win > 0 ? "good" : ""
      );
      flow.transition(GAME_STATE.IDLE);
    } else {
      flow.transition(GAME_STATE.BONUS);
      const winMsg = result.win > 0 ? `+${ui.fmt(result.win)} — ` : "";
      ui.setMessage(
        `${winMsg}Free spins: ${state.freeSpinsRemaining} restantes`,
        result.win > 0 ? "good" : "warn"
      );
    }
  } else {
    if (result.win > 0) {
      const winDesc = result.wins?.length
        ? result.wins.map(w => `${w.symbol}×${w.count} (x${w.mult})`).join(" + ")
        : result.line.join(" ");
      ui.setMessage(
        `¡Ganaste <b>${ui.fmt(result.win)}</b> — ${winDesc} 🔥`,
        "good"
      );
    } else {
      ui.setMessage("Nada esta vez 😈 Intenta de nuevo.", "");
    }
    flow.transition(GAME_STATE.RESULT);
    flow.transition(GAME_STATE.IDLE);
  }

  state.lastResult = result.line;

  const betPaid = isFreeSpin ? 0 : state.bet;
  recordSpin(state.stats, betPaid, result.win);
  persist();

  ui.setFairnessPanel(state.seed, state.spinId, state.lastResult);
  renderAll({ ui, state, paytable: PAYTABLE });

  if (state.auto && flow.canAutoSpin()) {
    const hasBalance = !isFreeSpin ? state.balance >= state.bet : true;
    if (hasBalance || state.freeSpinsRemaining > 0) {
      await wait(CONFIG.autoDelayMs);
      spin();
    }
  }
}

function changeBet(delta) {
  if (!flow.canBet()) return;
  state.bet = clamp(state.bet + delta, CONFIG.betMin, CONFIG.betMax);
  persist();
  audio.uiClick();
  renderAll({ ui, state, paytable: PAYTABLE });
}

function reset() {
  if (!flow.canEdit()) return;
  state.balance = CONFIG.startBalance;
  state.bet = CONFIG.betDefault;
  state.lastWin = 0;
  state.spinId = 0;
  state.freeSpinsRemaining = 0;
  state.auto = false;
  persist();

  ui.setAuto(false);
  ui.setMessage("Listo ✅ Presiona <b>SPIN</b> o <b>SPACE</b>.", "");
  state.lastResult = null;
  ui.setFairnessPanel(state.seed, state.spinId, state.lastResult);
  audio.uiClick();

  engine.showReels(CONFIG.defaultLine);

  renderAll({ ui, state, paytable: PAYTABLE });
}

function toggleMute() {
  state.muted = !state.muted;
  audio.setMuted(state.muted);
  ui.setMute(state.muted);
  persist();
  ui.setMessage(state.muted ? "Audio en mute 🔇" : "Audio activo 🔊", "");
}

function toggleAuto() {
  if (!flow.canToggleAuto()) return;
  state.auto = !state.auto;
  persist();
  ui.setAuto(state.auto);
  audio.uiClick();

  if (state.auto) {
    ui.setMessage("Auto-spin activado ✅", "warn");
    if (state.balance >= state.bet && flow.canAutoSpin()) spin();
  } else {
    ui.setMessage("Auto-spin desactivado.", "");
  }
}

function newSeed() {
  if (!flow.canEdit()) return;
  state.seed = cryptoRandomSeed();
  rng.setSeed(state.seed);

  state.spinId = 0;
  state.lastResult = null;
  ui.setFairnessPanel(state.seed, state.spinId, state.lastResult);
  ui.setMessage("Nueva seed aplicada ✅ (RNG reiniciado)", "warn");
  ui.showToast?.("Nueva seed aplicada", "warn");
  audio.uiClick();
}

function copyProof() {
  if (!flow.canEdit()) return;
  const proof = `Seed: ${state.seed}\nSpin #: ${state.spinId}\nResultado: ${(state.lastResult || []).join(" ") || "—"}`;
  navigator.clipboard.writeText(proof).then(() => {
    ui.showToast?.("Prueba copiada al portapapeles", "good");
  }).catch(() => ui.setMessage("No se pudo copiar", "bad"));
}

function resetData() {
  if (!flow.canEdit()) return;
  if (!confirm("¿Borrar todos los datos guardados? Balance, apuesta, stats y preferencias se restaurarán a valores iniciales.")) return;
  clearStorage();
  state.balance = CONFIG.startBalance;
  state.bet = CONFIG.betDefault;
  state.auto = false;
  state.muted = true;
  state.stats = { spins: 0, wins: 0, biggestWin: 0, totalGain: 0, totalLoss: 0, lossStreak: 0, maxLossStreak: 0 };
  state.lastWin = 0;
  state.spinId = 0;
  state.freeSpinsRemaining = 0;
  state.lastResult = null;
  audio.setMuted(true);
  ui.setAuto(false);
  ui.setMute(true);
  ui.setMessage("Datos borrados. Todo restaurado ✅", "good");
  ui.showToast?.("Datos borrados", "good");
  ui.setFairnessPanel(state.seed, state.spinId, state.lastResult);
  engine.showReels(CONFIG.defaultLine);
  renderAll({ ui, state, paytable: PAYTABLE });
}

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (e.code === "Space") { e.preventDefault(); spin(); }
  if (k === "arrowup") changeBet(+CONFIG.betStep);
  if (k === "arrowdown") changeBet(-CONFIG.betStep);
  if (k === "r") reset();
  if (k === "m") toggleMute();
  if (k === "a") toggleAuto();
});

// init (poblar strips antes de initReels para medición responsive)
ui.setFinalSymbols?.(CONFIG.defaultLine);
engine.initReels(ui.strips);
ui.setFairnessPanel(state.seed, state.spinId, state.lastResult);
ui.setMute(state.muted);
ui.setAuto(state.auto);
ui.setMessage("Listo ✅ Presiona <b>SPIN</b> o <b>SPACE</b>.", "");
ui.syncControls(flow);
renderAll({ ui, state, paytable: PAYTABLE });

function wait(ms){ return new Promise(r => setTimeout(r, ms)); }
function cryptoRandomSeed(){
  // seed “bonita” para mostrar (portafolio)
  const arr = new Uint32Array(2);
  crypto.getRandomValues(arr);
  return `${arr[0].toString(16)}-${arr[1].toString(16)}`.toUpperCase();
}
