# Mjukare bomb-spawn

Just nu: timers slumpas alltid 10–20, oavsett hur många bomber som redan finns eller om bokstaven är en sällsynt vokal. Enda skyddet är att om 3 bomber spawnar samtidigt höjs den lägsta till ≥13. Det är samma logik i singleplayer Bomb-läge och i äventyrsnivåer som kör `mode: 'bomb'` (en gemensam funktion `addBombsToGrid` i `src/hooks/useGameState.ts`).

## Nya minimi-drag

Räkna "ordinal" = antal bomber som redan finns + bombens index i den nya batchen (1-baserat). Sätt minimum baserat på ordinal, och höj extra om bokstaven är en sällsynt vokal (LETTER_VALUES ≥ 4 — i praktiken inga standardvokaler i engelska poolen, men reglerna gäller om ett språkpaket ger en vokal ≥4p).

| Ordinal (= existerande + denna i batchen) | Min normal | Min sällsynt vokal (≥4p) |
|---|---|---|
| 1 | 10 | 12 |
| 2 | 15 | 17 |
| 3+ | 20 | 21 |

Exempel:
- 0 bomber finns, 1 spawnar → min 10
- 0 finns, 2 spawnar samtidigt → båda min 15
- 0 finns, 3 spawnar samtidigt → alla tre min 20
- 1 finns, 1 ny → min 15
- 2 finns, 1 ny → min 20

Slumptal genereras fortfarande 10–20; om resultatet är under min höjs det till min. Tidigare specialregeln "om batch≥3, höj lägsta till 13" tas bort (ersätts av nya tabellen).

## Ändringar

**`src/hooks/useGameState.ts`**
- Uppdatera `addBombsToGrid(grid, count, vowelSet)`:
  1. Räkna `existing = countBombs(grid)` innan tilldelning.
  2. För varje ny bomb i batchen, beräkna `ordinal = existing + i + 1`.
  3. Hämta basminimum från tabellen ovan.
  4. Kolla `LETTER_VALUES[grid[p.row][p.col].letter] >= 4` → använd kolumnen sällsynt vokal.
  5. Sätt timer = `max(randomTimer, minForOrdinal)`.
- Ta bort gamla "if (toAdd >= 3) lowest≥13"-blocket.

Gäller automatiskt både vanliga Bomb-läget och äventyrsnivåer eftersom båda går via samma funktion.

## Att verifiera

- Befintligt test (om något) i `src/test/` passerar fortfarande.
- Snabb manuell körning i Bomb-läget och i en äventyrs-bomb-nivå för att se att första bomben kan ha låg timer men efterföljande får högre.
