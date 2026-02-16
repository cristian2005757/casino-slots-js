// Audio sin assets (WebAudio). Queda PRO y no depende de mp3/wav.
// Modo silencioso por defecto: si falla AudioContext, no explota.
// Incluye safeAudio() para cuando uses archivos mp3.

export function safeAudio(src, volume = 0.5) {
  try {
    const a = new Audio(src);
    a.volume = volume;
    a.addEventListener("error", () => {
      console.warn("[audio] missing:", src);
    });
    return a;
  } catch (e) {
    console.warn("[audio] failed to create:", src, e);
    return null;
  }
}

export function createAudio({ muted = true }) {
  let isMuted = muted;
  let ctx = null;
  let audioOk = true;

  function ensure() {
    if (!audioOk || ctx) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) {
        audioOk = false;
        console.warn("[audio] AudioContext no disponible");
        return;
      }
      ctx = new Ctx();
    } catch (e) {
      audioOk = false;
      console.warn("[audio] Error al crear AudioContext:", e);
    }
  }

  function tone(freq, ms, type = "sine", vol = 0.06) {
    if (isMuted || !audioOk) return;
    ensure();
    if (!ctx) return;
    try {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g);
      g.connect(ctx.destination);
      const now = ctx.currentTime;
      g.gain.setValueAtTime(vol, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + ms / 1000);
      o.start(now);
      o.stop(now + ms / 1000);
    } catch (e) {
      console.warn("[audio] tone error:", e);
    }
  }

  function tick() {
    tone(640, 35, "square", 0.03);
  }
  function spinStart() {
    tone(220, 90, "sawtooth", 0.05);
  }
  function win() {
    tone(523, 90, "triangle", 0.06);
    setTimeout(() => tone(659, 90, "triangle", 0.06), 80);
    setTimeout(() => tone(784, 120, "triangle", 0.06), 160);
  }
  function lose() {
    tone(180, 120, "sine", 0.05);
  }
  function uiClick() {
    tone(520, 40, "square", 0.03);
  }
  function uiError() {
    tone(120, 140, "sine", 0.06);
  }

  function setMuted(v) {
    isMuted = v;
  }

  return { tick, spinStart, win, lose, uiClick, uiError, setMuted };
}
