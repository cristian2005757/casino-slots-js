# 🎰 Casino Slots

Slot machine clásico de 3 carretes hecho con **Vanilla JavaScript** y **ES Modules** — sin frameworks. Arquitectura modular, RNG reproducible y diseño responsive pensado para portafolio.

![Casino Slots](https://img.shields.io/badge/JS-Vanilla-f7df1e?style=flat-square)
![ES Modules](https://img.shields.io/badge/module-ES-61dafb?style=flat-square)
![No Dependencies](https://img.shields.io/badge/deps-none-brightgreen?style=flat-square)

## 🌐 Demo

> [Añade aquí el link de Vercel o tu deploy cuando lo subas]

---

## ✨ Características

- **Animación fluida** — Reels con `requestAnimationFrame`, easing y parada escalonada
- **Bonus Free Spins** — 3 Scatter = 5 tiros gratis (retrigger: +3 durante bonus)
- **Símbolos especiales** — Wild (comodín), Scatter (paga en cualquier posición)
- **Tabla de pagos** — Seven x50, Bar x25, Cherry x10, Bell, Lemon + multiplicadores para 2 iguales
- **Auto-spin** con delay configurable
- **Audio WebAudio** — Sonidos generados en tiempo real (sin archivos MP3)
- **Panel RNG (Fairness)** — Seed, Spin # y resultado visible. Botón "Copiar prueba"
- **Persistencia** — Balance, apuesta, stats y preferencias en LocalStorage
- **Estadísticas** — Spins, winrate, ganancia/pérdida, mayor premio, racha de pérdidas
- **Responsive** — `clamp()`, `aspect-ratio` y safe areas para móvil/iPhone
- **Accesibilidad** — `aria-label`, foco visible (`:focus-visible`), toasts para mensajes
- **Tests** — Suite console-based para RNG y paytable (sin frameworks)

---

## 🚀 Cómo ejecutar

```bash
# Clonar o descargar el proyecto
cd casino-slots-js

# Servir con un servidor local (necesario por ES Modules)
npx serve .
```

Abre `http://localhost:3000` en el navegador.

> **Nota:** Los ES Modules no funcionan con `file://`; necesitas un servidor HTTP local.

---

## ⌨️ Controles

| Atajo | Acción |
|-------|--------|
| `SPACE` | Girar |
| `↑` / `↓` | Subir / Bajar apuesta |
| `A` | Activar / Desactivar auto-spin |
| `R` | Reset (balance y apuesta inicial) |
| `M` | Mute / Unmute |

---

## 🧪 Tests

Pruebas simples para la lógica core (RNG determinista + paytable):

```bash
npx serve .
# Abre http://localhost:3000/tests/test.html
```

- **RNG:** Misma seed → mismos resultados. `setSeed()` reproducible.
- **Paytable:** 3 iguales, 2 iguales, Wild sustituye, Scatter, free spins.

---

## 📁 Estructura del proyecto

```
casino-slots-js/
├── index.html
├── assets/
│   ├── css/
│   │   └── styles.css          # Responsive, variables, safe areas
│   ├── js/
│   │   ├── main.js              # Orquestación, handlers, persist
│   │   ├── core/
│   │   │   ├── config.js        # Configuración del juego
│   │   │   ├── state.js         # Estado inicial (balance, bet, seed)
│   │   │   └── rng.js           # RNG reproducible (xmur3 + mulberry32)
│   │   ├── systems/
│   │   │   ├── state.js         # Máquina de estados (IDLE, SPINNING, BONUS, PAUSED)
│   │   │   ├── paytable.js      # Lógica de premios (WILD, Scatter)
│   │   │   └── stats.js         # Estadísticas y telemetría
│   │   ├── entities/
│   │   │   └── reel.js          # Animación de carretes con easing
│   │   └── utils/
│   │       └── storage.js       # LocalStorage (balance, bet, stats)
│   ├── game/
│   │   └── slots.js             # Motor de slots (spin, initReels)
│   ├── ui/
│   │   ├── doom.js              # Bindings, render, toasts, modal
│   │   └── audio.js             # WebAudio (tick, win, lose, click)
│   └── utils/
│       └── helpers.js           # clamp, formatMoney
└── tests/
    └── test.html                # Tests RNG + paytable (console)
```

---

## 🎲 Fairness (RNG)

- **Algoritmo:** xmur3 (hash) + mulberry32 (PRNG)
- **Determinismo:** Misma seed → misma secuencia de spins
- **Verificación:** Panel "RNG (Fairness)" muestra Seed, Spin # y Resultado. Botón "Copiar prueba" para compartir evidencia.

---

## 🛠 Stack

- **HTML5** — Semántico, accesible
- **CSS3** — Variables, clamp, aspect-ratio, safe-area-inset
- **JavaScript (ES Modules)** — Vanilla, sin bundler

---

## 👤 Autor

**Cristian Alvarez**

---

## 📄 Licencia

MIT (o la que prefieras para portafolio)
