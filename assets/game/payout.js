// Multiplicadores por 3 en línea (centro)
export const PAYTABLE = [
    { symbol: "7️⃣",  mult: 10, name: "Seven" },
    { symbol: "💎",  mult: 7,  name: "Diamond" },
    { symbol: "🔔",  mult: 5,  name: "Bell" },
    { symbol: "👾",  mult: 4,  name: "Alien" },
    { symbol: "🍒",  mult: 3,  name: "Cherry" },
    { symbol: "🍋",  mult: 2,  name: "Lemon" },
  ];
  
  // helper para lookup rápido
  export function getMult(symbol){
    const row = PAYTABLE.find(p => p.symbol === symbol);
    return row ? row.mult : 0;
  }
  