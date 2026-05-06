# Match the Mockup — Title + Buttons Overhaul

Goal: get the menu visually as close to the Gemini mockup as possible. Two-row title with a blob-shaped bubble that hugs the letters, glossy candy buttons with no white ring, and solid (non-transparent) buttons by default.

## 1. Title — "Word Rumble" (two rows + gooey blob)

Rewrite `src/components/BubbleTitle.tsx`:

- **Layout**: Accept `lines: string[]` (e.g. `['Word', 'Rumble']`) so the title renders on two rows like the mockup, with "Rumble" slightly larger / offset.
- **Bubble shape that follows letters**: Use an SVG goo filter wrapped around the text. Behind the text, render one rounded rect per row (slightly oversized) inside an SVG `<filter>` using `feGaussianBlur` + `feColorMatrix` (classic gooey effect). The two blurred rectangles merge into a single organic blob that hugs the letter shapes — exactly the mockup look.
- **Bubble fill**: very light translucent white/blue gradient (`rgba(200,225,255,0.55)` → `rgba(255,255,255,0.35)`) with a soft inner highlight stripe at the top and a thin white outline (`stroke="#ffffff" stroke-width="3"`) drawn after the blur via a second SVG layer so the rim stays crisp.
- **Letter style** (closer to mockup "glossy candy" letters):
  - Font: switch from `Luckiest Guy` to **`Bagel Fat One`** (closer match — chunkier, rounder). Add Google Fonts link in `index.html`.
  - Per-letter palette per row: row 1 = blue/green/red/yellow ("Word"), row 2 = red/orange/yellow/green/blue/purple ("Rumble") — sampled from mockup.
  - Effects: `WebkitTextStroke: 4px #ffffff`, `paintOrder: stroke fill`, plus an inset glossy highlight using a second `<span>` layer with `background-clip: text` and a top-to-middle white→transparent gradient. Drop shadow `0 4px 0 rgba(30,40,90,0.35), 0 8px 14px rgba(0,0,0,0.3)`.
  - Slight per-letter rotation (±3°) and varied `translateY` for hand-drawn feel.
- Keep the small ✦ sparkle decorations.

Update `MainMenu.tsx` to pass `lines={['Word','Rumble']}`.

## 2. Buttons — `MenuButton.tsx`

Rewrite to match the mockup's "solid jelly pill" look:

- **Remove** `ring-2 ring-white/70 ring-inset` (this is the "too much white" the user dislikes).
- **Solid base color** (no transparency on the button surface), e.g. blue = `#3B82F6`. Add a subtle vertical gradient `linear-gradient(180deg, lighten 8% → base → darken 10%)` for depth.
- **Top gloss**: keep the inner top highlight, but thinner (`top-1 h-[40%]`, `rgba(255,255,255,0.45) → transparent`).
- **Bottom edge**: add an inset bottom shadow `inset 0 -4px 0 rgba(0,0,0,0.18)` to give the "candy lip" look.
- **Outer shadow**: soft drop shadow `0 6px 0 rgba(0,0,0,0.18), 0 10px 18px rgba(0,0,0,0.25)`.
- **Border**: 2px outer border in a slightly darker shade of the button color (not white) — gives the colored contour the mockup has.
- Shape stays `rounded-full`, sizes unchanged.
- Text: white, `font-extrabold`, drop-shadow `0 2px 0 rgba(0,0,0,0.25)`.

Result: solid candy pill with a colored rim and zero white ring.

## 3. Back button — `BackButton` in `MenuButton.tsx`

Currently translucent + white ring. Change to:

- Solid fill (default purple `#7C3AED` or theme-matched), same jelly treatment as `MenuButton` (gradient, top gloss, dark bottom inset, colored darker border).
- Optional `tone` prop (`'purple' | 'red' | …`) so different pages can color it.
- Keep arrow icon. Bigger contour so it's clearly visible on any background.

## 4. Theme-aware transparency

The user wants solid by default, but translucent OK when "Cosmic Night" theme is active.

- Read `settings.background` from `SettingsContext` inside `MenuButton`/`BackButton`.
- If `background === 'cosmic'` (or whichever id corresponds to Cosmic Night), apply a `bg-opacity` reduction + backdrop-blur variant. Otherwise stay fully solid.
- This keeps Storybook (default), Treasure Map, etc. fully readable.

## 5. Files touched

- `index.html` — add Bagel Fat One font.
- `src/components/BubbleTitle.tsx` — full rewrite (SVG gooey + 2 rows).
- `src/components/MenuButton.tsx` — restyle `MenuButton` and `BackButton`, theme-aware transparency.
- `src/pages/MainMenu.tsx` — pass two-line title.
- No other pages need changes (they all already use `BubbleTitle` + `MenuButton`/`BackButton`).

## Honest expectations

- Two-row title with gooey blob + Bagel Fat One letters will look very close to the mockup (~90%).
- Buttons will match the mockup's solid candy style essentially 1:1.
- Pixel-perfect blob curvature depends on SVG filter tuning — may need one quick follow-up iteration after you see it live.
