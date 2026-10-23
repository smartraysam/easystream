# EasyPresenter Studio (v2.0)

A modern, full-featured Church Presentation & Broadcast Controller built with **Vite + React 19 + TypeScript**, featuring an **EasyWorship / ProPresenter-grade Studio Console**, live dual-monitor projection output, and transparent vMix/OBS broadcast overlays.

---

## 🚀 Quick Start

### 1. Install & Run

Requires [Node.js](https://nodejs.org) (v18+).

```bash
# Build frontend & start server
npm run serve
# or for live development:
# npm run dev  (Vite dev server)
# npm start    (Node server)
```

### 📦 Nixpacks, Coolify & Docker Deployment

To deploy with **Coolify** (Nixpacks or Dockerfile):

- Select **Nixpacks** as Build Pack in **Coolify** (uses included [`nixpacks.toml`](./nixpacks.toml)).
- Set port `3000` and persistent volume `/app/data`.
- Or run locally with Docker::
  ```bash
  docker compose up -d --build
  ```
- See [COOLIFY.md](./COOLIFY.md) for full deployment instructions (Nixpacks, Dockerfile, Docker Compose).

You'll see:

```text
----------------------------------------------------
  ✨ EasyPresenter Studio Server is running!
----------------------------------------------------
  🖥️  Local Control:    http://localhost:3000/
  📺 Local Display:    http://localhost:3000/display
  🎬 Local vMix Ovly:  http://localhost:3000/display?overlay=1
  🎙️  Stage Monitor:   http://localhost:3000/stage
----------------------------------------------------
```

---

## 🎛️ Control Console (`http://<host-ip>:3000/`)

The Studio Console includes:

### 1. EasyWorship-Style Typography & Theme Inspector (Right Column)

- **Font Families**: Montserrat (Modern Bold), Outfit (Clean Geometric), Inter (Crisp Display), Playfair Display (Classic Serif), Cinzel (Majestic Traditional), Oswald (Tall Impact), Georgia, JetBrains Mono.
- **Font Size & Weight**: Interactive sliders from 20px to 80px base scale; weights from Light 300 to Black 900.
- **Style & Alignment**: Italic toggle, ALL-CAPS toggle, Left/Center/Right horizontal alignment.
- **Color & Swatches**: HEX color picker + church palette chips (Celestial White, Warm Amber, Gold, Rose, Cyan, Emerald).
- **Overlay Legibility & Stroke**: Broadcast drop shadow with blur slider and high-contrast text outlines (crucial for live camera feeds).
- **Backgrounds**: Ambient Motion Gradients, Solid Colors, Static Gradients, or Transparent vMix mode.
- **1-Click Style Presets**: _Midnight Celestial_, _Golden Glory_, _Deep Ocean Praise_, _Majestic Cinzel_, _Broadcast Lower-Third_, _Ruby Horizon_.

### 2. Service Schedule & Sets Manager (Left Column)

- **Save & Reload Sets**: Create custom Sunday service setlists, name them, save to disk, and reload anytime.
- **Item Reordering**: Move songs/scriptures up and down in the service order or remove them.
- **Export & Import**: Export all service sets as JSON backup.

### 3. Live Monitor & Slide Grid (Center Column)

- **Live Output Screen**: Real-time 16:9 preview with next-line preview prompts.
- **Slide Tiles**: Click any verse stanza/line to jump straight to it.
- **Auto-Advance Playback Bar**: Play, Pause, Skip, Restart, and WPM reading speed slider with live line duration calculator.
- **Quick Slide Editor**: In-place editor to add, reorder, or edit verse lines on the fly.
- **Keyboard Shortcuts**:
  - `Space` — Play / Pause auto-advance
  - `→` / `PageDown` — Next slide
  - `←` / `PageUp` — Previous slide
  - `Home` / `End` — First / Last slide
  - `R` — Restart from beginning

### 4. Live Broadcast Panic Bar (Top Bar)

- **`BLACK`** — Instant blackout for projector/stream.
- **`CLEAR`** — Clear text overlay while retaining background.
- **`LOGO`** — Display church logo graphic.
- **`TICKER ALERT`** — Broadcast instant emergency nursery or pastor alert banner across all live screens.

---

## 📺 Display Endpoints

### 1. Sanctuary Projector / TV (`http://<host-ip>:3000/display`)

- Clean full-screen display with styled backgrounds, smooth slide crossfades, optional title badges, and auto-advance progress bars.

### 2. vMix / OBS Alpha Overlay (`http://<host-ip>:3000/display?overlay=1`)

- Transparent background with high-contrast text outlines, lower-third or centered layout, optimized for live streaming camera inputs.

### 3. Stage Confidence Monitor (`http://<host-ip>:3000/stage`)

- High-visibility stage monitor for worship leaders, choir, and pastors showing current line in giant bold text, next slide prompt, countdown timer, and live digital clock.

---

## 📂 Song & Scripture Library

- Built-in rich library with Psalms, John 3:16, Philippians 4, Amazing Grace, Way Maker, and Great Is Thy Faithfulness.
- Built-in Smart Parser: Paste new lyrics or verses and split into slides by single line or by stanzas (paragraphs).
- Search filter by title, lyrics, or category.
