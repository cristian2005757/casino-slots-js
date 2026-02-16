import { normalizeStats } from "../systems/stats.js";

export function createState(config, saved = null){
    const s = saved ?? {};
    const stats = normalizeStats(s.stats);
    return {
      // estado “de juego”
      balance: validNum(s.balance) ? s.balance : config.startBalance,
      bet: validNum(s.bet) ? clampBet(s.bet, config) : config.betDefault,
      lastWin: 0,

      // UX (motor de estados en systems/gameState.js)
      muted: typeof s.muted === "boolean" ? s.muted : true,
      auto: typeof s.auto === "boolean" ? s.auto : false,

      // fairness / debug
      seed: defaultSeed(),
      spinId: 0,
      lastResult: null,

      // bonus
      freeSpinsRemaining: 0,

      // stats (persistidos, ver systems/stats.js)
      stats,
    };
  }

  function validNum(n){
    return typeof n === "number" && !Number.isNaN(n) && n >= 0;
  }
  function clampBet(val, config){
    return Math.max(config.betMin ?? 25, Math.min(config.betMax ?? 500, Math.round(val)));
  }
  
  function defaultSeed(){
    // seed determinista “bonita” inicial (luego puedes cambiarla)
    return "PORTFOLIO-SEED-001";
  }
  