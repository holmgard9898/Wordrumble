# Adventure 3-1: "The Crash" — Fixed-Board Puzzle Level

A short, hand-crafted puzzle level. Same start every time per language, single-word goal, storytelling intro.

## Behavior

- Board is 100% pre-determined per language (letters + colors fixed at start)
- Goal: find one word — Swedish `LJUS`, translated correctly to each of the 11 languages (`light`, `licht`, `luz`, `lumière`, `luce`, `licht`, `lys`, `lys`, `valo`...)
- Move limit per language, tuned so the obvious approach is ~2 moves short of solving, but a creative ~3-move trick (pop a 5+ letter word in a key column → a needed letter falls into reach) makes it solvable
- The target word's letters all share ONE color on the board; other copies of those letters in other colors are decoys
- Completion: as soon as the target word is found, level ends in success
- Goal UI shows just `Hitta LJUS` / `Find LIGHT` (no list of multiple words)

## Storytelling intro (3 tutorial cards before the level starts)

1. `AHHHH!!!` (translated: `Aaah!`, `¡Aaah!`, etc.)
2. `Ser ut som vi kraschat... var är vi?` / `Looks like we crashed... where are we?`
3. `Jag har en ficklampa... oj, vi är i en grotta. Mina batterier håller på att ta slut — vi måste hitta LJUS.` (translated, with the target word substituted in each language)

Shown only the first time the player enters `adv-3-1` (using the existing `useTutorialSeen` mechanism with key `adv-3-1`).

## Technical changes

### `src/data/adventureLevels.ts`

- Add new optional fields on `AdventureLevel`:
  - `presetGrid?: Record<GameLanguage, Array<Array<{ letter: string; color: BubbleColor }>>>` — 10×8 fixed start grid per language
  - `maxMovesByLang?: Record<GameLanguage, number>` — overrides `maxMoves`
  - `storyIntro?: Array<Record<GameLanguage, { title: string; body: string }>>` — ordered cards
- Add new goal variant: `{ type: 'single-word'; word: Record<GameLanguage, string> }` (or reuse `find-words` with length-1 array + a `singleWordLabel` flag — implementation detail)
- Replace existing `adv-3-1` config with the puzzle level (cave background, icon `🔦`, name something like "Kraschen" / "The Crash")

### `src/data/gameConstants.ts` / `src/hooks/useGameState.ts`

- `createGrid` accepts an optional `preset` param; when provided, builds the grid from the preset instead of randomising
- `useGameState` plumbs `level.presetGrid?.[lang]` into the initial grid
- Refill behaviour after pops stays random (only the start state is fixed) — confirm this matches the user's intent (see open question)

### `src/pages/AdventureGamePage.tsx`

- Read `maxMovesByLang?.[lang]` before falling back to `maxMoves`
- Render the new `single-word` goal: header `Hitta LJUS` (translated), no word list, completion when that exact word is played
- If `storyIntro` is set, show those cards via `TutorialModal` on first entry (key `adv-3-1`); skip the generic mode tutorial for this level

### Per-language board design (initial Swedish draft)

Swedish target `LJUS`, color = blue. Move limit = 10. Minimum "naive" solution = 12 swaps. Creative solution:
- A blue `J` sits in row 0 (top) of column 4
- Player spells a 5-letter blue word in column-adjacent rows using 3 swaps; the column pops, the `J` falls 4 rows down, and `LJUS` becomes formable in the remaining moves
- I will design and verify each language's board (letters + colors) the same way: confirm by simulation that the minimum-moves solution exists at the stated cap and the naive path is ≥2 over

### Tutorial / translations

- Add the three story strings to `src/data/translations.ts` (or inline in the level config under `storyIntro`)
- `src/components/TutorialModal.tsx` already supports custom step arrays — no component changes needed

## Out of scope

- No changes to the map graphic, portals, or other Adventure 3 levels
- Background stays `cave` (already added)

## Open questions before I implement

1. After the player pops bubbles, should the **refill letters** also be deterministic (fully scripted level) or random (only the starting state is fixed)? Random keeps it simple; deterministic guarantees the puzzle but is much more work.
2. Should I design all 11 language boards now, or ship Swedish + English first and iterate on the others?
3. If the player runs out of moves without finding the word, normal "out of moves" failure — correct?
