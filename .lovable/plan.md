

# Plan: Nya språk, musik-fix, splash/ikoner och reklam

## Viktig info innan vi börjar

**F-Droid fungerar inte** for ditt syfte. F-Droid kräver att appen är 100% öppen källkod utan proprietära beroenden och utan reklam/tracking. Eftersom du vill ha reklam i appen passar inte F-Droid.

**Amazon Appstore fungerar** -- gratis utvecklarkonto, accepterar Android APK-filer. Men de accepterar inte längre webb-appar (sedan okt 2024), så du behöver bygga en riktig APK via Capacitor. Du kan inte göra det direkt i Lovable -- du behöver exportera till GitHub och bygga lokalt med Android Studio.

**Alternativ till F-Droid:** Fortsätt med PWA (installera via Safari/Chrome) + Amazon Appstore via Capacitor-APK. PWA:n fungerar redan idag.

---

## Steg 1: Lägga till nya språk (ordlistor + översättningar)

Nya språk att lägga till: **spanska (es), franska (fr), italienska (it), portugisiska (pt), nederländska (nl), norska (no), danska (da), finska (fi)**

Varje språk behöver:
- Ordlista-URL (gratis GitHub-ordlistor finns för alla dessa)
- Bokstavsvärden (anpassade efter språkets bokstavsfrekvens, liknande Scrabble)
- Bokstavspool, vokaler, teckenvalidering, blockerade namn
- Alla ~120 UI-översättningssträngar i `translations.ts`

**Filer som ändras:**
- `src/data/languages.ts` -- ny typ `GameLanguage` utökad, 8 nya `LanguageConfig`-objekt
- `src/data/translations.ts` -- alla ~120 nycklar får 8 nya språkvarianter
- `src/contexts/SettingsContext.tsx` -- inga ändringar behövs (typen uppdateras via languages.ts)

## Steg 2: Fixa musik som fortsätter spela i bakgrunden

Problemet: När du lämnar appen (PWA) fortsätter `<audio>` att spela.

**Lösning:** Lyssna på `visibilitychange`-eventet i `useBackgroundMusic.ts` och `useMenuMusic.ts` -- pausa musik när `document.hidden === true`, återuppta när appen blir synlig igen.

**Filer som ändras:**
- `src/hooks/useBackgroundMusic.ts`
- `src/hooks/useMenuMusic.ts`

## Steg 3: Splash screen och app-ikoner

Skapar professionella ikoner och splash screen för Word Rumble:
- Generera en snygg app-ikon (512x512 och 192x192) med spelets tema
- Lägga till en splash screen-konfiguration i PWA-manifestet
- Uppdatera `index.html` med korrekta meta-taggar för iOS splash

**Filer som ändras:**
- `public/icon-192.png`, `public/icon-512.png` (nya ikoner)
- `vite.config.ts` (PWA splash-konfiguration)
- `index.html` (apple-touch-startup-image meta-taggar)

**Obs:** Jag behöver antingen generera ikoner programmatiskt eller be dig ladda upp en bild du vill använda som bas.

## Steg 4: Reklam-implementering

Eftersom appen primärt körs som PWA (inte native via Capacitor), kan vi inte använda AdMob direkt. Alternativ:

**A) Förbereda AdMob för Capacitor-bygget (Amazon Appstore)**
- Installera `@capacitor-community/admob`
- Implementera rewarded ads i shop-sidan (knappen "Se reklam" → visa 30s video → ge 0.5 coins)
- Implementera interstitial ads (visa mellan spelomgångar)
- Kräver att du skapar ett AdMob-konto på admob.google.com (gratis)

**B) Webb-baserade annonser för PWA-versionen**
- Google AdSense kan visa bannerannonser i webben
- Begränsning: Inga rewarded video-ads i webbläsaren
- Knappen "Se reklam" i shoppen kan bara fungera i native-versionen

**Rekommendation:** Implementera en abstraktion som detekterar om appen körs som PWA eller native, och visar rätt annonstyp.

**Filer som ändras/skapas:**
- `src/hooks/useAds.ts` (ny hook för annonslogik)
- `src/pages/Shop.tsx` (koppla rewarded ads till "Se reklam"-knappen)
- `src/pages/GamePage.tsx` (interstitial mellan spel)

## Steg 5: Capacitor-setup för Amazon Appstore

Installerar och konfigurerar Capacitor så du kan bygga en APK:
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`
- `capacitor.config.ts` med app-ID och hot-reload mot sandbox
- Du exporterar sedan till GitHub, klonar lokalt, kör `npx cap add android` och öppnar i Android Studio

**Filer som skapas:**
- `capacitor.config.ts`
- `package.json` (nya dependencies)

---

## Sammanfattning av prioritering

| Steg | Vad | Komplexitet |
|------|-----|-------------|
| 1 | 8 nya språk | Stor (mycket text) |
| 2 | Musik-fix bakgrund | Liten |
| 3 | Ikoner & splash | Medel |
| 4 | Reklam | Medel |
| 5 | Capacitor-setup | Liten |

Vill du att jag kör allt detta, eller vill du prioritera vissa steg först?

