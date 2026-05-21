// Shared letter pools / values for multiplayer grid generation per language.
// Keep in sync with src/data/languages.ts.

export type GameLanguage =
  | "en" | "sv" | "de" | "es" | "fr" | "it" | "pt" | "nl" | "no" | "da" | "fi";

export const AVAILABLE_LANGUAGES: GameLanguage[] = [
  "en", "sv", "de", "es", "fr", "it", "pt", "nl", "no", "da", "fi",
];

interface PoolConfig {
  pool: string;
  values: Record<string, number>;
}

export const LANG_POOLS: Record<GameLanguage, PoolConfig> = {
  en: {
    pool: "AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUVVWWXYYZ",
    values: { A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10 },
  },
  sv: {
    pool: "AAAAAAAABBDDDDDEEEEEEEFFGGGHIIIIIJKKKLLLLLMMMNNNNNNOOOOOOPPRRRRRRRRSSSSSSSSSTTTTTTTTTUUUVVXYÅÅÄÄÖÖ",
    values: { A:1,B:4,C:8,D:1,E:1,F:3,G:2,H:3,I:1,J:7,K:2,L:1,M:2,N:1,O:2,P:4,R:1,S:1,T:1,U:4,V:3,X:8,Y:7,Z:10,"Å":4,"Ä":4,"Ö":4 },
  },
  de: {
    pool: "AAAAABBCCDDDDEEEEEEEEEEEEEEEFFGGGHHHIIIIIIIJKKLLLMMMMNNNNNNNNNOOOPRRRRRRSSSSSSSSTTTTTTTUUUUUUVWXYZÄÖÜ",
    values: { A:1,B:3,C:4,D:1,E:1,F:4,G:2,H:2,I:1,J:6,K:4,L:2,M:3,N:1,O:2,P:4,Q:10,R:1,S:1,T:1,U:1,V:6,W:3,X:8,Y:10,Z:3,"Ä":6,"Ö":8,"Ü":6 },
  },
  es: {
    pool: "AAAAAAAAAAAABBCCCDDDDDEEEEEEEEEEEEEEFFGGHHIIIIIIIJKLLLLLLMMNNNNNÑOOOOOOOOPPQRRRRRRRRSSSSSSSSTTTTTTUUUUUVWXYZ",
    values: { A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:8,L:1,M:3,N:1,"Ñ":8,O:1,P:3,Q:5,R:1,S:1,T:1,U:1,V:4,W:8,X:8,Y:4,Z:10 },
  },
  fr: {
    pool: "AAAAAAAAABBCCDDDEEEEEEEEEEEEEEEEFFGGHIIIIIIIIIJKLLLLLLMMMNNNNNNNOOOOOOPPQRRRRRRSSSSSSSSTTTTTTTUUUUUUVWXYZ",
    values: { A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:10,L:1,M:2,N:1,O:1,P:3,Q:8,R:1,S:1,T:1,U:1,V:4,W:10,X:10,Y:10,Z:10 },
  },
  it: {
    pool: "AAAAAAAAAAAABBCCCCDDDDEEEEEEEEEEEEFFFGGGHHIIIIIIIIIIILLLLLMMMNNNNNNOOOOOOOOPPPQRRRRRRRSSSSSSTTTTTTTUUUUVVZZ",
    values: { A:1,B:5,C:2,D:5,E:1,F:5,G:8,H:8,I:1,J:8,K:8,L:3,M:3,N:3,O:1,P:5,Q:10,R:2,S:2,T:2,U:3,V:5,W:8,X:8,Y:8,Z:8 },
  },
  pt: {
    pool: "AAAAAAAAAAAABBCCCCDDDDEEEEEEEEEEEEEFFGGHHIIIIIIIIIJKLLLLMMMMNNNNOOOOOOOOPPQRRRRRRSSSSSSSSTTTTTTTUUUUVVXYZ",
    values: { A:1,B:3,C:2,D:2,E:1,F:4,G:4,H:4,I:1,J:5,K:8,L:2,M:1,N:3,O:1,P:2,Q:6,R:1,S:1,T:1,U:1,V:4,W:8,X:8,Y:8,Z:8 },
  },
  nl: {
    pool: "AAAAAABBDDDDEEEEEEEEEEEEFFGGHHIIIIIJKKLLLMMNNNNNNOOOOOOPPRRRRSSSSTTTTTTUUUVVWXYZ",
    values: { A:1,B:3,C:5,D:2,E:1,F:4,G:3,H:4,I:1,J:4,K:3,L:3,M:3,N:1,O:1,P:3,Q:10,R:2,S:2,T:2,U:4,V:4,W:5,X:8,Y:8,Z:4 },
  },
  no: {
    pool: "AAAAAABBDDDDEEEEEEEEEFFGGGGHIIIIIJKKKLLLLMMMNNNNNNOOOOOPPRRRRRRRSSSSSSSSTTTTTTTTUUUVVYÆØÅÅ",
    values: { A:1,B:4,C:10,D:1,E:1,F:2,G:2,H:3,I:1,J:4,K:2,L:1,M:2,N:1,O:2,P:4,R:1,S:1,T:1,U:4,V:4,W:8,X:8,Y:6,Z:10,"Æ":6,"Ø":5,"Å":4 },
  },
  da: {
    pool: "AAAAAABBDDDDEEEEEEEEEFFGGGHIIIIIJKKKLLLLMMMNNNNNNOOOOOOPPRRRRRRRSSSSSSSSTTTTTTTTUUUVVYÆØÅÅ",
    values: { A:1,B:3,C:8,D:2,E:1,F:3,G:3,H:4,I:3,J:4,K:3,L:2,M:3,N:1,O:2,P:4,R:1,S:1,T:2,U:3,V:3,W:8,X:8,Y:4,Z:9,"Æ":4,"Ø":4,"Å":4 },
  },
  fi: {
    pool: "AAAAAAAAABBDDEEEEEEEEEFFGHHIIIIIIIIJKKKKKLLLLLMMMNNNNNNNOOOOOPPPRRRSSSSSSSTTTTTTTTTUUUUUVVYYÄÄÖÖ",
    values: { A:1,B:8,C:10,D:7,E:1,F:8,G:8,H:4,I:1,J:4,K:2,L:2,M:3,N:1,O:2,P:4,R:4,S:1,T:1,U:4,V:4,W:8,X:8,Y:4,Z:10,"Ä":2,"Ö":7 },
  },
};

export function isValidLanguage(lang: unknown): lang is GameLanguage {
  return typeof lang === "string" && (AVAILABLE_LANGUAGES as string[]).includes(lang);
}
