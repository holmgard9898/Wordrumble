## Mål

Just nu ignorerar matchmakingen språk helt — alla spelare hamnar i samma kö och alla brickor genereras med svensk bokstavspool på servern. Vi gör matchmakingen språk-strikt och låser varje match till det språk den startades med.

## Vad som ändras

### 1. Databas (migration)

- Lägg till kolumn `language text NOT NULL DEFAULT 'sv'` på `matchmaking_queue` och `matches`.
- Backfill: alla befintliga rader får `'sv'` (det är det enda språket som faktiskt funkat hittills).
- Index på `matchmaking_queue (mode, language)` och `matches (status, mode, language, player2_id)` för snabb sökning.
- Uppdatera triggern `enforce_matches_update_rules` så `language` läggs till i listan över oföränderliga fält (klient kan inte byta språk på en pågående match).

### 2. Edge functions: `find-match` och `create-open-match`

- Ta emot `language` i body (validera mot vitlistan av språk).
- Filtrera öppna matcher och kö-rader på både `mode` och `language`.
- Duplicera letterPool + letterValues från `src/data/languages.ts` in i funktionen (en map per språk) och använd rätt pool när rutnät genereras.
- Skriv `language` på nya rader i `matches` och `matchmaking_queue`.

### 3. Klient

- I `MultiplayerMenu.tsx` (och `NewMatchFlow.tsx` om den används): skicka `settings.language` med varje `find-match` / `create-open-match`-anrop.
- Polling-querien som väntar på match filtreras på `language = settings.language` så vi inte plockar upp en match på fel språk.
- `MatchList.tsx` visar små språkflaggor och kan filtreras / sorteras så användaren ser vilka matcher som är på vilket språk.

### 4. Spela på rätt språk inuti en match

- `MultiplayerGamePage.tsx`: hämta `match.language` från DB och använd det språket för ordlista, bokstavsvärden och `validCharPattern` istället för användarens aktuella UI-språk. Då fungerar din situation: en tysk match som du startade förblir tysk även om du byter UI till svenska efteråt.
- Visa språkflaggan i `VersusHeader` så det är tydligt.

### 5. Edge case: språk-byte mitt i sökning

- Om användaren byter språk i settings medan `searching` är true: avbryt sökningen automatiskt (ta bort sig från kön) och visa toast "Sökning avbruten – språk ändrades". Förhindrar att man hamnar i fel kö.

## Vad som inte ändras

- Singleplayer-spel påverkas inte.
- AI-matcher (`is_ai_match`) skapas redan klient-side i användarens språk — får bara `language` ifylld korrekt.
- Existerande pågående matcher fortsätter spelas på svenska (backfill).

## Teknisk detalj

```text
matchmaking_queue
  + language text not null default 'sv'

matches
  + language text not null default 'sv'
  + index (status, mode, language, player2_id)
```

Edge function (förenklat):
```ts
const { mode, language } = body;
const cfg = LANG_CONFIGS[language];
// filter: .eq("language", language).eq("mode", pickedMode)
// generate grid using cfg.letterPool / cfg.letterValues
// insert: { mode, language, ... }
```

Klient (förenklat):
```ts
await supabase.functions.invoke('find-match', {
  body: { mode, language: settings.language }
});
```

## Svar på din direkta fråga

Idag: **nej**, det filtreras inte på språk, så ja — en tysk spelare och en svensk spelare kan matchas, och brädet servern genererar är dessutom alltid svenskt (ÅÄÖ). Det är troligen därför du såg konstiga matcher i statistiken. Att du inte hittade någon när du sökte slumpvis berodde antagligen bara på tom kö, inte språkfilter.

Efter den här ändringen: matcher du startar låses till språket du har när du söker, och de visas bara för andra spelare som har samma språk valt.
