import type { GameBackground, TileStyle } from '@/contexts/SettingsContext';

export type UnlockMethod = 'coins' | 'ad' | 'achievement' | 'free';

export interface ShopItem {
  id: string;
  name: string;
  unlockMethod: UnlockMethod;
  /** Coin cost (only for 'coins' method) */
  cost?: number;
  /** Description of how to unlock */
  unlockDescription: string;
}

export interface BgShopItem extends ShopItem {
  bgId: GameBackground;
}

export interface TileShopItem extends ShopItem {
  tileId: TileStyle;
}

export const bgShopItems: BgShopItem[] = [
  {
    id: 'bg-default',
    bgId: 'default',
    name: 'Cosmic Night',
    unlockMethod: 'free',
    unlockDescription: 'Upplåst från början!',
  },
  {
    id: 'bg-clouds',
    bgId: 'clouds',
    name: 'Blue Sky',
    unlockMethod: 'coins',
    cost: 10,
    unlockDescription: 'Köp för 10 coins.',
  },
  {
    id: 'bg-wood',
    bgId: 'wood',
    name: 'Valnöt',
    unlockMethod: 'ad',
    unlockDescription: 'Titta på en reklamvideo för att låsa upp.',
  },
  {
    id: 'bg-space',
    bgId: 'space',
    name: 'Rymden',
    unlockMethod: 'coins',
    cost: 100,
    unlockDescription: 'Köp för 100 coins.',
  },
  {
    id: 'bg-volcano',
    bgId: 'volcano',
    name: 'Vulkan',
    unlockMethod: 'achievement',
    unlockDescription: 'Nå 200 poäng i Bomb Mode för att låsa upp.',
  },
  {
    id: 'bg-beach',
    bgId: 'beach',
    name: 'Strand',
    unlockMethod: 'coins',
    cost: 75,
    unlockDescription: 'Köp för 75 coins.',
  },
];

export const tileShopItems: TileShopItem[] = [
  {
    id: 'tile-bubble',
    tileId: 'bubble',
    name: 'Bubblor',
    unlockMethod: 'free',
    unlockDescription: 'Upplåst från början!',
  },
  {
    id: 'tile-rubik',
    tileId: 'rubik',
    name: 'Rubik',
    unlockMethod: 'coins',
    cost: 30,
    unlockDescription: 'Köp för 30 coins.',
  },
  {
    id: 'tile-shapes',
    tileId: 'shapes',
    name: 'Former',
    unlockMethod: 'free',
    unlockDescription: 'Upplåst från början!',
  },
  {
    id: 'tile-soapbubble',
    tileId: 'soapbubble',
    name: 'Såpbubblor',
    unlockMethod: 'coins',
    cost: 200,
    unlockDescription: 'Köp för 200 coins.',
  },
  {
    id: 'tile-sports',
    tileId: 'sports',
    name: 'Sport',
    unlockMethod: 'achievement',
    unlockDescription: 'Vinn 30 online-spel för att låsa upp.',
  },
];

export interface MiscShopItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'action' | 'coming-soon';
  /** For action items: what happens on click */
  actionLabel?: string;
}

export const miscShopItems: MiscShopItem[] = [
  {
    id: 'watch-ad',
    name: 'Se reklam',
    description: 'Titta på en video (~30s) och få 10 coins',
    icon: '📺',
    type: 'action',
    actionLabel: 'Se video',
  },
  {
    id: 'adventure-mode',
    name: 'Äventyr',
    description: 'Kommer snart!',
    icon: '🗺️',
    type: 'coming-soon',
  },
];
