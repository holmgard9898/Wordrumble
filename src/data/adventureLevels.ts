import type { GameLanguage } from './languages';
import type { GameBackground } from '@/contexts/SettingsContext';
import type { GameMode } from '@/pages/GamePage';

export type AdventureGoal =
  | { type: 'find-words'; words: Record<GameLanguage, string[]> }
  | { type: 'reach-score'; target: number }
  | { type: 'find-long-word'; minLength: number }
  | { type: 'survive-moves'; moves: number };

export interface AdventureLevel {
  id: string;
  number: number;
  name: Record<GameLanguage, string>;
  intro: Record<GameLanguage, string>;
  background: GameBackground;
  goal: AdventureGoal;
  /** Game mode rules to use for this level. Defaults to classic. */
  mode?: GameMode;
  /** Show progress bar against goal (e.g. score target). */
  showProgressBar?: boolean;
  /** Optional shop item id to unlock when this level is completed */
  unlocksShopItem?: string;
  /** Position on the map as % of map width/height */
  mapPosition: { x: number; y: number };
  /** Connects (line drawn) to these other level ids */
  connectsTo: string[];
  icon: string;
  /** Override default moves (e.g. easier early levels) */
  maxMoves?: number;
}

// Helper: word lists curated to be of similar difficulty across languages.
const wl = (
  en: string[], sv: string[], de: string[], es: string[], fr: string[], it: string[],
  pt: string[], nl: string[], no: string[], da: string[], fi: string[],
): Record<GameLanguage, string[]> => ({ en, sv, de, es, fr, it, pt, nl, no, da, fi });

export const adventureLevels: AdventureLevel[] = [
  {
    id: 'adv-1', number: 1, icon: '🏖️',
    name: { en: 'Sandy Shore', sv: 'Sandstrand', de: 'Sandstrand', es: 'Costa Arena', fr: 'Plage Sable', it: 'Spiaggia', pt: 'Praia', nl: 'Strand', no: 'Sandstrand', da: 'Sandstrand', fi: 'Hiekkaranta' },
    intro: {
      en: 'Find 5 words to begin your adventure!',
      sv: 'Hitta 5 ord för att börja ditt äventyr!',
      de: 'Finde 5 Wörter, um dein Abenteuer zu beginnen!',
      es: '¡Encuentra 5 palabras para empezar la aventura!',
      fr: 'Trouvez 5 mots pour commencer votre aventure !',
      it: 'Trova 5 parole per iniziare la tua avventura!',
      pt: 'Encontre 5 palavras para começar a aventura!',
      nl: 'Vind 5 woorden om je avontuur te beginnen!',
      no: 'Finn 5 ord for å starte eventyret!',
      da: 'Find 5 ord for at starte eventyret!',
      fi: 'Löydä 5 sanaa aloittaaksesi seikkailun!',
    },
    background: 'beach',
    goal: { type: 'find-words', words: wl(
      ['sand', 'wave', 'shell', 'palm', 'boat'],
      ['sand', 'våg', 'snäcka', 'palm', 'båt'],
      ['sand', 'welle', 'muschel', 'palme', 'boot'],
      ['mar', 'ola', 'concha', 'palma', 'arena'],
      ['sable', 'vague', 'mer', 'palme', 'plage'],
      ['mare', 'onda', 'sole', 'palma', 'sabbia'],
      ['areia', 'onda', 'mar', 'palma', 'barco'],
      ['zand', 'golf', 'schelp', 'palm', 'boot'],
      ['sand', 'bølge', 'skjell', 'palme', 'båt'],
      ['sand', 'bølge', 'musling', 'palme', 'båd'],
      ['hiekka', 'aalto', 'simpukka', 'palmu', 'vene'],
    ) },
    mapPosition: { x: 18, y: 82 },
    connectsTo: ['adv-2'],
    maxMoves: 100,
  },
  {
    id: 'adv-2', number: 2, icon: '⚡',
    name: { en: 'Word Surge Beach', sv: 'Word Surge-strand', de: 'Wortwelle', es: 'Ola de Palabras', fr: 'Vague de Mots', it: 'Onda Parole', pt: 'Onda Palavras', nl: 'Woordgolf', no: 'Ordbølge', da: 'Ordbølge', fi: 'Sana-aalto' },
    intro: {
      en: 'Word Surge! Reach 80 points in 50 moves. Long words give bonus moves!',
      sv: 'Word Surge! Nå 80 poäng på 50 drag. Långa ord ger bonusdrag!',
      de: 'Wortwelle! Erreiche 80 Punkte in 50 Zügen. Lange Wörter geben Bonuszüge!',
      es: '¡Ola de Palabras! Consigue 80 puntos en 50 movimientos.',
      fr: 'Vague de Mots ! 80 points en 50 coups.',
      it: 'Onda di Parole! 80 punti in 50 mosse.',
      pt: 'Onda de Palavras! 80 pontos em 50 jogadas.',
      nl: 'Woordgolf! 80 punten in 50 zetten.',
      no: 'Ordbølge! 80 poeng på 50 trekk.',
      da: 'Ordbølge! 80 point på 50 træk.',
      fi: 'Sana-aalto! 80 pistettä 50 siirrolla.',
    },
    background: 'beach',
    mode: 'surge',
    goal: { type: 'reach-score', target: 80 },
    showProgressBar: true,
    mapPosition: { x: 32, y: 78 },
    connectsTo: ['adv-3'],
    maxMoves: 50,
  },
  {
    id: 'adv-3', number: 3, icon: '🏖️',
    name: { en: 'Hidden Cove', sv: 'Dold vik', de: 'Versteckte Bucht', es: 'Cala Oculta', fr: 'Crique', it: 'Insenatura', pt: 'Enseada', nl: 'Verborgen Baai', no: 'Skjult Vik', da: 'Skjult Bugt', fi: 'Salainen Lahti' },
    intro: {
      en: 'Find a 6-letter word!',
      sv: 'Hitta ett ord med 6 bokstäver!',
      de: 'Finde ein 6-Buchstaben-Wort!',
      es: '¡Encuentra una palabra de 6 letras!',
      fr: 'Trouvez un mot de 6 lettres !',
      it: 'Trova una parola di 6 lettere!',
      pt: 'Encontre uma palavra de 6 letras!',
      nl: 'Vind een woord van 6 letters!',
      no: 'Finn et ord på 6 bokstaver!',
      da: 'Find et ord på 6 bogstaver!',
      fi: 'Löydä 6-kirjaiminen sana!',
    },
    background: 'beach',
    goal: { type: 'find-long-word', minLength: 6 },
    mapPosition: { x: 46, y: 73 },
    connectsTo: ['adv-4'],
  },
  {
    id: 'adv-4', number: 4, icon: '💣',
    name: { en: 'Bomb Wreck', sv: 'Bombvrak', de: 'Bombenwrack', es: 'Naufragio Bomba', fr: 'Épave Bombe', it: 'Relitto Bomba', pt: 'Naufrágio Bomba', nl: 'Bommenwrak', no: 'Bombevrak', da: 'Bombevrag', fi: 'Pommihylky' },
    intro: {
      en: 'Bombs everywhere! Score 120 points before they explode!',
      sv: 'Bomber överallt! Nå 120 poäng innan de exploderar!',
      de: 'Bomben überall! Erreiche 120 Punkte bevor sie explodieren!',
      es: '¡Bombas! ¡Consigue 120 puntos antes de explotar!',
      fr: 'Bombes ! 120 points avant l\'explosion !',
      it: 'Bombe! 120 punti prima dell\'esplosione!',
      pt: 'Bombas! 120 pontos antes de explodir!',
      nl: 'Bommen! 120 punten voor ze ontploffen!',
      no: 'Bomber! 120 poeng før de eksploderer!',
      da: 'Bomber! 120 point før de eksploderer!',
      fi: 'Pommeja! 120 pistettä ennen räjähdystä!',
    },
    background: 'shipwreck',
    mode: 'bomb',
    goal: { type: 'reach-score', target: 120 },
    mapPosition: { x: 14, y: 64 },
    connectsTo: ['adv-5'],
  },
  {
    id: 'adv-5', number: 5, icon: '🐠',
    name: { en: 'Deep Sea', sv: 'Djuphavet', de: 'Tiefsee', es: 'Mar Profundo', fr: 'Mer Profonde', it: 'Mare Profondo', pt: 'Mar Profundo', nl: 'Diepzee', no: 'Dyphavet', da: 'Dybhavet', fi: 'Syvämeri' },
    intro: {
      en: 'Find 5 sea-themed words!',
      sv: 'Hitta 5 havsord!',
      de: 'Finde 5 Meereswörter!',
      es: '¡Encuentra 5 palabras del mar!',
      fr: 'Trouvez 5 mots marins !',
      it: 'Trova 5 parole marine!',
      pt: 'Encontre 5 palavras do mar!',
      nl: 'Vind 5 zeewoorden!',
      no: 'Finn 5 havord!',
      da: 'Find 5 havord!',
      fi: 'Löydä 5 merisanaa!',
    },
    background: 'underwater',
    goal: { type: 'find-words', words: wl(
      ['fish', 'reef', 'coral', 'shark', 'whale'],
      ['fisk', 'haj', 'val', 'korall', 'rev'],
      ['fisch', 'hai', 'wal', 'koralle', 'riff'],
      ['pez', 'mar', 'coral', 'tiburón', 'ballena'],
      ['poisson', 'corail', 'requin', 'baleine', 'récif'],
      ['pesce', 'corallo', 'squalo', 'balena', 'scoglio'],
      ['peixe', 'coral', 'tubarão', 'baleia', 'recife'],
      ['vis', 'koraal', 'haai', 'walvis', 'rif'],
      ['fisk', 'hai', 'hval', 'korall', 'rev'],
      ['fisk', 'haj', 'hval', 'koral', 'rev'],
      ['kala', 'hai', 'valas', 'koralli', 'riutta'],
    ) },
    mapPosition: { x: 38, y: 50 },
    connectsTo: ['adv-6'],
    maxMoves: 60,
  },
  {
    id: 'adv-6', number: 6, icon: '🌋',
    name: { en: 'Volcano Bombs', sv: 'Vulkanbomber', de: 'Vulkanbomben', es: 'Bombas Volcán', fr: 'Bombes Volcan', it: 'Bombe Vulcano', pt: 'Bombas Vulcão', nl: 'Vulkaanbommen', no: 'Vulkanbomber', da: 'Vulkanbomber', fi: 'Tulivuoripommit' },
    intro: {
      en: 'Survive 90 moves in Bomb Mode!',
      sv: 'Överlev 90 drag i Bombläge!',
      de: 'Überlebe 90 Züge im Bombenmodus!',
      es: '¡Sobrevive 90 movimientos en modo Bomba!',
      fr: 'Survivez 90 coups en mode Bombe !',
      it: 'Sopravvivi a 90 mosse in modalità Bomba!',
      pt: 'Sobreviva 90 jogadas no modo Bomba!',
      nl: 'Overleef 90 zetten in Bommenmodus!',
      no: 'Overlev 90 trekk i Bombemodus!',
      da: 'Overlev 90 træk i Bombetilstand!',
      fi: 'Selviä 90 siirrosta pommitilassa!',
    },
    background: 'volcano',
    mode: 'bomb',
    goal: { type: 'survive-moves', moves: 90 },
    mapPosition: { x: 70, y: 50 },
    connectsTo: ['adv-7'],
  },
  {
    id: 'adv-7', number: 7, icon: '🎈',
    name: { en: 'Sky High', sv: 'Högt i skyn', de: 'Hoch am Himmel', es: 'Alto Cielo', fr: 'Haut Ciel', it: 'Cielo Alto', pt: 'Céu Alto', nl: 'Hoog in de Lucht', no: 'Høyt i Luften', da: 'Højt på Himlen', fi: 'Korkealla' },
    intro: {
      en: 'Find 5 sky-themed words!',
      sv: 'Hitta 5 luftord!',
      de: 'Finde 5 Himmelswörter!',
      es: '¡Encuentra 5 palabras del cielo!',
      fr: 'Trouvez 5 mots du ciel !',
      it: 'Trova 5 parole del cielo!',
      pt: 'Encontre 5 palavras do céu!',
      nl: 'Vind 5 luchtwoorden!',
      no: 'Finn 5 luftord!',
      da: 'Find 5 luftord!',
      fi: 'Löydä 5 ilmasanaa!',
    },
    background: 'clouds',
    goal: { type: 'find-words', words: wl(
      ['cloud', 'wind', 'bird', 'sky', 'kite'],
      ['moln', 'vind', 'fågel', 'himmel', 'drake'],
      ['wolke', 'wind', 'vogel', 'himmel', 'drachen'],
      ['nube', 'viento', 'pájaro', 'cielo', 'ave'],
      ['nuage', 'vent', 'oiseau', 'ciel', 'aile'],
      ['nuvola', 'vento', 'uccello', 'cielo', 'ala'],
      ['nuvem', 'vento', 'pássaro', 'céu', 'asa'],
      ['wolk', 'wind', 'vogel', 'lucht', 'vlieger'],
      ['sky', 'vind', 'fugl', 'himmel', 'drage'],
      ['sky', 'vind', 'fugl', 'himmel', 'drage'],
      ['pilvi', 'tuuli', 'lintu', 'taivas', 'leija'],
    ) },
    mapPosition: { x: 56, y: 32 },
    connectsTo: ['adv-8'],
    maxMoves: 60,
  },
  {
    id: 'adv-8', number: 8, icon: '🚀',
    name: { en: 'Rocket Launch', sv: 'Raketuppskjutning', de: 'Raketenstart', es: 'Lanzamiento', fr: 'Lancement', it: 'Lancio', pt: 'Lançamento', nl: 'Lancering', no: 'Rakettoppskyting', da: 'Raketopsendelse', fi: 'Raketin laukaisu' },
    intro: {
      en: 'Blast off! Find 5 words.',
      sv: 'Uppskjutning! Hitta 5 ord.',
      de: 'Start! Finde 5 Wörter.',
      es: '¡Despega! Encuentra 5 palabras.',
      fr: 'Décollage ! Trouvez 5 mots.',
      it: 'Decollo! Trova 5 parole.',
      pt: 'Decolar! Encontre 5 palavras.',
      nl: 'Lanceren! Vind 5 woorden.',
      no: 'Avgang! Finn 5 ord.',
      da: 'Opsendelse! Find 5 ord.',
      fi: 'Lähtö! Löydä 5 sanaa.',
    },
    background: 'space',
    goal: { type: 'find-words', words: wl(
      ['star', 'moon', 'mars', 'orbit', 'space'],
      ['stjärna', 'måne', 'mars', 'rymd', 'planet'],
      ['stern', 'mond', 'mars', 'planet', 'raum'],
      ['estrella', 'luna', 'marte', 'planeta', 'cohete'],
      ['étoile', 'lune', 'mars', 'planète', 'fusée'],
      ['stella', 'luna', 'marte', 'pianeta', 'razzo'],
      ['estrela', 'lua', 'marte', 'planeta', 'foguete'],
      ['ster', 'maan', 'mars', 'planeet', 'raket'],
      ['stjerne', 'måne', 'mars', 'planet', 'rakett'],
      ['stjerne', 'måne', 'mars', 'planet', 'raket'],
      ['tähti', 'kuu', 'mars', 'planeetta', 'raketti'],
    ) },
    mapPosition: { x: 78, y: 14 },
    connectsTo: [],
  },
];

export function getLevelById(id: string): AdventureLevel | undefined {
  return adventureLevels.find(l => l.id === id);
}
