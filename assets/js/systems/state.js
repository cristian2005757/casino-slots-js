/**
 * Motor de Estados (State Machine) — flujo claro sin ifs dispersos
 * IDLE → SPINNING → RESULT → IDLE
 * PAUSED cuando modal abierto (bloquea auto-spin)
 */

export const GAME_STATE = Object.freeze({
  IDLE: "IDLE",
  SPINNING: "SPINNING",
  RESULT: "RESULT",
  BONUS: "BONUS",
  PAUSED: "PAUSED",
});

/**
 * Crea la máquina de estados del juego.
 * @param {() => void} onStateChange - callback cuando cambia el estado (para sync UI)
 */
export function createGameStateMachine(onStateChange) {
  let current = GAME_STATE.IDLE;
  let modalOpen = false;
  let stateBeforeModal = null;

  function transition(to) {
    if (current === to) return;
    current = to;
    onStateChange?.(current);
  }

  function setModalOpen(open) {
    if (modalOpen === open) return;
    modalOpen = open;
    if (open) {
      stateBeforeModal = current;
      if (current === GAME_STATE.IDLE || current === GAME_STATE.RESULT) {
        transition(GAME_STATE.PAUSED);
      }
    } else {
      transition(stateBeforeModal ?? GAME_STATE.IDLE);
      stateBeforeModal = null;
    }
    onStateChange?.(current);
  }

  /** ¿Puede girar? (IDLE, RESULT, o BONUS con tiros restantes, sin modal) */
  function canSpin() {
    return (
      (current === GAME_STATE.IDLE ||
        current === GAME_STATE.RESULT ||
        current === GAME_STATE.BONUS) &&
      !modalOpen
    );
  }

  /** ¿Puede cambiar apuesta? (no durante spin ni en bonus) */
  function canBet() {
    return (
      (current === GAME_STATE.IDLE || current === GAME_STATE.RESULT) &&
      !modalOpen
    );
  }

  /** ¿Puede hacer reset/newSeed/copy? (no durante spin ni en bonus) */
  function canEdit() {
    return (
      (current === GAME_STATE.IDLE || current === GAME_STATE.RESULT) &&
      !modalOpen
    );
  }

  /** ¿Puede activar auto-spin? (idle/result, sin modal; no en bonus) */
  function canToggleAuto() {
    return (
      (current === GAME_STATE.IDLE || current === GAME_STATE.RESULT) &&
      !modalOpen
    );
  }

  /** ¿Ejecutar siguiente auto-spin? (idle o bonus, sin modal, auto activo) */
  function canAutoSpin() {
    return (
      (current === GAME_STATE.IDLE || current === GAME_STATE.BONUS) &&
      !modalOpen
    );
  }

  /** ¿Debe bloquear controles? (spinning o paused) */
  function isLocked() {
    return current === GAME_STATE.SPINNING || current === GAME_STATE.PAUSED;
  }

  return {
    get state() {
      return current;
    },
    get modalOpen() {
      return modalOpen;
    },
    transition,
    setModalOpen,
    canSpin,
    canBet,
    canEdit,
    canToggleAuto,
    canAutoSpin,
    isLocked,
  };
}
