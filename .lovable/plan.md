## Mörka Skogen (adv-3-3) — ny powerup + smitta

### Del 1: Nivån adv-3-3
- Behåll samma config som tidigare (klassisk, samma drag och målord som du valt). Lägg till på brädet:
  - 2× powerup `swapcolor` (ny)
  - 1× powerup `swapletter` (befintlig)
  - 1 startsmittad bokstav

### Del 2: Ny powerup `swapcolor`
- Lägg till `'swapcolor'` i `PowerupType` (`gameConstants.ts`).
- `Bubble.tsx`: ny `PowerupBadge` variant — visa t.ex. `🎨` med lila gradient.
- I `useGameState.ts` / popup-flödet (där `swapletter` triggar val-modal): trigga en motsvarande **välj färg**-popup när en bricka med `swapcolor` ingår i ett ord. Användaren väljer ny färg på en valfri bricka på brädet (samma UX som byt bokstav, fast färgknappar med de 5 bubbel-färgerna).
- Återanvänd existerande modal-komponent för byt bokstav som mall — skapa `ColorSwapPopup.tsx` om enklare.

### Del 3: Smitta (infection) — endast adventure 3
Ny fält på `BubbleData`:
- `infected?: number` — drag kvar tills smittan sprids (start 5)
- `dead?: boolean` — bokstaven är spöke
- `deadCounter?: number` — drag sedan död (efter 5 → −1 poäng/drag)

Regler:
1. Vid nivåstart: minst 1 slumpmässig bokstav får `infected = 5`.
2. Efter varje spelarens drag, för varje smittad bricka: dekrementera räknaren.
   - Vid 0: alla 4 ortogonala grannar (ej rocks/asteroider/satelliter/spöken) blir smittade (`infected = 5`). Den ursprungliga brickans räknare blir `7` (tid till död).
   - Faktiskt enklare modell enligt brief: håll **två** räknare per smittad: `spreadIn` (5) och `dieIn` (7). När `spreadIn` når 0 sprids smitta; när `dieIn` når 0 dör brickan.
3. När en smittad bricka används i ett ord → smittan rensas (bricka poppar som vanligt).
4. När död: `dead = true`, `deadCounter = 0`, ej klickbar/swappbar/del av ord. Render: opacity ~0.45, behåll bokstaven, lägg 👻-overlay.
5. Varje drag: `deadCounter++`. När `deadCounter > 5` → totalpoäng −1 per drag tills brickan rensas (visa flytande `−1` popup på den brickan).
6. Spöken kan rensas genom att en intilliggande swap orsakar att en boost/bomb poppar dem? Brief säger "om den inte kombineras i ett ord" — så spöket måste poppas via ord. Eftersom dead inte kan ingå i ord behövs en mekanik. **Tolkning**: bomb/explosion eller kaskad pop på sammanstötande popping rensar spöket. Enklast: när intilliggande pop sker rensas spöket också. Implementeras genom att utvidga pop-set med adjacenta `dead`-brickor.

### Del 4: Plumbing
- `adventureLevels.ts`: adv-3-3 får `infection: true` flagga + powerup-placeringar.
- `AdventureGamePage.tsx`: skicka `infection` flaggan vidare till `useGameState`.
- `useGameState.ts`: hook in infection-tick i `performSwap` efter pop-resolution.
- `Bubble.tsx`: rendera infected (grön glöd/sjuk-tint), dead (genomskinlig + 👻).
- `BonusMovePopup` redan stödjer custom label → används för `−1` per spöke.

### Tekniska detaljer
- Byt-färg modalen: identisk layout som byt-bokstav, 5 stora färgknappar (samma `BUBBLE_COLOR_STYLES`).
- Smittans visuella: `box-shadow: 0 0 8px hsl(110, 80%, 40%)` + liten `🦠` badge bottom-left.
- Spöke: opacity 0.45, blur(0.5px), `👻` badge top-left, ingen `value` visas, ej `cursor-pointer`.
- Ord-detektion (`findWords`): exkludera `dead` brickor (samma sätt som `rock`).
- Kolumn-blockerare: spöken **blockerar inte** refill (de kan rensas), så lämnas utanför `getColumnBlockers`.

### Filer som ändras
- `src/data/gameConstants.ts` — `PowerupType`, `BubbleData` (infected/dead/deadCounter)
- `src/components/game/Bubble.tsx` — render infected/dead, ny powerup-badge
- `src/components/game/ColorSwapPopup.tsx` — ny
- `src/hooks/useGameState.ts` — infection-tick, swapcolor flöde, spök poäng-drain
- `src/data/adventureLevels.ts` — adv-3-3 config
- `src/pages/AdventureGamePage.tsx` — skicka infection flagga
