import type { GameLanguage } from './languages';
import type { GameBackground } from '@/contexts/SettingsContext';
import type { GameMode } from '@/pages/GamePage';

export type AdventureGoal =
  | { type: 'find-words'; words: Record<GameLanguage, string[]> }
  | { type: 'reach-score'; target: number }
  | { type: 'find-long-word'; minLength: number }
  | { type: 'survive-moves'; moves: number }
  /** Find thematic words; each one reveals the next letter of `hiddenWord`. */
  | { type: 'hidden-word'; thematicWords: Record<GameLanguage, string[]>; hiddenWord: Record<GameLanguage, string> };

export interface AdventureLevel {
  id: string;
  number: number;
  /** Which adventure map this level belongs to (1 = beach→sky, 2 = space). Defaults to 1. */
  map?: number;
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
  /** Number of free rockets the player gets at start (level 8 powerup). */
  freeRockets?: number;
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
      en: 'Find 4 words to begin your adventure!',
      sv: 'Hitta 4 ord för att börja ditt äventyr!',
      de: 'Finde 4 Wörter, um dein Abenteuer zu beginnen!',
      es: '¡Encuentra 4 palabras para empezar la aventura!',
      fr: 'Trouvez 4 mots pour commencer votre aventure !',
      it: 'Trova 4 parole per iniziare la tua avventura!',
      pt: 'Encontre 4 palavras para começar a aventura!',
      nl: 'Vind 4 woorden om je avontuur te beginnen!',
      no: 'Finn 4 ord for å starte eventyret!',
      da: 'Find 4 ord for at starte eventyret!',
      fi: 'Löydä 4 sanaa aloittaaksesi seikkailun!',
    },
    background: 'beach',
    goal: { type: 'find-words', words: wl(
      ['sand', 'wave', 'palm', 'boat'],
      ['sand', 'våg', 'palm', 'båt'],
      ['sand', 'welle','palme', 'boot'],
      ['mar', 'ola', 'palma', 'arena'],
      ['sable', 'mer', 'palme', 'plage'],
      ['mare', 'onda', 'sole', 'palma'],
      ['onda', 'mar', 'palma', 'barco'],
      ['zand', 'golf', 'palm', 'boot'],
      ['sand', 'bølge', 'palme', 'båt'],
      ['sand', 'bølge', 'palme', 'båd'],
      ['hiekka', 'aalto', 'palmu', 'vene'],
    ) },
    mapPosition: { x: 18, y: 82 },
    connectsTo: ['adv-2'],
    maxMoves: 120,
  },
  {
    id: 'adv-2', number: 2, icon: '⚡',
    name: { en: 'Surf Cove', sv: 'Surfviken', de: 'Surfbucht', es: 'Cala del Surf', fr: 'Crique Surf', it: 'Baia del Surf', pt: 'Baía do Surf', nl: 'Surfbaai', no: 'Surfbukt', da: 'Surfbugt', fi: 'Lainelahti' },
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
    id: 'adv-3', number: 3, icon: '🔍',
    name: { en: 'Hidden Cove', sv: 'Dold vik', de: 'Versteckte Bucht', es: 'Cala Oculta', fr: 'Crique Cachée', it: 'Insenatura Nascosta', pt: 'Enseada Oculta', nl: 'Verborgen Baai', no: 'Skjult Vik', da: 'Skjult Bugt', fi: 'Salainen Lahti' },
    intro: {
      en: 'Find the beach words to reveal a hidden word, letter by letter!',
      sv: 'Hitta strandorden för att avslöja ett dolt ord, bokstav för bokstav!',
      de: 'Finde die Strandwörter, um ein verstecktes Wort zu enthüllen!',
      es: '¡Encuentra las palabras de playa para revelar la palabra oculta!',
      fr: 'Trouvez les mots de plage pour révéler le mot caché !',
      it: 'Trova le parole della spiaggia per rivelare la parola nascosta!',
      pt: 'Encontre as palavras de praia para revelar a palavra oculta!',
      nl: 'Vind de strandwoorden om het verborgen woord te onthullen!',
      no: 'Finn strandordene for å avsløre det skjulte ordet!',
      da: 'Find strandordene for at afsløre det skjulte ord!',
      fi: 'Löydä rantasanat paljastaaksesi salaisen sanan!',
    },
    background: 'beach',
    goal: {
      type: 'hidden-word',
      hiddenWord: { en: 'OCEAN', sv: 'SKEPP', de: 'STRAND', es: 'PLAYA', fr: 'PLAGE', it: 'SPIAGGIA', pt: 'PRAIA', nl: 'STRAND', no: 'STRAND', da: 'STRAND', fi: 'RANTA' },
      thematicWords: wl(
        ['surf', 'tide', 'crab', 'dune', 'reef', 'salt', 'foam', 'gull'],
        ['våg', 'sand', 'hav', 'måsen', 'salt', 'kust'],
        ['sand', 'welle', 'meer', 'sonne', 'salz', 'küste', 'möwe', 'ebbe'],
        ['mar', 'sol', 'ola', 'sal', 'roca', 'duna', 'gaviota', 'arena'],
        ['mer', 'sel', 'vague', 'rive', 'dune', 'algue', 'phare', 'côte'],
        ['mare', 'sale', 'onda', 'duna', 'riva', 'alga', 'sole', 'molo'],
        ['mar', 'sal', 'onda', 'praia', 'duna', 'alga', 'sol', 'maré'],
        ['zee', 'zout', 'golf', 'duin', 'kust', 'meeuw', 'eb', 'kiezel'],
        ['hav', 'salt', 'sand', 'vik', 'kyst', 'måke', 'fyr', 'tang'],
        ['hav', 'salt', 'sand', 'vig', 'kyst', 'måge', 'fyr', 'tang'],
        ['meri', 'suola', 'aalto', 'ranta', 'lokki', 'hiekka', 'kallio', 'majakka'],
      ),
    },
    mapPosition: { x: 46, y: 73 },
    connectsTo: ['adv-4'],
    maxMoves: 120,
  },
  {
    id: 'adv-4', number: 4, icon: '🚢',
    name: { en: 'Shipwreck', sv: 'Skeppsvrak', de: 'Schiffswrack', es: 'Naufragio', fr: 'Épave', it: 'Relitto', pt: 'Naufrágio', nl: 'Scheepswrak', no: 'Skipsvrak', da: 'Skibsvrag', fi: 'Hylky' },
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
    name: { en: 'Volcano', sv: 'Vulkanen', de: 'Vulkan', es: 'Volcán', fr: 'Volcan', it: 'Vulcano', pt: 'Vulcão', nl: 'Vulkaan', no: 'Vulkanen', da: 'Vulkanen', fi: 'Tulivuori' },
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
      en: 'Blast off! Score 250 with 5+ letter words. You have 2 free rockets — fire them up a column to pop every bubble!',
      sv: 'Uppskjutning! Nå 250 poäng med ord på 5+ bokstäver. Du har 2 gratisraketer — skjut upp en lodrätt rad och spräck alla bubblor!',
      de: 'Start! Erreiche 250 Punkte mit 5+ Buchstaben. Du hast 2 Gratisraketen — schieße eine Spalte ab!',
      es: '¡Despega! Consigue 250 con palabras de 5+ letras. ¡Tienes 2 cohetes gratis para limpiar columnas!',
      fr: 'Décollage ! 250 points avec des mots de 5+ lettres. 2 fusées gratuites pour nettoyer une colonne !',
      it: 'Decollo! 250 punti con parole di 5+ lettere. Hai 2 razzi gratis per ripulire una colonna!',
      pt: 'Decolar! 250 pontos com palavras de 5+ letras. Tem 2 foguetes grátis para limpar uma coluna!',
      nl: 'Lanceren! 250 punten met woorden van 5+ letters. 2 gratis raketten om een kolom leeg te schieten!',
      no: 'Avgang! 250 poeng med 5+ bokstaver. 2 gratis raketter for å rense en kolonne!',
      da: 'Opsendelse! 250 point med 5+ bogstaver. 2 gratis raketter til at rense en kolonne!',
      fi: 'Lähtö! 250 pistettä 5+ kirjaimen sanoilla. 2 ilmaista rakettia tyhjentämään sarake!',
    },
    background: 'space',
    mode: 'fiveplus',
    goal: { type: 'reach-score', target: 250 },
    mapPosition: { x: 78, y: 14 },
    connectsTo: [],
    maxMoves: 160,
    freeRockets: 2,
  },

  // ─── Map 2: Space (Earth → Moon → Earth) ───
  // Placeholder levels — gameplay TBD. Layout: Earth (bottom-left), winding up to Moon (top-right), then back down to Earth area.
  {
    id: 'adv-2-1', number: 1, icon: '🌍', map: 2,
    name: { en: 'Liftoff', sv: 'Uppskjutning', de: 'Start', es: 'Despegue', fr: 'Décollage', it: 'Decollo', pt: 'Decolagem', nl: 'Lancering', no: 'Oppskyting', da: 'Opsendelse', fi: 'Lähtö' },
    intro: { en: 'Coming soon', sv: 'Kommer snart', de: 'Kommt bald', es: 'Próximamente', fr: 'Bientôt', it: 'Prossimamente', pt: 'Em breve', nl: 'Binnenkort', no: 'Kommer snart', da: 'Kommer snart', fi: 'Tulossa pian' },
    background: 'space',
    goal: { type: 'find-words', words: wl(['star'],['stjärna'],['stern'],['estrella'],['étoile'],['stella'],['estrela'],['ster'],['stjerne'],['stjerne'],['tähti']) },
    mapPosition: { x: 22, y: 82 },
    connectsTo: ['adv-2-2'],
  },
  {
    id: 'adv-2-2', number: 2, icon: '☄️', map: 2,
    name: { en: 'Asteroid Belt', sv: 'Asteroidbältet', de: 'Asteroidengürtel', es: 'Cinturón Asteroides', fr: 'Ceinture Astéroïdes', it: 'Fascia Asteroidi', pt: 'Cinturão Asteroides', nl: 'Asteroïdengordel', no: 'Asteroidebeltet', da: 'Asteroidebæltet', fi: 'Asteroidivyö' },
    intro: { en: 'Coming soon', sv: 'Kommer snart', de: 'Kommt bald', es: 'Próximamente', fr: 'Bientôt', it: 'Prossimamente', pt: 'Em breve', nl: 'Binnenkort', no: 'Kommer snart', da: 'Kommer snart', fi: 'Tulossa pian' },
    background: 'space',
    goal: { type: 'find-words', words: wl(['rock'],['sten'],['fels'],['roca'],['roche'],['roccia'],['rocha'],['rots'],['stein'],['sten'],['kivi']) },
    mapPosition: { x: 38, y: 70 },
    connectsTo: ['adv-2-3'],
  },
  {
    id: 'adv-2-3', number: 3, icon: '🛰️', map: 2,
    name: { en: 'Satellite', sv: 'Satellit', de: 'Satellit', es: 'Satélite', fr: 'Satellite', it: 'Satellite', pt: 'Satélite', nl: 'Satelliet', no: 'Satellitt', da: 'Satellit', fi: 'Satelliitti' },
    intro: { en: 'Coming soon', sv: 'Kommer snart', de: 'Kommt bald', es: 'Próximamente', fr: 'Bientôt', it: 'Prossimamente', pt: 'Em breve', nl: 'Binnenkort', no: 'Kommer snart', da: 'Kommer snart', fi: 'Tulossa pian' },
    background: 'space',
    goal: { type: 'find-words', words: wl(['orbit'],['bana'],['umlauf'],['órbita'],['orbite'],['orbita'],['órbita'],['baan'],['bane'],['bane'],['rata']) },
    mapPosition: { x: 56, y: 58 },
    connectsTo: ['adv-2-4'],
  },
  {
    id: 'adv-2-4', number: 4, icon: '🌑', map: 2,
    name: { en: 'Dark Side', sv: 'Mörka sidan', de: 'Dunkle Seite', es: 'Lado Oscuro', fr: 'Côté Obscur', it: 'Lato Oscuro', pt: 'Lado Escuro', nl: 'Donkere Kant', no: 'Mørke Siden', da: 'Mørke Side', fi: 'Pimeä Puoli' },
    intro: { en: 'Coming soon', sv: 'Kommer snart', de: 'Kommt bald', es: 'Próximamente', fr: 'Bientôt', it: 'Prossimamente', pt: 'Em breve', nl: 'Binnenkort', no: 'Kommer snart', da: 'Kommer snart', fi: 'Tulossa pian' },
    background: 'space',
    goal: { type: 'find-words', words: wl(['dark'],['mörk'],['dunkel'],['oscuro'],['sombre'],['scuro'],['escuro'],['donker'],['mørk'],['mørk'],['pimeä']) },
    mapPosition: { x: 72, y: 42 },
    connectsTo: ['adv-2-5'],
  },
  {
    id: 'adv-2-5', number: 5, icon: '🌕', map: 2,
    name: { en: 'Moon Landing', sv: 'Månlandning', de: 'Mondlandung', es: 'Alunizaje', fr: 'Alunissage', it: 'Allunaggio', pt: 'Alunissagem', nl: 'Maanlanding', no: 'Månelanding', da: 'Månelanding', fi: 'Kuulaskeutuminen' },
    intro: { en: 'Coming soon', sv: 'Kommer snart', de: 'Kommt bald', es: 'Próximamente', fr: 'Bientôt', it: 'Prossimamente', pt: 'Em breve', nl: 'Binnenkort', no: 'Kommer snart', da: 'Kommer snart', fi: 'Tulossa pian' },
    background: 'space',
    goal: { type: 'find-words', words: wl(['moon'],['måne'],['mond'],['luna'],['lune'],['luna'],['lua'],['maan'],['måne'],['måne'],['kuu']) },
    mapPosition: { x: 84, y: 22 },
    connectsTo: ['adv-2-6'],
  },
  {
    id: 'adv-2-6', number: 6, icon: '👨‍🚀', map: 2,
    name: { en: 'Moonwalk', sv: 'Månpromenad', de: 'Mondspaziergang', es: 'Paseo Lunar', fr: 'Marche Lunaire', it: 'Passeggiata Lunare', pt: 'Caminhada Lunar', nl: 'Maanwandeling', no: 'Månevandring', da: 'Månevandring', fi: 'Kuukävely' },
    intro: { en: 'Coming soon', sv: 'Kommer snart', de: 'Kommt bald', es: 'Próximamente', fr: 'Bientôt', it: 'Prossimamente', pt: 'Em breve', nl: 'Binnenkort', no: 'Kommer snart', da: 'Kommer snart', fi: 'Tulossa pian' },
    background: 'space',
    goal: { type: 'find-words', words: wl(['walk'],['gå'],['gehen'],['andar'],['marcher'],['camminare'],['andar'],['lopen'],['gå'],['gå'],['kävellä']) },
    mapPosition: { x: 68, y: 30 },
    connectsTo: ['adv-2-7'],
  },
  {
    id: 'adv-2-7', number: 7, icon: '🚀', map: 2,
    name: { en: 'Return Flight', sv: 'Återresan', de: 'Rückflug', es: 'Vuelo de Regreso', fr: 'Vol Retour', it: 'Volo di Ritorno', pt: 'Voo de Volta', nl: 'Terugvlucht', no: 'Returflyvning', da: 'Returflyvning', fi: 'Paluulento' },
    intro: { en: 'Coming soon', sv: 'Kommer snart', de: 'Kommt bald', es: 'Próximamente', fr: 'Bientôt', it: 'Prossimamente', pt: 'Em breve', nl: 'Binnenkort', no: 'Kommer snart', da: 'Kommer snart', fi: 'Tulossa pian' },
    background: 'space',
    goal: { type: 'find-words', words: wl(['ship'],['skepp'],['schiff'],['nave'],['vaisseau'],['nave'],['nave'],['schip'],['skip'],['skib'],['alus']) },
    mapPosition: { x: 50, y: 42 },
    connectsTo: ['adv-2-8'],
  },
  {
    id: 'adv-2-8', number: 8, icon: '🪂', map: 2,
    name: { en: 'Splashdown', sv: 'Landning', de: 'Wasserung', es: 'Amerizaje', fr: 'Amerrissage', it: 'Ammaraggio', pt: 'Amaragem', nl: 'Landing', no: 'Landing', da: 'Landing', fi: 'Lasku' },
    intro: { en: 'Coming soon', sv: 'Kommer snart', de: 'Kommt bald', es: 'Próximamente', fr: 'Bientôt', it: 'Prossimamente', pt: 'Em breve', nl: 'Binnenkort', no: 'Kommer snart', da: 'Kommer snart', fi: 'Tulossa pian' },
    background: 'space',
    goal: { type: 'find-words', words: wl(['land'],['land'],['land'],['tierra'],['terre'],['terra'],['terra'],['land'],['land'],['land'],['maa']) },
    mapPosition: { x: 30, y: 58 },
    connectsTo: [],
  },
];

export function getLevelById(id: string): AdventureLevel | undefined {
  return adventureLevels.find(l => l.id === id);
}
