## Mål

I äventyrsnivåer av typen **find-words** och **hidden-word** ska de ord som krävs för att klara nivån **alltid gå att kombinera** på brädet — både direkt vid start och kontinuerligt under spelets gång. När bubblor poppas och nya genereras ska systemet se till att minst en färg fortfarande har alla bokstäver som behövs för varje icke-funnet målord. Spelaren behöver inte veta om detta — det är en tyst "frustration-saver".

## Nuvarande beteende

- `buildSeededGrid` (i `useGameState.ts`) planterar målord vid start i samma färg. Bra.
- `refillBubble` viktar bara nya bubblor mot målbokstäver med 45% sannolikhet och **slumpar färg**. Det finns ingen garanti att hidden-word eller find-words-orden förblir formbara.
- `hidden-word`-nivåer skickar bara *thematicWords* som seed — själva det dolda ordet (t.ex. SKEPP) seedas inte alls.
- Inga checks görs efter popp + refill att ord fortfarande är formbara.

## Steg 1 – Definiera "formability"

Lägg till hjälpare i `src/utils/gridGeneration.ts`:

```ts
export function colorHasLetters(grid, word, color): boolean
// True om gridet har minst N exemplar av varje bokstav i `word` med given färg
// (count med multiplicitet — KATT kräver 2 st T i samma färg).

export function wordIsFormable(grid, word): boolean
// True om någon färg uppfyller colorHasLetters(grid, word, color).

export function findBestColorForWord(grid, word): { color, missing: Record<letter, count> } | null
// Returnerar färgen som är "närmast" att kunna forma ordet (minst antal saknade bokstäver),
// och en map över hur många bokstäver av varje sort som saknas.
```

## Steg 2 – Utöka AdventureSeed

I `useGameState.ts`:

```ts
export interface AdventureSeed {
  targetWords: string[];
  maxMoves?: number;
  /** Words that must remain formable in some color throughout the game. */
  keepFormableWords?: string[];
}
```

Lägg till en ref `keepFormableRef` med dessa ord, och en setter via en ny exporterad funktion `setRemainingFormableWords(words)` så att `AdventureGamePage` kan ta bort ord ur listan när spelaren hittat dem (slipper onödigt arbete).

## Steg 3 – Garantera initial formability

Utöka `buildSeededGrid`:

1. Plantera `targetWords` precis som idag.
2. För varje ord i `keepFormableWords` som **inte** redan finns i en enskild färg på brädet (efter steg 1), välj en färg och *plantera även det ordet* (en bokstav per cell, samma färg) på lediga / icke-konflikterande positioner.
3. Kör fortfarande `ensureGridHasNoWords` så vi inte börjar med färdiga ord.

Detta löser hidden-word-fallet: SKEPP planteras vid start.

## Steg 4 – Garantera fortsatt formability vid refill

Skapa ny funktion i `gridGeneration.ts`:

```ts
export function repairFormability(
  grid, requiredWords: string[],
  newCells: { row: number; col: number }[],  // celler som just genererats
  values, pool
): BubbleData[][]
```

Logik:
1. För varje ord i `requiredWords`:
   - Om `wordIsFormable(grid, word)` → hoppa över.
   - Annars: hitta `findBestColorForWord(grid, word)`. Om någon `newCells`-cell redan har den färgen, byt dess bokstav till en av de saknade. Annars: byt en av `newCells` (helst en i en kolumn som tillhör samma färg-cluster, annars valfri) till bokstav + färg som saknas.
2. Iterera tills alla `requiredWords` är formbara, eller `newCells` är slut. Om vi inte räcker till: använd även gamla bubblor från brädet i nödfall (sällsynt, men en sista fallback för att garantera invarianten).
3. Kör `ensureGridHasNoWords` igen för att inte oavsiktligt ha skapat ett färdigt ord på raden.

I `useGameState.ts`:
- Efter `popAndCascade`s `newGrid`-bygge (raden där `setGrid(newGrid)` anropas, ~rad 595) — kör `repairFormability` med de nya cellerna (positionerna i `newBubbles`) **innan** `setGrid`.
- Samma sak i `fireRocket` (~rad 711) för raketkolumnen.

Tracking av nya celler: i refill-loopen håll reda på `(r, c)` för varje `newBubbles[i]` så vi kan skicka in dem till `repairFormability`.

## Steg 5 – AdventureGamePage skickar in rätt ord

I `adventureSeed`-memon:

- **find-words**: `keepFormableWords = words.filter(w => !foundTargets.includes(w))`
- **hidden-word**: `keepFormableWords = [hiddenWord, ...thematicWordsEjFunna]`
- **andra typer**: lämna tomt.

Eftersom `useGameState` lever genom hela nivån behöver vi en reaktiv uppdatering. Två alternativ:

1. **Enkelt**: Exponera `setKeepFormableWords` från `useGameState`. Adventure-sidan har en effekt som synkar varje gång `usedWords`/`hiddenFoundCount` ändras.
2. Alternativt: Adventure passerar en callback `getKeepFormable()` som useGameState läser via ref vid varje refill. Mindre re-renders.

Vi går på alternativ 2 (ref-baserad) för minimal omrendrering.

## Steg 6 – Sanity-test

Lägg till ett vitest-fall i `src/test/gridGeneration.test.ts`:

- Bygg ett rutnät där SKEPP-bokstäver bara finns i röd, ta bort ett P (simulera popp), kör `repairFormability` med `requiredWords = ['SKEPP']` och en lista nya celler. Förvänta att `wordIsFormable(result, 'SKEPP') === true` efteråt.

## Tekniska detaljer

**Filer som ändras**
- `src/utils/gridGeneration.ts` – nya helpers `colorHasLetters`, `wordIsFormable`, `findBestColorForWord`, `repairFormability`.
- `src/hooks/useGameState.ts` – `AdventureSeed.keepFormableWords` + ref, plantera dem i `buildSeededGrid`, applicera `repairFormability` i `popAndCascade` och `fireRocket`, exponera setter/ref-uppdatering.
- `src/pages/AdventureGamePage.tsx` – beräkna `keepFormableWords` reaktivt och synka in i game-hooken.
- `src/test/gridGeneration.test.ts` – nytt test.

**Beteendekontrakt**
- Find-words och hidden-word-nivåer: målorden är *garanterat* formbara i någon färg från start och efter varje refill, **såvida inte** ordet redan hittats av spelaren.
- Övriga lägen (classic, surge, bomb, fiveplus): oförändrat beteende.
- Inga ändringar är synliga för spelaren — bara mindre frustration.

**Edge-cases**
- Om brädet är så fullt att ingen färg kan rymma ordet ens med ompositionering: byt ut äldre bubblor (inte bara `newCells`) som sista utväg.
- Multipla `keepFormableWords` som delar bokstäver: en enda repair-runda tillåts dela bidrag (samma S-bubbla räcker för båda).
- Bomb mode (adv-4) påverkas inte eftersom den inte är hidden-word/find-words.
