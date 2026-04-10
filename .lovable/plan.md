

## Problem: Why the page freezes

The AI opponent (`simulateAIRound`) runs **synchronously on the main thread** inside a `setTimeout(..., 500)`. For each of its 50 moves, it calls `findBestSwap` which tests **all 160 possible swaps** (10×8 grid × 2 directions), and for each swap copies the grid and scans for words. That's ~8,000 full grid scans per AI round — all blocking the UI. When the AI plays multiple sub-turns (e.g. 50+25 moves in Classic), the browser locks up completely.

## Solution: Web Worker for AI computation

Move the AI simulation into a **Web Worker** so it runs off the main thread. The UI stays responsive with a loading indicator while the AI "thinks."

### Steps

1. **Create a Web Worker file** (`src/workers/aiWorker.ts`)
   - Move `findWordsInGrid`, `findBestSwap`, `calcScore`, `simulateAIRound`, and all helper functions into this standalone file
   - Accept messages with grid, mode, moves, shared words, difficulty
   - Post back the `AIRoundResult` when done

2. **Update `useAIOpponent.ts`**
   - Instead of calling `simulateAIRound` directly, instantiate the Web Worker
   - `runAIRound` sends a message to the worker and returns a Promise that resolves when the worker posts back results
   - Add cleanup on unmount

3. **Update Vite config** (if needed)
   - Vite supports `new Worker(new URL(...), { type: 'module' })` out of the box — no extra config needed

4. **Keep the multiplayer page as-is**
   - The `MultiplayerGamePage` already shows loading states during `ai-playing` and `waiting-opponent` phases — those will now actually work because the UI thread is free

5. **Optional optimization: early termination**
   - If `findBestSwap` finds a word of length ≥7, stop searching (good enough)
   - This reduces worst-case scan time significantly

### Technical detail

```text
Main Thread                    Web Worker
───────────                    ──────────
postMessage({grid, mode, ...})  ──→  simulateAIRound(...)
   (UI stays responsive)              (heavy computation)
   ←──  postMessage(AIRoundResult)
resolve Promise
```

No database changes, no new tables, no edge functions needed. This is a purely client-side fix.

