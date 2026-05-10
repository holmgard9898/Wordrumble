/** Secret words that unlock the Forest background when found in any game.
 *  Match is case-insensitive and language-agnostic — finding the word
 *  in any of the listed languages unlocks 'bg-forest'. */
const FOREST_SECRET_WORDS = new Set<string>([
  // English: forest, wolf, ghost, tree, bear
  'forest', 'wolf', 'ghost', 'tree', 'bear',
  // Swedish: skog, varg, spöke, träd, björn
  'skog', 'varg', 'spöke', 'spoke', 'träd', 'trad', 'björn', 'bjorn',
  // German: wald, wolf, geist, baum, bär
  'wald', 'geist', 'baum', 'bär', 'bar',
  // Spanish: bosque, lobo, fantasma, árbol, oso
  'bosque', 'lobo', 'fantasma', 'árbol', 'arbol', 'oso',
  // French: forêt, loup, fantôme, arbre, ours
  'forêt', 'foret', 'loup', 'fantôme', 'fantome', 'arbre', 'ours',
  // Italian: bosco, lupo, fantasma, albero, orso
  'bosco', 'lupo', 'albero', 'orso',
  // Portuguese: floresta, lobo, fantasma, árvore, urso
  'floresta', 'árvore', 'arvore', 'urso',
  // Dutch: bos, wolf, spook, boom, beer
  'bos', 'spook', 'boom', 'beer',
  // Norwegian: skog, ulv, spøkelse, tre, bjørn
  'ulv', 'spøkelse', 'spokelse', 'tre', 'bjørn',
  // Danish: skov, ulv, spøgelse, træ, bjørn
  'skov', 'spøgelse', 'spogelse', 'træ', 'trae',
  // Finnish: metsä, susi, haamu, puu, karhu
  'metsä', 'metsa', 'susi', 'haamu', 'puu', 'karhu',
]);

export function isForestSecretWord(word: string): boolean {
  if (!word) return false;
  return FOREST_SECRET_WORDS.has(word.toLowerCase());
}
