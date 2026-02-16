export const CONFIG = {
    // economía
    startBalance: 1000,
    betDefault: 50,
    betMin: 25,
    betMax: 500,
    betStep: 25,
  
    // symbols (nombre + emoji) — alineados con paytable.js
    symbols: [
      { id: "seven",  emoji: "7️⃣", label: "Seven" },
      { id: "bar",    emoji: "🎰", label: "Bar" },
      { id: "cherry", emoji: "🍒", label: "Cherry" },
      { id: "bell",   emoji: "🔔", label: "Bell" },
      { id: "lemon",  emoji: "🍋", label: "Lemon" },
      { id: "wild",   emoji: "🌟", label: "Wild" },
      { id: "scatter",emoji: "⭐", label: "Scatter" },
    ],
  
    // default line shown at boot (símbolos del nuevo paytable)
    defaultLine: ["🍒","🎰","7️⃣"],
  
    // animación reels
    reelHeight: 280,           // altura visible (debe coincidir con CSS .reel)
    reelSymbolHeight: 80,      // 70px symbol + 10px gap (debe coincidir con CSS)
    reelStripPadding: 16,
    spinDurationMs: 2400,      // duración total del spin por reel
    spinPhaseAccel: 0.15,      // % duración fase aceleración
    spinPhaseCruise: 0.6,      // % duración velocidad constante
    spinPhaseDecel: 0.25,      // % duración frenado
    reelStopDelayMs: 180,      // delay entre parada de cada reel (1, 2, 3)
    minRevolutions: 3,        // mínimo de "vueltas" antes de parar
  
    autoDelayMs: 280,          // delay entre auto-spins

    // bonus free spins
    freeSpinsCount: 5,     // tiros gratis al sacar 3 scatter
    freeSpinsRetrigger: 3, // extra tiros si 3 scatter durante bonus
  };
  