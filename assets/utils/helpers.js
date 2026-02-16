export function clamp(n, min, max){
    return Math.max(min, Math.min(max, n));
  }
  
  export function formatMoney(n){
    return "$ " + Number(n).toLocaleString("es-CO");
  }
  