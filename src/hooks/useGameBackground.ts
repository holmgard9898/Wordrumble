import { useSettings } from '@/contexts/SettingsContext';
import cloudsBg from '@/assets/bg-clouds.jpg';
import woodBg from '@/assets/bg-wood.jpg';

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

  return { className: 'game-bg' };
}
