import type { GameLanguage } from './languages';
import type { GameBackground } from '@/contexts/SettingsContext';

export type AdventureGoal =
  | { type: 'find-words'; words: Record<GameLanguage, string[]> }
  | { type: 'reach-score'; target: number }
  | { type: 'find-long-word'; minLength: number };

export interface AdventureLevel {
  id: string;
  number: number;
  name: Record<GameLanguage, string>;
  intro: Record<GameLanguage, string>;
  background: GameBackground;
  goal: AdventureGoal;
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
    id: 'adv-2', number: 2, icon: '🏖️',
    name: { en: 'Beach Walk', sv: 'Strandpromenad', de: 'Strandspaziergang', es: 'Paseo Playa', fr: 'Promenade', it: 'Passeggiata', pt: 'Caminhada', nl: 'Strandwandeling', no: 'Strandtur', da: 'Strandtur', fi: 'Rantakävely' },
    intro: {
      en: 'Reach 30 points!',
      sv: 'Nå 30 poäng!',
      de: 'Erreiche 30 Punkte!',
      es: '¡Consigue 30 puntos!',
      fr: 'Atteignez 30 points !',
      it: 'Raggiungi 30 punti!',
      pt: 'Alcance 30 pontos!',
      nl: 'Behaal 30 punten!',
      no: 'Nå 30 poeng!',
      da: 'Nå 30 point!',
      fi: 'Saavuta 30 pistettä!',
    },
    background: 'beach',
    goal: { type: 'reach-score', target: 30 },
    mapPosition: { x: 32, y: 78 },
    connectsTo: ['adv-3'],
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
    id: 'adv-4', number: 4, icon: '⛵',
    name: { en: 'Shipwreck', sv: 'Skeppsvrak', de: 'Schiffswrack', es: 'Naufragio', fr: 'Épave', it: 'Relitto', pt: 'Naufrágio', nl: 'Scheepswrak', no: 'Skipsvrak', da: 'Skibsvrag', fi: 'Hylky' },
    intro: {
      en: 'A washed-up ship! Find 5 words.',
      sv: 'Ett strandat skepp! Hitta 5 ord.',
      de: 'Ein gestrandetes Schiff! Finde 5 Wörter.',
      es: '¡Un barco varado! Encuentra 5 palabras.',
      fr: 'Un navire échoué ! Trouvez 5 mots.',
      it: 'Una nave arenata! Trova 5 parole.',
      pt: 'Um navio encalhado! Encontre 5 palavras.',
      nl: 'Een gestrand schip! Vind 5 woorden.',
      no: 'Et grunnstøtt skip! Finn 5 ord.',
      da: 'Et strandet skib! Find 5 ord.',
      fi: 'Karille ajautunut alus! Löydä 5 sanaa.',
    },
    background: 'shipwreck',
    goal: { type: 'find-words', words: wl(
      ['ship', 'mast', 'rope', 'sail', 'wood'],
      ['skepp', 'mast', 'rep', 'segel', 'trä'],
      ['schiff', 'mast', 'seil', 'segel', 'holz'],
      ['barco', 'mástil', 'cuerda', 'vela', 'mar'],
      ['navire', 'mât', 'corde', 'voile', 'bois'],
      ['nave', 'albero', 'corda', 'vela', 'legno'],
      ['navio', 'mastro', 'corda', 'vela', 'mar'],
      ['schip', 'mast', 'touw', 'zeil', 'hout'],
      ['skip', 'mast', 'tau', 'seil', 'tre'],
      ['skib', 'mast', 'reb', 'sejl', 'træ'],
      ['laiva', 'masto', 'köysi', 'purje', 'puu'],
    ) },
    mapPosition: { x: 14, y: 64 },
    connectsTo: ['adv-5'],
  },
  {
    id: 'adv-5', number: 5, icon: '🐠',
    name: { en: 'Deep Sea', sv: 'Djuphavet', de: 'Tiefsee', es: 'Mar Profundo', fr: 'Mer Profonde', it: 'Mare Profondo', pt: 'Mar Profundo', nl: 'Diepzee', no: 'Dyphavet', da: 'Dybhavet', fi: 'Syvämeri' },
    intro: {
      en: 'Dive deep — reach 50 points!',
      sv: 'Dyk djupt — nå 50 poäng!',
      de: 'Tauche tief — 50 Punkte!',
      es: '¡Bucea — consigue 50 puntos!',
      fr: 'Plongez — 50 points !',
      it: 'Tuffati — 50 punti!',
      pt: 'Mergulhe — 50 pontos!',
      nl: 'Duik diep — 50 punten!',
      no: 'Dykk dypt — 50 poeng!',
      da: 'Dyk dybt — 50 point!',
      fi: 'Sukella syvälle — 50 pistettä!',
    },
    background: 'underwater',
    goal: { type: 'reach-score', target: 50 },
    mapPosition: { x: 45, y: 45 },
    connectsTo: ['adv-6'],
  },
  {
    id: 'adv-6', number: 6, icon: '🌋',
    name: { en: 'Volcano Peak', sv: 'Vulkanens topp', de: 'Vulkangipfel', es: 'Pico Volcán', fr: 'Pic Volcan', it: 'Picco Vulcano', pt: 'Pico Vulcão', nl: 'Vulkaantop', no: 'Vulkantopp', da: 'Vulkantop', fi: 'Tulivuoren huippu' },
    intro: {
      en: 'Find a 7-letter word!',
      sv: 'Hitta ett ord med 7 bokstäver!',
      de: 'Finde ein 7-Buchstaben-Wort!',
      es: '¡Encuentra una palabra de 7 letras!',
      fr: 'Trouvez un mot de 7 lettres !',
      it: 'Trova una parola di 7 lettere!',
      pt: 'Encontre uma palavra de 7 letras!',
      nl: 'Vind een woord van 7 letters!',
      no: 'Finn et ord på 7 bokstaver!',
      da: 'Find et ord på 7 bogstaver!',
      fi: 'Löydä 7-kirjaiminen sana!',
    },
    background: 'volcano',
    goal: { type: 'find-long-word', minLength: 7 },
    mapPosition: { x: 70, y: 50 },
    connectsTo: ['adv-7', 'adv-8'],
  },
  {
    id: 'adv-7', number: 7, icon: '🚀',
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
    mapPosition: { x: 78, y: 18 },
    connectsTo: [],
  },
  {
    id: 'adv-8', number: 8, icon: '🎈',
    name: { en: 'Hot-Air Balloon', sv: 'Luftballong', de: 'Heißluftballon', es: 'Globo Aire', fr: 'Montgolfière', it: 'Mongolfiera', pt: 'Balão', nl: 'Luchtballon', no: 'Luftballong', da: 'Luftballon', fi: 'Kuumailmapallo' },
    intro: {
      en: 'Soar through the sky — reach 60 points!',
      sv: 'Sväva genom skyn — nå 60 poäng!',
      de: 'Schwebe — erreiche 60 Punkte!',
      es: '¡Vuela — consigue 60 puntos!',
      fr: 'Volez — 60 points !',
      it: 'Vola — 60 punti!',
      pt: 'Voe — 60 pontos!',
      nl: 'Zweef — 60 punten!',
      no: 'Sveve — 60 poeng!',
      da: 'Svæv — 60 point!',
      fi: 'Liidä — 60 pistettä!',
    },
    background: 'clouds',
    goal: { type: 'reach-score', target: 60 },
    mapPosition: { x: 60, y: 22 },
    connectsTo: [],
  },
];

export function getLevelById(id: string): AdventureLevel | undefined {
  return adventureLevels.find(l => l.id === id);
}
