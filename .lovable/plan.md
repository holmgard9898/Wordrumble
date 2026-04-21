

## Plan: Slider fix, explosion origin, Adventure mode foundation

### 1. Slider mobile touch fix (`src/components/ui/slider.tsx`)
- Radix's `Slider.Root` already uses pointer events but our `touch-none` on both Root and Thumb is fine — the real issue is the parent Settings page scroll container intercepts the gesture. Wrap the slider in a stop-propagation pointer handler and add `style={{ touchAction: 'none' }}` explicitly. Also enlarge the thumb hit area to `h-7 w-7` and add a transparent padding zone.
- Verified: native HTML `<input type="range">` is more reliable on mobile WebKit. **Switch the volume sliders in `SettingsPage.tsx` and `InGameMenu.tsx` to a styled native range input** as a robust fallback (still themed white-from-left).

### 2. Explosion origin fix (`GameOverOverlay.tsx`)
The overlay is `fixed inset-0` (full viewport) but the bomb cell percentage is currently computed as `(col+0.5)/8 * 100%` of the viewport — wrong because the board isn't viewport-wide.
- Fix: pass the bomb cell's screen-pixel coordinates from `GameBoard` via a ref. Add `boardRef` in `GameBoard.tsx` exposing `getCellRect(row, col)`. `GamePage` reads this when `gameOver && explodedAt` is set and passes pixel `{x, y}` to `GameOverOverlay`. Render the radial gradient at those exact pixels.

### 3. Adventure Mode (new feature)

**Routes & navigation**
- New route `/adventure` → `AdventureMap.tsx` (treasure-map style, scrollable horizontally for future).
- Add an "Adventure" tile to the Shop's Other section (replace the "coming-soon" stub) → navigates to `/adventure`.
- Also add an "Adventure" entry point on `SingleplayerMenu.tsx` (so it's reachable from Play too).

**Adventure data model** (`src/data/adventureLevels.ts`)
```ts
type AdventureGoal = 
  | { type: 'find-words'; words: Record<GameLanguage, string[]>; minLength?: number }
  | { type: 'reach-score'; target: number }
  | { type: 'find-long-word'; minLength: number };

interface AdventureLevel {
  id: string;            // 'adv-1'
  name: Record<GameLanguage, string>;
  background: GameBackground;     // 'beach' | 'shipwreck' | 'underwater' | 'volcano' | 'cave' | 'space' | 'clouds' | 'city'
  goal: AdventureGoal;
  intro: Record<GameLanguage, string>;
  unlocksBackground?: GameBackground;  // 'cave' unlocks via first cave level
  mapPosition: { x: number; y: number };  // % on map
}
```

**Initial 7 levels** (themes & order):
1. Beach 1 — find 5 words (4–6 letters, easy)
2. Beach 2 — reach 30 points
3. Beach 3 — find 5 words including one 6-letter
4. Shipwreck — find 5 nautical-themed words
5. Underwater (deep sea) — reach 50 points
6. Volcano 1 — find a 7-letter word
7. Space — find 5 words
8. Blue Sky (hot-air balloon) — reach 60 points

Word lists per language (curated, similar difficulty across en/sv/de/etc).

**Map UI (`AdventureMap.tsx`)**
- SVG canvas, treasure-map parchment texture background.
- Landmasses positioned: bottom = beach island (3 nodes), middle-left = shipwreck on rocks, middle = deep sea (1 node), middle-right = volcano island (1 node), top = island with rocket + balloon (2 nodes).
- Dashed SVG paths between adjacent unlocked levels.
- Each level node: round button with icon + number, locked nodes greyed out with padlock.
- Horizontally scrollable container (`overflow-x-auto`) for future expansion.

**Level intro modal** (`AdventureIntro.tsx`)
- Shown before starting. Big icon, level name, goal description, "Start" / "Back" buttons.

**Adventure gameplay (`AdventureGamePage.tsx`)**
- Reuses `useGameState` (classic mode, but with a custom goal checker layered on top).
- Background **forced** to the level's bg via a temporary override prop on `useGameBackground` (does NOT modify `settings.background` — the user's purchased bg in settings remains active everywhere else).
- For `find-words` levels: render a sidebar/topbar `WordGoalList` showing the target words; when found, line through with `<s>` but keep visible.
- On goal completion → success screen with coins + "Next level" / "Back to map" buttons.
- Mark level as completed in `useAdventureProgress` (localStorage).
- If level has `unlocksBackground`, call `unlock()` on the matching shop item.

**Progress hook** (`src/hooks/useAdventureProgress.ts`)
- Tracks `completedLevels: Set<string>` in localStorage.
- `isLevelUnlocked(id)` — first level always unlocked, subsequent require previous completed.

### 4. New backgrounds (4 generated images)
Generate via Lovable AI (nano banana pro for quality):
- `bg-underwater.jpg` — Little Mermaid style: corals, fish, soft blue light rays, sandy floor.
- `bg-shipwreck.jpg` — abandoned wooden boat washed up, holes in hull (Lilla Tråget vibe).
- `bg-cave.jpg` — stone cave walls lit by orange torches, warm flickering light.
- `bg-city.jpg` — cartoon city skyline at twilight, lit windows, soft gradient sky.

Add to:
- `GameBackground` union in `SettingsContext.tsx`
- `useGameBackground.ts` (with `override` parameter for adventure)
- `bgShopItems` in `shopData.ts`:
  - Underwater: 450 coins
  - Shipwreck: 250 coins
  - Cave: achievement (complete first cave adventure level)
  - City: 300 coins
- `bgPreviews` in `Shop.tsx`

### 5. Shop name localization
Add translation keys for previously hard-coded names: `shopCosmicNight`, `shopBlueSky`, `shopRubik`, `shopUnderwater`, `shopShipwreck`, `shopCave`, `shopCity`. Wire all 11 languages.

### 6. Memory update
Update `mem://features/planned` — Adventure mode now in progress; add `mem://features/adventure` documenting structure.

## Technical details
- **Slider robustness**: native `<input type="range">` styled via Tailwind + custom CSS for `::-webkit-slider-thumb` and `::-webkit-slider-runnable-track`. Background gradient `linear-gradient(to right, white 0% X%, rgba(0,0,0,0.4) X% 100%)` for the fill-from-left effect on iOS/Android.
- **Explosion pixel position**: forward a ref from `GameBoard` exposing `getCellRect(r,c) → DOMRect`. In `GamePage`, capture once when `explodedAt` becomes non-null, store `{x,y}` in state, pass to overlay.
- **Adventure background override**: extend `useGameBackground(override?: GameBackground)` to take an optional override. Existing callers unchanged.
- **Goal checking** layered on `useGameState`: `useEffect` watching `usedWords` / `score`; calls `onLevelComplete` when satisfied.

## Open question
Adventure entry point — pick one or both:
1. From Shop (replaces current "coming soon" tile)
2. From Singleplayer Menu (new tile alongside Classic / Surge / 5+ / Bomb / OneWord)
3. Both (recommended)

I'll go with **both** unless you tell me otherwise.

