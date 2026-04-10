import type { GameLanguage } from './languages';

const translations = {
  // ─── Common ───
  mainMenu: { en: 'Main Menu', sv: 'Huvudmeny', de: 'Hauptmenü' },
  back: { en: 'Back', sv: 'Tillbaka', de: 'Zurück' },
  play: { en: 'Play', sv: 'Spela', de: 'Spielen' },
  challenge: { en: 'Challenge', sv: 'Utmana', de: 'Herausfordern' },
  shop: { en: 'Shop', sv: 'Butik', de: 'Shop' },
  statistics: { en: 'Statistics', sv: 'Statistik', de: 'Statistik' },
  settingsTitle: { en: 'Settings', sv: 'Inställningar', de: 'Einstellungen' },
  loading: { en: 'Loading...', sv: 'Laddar...', de: 'Laden...' },
  close: { en: 'Close', sv: 'Stäng', de: 'Schließen' },
  or: { en: 'or', sv: 'eller', de: 'oder' },
  points: { en: 'points', sv: 'poäng', de: 'Punkte' },
  comingSoon: { en: 'Coming soon', sv: 'Kommer snart', de: 'Kommt bald' },

  // ─── Main Menu ───
  subtitle: { en: 'Bubble Word Game', sv: 'Bubble Word Game', de: 'Bubble Word Game' },

  // ─── Singleplayer Menu ───
  singleplayer: { en: 'Singleplayer', sv: 'Singleplayer', de: 'Einzelspieler' },
  chooseMode: { en: 'Choose game mode', sv: 'Välj spelläge', de: 'Spielmodus wählen' },
  locked: { en: 'Locked', sv: 'Låst', de: 'Gesperrt' },
  modeLocked: { en: 'Game mode locked', sv: 'Spelläget är låst', de: 'Spielmodus gesperrt' },

  // ─── Mode names ───
  modeClassic: { en: 'Classic', sv: 'Classic', de: 'Classic' },
  modeSurge: { en: 'Word Surge', sv: 'Word Surge', de: 'Word Surge' },
  modeFiveplus: { en: '5+ Letters', sv: '5+ Bokstäver', de: '5+ Buchstaben' },
  modeOneword: { en: 'One Word', sv: 'Ett Ord', de: 'Ein Wort' },
  modeBomb: { en: 'Bomb Mode', sv: 'Bomb Mode', de: 'Bomb Mode' },

  // ─── Mode descriptions ───
  descClassic: {
    en: '50 moves. Score as many points as possible! Bonus for long words.',
    sv: '50 drag. Få så många poäng som möjligt! Bonus för långa ord.',
    de: '50 Züge. Erziele so viele Punkte wie möglich! Bonus für lange Wörter.',
  },
  descSurge: {
    en: '50 moves. Find high-scoring or long words to earn extra moves!',
    sv: '50 drag. Hitta ord med höga poäng eller långa ord för att få extra drag!',
    de: '50 Züge. Finde Wörter mit hohen Punkten oder lange Wörter für Extrazüge!',
  },
  descFiveplus: {
    en: '100 moves. Only 3 colors but only words with 5+ letters count!',
    sv: '100 drag. Bara 3 färger men bara ord med 5+ bokstäver räknas!',
    de: '100 Züge. Nur 3 Farben, aber nur Wörter mit 5+ Buchstaben zählen!',
  },
  descOneword: {
    en: '60 moves. Make as many words as you want but only your best word counts!',
    sv: '60 drag. Bilda så många ord du vill men bara ditt bästa ord räknas!',
    de: '60 Züge. Bilde so viele Wörter wie du willst, aber nur dein bestes zählt!',
  },
  descBomb: {
    en: 'No move limit! Defuse bombs by making words with bombed letters before time runs out.',
    sv: 'Inga dragbegränsningar! Desarmera bomber genom att bilda ord med bombade bokstäver innan tiden rinner ut.',
    de: 'Kein Zuglimit! Entschärfe Bomben, indem du Wörter mit Bomben-Buchstaben bildest.',
  },

  // ─── Mode info ───
  infoClassic: {
    en: [
      'You have 50 moves to form as many words as possible.',
      'Combine tiles of the same color by swiping or clicking.',
      'Longer words give bonus points:',
      '• 4 letters → +2 points', '• 5 letters → +4 points', '• 6 letters → +6 points',
      '• 7 letters → +8 points', '• 8 letters → +10 points',
      '• 9 letters → 2x letter points', '• 10 letters → 3x letter points',
      'Each letter has a point value — rare letters are worth more!',
    ],
    sv: [
      'Du har 50 drag att bilda så många ord som möjligt.',
      'Kombinera spelbrickor av samma färg genom att swipa eller klicka.',
      'Längre ord ger bonuspoäng:',
      '• 4 bokstäver → +2 poäng', '• 5 bokstäver → +4 poäng', '• 6 bokstäver → +6 poäng',
      '• 7 bokstäver → +8 poäng', '• 8 bokstäver → +10 poäng',
      '• 9 bokstäver → 2x bokstavspoäng', '• 10 bokstäver → 3x bokstavspoäng',
      'Varje bokstav har ett poängvärde — ovanliga bokstäver ger mer!',
    ],
    de: [
      'Du hast 50 Züge, um so viele Wörter wie möglich zu bilden.',
      'Kombiniere Spielsteine gleicher Farbe durch Wischen oder Klicken.',
      'Längere Wörter geben Bonuspunkte:',
      '• 4 Buchstaben → +2 Punkte', '• 5 Buchstaben → +4 Punkte', '• 6 Buchstaben → +6 Punkte',
      '• 7 Buchstaben → +8 Punkte', '• 8 Buchstaben → +10 Punkte',
      '• 9 Buchstaben → 2× Buchstabenpunkte', '• 10 Buchstaben → 3× Buchstabenpunkte',
      'Jeder Buchstabe hat einen Punktwert — seltene Buchstaben sind mehr wert!',
    ],
  },
  infoSurge: {
    en: [
      'Start with 50 moves — but you can earn more!',
      'Score bonus → extra moves:', '• ≥10 points on a word → +10 moves', '• ≥15 points on a word → +25 moves',
      'Length bonus → extra moves:', '• ≥5 letters → +10 moves', '• ≥7 letters → +25 moves', '• 10 letters → +50 moves',
      'Score and length bonuses stack! No extra bonus points for long words in this mode.',
    ],
    sv: [
      'Börja med 50 drag — men du kan tjäna fler!',
      'Poängbonus → extra drag:', '• ≥10 poäng på ett ord → +10 drag', '• ≥15 poäng på ett ord → +25 drag',
      'Längdbonus → extra drag:', '• ≥5 bokstäver → +10 drag', '• ≥7 bokstäver → +25 drag', '• 10 bokstäver → +50 drag',
      'Poäng- och längdbonus adderas! Inga extra bonuspoäng för långa ord i detta läge.',
    ],
    de: [
      'Starte mit 50 Zügen — aber du kannst mehr verdienen!',
      'Punktebonus → Extrazüge:', '• ≥10 Punkte für ein Wort → +10 Züge', '• ≥15 Punkte für ein Wort → +25 Züge',
      'Längenbonus → Extrazüge:', '• ≥5 Buchstaben → +10 Züge', '• ≥7 Buchstaben → +25 Züge', '• 10 Buchstaben → +50 Züge',
      'Punkte- und Längenbonus addieren sich! Keine extra Bonuspunkte für lange Wörter.',
    ],
  },
  infoFiveplus: {
    en: [
      'You have 100 moves but only words with at least 5 letters count.',
      'Only 3 colors on the board (red, green, blue) — easier to combine!',
      'Same length bonus points as Classic:',
      '• 5 letters → +4 points', '• 6 letters → +6 points',
      '• And so on up to 10 letters (3×).',
      'Strategy: build long words with fewer colors to worry about.',
    ],
    sv: [
      'Du har 100 drag men bara ord med minst 5 bokstäver räknas.',
      'Bara 3 färger på brädet (röd, grön, blå) — lättare att kombinera!',
      'Samma längdbonuspoäng som Classic:',
      '• 5 bokstäver → +4 poäng', '• 6 bokstäver → +6 poäng',
      '• Och så vidare upp till 10 bokstäver (3x).',
      'Strategin: bygg långa ord med färre färger att oroa dig för.',
    ],
    de: [
      'Du hast 100 Züge, aber nur Wörter mit mindestens 5 Buchstaben zählen.',
      'Nur 3 Farben auf dem Brett (rot, grün, blau) — leichter zu kombinieren!',
      'Gleiche Längenbonuspunkte wie Classic:',
      '• 5 Buchstaben → +4 Punkte', '• 6 Buchstaben → +6 Punkte',
      '• Und so weiter bis 10 Buchstaben (3×).',
      'Strategie: Bilde lange Wörter mit weniger Farben.',
    ],
  },
  infoOneword: {
    en: [
      'You have 60 moves to find your best word.',
      'All words you form count during the game, but your final score = your highest-scoring word.',
      'Same length bonus points as Classic apply.',
      'Tip: Go for one amazing word instead of many small ones!',
    ],
    sv: [
      'Du har 60 drag att hitta ditt bästa ord.',
      'Alla ord du bildar räknas under spelets gång, men din slutpoäng = ditt högst poängsatta ord.',
      'Samma längdbonuspoäng som Classic gäller.',
      'Tips: Satsa på ett enda fantastiskt ord istället för många små!',
    ],
    de: [
      'Du hast 60 Züge, um dein bestes Wort zu finden.',
      'Alle Wörter zählen während des Spiels, aber deine Endpunktzahl = dein höchstes Wort.',
      'Gleiche Längenbonuspunkte wie Classic.',
      'Tipp: Setze auf ein einziges fantastisches Wort statt vieler kleiner!',
    ],
  },
  infoBomb: {
    en: [
      'No move limit — the game continues until a bomb explodes!',
      'Random vowels get bomb timers (at least 10 moves).',
      'You start with 1–3 bombs, max 5 at a time.',
      '30% chance a new bomb appears after each word found.',
      'Defuse bombs by forming words that include the bombed letters.',
      'No bonus points for long words in this mode.',
    ],
    sv: [
      'Inga dragbegränsningar — spelet pågår tills en bomb exploderar!',
      'Slumpmässiga vokaler får bombtimer (minst 10 drag).',
      'Du startar med 1–3 bomber, max 5 samtidigt.',
      '30% chans att en ny bomb dyker upp efter varje hittat ord.',
      'Desarmera bomber genom att bilda ord som innehåller de bombade bokstäverna.',
      'Inga bonuspoäng för långa ord i detta läge.',
    ],
    de: [
      'Kein Zuglimit — das Spiel geht weiter bis eine Bombe explodiert!',
      'Zufällige Vokale bekommen Bombentimer (mindestens 10 Züge).',
      'Du startest mit 1–3 Bomben, max 5 gleichzeitig.',
      '30% Chance, dass nach jedem gefundenen Wort eine neue Bombe erscheint.',
      'Entschärfe Bomben, indem du Wörter bildest, die Bomben-Buchstaben enthalten.',
      'Keine Bonuspunkte für lange Wörter in diesem Modus.',
    ],
  },

  // ─── Unlock hints ───
  unlockSurge: {
    en: 'Complete a Classic game to unlock this mode.',
    sv: 'Spela klart ett Classic-spel för att låsa upp detta spelläge.',
    de: 'Schließe ein Classic-Spiel ab, um diesen Modus freizuschalten.',
  },
  unlockBomb: {
    en: 'Complete a Classic game to unlock this mode.',
    sv: 'Spela klart ett Classic-spel för att låsa upp detta spelläge.',
    de: 'Schließe ein Classic-Spiel ab, um diesen Modus freizuschalten.',
  },
  unlockFiveplus: {
    en: 'Use over 120 moves in a single Word Surge game to unlock this mode.',
    sv: 'Använd över 120 drag i en enda Word Surge-omgång för att låsa upp detta spelläge.',
    de: 'Nutze über 120 Züge in einem einzigen Word Surge-Spiel, um diesen Modus freizuschalten.',
  },
  unlockOneword: {
    en: 'Score more than 25 points on a single word (any mode) to unlock this mode.',
    sv: 'Få mer än 25 poäng på ett enda ord (i valfritt spelläge) för att låsa upp detta spelläge.',
    de: 'Erziele mehr als 25 Punkte mit einem einzelnen Wort (beliebiger Modus), um freizuschalten.',
  },

  // ─── Game UI ───
  score: { en: 'Score', sv: 'Poäng', de: 'Punkte' },
  movesLeft: { en: 'Moves left', sv: 'Drag kvar', de: 'Züge übrig' },
  bestWord: { en: 'Best word', sv: 'Bästa ord', de: 'Bestes Wort' },
  wordFound: { en: 'Word found!', sv: 'Ord hittat!', de: 'Wort gefunden!' },
  words: { en: 'Words', sv: 'Ord', de: 'Wörter' },
  loadingDict: { en: 'Loading word list...', sv: 'Laddar ordlista...', de: 'Wortliste wird geladen...' },

  // ─── In-game menu ───
  pause: { en: 'Pause', sv: 'Paus', de: 'Pause' },
  sound: { en: 'Sound', sv: 'Ljud', de: 'Sound' },
  music: { en: 'Music', sv: 'Musik', de: 'Musik' },
  on: { en: 'On', sv: 'På', de: 'An' },
  off: { en: 'Off', sv: 'Av', de: 'Aus' },
  continuePlay: { en: 'Continue playing', sv: 'Fortsätt spela', de: 'Weiterspielen' },

  // ─── Game Over ───
  gameOver: { en: 'Game Over!', sv: 'Game Over!', de: 'Game Over!' },
  finalResult: { en: 'Final Result', sv: 'Slutresultat', de: 'Endergebnis' },
  bestWordTitle: { en: 'Best Word!', sv: 'Bästa Ord!', de: 'Bestes Wort!' },
  theBestWord: { en: 'Best word', sv: 'Bästa ordet', de: 'Bestes Wort' },
  wordsFound: { en: 'words found', sv: 'ord hittade', de: 'Wörter gefunden' },
  newGame: { en: 'New game', sv: 'Nytt spel', de: 'Neues Spiel' },
  scoreBonus: { en: 'Score bonus', sv: 'Poängbonus', de: 'Punktebonus' },
  longWords: { en: 'Long words', sv: 'Långa ord', de: 'Lange Wörter' },
  superWord: { en: 'Super word (50+p)', sv: 'Superord (50+p)', de: 'Superwort (50+P)' },
  endurance: { en: 'Endurance', sv: 'Uthållighet', de: 'Ausdauer' },

  // ─── Word History ───
  combinedWords: { en: 'Combined words', sv: 'Kombinerade ord', de: 'Kombinierte Wörter' },
  total: { en: 'Total', sv: 'Totalt', de: 'Gesamt' },
  noWordsYet: { en: 'No words yet!', sv: 'Inga ord ännu!', de: 'Noch keine Wörter!' },
  opponentWords: { en: "Opponent's words (blocked)", sv: 'Motståndarens ord (blockerade)', de: 'Gegner-Wörter (blockiert)' },
  blocked: { en: 'blocked', sv: 'blockerat', de: 'blockiert' },

  // ─── Settings ───
  languageLabel: { en: 'Language', sv: 'Språk / Language', de: 'Sprache / Language' },
  soundEffects: { en: 'Sound effects', sv: 'Ljudeffekter', de: 'Soundeffekte' },
  langChangeNote: { en: 'Not changed during active game', sv: 'Ändras inte under pågående spel', de: 'Wird nicht im laufenden Spiel geändert' },

  // ─── Shop ───
  backgrounds: { en: 'Backgrounds', sv: 'Bakgrunder', de: 'Hintergründe' },
  tiles: { en: 'Tiles', sv: 'Spelbrickor', de: 'Spielsteine' },
  other: { en: 'Other', sv: 'Övrigt', de: 'Sonstiges' },
  buyFor: { en: 'Buy for', sv: 'Köp för', de: 'Kaufen für' },
  watchAdUnlock: { en: 'Watch ad & unlock', sv: 'Se reklamvideo & lås upp', de: 'Werbung ansehen & freischalten' },
  achievementUnlock: { en: 'Unlocked through in-game achievement.', sv: 'Denna låses upp genom prestation i spelet.', de: 'Wird durch eine Spielleistung freigeschaltet.' },
  unlockedFromStart: { en: 'Unlocked from the start!', sv: 'Upplåst från början!', de: 'Von Anfang an freigeschaltet!' },

  // ─── Shop items ───
  shopWalnut: { en: 'Walnut', sv: 'Valnöt', de: 'Walnuss' },
  shopSpace: { en: 'Space', sv: 'Rymden', de: 'Weltraum' },
  shopVolcano: { en: 'Volcano', sv: 'Vulkan', de: 'Vulkan' },
  shopBubbles: { en: 'Bubbles', sv: 'Bubblor', de: 'Blasen' },
  shopShapes: { en: 'Shapes', sv: 'Former', de: 'Formen' },
  shopSoapBubbles: { en: 'Soap Bubbles', sv: 'Såpbubblor', de: 'Seifenblasen' },
  shopSport: { en: 'Sports', sv: 'Sport', de: 'Sport' },
  shopWatchAd: { en: 'Watch ad', sv: 'Se reklam', de: 'Werbung ansehen' },
  shopWatchAdDesc: { en: 'Watch a video (~30s) and get 0.5 coins', sv: 'Titta på en video (~30s) och få 0.5 coins', de: 'Video ansehen (~30s) und 0,5 Coins erhalten' },
  shopWatchVideo: { en: 'Watch video', sv: 'Se video', de: 'Video ansehen' },
  shopAdventure: { en: 'Adventure', sv: 'Äventyr', de: 'Abenteuer' },

  shopBuyCoins: { en: 'Buy for {cost} coins.', sv: 'Köp för {cost} coins.', de: 'Kaufen für {cost} Coins.' },
  shopWatchAdToUnlock: { en: 'Watch an ad to unlock.', sv: 'Titta på en reklamvideo för att låsa upp.', de: 'Schaue eine Werbung, um freizuschalten.' },
  shopVolcanoUnlock: { en: 'Score 150 points in Bomb Mode to unlock.', sv: 'Nå 150 poäng i Bomb Mode för att låsa upp.', de: '150 Punkte im Bomb Mode erreichen zum Freischalten.' },
  shopSportsUnlock: { en: 'Win 30 online games to unlock.', sv: 'Vinn 30 online-spel för att låsa upp.', de: '30 Online-Spiele gewinnen zum Freischalten.' },

  // ─── Statistics ───
  highscore: { en: 'Highscore', sv: 'Highscore', de: 'Highscore' },
  online: { en: 'Online', sv: 'Online', de: 'Online' },
  allModes: { en: 'All modes', sv: 'Alla lägen', de: 'Alle Modi' },
  noHighscores: { en: 'No highscores yet', sv: 'Inga highscores ännu', de: 'Noch keine Highscores' },
  playARound: { en: 'Play a round!', sv: 'Spela en omgång!', de: 'Spiele eine Runde!' },
  loginForOnline: { en: 'Log in to see online stats', sv: 'Logga in för att se online-statistik', de: 'Einloggen für Online-Statistik' },
  noFinishedMatches: { en: 'No finished matches yet', sv: 'Inga avslutade matcher ännu', de: 'Noch keine beendeten Spiele' },
  inThisMode: { en: 'in this mode', sv: 'i detta läge', de: 'in diesem Modus' },
  wins: { en: 'Wins', sv: 'Vinster', de: 'Siege' },
  losses: { en: 'Losses', sv: 'Förluster', de: 'Niederlagen' },
  draws: { en: 'Draws', sv: 'Oavgjort', de: 'Unentschieden' },
  matchesPlayed: { en: 'Matches played', sv: 'Matcher spelade', de: 'Spiele gespielt' },
  winRate: { en: 'Win rate', sv: 'Vinstprocent', de: 'Siegquote' },
  totalPoints: { en: 'Total points', sv: 'Totala poäng', de: 'Gesamtpunkte' },
  bestMatchScore: { en: 'Best match score', sv: 'Bästa matchpoäng', de: 'Beste Spielpunktzahl' },

  // ─── Multiplayer ───
  chooseOpponent: { en: 'Choose opponent and game mode', sv: 'Välj motståndare och spelläge', de: 'Gegner und Spielmodus wählen' },
  randomOpponent: { en: 'Random', sv: 'Slumpmässig', de: 'Zufällig' },
  meetRandomPlayer: { en: 'Meet a random player', sv: 'Möt en slumpmässig spelare', de: 'Triff einen zufälligen Spieler' },
  friend: { en: 'Friend', sv: 'Vän', de: 'Freund' },
  challengeFriend: { en: 'Challenge a friend', sv: 'Utmana en vän', de: 'Fordere einen Freund heraus' },
  computer: { en: 'Computer', sv: 'Dator', de: 'Computer' },
  playVsAI: { en: 'Play vs AI', sv: 'Spela mot AI', de: 'Gegen KI spielen' },
  searchingOpponent: { en: 'Searching for opponent...', sv: 'Söker motståndare...', de: 'Suche Gegner...' },
  cancel: { en: 'Cancel', sv: 'Avbryt', de: 'Abbrechen' },
  matchFound: { en: 'Match found!', sv: 'Match hittad!', de: 'Spiel gefunden!' },
  couldNotSearch: { en: 'Could not search for match', sv: 'Kunde inte söka match', de: 'Konnte nicht nach Spiel suchen' },
  challengeSent: { en: 'Challenge sent to {name}!', sv: 'Utmaning skickad till {name}!', de: 'Herausforderung an {name} gesendet!' },
  couldNotCreate: { en: 'Could not create match', sv: 'Kunde inte skapa match', de: 'Konnte Spiel nicht erstellen' },
  chooseGameMode: { en: 'Choose game mode', sv: 'Välj spelläge', de: 'Spielmodus wählen' },

  // ─── Match modes (multiplayer descriptions) ───
  mpClassicDesc: { en: '2 rounds, 50 moves each', sv: '2 omgångar, 50 drag var', de: '2 Runden, je 50 Züge' },
  mpSurgeDesc: { en: '3 rounds, bonus for long words', sv: '3 omgångar, bonus för långa ord', de: '3 Runden, Bonus für lange Wörter' },
  mpFiveplusDesc: { en: '2 rounds, min 5 letters', sv: '2 omgångar, min 5 bokstäver', de: '2 Runden, min. 5 Buchstaben' },
  mpOnewordDesc: { en: '2 rounds, best word counts', sv: '2 omgångar, bästa ord räknas', de: '2 Runden, bestes Wort zählt' },
  longestWord: { en: 'Longest Word', sv: 'Längsta Ordet', de: 'Längstes Wort' },

  // ─── Match list ───
  loadingMatches: { en: 'Loading matches...', sv: 'Laddar matcher...', de: 'Lade Spiele...' },
  noActiveMatches: { en: 'No active matches', sv: 'Inga pågående matcher', de: 'Keine aktiven Spiele' },
  startNewMatch: { en: 'Start a new match below!', sv: 'Starta en ny match nedan!', de: 'Starte ein neues Spiel!' },
  matchInvitations: { en: 'Match invitations', sv: 'Matchinbjudningar', de: 'Spieleinladungen' },
  invitation: { en: 'Invitation', sv: 'Inbjudan', de: 'Einladung' },
  challengesYou: { en: 'challenges you!', sv: 'utmanar dig!', de: 'fordert dich heraus!' },
  activeMatches: { en: 'Active matches', sv: 'Pågående matcher', de: 'Aktive Spiele' },
  yourTurn: { en: 'Your turn', sv: 'Din tur', de: 'Dein Zug' },
  awaitingResponse: { en: 'Awaiting response', sv: 'Inväntar svar', de: 'Wartet auf Antwort' },
  awaitingOpponent: { en: 'Awaiting opponent', sv: 'Inväntar motståndare', de: 'Wartet auf Gegner' },
  awaitingPlayer: { en: 'Awaiting player...', sv: 'Inväntar spelare...', de: 'Wartet auf Spieler...' },
  player: { en: 'Player', sv: 'Spelare', de: 'Spieler' },
  round: { en: 'Round', sv: 'Omgång', de: 'Runde' },
  couldNotAccept: { en: 'Could not accept match', sv: 'Kunde inte acceptera match', de: 'Konnte Spiel nicht annehmen' },
  matchAccepted: { en: 'Match accepted!', sv: 'Match accepterad!', de: 'Spiel angenommen!' },
  couldNotDecline: { en: 'Could not decline match', sv: 'Kunde inte avböja match', de: 'Konnte Spiel nicht ablehnen' },
  matchDeclined: { en: 'Match declined', sv: 'Match avböjd', de: 'Spiel abgelehnt' },
  justNow: { en: 'Just now', sv: 'Just nu', de: 'Gerade eben' },
  minAgo: { en: 'min ago', sv: 'min sedan', de: 'Min. her' },
  hAgo: { en: 'h ago', sv: 'h sedan', de: 'Std. her' },
  dAgo: { en: 'd ago', sv: 'd sedan', de: 'T. her' },

  // ─── Friend drawer ───
  challengeAFriend: { en: 'Challenge a friend', sv: 'Utmana en vän', de: 'Fordere einen Freund heraus' },
  searchPlayers: { en: 'Search players...', sv: 'Sök spelare...', de: 'Spieler suchen...' },
  searchResults: { en: 'Search results', sv: 'Sökresultat', de: 'Suchergebnisse' },
  addFriend: { en: 'Add', sv: 'Lägg till', de: 'Hinzufügen' },
  noPlayersFound: { en: 'No players found', sv: 'Inga spelare hittade', de: 'Keine Spieler gefunden' },
  friendRequests: { en: 'Friend requests', sv: 'Vänförfrågningar', de: 'Freundschaftsanfragen' },
  yourFriends: { en: 'Your friends', sv: 'Dina vänner', de: 'Deine Freunde' },
  noFriendsYet: { en: 'No friends yet', sv: 'Inga vänner ännu', de: 'Noch keine Freunde' },
  searchAboveOrInvite: { en: 'Search for players above or invite friends', sv: 'Sök efter spelare ovan eller bjud in vänner', de: 'Suche Spieler oben oder lade Freunde ein' },
  inviteFriends: { en: 'Invite friends', sv: 'Bjud in vänner', de: 'Freunde einladen' },
  unknown: { en: 'Unknown', sv: 'Okänd', de: 'Unbekannt' },
  friendRequestSent: { en: 'Friend request sent!', sv: 'Vänförfrågan skickad!', de: 'Freundschaftsanfrage gesendet!' },
  requestAlreadySent: { en: 'Request already sent', sv: 'Vänförfrågan redan skickad', de: 'Anfrage bereits gesendet' },
  couldNotSendRequest: { en: 'Could not send request', sv: 'Kunde inte skicka förfrågan', de: 'Konnte Anfrage nicht senden' },
  friendAdded: { en: 'Friend added!', sv: 'Vän tillagd!', de: 'Freund hinzugefügt!' },
  linkCopied: { en: 'Link copied!', sv: 'Länk kopierad!', de: 'Link kopiert!' },
  challengeMe: { en: 'Challenge me in Word Rumble! 🎮', sv: 'Utmana mig i Word Rumble! 🎮', de: 'Fordere mich in Word Rumble heraus! 🎮' },

  // ─── Auth ───
  loginToChallenge: { en: 'Log in to challenge', sv: 'Logga in för att utmana', de: 'Einloggen zum Herausfordern' },
  createAccount: { en: 'Create account', sv: 'Skapa konto', de: 'Konto erstellen' },
  continueWithGoogle: { en: 'Continue with Google', sv: 'Fortsätt med Google', de: 'Weiter mit Google' },
  displayName: { en: 'Display name', sv: 'Visningsnamn', de: 'Anzeigename' },
  email: { en: 'Email', sv: 'E-post', de: 'E-Mail' },
  password: { en: 'Password', sv: 'Lösenord', de: 'Passwort' },
  wait: { en: 'Wait...', sv: 'Vänta...', de: 'Warten...' },
  logIn: { en: 'Log in', sv: 'Logga in', de: 'Einloggen' },
  loggedIn: { en: 'Logged in!', sv: 'Inloggad!', de: 'Eingeloggt!' },
  accountCreated: { en: 'Account created! Check your email to verify.', sv: 'Konto skapat! Kolla din e-post för att verifiera.', de: 'Konto erstellt! Überprüfe deine E-Mail zur Verifizierung.' },
  googleLoginFailed: { en: 'Google login failed', sv: 'Google-inloggning misslyckades', de: 'Google-Anmeldung fehlgeschlagen' },
  somethingWrong: { en: 'Something went wrong', sv: 'Något gick fel', de: 'Etwas ist schiefgelaufen' },
  noAccountCreate: { en: "Don't have an account? Create one", sv: 'Har du inget konto? Skapa ett', de: 'Kein Konto? Erstelle eins' },
  haveAccountLogin: { en: 'Already have an account? Log in', sv: 'Har du redan ett konto? Logga in', de: 'Bereits ein Konto? Einloggen' },

  // ─── Coin rewards ───
  loss: { en: 'Loss', sv: 'Förlust', de: 'Niederlage' },
  opponentForfeit: { en: 'Opponent forfeited', sv: 'Motståndaren gav upp', de: 'Gegner aufgegeben' },
  draw: { en: 'Draw', sv: 'Oavgjort', de: 'Unentschieden' },
  win: { en: 'Win', sv: 'Vinst', de: 'Sieg' },
} as const;

type TranslationKey = keyof typeof translations;

export type Translations = { [K in TranslationKey]: string };

export function getTranslations(lang: GameLanguage): Translations {
  const result: Record<string, any> = {};
  for (const key of Object.keys(translations) as TranslationKey[]) {
    const val = translations[key];
    if (Array.isArray((val as any).en)) {
      // Array values are handled separately via getTranslationArray
      result[key] = (val as any)[lang] ?? (val as any).en;
    } else {
      result[key] = (val as any)[lang] ?? (val as any).en;
    }
  }
  return result as Translations;
}

// For array-type translations (mode info)
type ArrayTranslationKey = 'infoClassic' | 'infoSurge' | 'infoFiveplus' | 'infoOneword' | 'infoBomb';

export function getTranslationArray(lang: GameLanguage, key: ArrayTranslationKey): string[] {
  const val = translations[key] as any;
  return val[lang] ?? val.en;
}
