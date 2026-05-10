import { useSettings, type GameBackground } from '@/contexts/SettingsContext';
import cloudsBg from '@/assets/bg-clouds.jpg';
import woodBg from '@/assets/bg-wood.jpg';
import spaceBg from '@/assets/bg-space.jpg';
import volcanoBg from '@/assets/bg-volcano.jpg';
import beachBg from '@/assets/bg-beach.jpg';
import underwaterBg from '@/assets/bg-underwater.jpg';
import shipwreckBg from '@/assets/bg-shipwreck.jpg';
import caveBg from '@/assets/bg-cave.jpg';
import cityBg from '@/assets/bg-city.jpg';
import storybookBg from '@/assets/bg-storybook.jpg';
import moonBg from '@/assets/bg-moon.jpg';
import forestBg from '@/assets/bg-forest.jpg';
import spookyCastleBg from '@/assets/bg-spookycastle.jpg';

const BG_IMAGES: Partial<Record<GameBackground, string>> = {
  storybook: storybookBg,
  clouds: cloudsBg,
  wood: woodBg,
  space: spaceBg,
  volcano: volcanoBg,
  beach: beachBg,
  underwater: underwaterBg,
  shipwreck: shipwreckBg,
  cave: caveBg,
  city: cityBg,
  moon: moonBg,
  forest: forestBg,
  spookycastle: spookyCastleBg,
};

/**
 * @param override Optional GameBackground that overrides the user's setting.
 *                 Used by Adventure Mode so each level uses a fixed background
 *                 without unlocking it for the rest of the game.
 */
export function useGameBackground(override?: GameBackground): { className: string; style?: React.CSSProperties } {
  const { settings } = useSettings();
  const active = override ?? settings.background;

  const img = BG_IMAGES[active];
  if (img) {
    return {
      className: 'game-bg-clouds',
      style: { backgroundImage: `url(${img})` },
    };
  }
  return { className: 'game-bg' };
}
