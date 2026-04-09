import { useSettings } from '@/contexts/SettingsContext';
import cloudsBg from '@/assets/bg-clouds.jpg';

export function useGameBackground(): { className: string; style?: React.CSSProperties } {
  const { settings } = useSettings();

  if (settings.background === 'clouds') {
    return {
      className: 'game-bg-clouds',
      style: { backgroundImage: `url(${cloudsBg})` },
    };
  }

  return { className: 'game-bg' };
}
