import { useSettings } from '@/contexts/SettingsContext';
import cloudsBg from '@/assets/bg-clouds.jpg';
import woodBg from '@/assets/bg-wood.jpg';
import spaceBg from '@/assets/bg-space.jpg';
import volcanoBg from '@/assets/bg-volcano.jpg';
import beachBg from '@/assets/bg-beach.jpg';

export function useGameBackground(): { className: string; style?: React.CSSProperties } {
  const { settings } = useSettings();

  if (settings.background === 'clouds') {
    return {
      className: 'game-bg-clouds',
      style: { backgroundImage: `url(${cloudsBg})` },
    };
  }

  if (settings.background === 'wood') {
    return {
      className: 'game-bg-clouds',
      style: { backgroundImage: `url(${woodBg})` },
    };
  }

  if (settings.background === 'space') {
    return {
      className: 'game-bg-clouds',
      style: { backgroundImage: `url(${spaceBg})` },
    };
  }

  if (settings.background === 'volcano') {
    return {
      className: 'game-bg-clouds',
      style: { backgroundImage: `url(${volcanoBg})` },
    };
  }

  if (settings.background === 'beach') {
    return {
      className: 'game-bg-clouds',
      style: { backgroundImage: `url(${beachBg})` },
    };
  }

  return { className: 'game-bg' };
}
