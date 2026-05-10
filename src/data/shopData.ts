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
  { id: 'bg-storybook', bgId: 'storybook', name: 'Storybook', unlockMethod: 'free', unlockDescription: 'Unlocked from the start!' },
  { id: 'bg-default', bgId: 'default', name: 'Cosmic Night', unlockMethod: 'free', unlockDescription: 'Unlocked from the start!' },
  { id: 'bg-clouds', bgId: 'clouds', name: 'Blue Sky', unlockMethod: 'coins', cost: 10, unlockDescription: 'Buy for 10 coins.' },
  { id: 'bg-wood', bgId: 'wood', name: 'Walnut', unlockMethod: 'ad', unlockDescription: 'Watch an ad to unlock.' },
  { id: 'bg-space', bgId: 'space', name: 'Space', unlockMethod: 'coins', cost: 100, unlockDescription: 'Buy for 100 coins.' },
  { id: 'bg-volcano', bgId: 'volcano', name: 'Volcano', unlockMethod: 'achievement', unlockDescription: 'Score 200 in Bomb Mode to unlock.' },
  { id: 'bg-beach', bgId: 'beach', name: 'Beach', unlockMethod: 'coins', cost: 75, unlockDescription: 'Buy for 75 coins.' },
  { id: 'bg-shipwreck', bgId: 'shipwreck', name: 'Shipwreck', unlockMethod: 'coins', cost: 250, unlockDescription: 'Buy for 250 coins.' },
  { id: 'bg-city', bgId: 'city', name: 'City', unlockMethod: 'coins', cost: 300, unlockDescription: 'Buy for 300 coins.' },
  { id: 'bg-underwater', bgId: 'underwater', name: 'Underwater', unlockMethod: 'coins', cost: 450, unlockDescription: 'Buy for 450 coins.' },
  { id: 'bg-cave', bgId: 'cave', name: 'Cave', unlockMethod: 'achievement', unlockDescription: 'Reach the first cave level in Adventure Mode.' },
  { id: 'bg-moon', bgId: 'moon', name: 'Moon', unlockMethod: 'achievement', unlockDescription: 'Reach the Moon Landing level in Adventure Mode.' },
  { id: 'bg-forest', bgId: 'forest', name: 'Forest', unlockMethod: 'achievement', unlockDescription: 'Combine a secret word to unlock.' },
];

export const tileShopItems: TileShopItem[] = [
  { id: 'tile-bubble', tileId: 'bubble', name: 'Bubbles', unlockMethod: 'free', unlockDescription: 'Unlocked from the start!' },
  { id: 'tile-rubik', tileId: 'rubik', name: 'Rubik', unlockMethod: 'coins', cost: 30, unlockDescription: 'Buy for 30 coins.' },
  { id: 'tile-shapes', tileId: 'shapes', name: 'Shapes', unlockMethod: 'free', unlockDescription: 'Unlocked from the start!' },
  { id: 'tile-soapbubble', tileId: 'soapbubble', name: 'Soap Bubbles', unlockMethod: 'coins', cost: 200, unlockDescription: 'Buy for 200 coins.' },
  { id: 'tile-sports', tileId: 'sports', name: 'Sports', unlockMethod: 'achievement', unlockDescription: 'Win 30 online games to unlock.' },
];

export interface MiscShopItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'action' | 'navigate';
  actionLabel?: string;
  /** For 'navigate' items */
  navigateTo?: string;
}

export const miscShopItems: MiscShopItem[] = [
  { id: 'watch-ad', name: 'Watch ad', description: 'Watch a video (~30s) and get 10 coins', icon: '📺', type: 'action', actionLabel: 'Watch video' },
  { id: 'adventure-mode', name: 'Adventure', description: 'Embark on a treasure-map journey!', icon: '🗺️', type: 'navigate', navigateTo: '/adventure' },
];
