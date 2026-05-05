## Mål
Byt standardutseendet till den lekfulla stilen från mockupen. Gammal stil finns kvar i temaväljaren så vi enkelt kan byta tillbaka.

## Ändringar

### 1. Ny standardbakgrund "Sagolandet"
- Generera en ny bakgrundsbild i samma stil som mockupen (ljusblå himmel med moln, gröna kullar, slott till höger, stuga, stig) via Lovable AI (Nano banana pro för hög kvalitet).
- Spara som `src/assets/bg-storybook.jpg`.
- Lägg till `'storybook'` i `GameBackground`-typen i `SettingsContext.tsx` och mappa den i `useGameBackground.ts`.
- Sätt `defaultSettings.background = 'storybook'` så nya spelare möts av den direkt. Befintliga spelare som redan har sparat tema behåller sitt val (vi rör inte deras localStorage).
- Lägg in den som valbar i bakgrundsväljaren (kollar `SettingsPage.tsx`/shop) så man kan byta tillbaka till "default" (Cosmic Night) eller annat.

### 2. Lekfull titel-logo "Word Rumble"
- Ersätt nuvarande `h1` på `MainMenu.tsx` med en bubbel-stiliserad logo:
  - Font: behåll `Fredoka One` (matchar mockupens runda glada bokstäver), men öka storlek och lägg på:
    - Vit tjock `-webkit-text-stroke` (ca 6–8px) + en yttre mörkblå stroke via `text-shadow` (multipla offsets) för dubbel-outline-effekten i mockupen.
    - Per-bokstavs färger: W blå, o grön, r gul, d blå · R röd, u orange, m gul, b grön, l blå, e röd (renderas som spans).
    - Mjuk `drop-shadow` nedåt för djup.
  - Bubbla runt: en pill-formad container bakom titeln med ljusblå halvtransparent fyllning, vit ring (`ring-4 ring-white/80`), `rounded-[3rem]`, padding och inre highlight (gradient-overlay top→transparent) för glansig bubbel-känsla. Små ✨-ikoner kring titeln.
- Ta bort undertiteln "Bubble word game" (`<p>{t.subtitle}</p>`).

### 3. Rundare, "godis"-knappar
- Skapa en lokal knappstil i `MainMenu.tsx` (eller ny `MenuButton`-komponent) som överstyr standard Button:
  - `rounded-full` (helt pill-formade), `h-16` på huvudknappar, `h-12` på Statistik/Inställningar.
  - Tjock vit inre kant (`ring-2 ring-white/70 ring-inset`) + yttre mörk skugga för 3D-känsla.
  - Topp-glans: `::before` pseudo via en inre `<span>` med vit gradient (vit 40% → transparent) på övre halvan.
  - Behåll befintliga gradient-färger (blå/röd/gul/grön/lila) men öka mättnad något så det matchar mockupens poppiga ton.
  - Ikon vänsterställd i en liten cirkel? Nej — håll enkelt: ikon + text centrerat som idag, men större font (`text-xl`, `font-extrabold`).

### 4. Återställbarhet
- Inga andra sidor (GamePage, Shop osv.) ändras visuellt — endast MainMenu + standardbakgrund.
- Eftersom det bara är default-värdet + en ny CSS-klass kan vi snabbt rulla tillbaka genom att sätta `background: 'default'` och återställa `MainMenu.tsx`.

## Filer som ändras
- `src/contexts/SettingsContext.tsx` — lägg till `'storybook'`, ändra default.
- `src/hooks/useGameBackground.ts` — mappa `storybook` → ny bild.
- `src/assets/bg-storybook.jpg` — ny genererad bild.
- `src/pages/MainMenu.tsx` — ny logo-komponent, borttagen subtitle, nya pill-knappar.
- `src/index.css` — små helpers för bubbel-text-stroke och knapp-glans om Tailwind inte räcker.
- Ev. `src/pages/SettingsPage.tsx` eller där bakgrunder listas — lägg till "Storybook" som val (gratis/upplåst).

## Risker / noter
- Genererad bakgrundsbild kan behöva 1–2 iterationer för att matcha mockupen. Jag QA:ar bilden visuellt innan jag committar.
- Multi-color text-stroke kräver per-bokstav spans — lite extra markup men inga nya beroenden.
