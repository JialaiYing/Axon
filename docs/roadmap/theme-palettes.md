# Theme palettes — token source of truth

**Status:** Spec for M2 unlockable dark palettes (`product-requirements.md` §4).  
**Consumers:** `src/app/globals.css` (`data-palette` overrides), `src/lib/palettes/catalog.ts`, Settings Appearance, Rank unlock preview.  
**Rule:** implement CSS by copying these tables — do not invent new hex values in code.

City / skyline and ambient Dashboard WebGL backgrounds are **out of scope**. Rank stays. Unlock ≠ equip.

---

## Scope

### In scope (dark unlocks)
Remap these CSS variables per `data-palette` when `data-theme="dark"`:

| Role | CSS variable(s) | UI meaning |
|------|-----------------|------------|
| Page canvas | `--color-background` | App shell page |
| Chrome | `--color-surface` | Sidebar, header |
| Modules | `--color-card`, `--color-card-hover` | Panels, cards |
| Edges | `--color-border`, `--color-border-strong` | Hairlines |
| Text | `--color-foreground`, `--color-muted`, `--color-muted-foreground` | Primary → tertiary |
| Primary action | `--color-accent`, `-foreground`, `-muted` | Buttons, links, focus rings, active chrome |
| Secondary chrome | `--color-secondary`, `-foreground`, `-muted` | Rare secondary UI (not subject colors) |
| Soft fills | `--color-wash`, `--color-wash-strong` | Hover / active washes (accent-tinted) |

### Impact rules
Palette swaps must change the **whole dashboard aesthetic**, not just the page canvas:

1. Surfaces carry a clear **hue cast** (blue / frost / green / warm brown / mauve)—not gray-with-a-hint.
2. `foreground` / `muted` / `muted-foreground` visibly tint toward the palette (IDE-like), not stay near Axon gray.
3. `accent` is the **signature color** of the theme (primary buttons, focus rings, progress, active sidebar).
4. `wash` / `accent-muted` are **accent-tinted**, not neutral white overlays.
5. Chrome (sidebar active item, header icon hover) follows accent — see implementer notes.

### Out of scope / frozen across unlocks
Keep these **Axon-stable** on every dark palette (do not remap in `data-palette` blocks):

| Token / surface | Hex / rule |
|-----------------|------------|
| `--color-success` | `#3dba6e` |
| `--color-success-muted` | `#122d1e` |
| `--color-warning` | `#e0a03a` |
| `--color-warning-muted` | `#33260e` |
| `--color-danger` | `#e05555` |
| `--color-danger-muted` | `#331515` |
| Streak flame heat | Uses `warning` → `danger` only |
| Rank trophy metals | `--color-trophy-*` (defined once; never overridden by palette) |
| Subject board / Analytics colors | Separate fixed hex list (M2 subject colors) |

Trophy metal tokens (dark):

| Token | Hex | Use |
|-------|-----|-----|
| `--color-trophy-iron` | `#6e6e73` | Novice |
| `--color-trophy-pewter` | `#8a8a8f` | Apprentice |
| `--color-trophy-silver` | `#c8c8cc` | Fellow |
| `--color-trophy-steel` | `#5b8def` | Mentor (Axon blue, fixed) |
| `--color-trophy-sapphire` | `#4a7ae0` | Luminary |
| `--color-trophy-amethyst` | `#8b7ec8` | Magister (Axon violet, fixed) |

Copper / bronze / gold use `warning` opacities; emerald uses `success`.

### Light mode
`data-theme="light"` stays the **single** light alternate. Unlockable palettes are **dark-only**: when light is active, ignore `data-palette`. Do not ship light variants in this phase.

### Attribute contract
- `html[data-theme="dark"|"light"]` — mode
- `html[data-palette="axon"|"tokyo-night"|"nord"|"everforest"|"gruvbox"|"rose-pine"]` — dark palette id (meaningful only when dark)

Marketing routes (`/`, `/login`, `/privacy`, `/terms`, `/faq`) always force dark + `axon`.

---

## Unlock gates

| Id | Display name | Unlock level | Notes |
|----|--------------|--------------|-------|
| `axon` | Axon Dark | 1 (always) | Theme zero — never locked |
| `tokyo-night` | Tokyo Night | **1** | Starter — personalization from day one |
| `nord` | Nord | **1** | Starter — personalization from day one |
| `everforest` | Everforest Dark | **3** | First gated unlock |
| `gruvbox` | Gruvbox Dark | **7** | Second gated unlock |
| `rose-pine` | Rosé Pine | **13** | Third gated unlock |

Unlock notifications fire only for gated unlocks (`everforest`, `gruvbox`, `rose-pine`) — not starters.

---

## Palette tables

### Axon Dark — `axon` (default)

Current product dark. Source: existing `@theme` / `[data-theme="dark"]` in `globals.css`.

| Token | Hex |
|-------|-----|
| background | `#0a0a0a` |
| surface | `#111111` |
| card | `#161616` |
| card-hover | `#1c1c1c` |
| border | `#232323` |
| border-strong | `#333333` |
| foreground | `#f5f5f5` |
| muted | `#8a8a8f` |
| muted-foreground | `#6e6e73` |
| accent | `#5b8def` |
| accent-foreground | `#f0f4fc` |
| accent-muted | `#141a28` |
| secondary | `#8b7ec8` |
| secondary-foreground | `#f3efff` |
| secondary-muted | `#241f38` |
| wash | `rgba(91, 141, 239, 0.10)` |
| wash-strong | `rgba(91, 141, 239, 0.16)` |

Preview swatch: background `#0a0a0a` + accent `#5b8def`.

---

### Tokyo Night — `tokyo-night`

Upstream: [Tokyo Night](https://github.com/enkia/tokyo-night-vscode-theme) (Night). Signature = blue chrome; secondary = magenta. Punchier surfaces and accent-tinted washes so the swap reads as a blue IDE, not a gray tint.

| Token | Hex | Upstream cue |
|-------|-----|--------------|
| background | `#16161e` | Deeper night canvas |
| surface | `#1a1b26` | Editor bg as chrome |
| card | `#24283b` | Storm panel |
| card-hover | `#2f3549` | Elevated |
| border | `#3b4261` | Soft split |
| border-strong | `#565f89` | Comment edge |
| foreground | `#c0caf5` | Primary fg |
| muted | `#a9b1d6` | Soft fg |
| muted-foreground | `#787c99` | Dim comment (readable) |
| accent | `#7aa2f7` | Blue |
| accent-foreground | `#16161e` | On-accent |
| accent-muted | `#1e2438` | Blue wash fill |
| secondary | `#bb9af7` | Magenta |
| secondary-foreground | `#16161e` | |
| secondary-muted | `#2a2038` | |
| wash | `rgba(122, 162, 247, 0.12)` | |
| wash-strong | `rgba(122, 162, 247, 0.20)` | |

Preview swatch: background `#16161e` + accent `#7aa2f7`.

---

### Nord — `nord`

Upstream: [Nord](https://www.nordtheme.com/docs/colors-and-palettes) Polar Night + Frost. Signature = frost cyan (`nord8`); secondary = aurora purple (`nord15`).

| Token | Hex | Upstream |
|-------|-----|----------|
| background | `#2e3440` | nord0 |
| surface | `#3b4252` | nord1 |
| card | `#434c5e` | nord2 |
| card-hover | `#4c566a` | nord3 |
| border | `#4c566a` | nord3 |
| border-strong | `#81a1c1` | nord9 edge |
| foreground | `#eceff4` | nord6 |
| muted | `#d8dee9` | nord4 |
| muted-foreground | `#88c0d0` | nord8 as tertiary tint |
| accent | `#88c0d0` | nord8 |
| accent-foreground | `#2e3440` | |
| accent-muted | `#3a4a55` | |
| secondary | `#b48ead` | nord15 |
| secondary-foreground | `#2e3440` | |
| secondary-muted | `#3f3548` | |
| wash | `rgba(136, 192, 208, 0.14)` | |
| wash-strong | `rgba(136, 192, 208, 0.22)` | |

Preview swatch: background `#2e3440` + accent `#88c0d0`.

---

### Everforest Dark — `everforest`

Upstream: [Everforest](https://github.com/sainnhe/everforest) Dark Medium. Signature = green (`statusline1` / green); secondary = purple.

| Token | Hex | Upstream |
|-------|-----|----------|
| background | `#232a2e` | bg_dim |
| surface | `#2d353b` | bg0 |
| card | `#343f44` | bg1 |
| card-hover | `#3d484d` | bg2 |
| border | `#475258` | bg3 |
| border-strong | `#4f585e` | bg4 |
| foreground | `#d3c6aa` | fg |
| muted | `#9da9a0` | grey2 |
| muted-foreground | `#859289` | grey1 |
| accent | `#a7c080` | green |
| accent-foreground | `#232a2e` | |
| accent-muted | `#2f3d34` | bg_green-ish |
| secondary | `#d699b6` | purple |
| secondary-foreground | `#232a2e` | |
| secondary-muted | `#3a3038` | |
| wash | `rgba(167, 192, 128, 0.14)` | |
| wash-strong | `rgba(167, 192, 128, 0.22)` | |

Preview swatch: background `#232a2e` + accent `#a7c080`.

---

### Gruvbox Dark — `gruvbox`

Upstream: [Gruvbox](https://github.com/morhetz/gruvbox) Dark Hard. Signature = orange; secondary = aqua. Warm brown surfaces.

| Token | Hex | Upstream |
|-------|-----|----------|
| background | `#1d2021` | bg0_h |
| surface | `#282828` | bg0 |
| card | `#3c3836` | bg1 |
| card-hover | `#504945` | bg2 |
| border | `#665c54` | bg3 |
| border-strong | `#7c6f64` | bg4 |
| foreground | `#ebdbb2` | fg |
| muted | `#a89984` | gray2 / soft |
| muted-foreground | `#928374` | gray |
| accent | `#fe8019` | orange |
| accent-foreground | `#1d2021` | |
| accent-muted | `#3a2a1a` | |
| secondary | `#8ec07c` | aqua |
| secondary-foreground | `#1d2021` | |
| secondary-muted | `#2a3328` | |
| wash | `rgba(254, 128, 25, 0.14)` | |
| wash-strong | `rgba(254, 128, 25, 0.22)` | |

Preview swatch: background `#1d2021` + accent `#fe8019`.

---

### Rosé Pine — `rose-pine`

Upstream: [Rosé Pine](https://rosepinetheme.com/palette/) (main variant). Signature = Iris (muted lavender/purple); secondary = Gold for warm/cool contrast. Deliberately soft and desaturated — quieter than the other unlocks, not a neon purple.

| Token | Hex | Upstream |
|-------|-----|----------|
| background | `#191724` | Base |
| surface | `#1f1d2e` | Surface |
| card | `#26233a` | Overlay |
| card-hover | `#403d52` | Highlight Med |
| border | `#524f67` | Highlight High |
| border-strong | `#6e6a86` | Muted |
| foreground | `#e0def4` | Text |
| muted | `#908caa` | Subtle |
| muted-foreground | `#6e6a86` | Muted |
| accent | `#c4a7e7` | Iris |
| accent-foreground | `#191724` | |
| accent-muted | `#2a2340` | |
| secondary | `#f6c177` | Gold |
| secondary-foreground | `#191724` | |
| secondary-muted | `#33291c` | |
| wash | `rgba(196, 167, 231, 0.14)` | |
| wash-strong | `rgba(196, 167, 231, 0.22)` | |

Preview swatch: background `#191724` + accent `#c4a7e7`.

---

## Behavior notes (for implementers)

1. **Unlock ≠ equip** — crossing an unlock level only unlocks the id in Appearance; never auto-apply mid-session.
2. **Locked selection** — Settings tiles show “Lvl N” and cannot be selected; if stored `paletteId` is locked, fall back to `axon`.
3. **FOUC** — layout inline script must set both `data-theme` and `data-palette` before paint; allowlist all six ids.
4. **Chrome accent** — sidebar active row uses `bg-accent-muted` + `text-accent` icon; idle stays muted. Header icon buttons hover toward accent.
5. **Shadows / radii / fonts** — unchanged across palettes.
6. **Axon wash** — even the default palette uses accent-tinted wash (not pure white) so active chrome stays coherent.

---

## Change control

When adjusting a hex:
1. Edit this file first.
2. Mirror into `globals.css` / catalog in the same change.
3. Note the reason in the PR or commit (contrast, upstream correction, etc.).
