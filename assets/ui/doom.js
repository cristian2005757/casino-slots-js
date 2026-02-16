import { formatMoney } from "../utils/helpers.js";
import { PAYTABLE, SYMBOLS } from "../js/systems/paytable.js";
import { getDisplayStats } from "../js/systems/stats.js";

export function bindUI(handlers, deps = {}){
  const { flow } = deps;
  const el = {
    balance: document.querySelector("#balance"),
    bet: document.querySelector("#bet"),
    lastWin: document.querySelector("#lastWin"),
    msg: document.querySelector("#message"),
    toast: document.querySelector("#toast"),

    btnSpin: document.querySelector("#btnSpin"),
    btnBetUp: document.querySelector("#btnBetUp"),
    btnBetDown: document.querySelector("#btnBetDown"),
    btnAuto: document.querySelector("#btnAuto"),
    btnMute: document.querySelector("#btnMute"),
    btnReset: document.querySelector("#btnReset"),
    btnNewSeed: document.querySelector("#btnNewSeed"),

    fairnessSeed: document.querySelector("#fairnessSeed"),
    fairnessSpin: document.querySelector("#fairnessSpin"),
    fairnessResult: document.querySelector("#fairnessResult"),
    btnCopyProof: document.querySelector("#btnCopyProof"),
    statFreeSpins: document.querySelector("#statFreeSpins"),
    freeSpinsCount: document.querySelector("#freeSpinsCount"),
    statsPanelToggle: document.querySelector("#statsPanelToggle"),
    statsPanelBody: document.querySelector("#statsPanelBody"),
    statSpins: document.querySelector("#statSpins"),
    statWinrate: document.querySelector("#statWinrate"),
    statTotalGain: document.querySelector("#statTotalGain"),
    statTotalLoss: document.querySelector("#statTotalLoss"),
    statNet: document.querySelector("#statNet"),
    statBiggestWin: document.querySelector("#statBiggestWin"),
    statLossStreak: document.querySelector("#statLossStreak"),
    btnResetData: document.querySelector("#btnResetData"),
    paytableList: document.querySelector("#paytableList"),
    btnPaytableInfo: document.querySelector("#btnPaytableInfo"),

    strips: [
      document.querySelector("#strip0"),
      document.querySelector("#strip1"),
      document.querySelector("#strip2"),
    ],
  };

  // Events
  el.btnSpin.addEventListener("click", handlers.onSpin);
  el.btnBetUp.addEventListener("click", handlers.onBetUp);
  el.btnBetDown.addEventListener("click", handlers.onBetDown);
  el.btnAuto.addEventListener("click", handlers.onAuto);
  el.btnMute.addEventListener("click", handlers.onMute);

  el.btnReset?.addEventListener("click", (e) => {
    e.preventDefault();
    handlers.onReset();
  });

  el.btnNewSeed.addEventListener("click", handlers.onNewSeed);
  if (el.btnCopyProof) el.btnCopyProof.addEventListener("click", handlers.onCopyProof);
  if (el.btnResetData) el.btnResetData.addEventListener("click", (e) => { e.preventDefault(); handlers.onResetData?.(); });

  if (el.btnPaytableInfo) {
    el.btnPaytableInfo.addEventListener("click", () => openPaytableModal());
  }

  el.statsPanelToggle?.addEventListener("click", () => {
    const panel = el.statsPanelToggle?.closest(".statsPanel");
    const body = el.statsPanelBody;
    const btn = el.statsPanelToggle;
    if (panel && body && btn) {
      const isOpen = panel.classList.contains("open");
      panel.classList.toggle("open", !isOpen);
      btn.setAttribute("aria-expanded", !isOpen);
    }
  });

  // Render paytable once
  renderPaytable(el.paytableList);

  function fmt(n){ return formatMoney(n); }

  function setMessage(html, type=""){
    el.msg.classList.remove("good","warn","bad");
    if (type) el.msg.classList.add(type);
    el.msg.innerHTML = html;
  }

  let toastTimer = null;
  function showToast(text, type = ""){
    if (!el.toast) return;
    el.toast.textContent = text;
    el.toast.className = "toast visible " + (type || "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toast.classList.remove("visible");
    }, 3200);
  }

  function setFairnessPanel(seed, spinId, result){
    if (el.fairnessSeed) el.fairnessSeed.textContent = seed || "—";
    if (el.fairnessSpin) el.fairnessSpin.textContent = spinId ?? "0";
    if (el.fairnessResult) el.fairnessResult.textContent = result?.length ? result.join(" ") : "—";
  }

  function setFreeSpinsVisible(visible, count = 0){
    if (el.statFreeSpins) el.statFreeSpins.style.display = visible ? "flex" : "none";
    if (el.freeSpinsCount) el.freeSpinsCount.textContent = String(count);
  }

  function syncControls(machine){
    const lock = machine?.isLocked?.() ?? false;
    const betLocked = lock || machine?.state === "BONUS";
    const editLocked = lock || machine?.state === "BONUS";
    el.btnSpin.disabled = lock;
    el.btnBetUp.disabled = betLocked;
    el.btnBetDown.disabled = betLocked;
    el.btnAuto.disabled = lock;
    el.btnNewSeed.disabled = editLocked;
    if (el.btnCopyProof) el.btnCopyProof.disabled = editLocked;
    if (el.btnPaytableInfo) el.btnPaytableInfo.disabled = lock;
    if (el.btnReset) el.btnReset.style.pointerEvents = lock ? "none" : "";
    if (el.btnResetData) el.btnResetData.disabled = editLocked;
  }

  function setMute(isMuted){
    el.btnMute.textContent = isMuted ? "Unmute" : "Mute";
  }

  function setAuto(isAuto){
    el.btnAuto.textContent = `Auto: ${isAuto ? "ON" : "OFF"}`;
  }

  function setFinalSymbols(line){
    // Esto pone el símbolo visible en el centro (simple)
    for (let i=0; i<3; i++){
      el.strips[i].innerHTML = buildStrip([line[i]]);
    }
  }

  function previewSymbols(line){
    // tira de 4 símbolos con el “visible” en el centro
    for (let i=0; i<3; i++){
      el.strips[i].innerHTML = buildStrip([randomPad(), line[i], randomPad(), randomPad()]);
    }
  }

  function randomPad(){
    const pool = SYMBOLS.map(s => s.symbol);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function openPaytableModal(){
    flow?.setModalOpen?.(true);
    const modal = document.getElementById("paytableModal");
    const body = document.getElementById("paytableModalBody");
    if (modal) {
      if (body) {
        const wild = SYMBOLS.find(s => s.isWild);
        const toShow = [...PAYTABLE, wild].filter(Boolean);
        body.innerHTML = `
          <p class="modalIntro">Premios por línea central. <strong>🌟 WILD</strong> sustituye cualquier símbolo. <strong>⭐ SCATTER</strong> paga en cualquier posición. <strong>3 SCATTER</strong> = 5 Free Spins (retrigger: +3).</p>
          <div class="payList modalPayList">
            ${toShow.map(p => {
              const extra = p.isScatter ? " (cualquier posición)" : p.isWild ? " — Comodín" : "";
              const multStr = p.isWild ? "Sustituye" : p.mult2 ? `3 iguales = x${p.mult} · 2 iguales = x${p.mult2}` : `x${p.mult}`;
              return `
                <div class="payItem">
                  <div class="payLeft">
                    <div class="paySym">${p.symbol}</div>
                    <div>
                      <div style="font-weight:900">${p.name}${extra ? ` <small style="opacity:.7">${extra}</small>` : ""}</div>
                      <div class="payName">${multStr}</div>
                    </div>
                  </div>
                  <div class="payMult">${p.isWild ? "—" : `x${p.mult}`}</div>
                </div>
              `;
            }).join("")}
          </div>
        `;
      }
      modal.classList.add("active");
    }
  }

  function closePaytableModal(){
    flow?.setModalOpen?.(false);
    const modal = document.getElementById("paytableModal");
    if (modal) modal.classList.remove("active");
  }

  function initPaytableModal(){
    const modal = document.getElementById("paytableModal");
    const overlay = modal?.querySelector(".modalOverlay");
    const btnClose = modal?.querySelector(".modalClose");
    if (overlay) overlay.addEventListener("click", closePaytableModal);
    if (btnClose) btnClose.addEventListener("click", closePaytableModal);
  }

  initPaytableModal();

  return {
    el,
    strips: el.strips,
    fmt,
    setMessage,
    showToast,
    setFairnessPanel,
    setFreeSpinsVisible,
    syncControls,
    setMute,
    setAuto,
    setFinalSymbols,
    previewSymbols,
  };
}

export function renderAll({ ui, state, paytable }){
  ui.el.balance.textContent = ui.fmt(state.balance);
  ui.el.bet.textContent = ui.fmt(state.bet);
  ui.el.lastWin.textContent = ui.fmt(state.lastWin);
  ui.setFreeSpinsVisible?.(state.freeSpinsRemaining > 0, state.freeSpinsRemaining);

  const ds = getDisplayStats(state.stats, ui.fmt);
  if (ui.el.statSpins) ui.el.statSpins.textContent = String(ds.spins);
  if (ui.el.statWinrate) ui.el.statWinrate.textContent = ds.winrate;
  if (ui.el.statTotalGain) ui.el.statTotalGain.textContent = ds.totalGain;
  if (ui.el.statTotalLoss) ui.el.statTotalLoss.textContent = ds.totalLoss;
  if (ui.el.statNet) {
    ui.el.statNet.textContent = ds.net;
    ui.el.statNet.style.color = ds.netRaw >= 0 ? "var(--good)" : "var(--bad)";
  }
  if (ui.el.statBiggestWin) ui.el.statBiggestWin.textContent = ds.biggestWin;
  if (ui.el.statLossStreak) ui.el.statLossStreak.textContent = String(ds.lossStreak);
}

function renderPaytable(container){
  if (!container) return;
  const wild = SYMBOLS.find(s => s.isWild);
  const toShow = [...PAYTABLE, wild].filter(Boolean);
  const items = toShow.map(p => {
    const extra = p.isScatter ? " (cualquier posición)" : p.isWild ? " — Comodín" : "";
    const multStr = p.isWild ? "—" : p.mult2 ? `3=x${p.mult} · 2=x${p.mult2}` : `x${p.mult}`;
    return `
      <div class="payItem">
        <div class="payLeft">
          <div class="paySym">${p.symbol}</div>
          <div>
            <div style="font-weight:900">${p.name}${extra ? ` <small style="opacity:.7">${extra}</small>` : ""}</div>
            <div class="payName">${multStr} apuesta</div>
          </div>
        </div>
        <div class="payMult">${p.isWild ? "—" : `x${p.mult}`}</div>
      </div>
    `;
  });
  container.innerHTML = items.join("");
}

function buildStrip(symbols){
  return symbols
    .map(s => `<div class="symbol">${s}</div>`)
    .join("");
}
