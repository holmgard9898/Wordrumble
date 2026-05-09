## Mål

1. Visa tutorial-popup vid **varje** äventyrsnivå (även om den spelats förut).
2. Göra tutorial-rutorna **interaktiva**: spelaren swipar själv en bokstav i en minirutnät för att stava ett ord.
3. Ordet i den interaktiva rutan **anpassas efter språk** (t.ex. CAT / KATT).
4. Lägg till en **animerad tecknad vit handske** som visuellt visar swipe-rörelsen (med ett vitt spår bakom), som vägledning. Spelaren utför själv den faktiska handlingen.
5. Förberedelse för nästa steg: bygga ut Map 2 (ersätta placeholder-nivåerna). Görs i ett separat steg.

---

## Steg 1 – Alltid visa tutorial i Adventure

I `AdventureGamePage.tsx`:
- Ta bort dagens `showIntro`-flow (texten i `level.intro`) som första modal — ersätt med en ny `<AdventureTutorialModal />` som öppnas alltid när nivån laddas.
- Modalen visar:
  1. Korta intro-text (från `level.intro[lang]`) + målet (från goalText).
  2. Lägesspecifika tutorial-steg från `getTutorialSteps(level.mode ?? 'classic', lang)` (samma som klassiskt läge).
  3. Sista sidan = "Spela!" knapp som stänger.
- Gated på `ready` (efter att spelet är initierat) precis som idag.
- **Ingen** koppling till `useTutorialSeen` här — visas alltid.

## Steg 2 – Interaktiva tutorial-steg

Skapa ny komponent `src/components/tutorial/InteractiveSwapDemo.tsx`:
- Litet 4x4-rutnät av "bubblor" (samma stil som spelets `Bubble`).
- Tar in ett mål-ord (`targetWord`, t.ex. "CAT"/"KATT") och placerar bokstäverna i rutnätet på ett sätt så att en bokstav är **3 positioner** ifrån sin slutposition (för att visa fri svajping till skillnad mot Candy Crush).
- Spelaren swipar bokstaven steg för steg. När bokstaven är på rätt plats och hela ordet bildats → "klart"-state och tutorialen kan gå vidare ("Nästa"-knapp aktiveras).
- Färger: alla bokstäver i ordet får **samma färg** (t.ex. grön) för att visa "samma färg = ord". Övriga bubblor får andra färger för kontrast.
- Vid mount: animerad "hint"-hand pekar på den felplacerade bokstaven och ritar en streckad vit linje längs vägen den ska swipas. Loopar tills spelaren rört vid bubblan.

Skapa `src/components/tutorial/AnimatedHand.tsx`:
- En liten SVG/PNG-hand (vit handske, tecknad stil — lägg under `src/assets/hand-pointer.svg`, jag genererar den med `imagegen`).
- Animation: hand glider från startpos → slutpos längs vald axel; bakom följer en mjukt fade:ad vit svans (CSS box-shadow eller en SVG `<path>` som ritas med `stroke-dashoffset`).
- Loopar med 1s paus mellan varje svep.
- Pausar/försvinner när spelaren börjar interagera.

## Steg 3 – Språkanpassade demo-ord

Lägg till en map i `src/data/tutorials.tsx`:
```ts
const DEMO_WORDS: Record<GameLanguage, string> = {
  en: 'CAT', sv: 'KATT', de: 'KATZ', es: 'GATO', fr: 'CHAT',
  it: 'GATTO', pt: 'GATO', nl: 'KAT', no: 'KATT', da: 'KAT', fi: 'KISSA',
};
```
- `getTutorialSteps` byter ut det nuvarande "Same color forms words"-steget mot ett interaktivt steg som använder `DEMO_WORDS[lang]`.
- Den befintliga statiska `MiniGrid`-visualiseringen tas bort där den ersätts. Behåll den för andra steg som bara förklarar (t.ex. "5+ letters only" för fiveplus).

## Steg 4 – TutorialModal stöd för interaktiva steg

I `src/components/TutorialModal.tsx`:
- Lägg till valfritt `interactive?: boolean` och `onComplete?: () => void` på `TutorialStep`.
- Om `interactive` är true: dölj "Nästa"-pilen tills `onComplete` triggats (rendrera ändå "Hoppa över" som liten länk för accessibility).
- "Visual" får ta över hela kortets innehåll (utan body-text) när det är interaktivt, för plats.

## Steg 5 – Adventure: använd tutorial efter rätt mode

`AdventureGamePage` skickar `level.mode ?? 'classic'` till `getTutorialSteps`. Bombnivåer får alltså bombstegen, surge får surgestegen, etc. Hidden-word/find-words-nivåer faller tillbaka på classic-stegen + en extra slide som förklarar målet (kommer från `level.intro` + `goalText`).

## Steg 6 – Nästa loop (inte i denna omgång)

- Designa ut Map 2-nivåerna (`adv-2-1` … `adv-2-N`) med riktiga mål, ord, lägen, bakgrunder och progression Earth → Moon → Earth.
- Lägga till intro-texter på alla språk.

---

## Tekniska detaljer

**Filer som skapas**
- `src/components/tutorial/InteractiveSwapDemo.tsx`
- `src/components/tutorial/AnimatedHand.tsx`
- `src/assets/hand-pointer.svg` (genererad bild – tecknad vit handske)

**Filer som ändras**
- `src/components/TutorialModal.tsx` – stöd för interaktiva steg
- `src/data/tutorials.tsx` – DEMO_WORDS, byter ut "find words"-steget mot interaktivt
- `src/pages/AdventureGamePage.tsx` – ersätt `showIntro` med tutorial-modal som visas varje gång; ingen `useTutorialSeen`
- `src/pages/GamePage.tsx` – inga funktionella ändringar, men interaktivt steg fungerar automatiskt

**Beteendekontrakt**
- I klassiskt läge: tutorialen visas fortfarande bara första gången (via `useTutorialSeen`).
- I adventure: visas alltid.
- Spelaren kan inte gå vidare i ett interaktivt steg utan att slutföra (kan dock stänga hela modalen via X eller "Hoppa över").

