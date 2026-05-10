import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { useSfx } from '@/hooks/useSfx';
import { useMenuMusic } from '@/hooks/useMenuMusic';
import { useTranslation } from '@/hooks/useTranslation';
import { adventureLevels } from '@/data/adventureLevels';
import { useAdventureProgress } from '@/hooks/useAdventureProgress';
import { useSettings } from '@/contexts/SettingsContext';
import adventureMapBg from '@/assets/adventure-map.jpg';
import adventureMapSpaceBg from '@/assets/adventure-map-space.jpg';
import adventureMap3Bg from '@/assets/adventure-map-3.jpg';

interface Props {
  mapNumber?: number;
}

const AdventureMap = ({ mapNumber = 1 }: Props) => {
  useMenuMusic();
  const navigate = useNavigate();
  const { playClick } = useSfx();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { isUnlocked, isCompleted } = useAdventureProgress();
  const lang = settings.language;

  const levels = adventureLevels.filter(l => (l.map ?? 1) === mapNumber);
  const bgImage = mapNumber === 3 ? adventureMap3Bg : mapNumber === 2 ? adventureMapSpaceBg : adventureMapBg;
  const isDarkMap = mapNumber === 2 || mapNumber === 3;

  // Build connection lines
  const lines: { from: { x: number; y: number }; to: { x: number; y: number }; key: string }[] = [];
  for (const lvl of levels) {
    for (const targetId of lvl.connectsTo) {
      const target = levels.find(l => l.id === targetId);
      if (target) lines.push({ from: lvl.mapPosition, to: target.mapPosition, key: `${lvl.id}-${targetId}` });
    }
  }

  // Portals: every map (except the last) shows an "up" portal to the next map
  // when its final level is complete. Maps 2+ also show a "down" portal back.
  const lastLevel = levels[levels.length - 1];
  const hasNextMap = mapNumber < 3;
  const hasPrevMap = mapNumber > 1;
  const portalUpPos = { x: 92, y: 6 };
  const portalDownPos = { x: 8, y: 94 };
  const portalUpUnlocked = isCompleted(lastLevel.id);

  const curvePath = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const off = 3;
    const cx = mx + (-dy / len) * off;
    const cy = my + (dx / len) * off;
    return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
  };

  const titlePrefix = mapNumber === 3 ? '🏰' : mapNumber === 2 ? '🚀' : '🗺️';
  const titleSuffix = mapNumber === 3 ? ' III' : mapNumber === 2 ? ' II' : '';

  return (
    <div className="min-h-screen flex flex-col items-center treasure-map-bg p-4">
      <h1 className="text-4xl font-bold mb-2" style={{ color: '#5a3a1a', fontFamily: '"Fredoka One", cursive', textShadow: '2px 2px 0 rgba(255,255,255,0.3)' }}>
        {titlePrefix} {t.adventureTitle}{titleSuffix}
      </h1>

      <div className="relative w-full max-w-2xl flex-1 my-4 rounded-2xl overflow-hidden" style={{
        aspectRatio: '9/16',
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        boxShadow: 'inset 0 0 60px rgba(60,30,10,0.5), 0 8px 30px rgba(0,0,0,0.4)',
        border: '4px solid rgba(120,70,30,0.6)',
      }}>

        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <filter id="inkBleed" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.15" />
            </filter>
          </defs>
          {lines.map(({ from, to, key }) => (
            <g key={key} filter="url(#inkBleed)">
              <path d={curvePath(from, to)} fill="none" stroke="rgba(60,30,10,0.35)"
                strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2.2,2.2"
                vectorEffect="non-scaling-stroke" transform="translate(0.3,0.3)" />
              <path d={curvePath(from, to)} fill="none" stroke={isDarkMap ? '#fde68a' : '#5a2e0c'}
                strokeWidth="0.9" strokeLinecap="round" strokeDasharray="2,2"
                vectorEffect="non-scaling-stroke" />
            </g>
          ))}
          {hasNextMap && portalUpUnlocked && (
            <g filter="url(#inkBleed)">
              <path d={curvePath(lastLevel.mapPosition, portalUpPos)} fill="none" stroke={isDarkMap ? '#fde68a' : '#5a2e0c'}
                strokeWidth="0.9" strokeLinecap="round" strokeDasharray="2,2"
                vectorEffect="non-scaling-stroke" />
            </g>
          )}
        </svg>

        {levels.map(lvl => {
          const unlocked = isUnlocked(lvl.id);
          const completed = isCompleted(lvl.id);
          const labelColor = isDarkMap ? '#fef3c7' : '#3a2510';
          const labelShadow = isDarkMap ? '1px 1px 2px rgba(0,0,0,0.8)' : '1px 1px 0 rgba(255,255,255,0.5)';
          return (
            <button
              key={lvl.id}
              onClick={() => { playClick(); if (unlocked) navigate(`/adventure/${lvl.id}`); }}
              disabled={!unlocked}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 active:scale-95"
              style={{ left: `${lvl.mapPosition.x}%`, top: `${lvl.mapPosition.y}%` }}
            >
              {unlocked ? (
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg relative" style={{
                  background: completed ? 'linear-gradient(135deg, #4ade80, #16a34a)' : 'linear-gradient(135deg, #fbbf24, #d97706)',
                  border: '3px solid rgba(255,255,255,0.9)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                }}>
                  <span>{lvl.icon}</span>
                  {completed && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                  )}
                </div>
              ) : (
                <svg width="56" height="56" viewBox="0 0 56 56" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }}>
                  <g stroke="#3a1a06" strokeOpacity="0.4" strokeWidth="6" strokeLinecap="round" fill="none" transform="translate(1.5,1.5)">
                    <path d="M 12 11 Q 28 28 44 45" />
                    <path d="M 44 12 Q 28 28 12 44" />
                  </g>
                  <g stroke="#8a1a0a" strokeWidth="5.5" strokeLinecap="round" fill="none">
                    <path d="M 11 12 Q 20 22 28 28 T 44 44" />
                    <path d="M 44 11 Q 35 21 28 28 T 12 44" />
                  </g>
                </svg>
              )}
              <div className="text-center mt-1 text-xs font-bold" style={{ color: labelColor, textShadow: labelShadow }}>
                {lvl.number}. {lvl.name[lang]}
              </div>
            </button>
          );
        })}

        {/* Up portal: leads to next map (always at top-right of last level) */}
        {hasNextMap && (
          <button
            onClick={() => { if (portalUpUnlocked) { playClick(); navigate(`/adventure/map/${mapNumber + 1}`); } }}
            disabled={!portalUpUnlocked}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 active:scale-95"
            style={{ left: `${portalUpPos.x}%`, top: `${portalUpPos.y}%`, opacity: portalUpUnlocked ? 1 : 0.5 }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
              background: 'radial-gradient(circle at 30% 30%, #fde68a, #b45309)',
              border: '3px dashed rgba(90,46,12,0.8)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}>
              <ArrowUp className="w-6 h-6" style={{ color: '#3a1a06' }} strokeWidth={3} />
            </div>
            <div className="text-center mt-1 text-[10px] font-bold" style={{ color: isDarkMap ? '#fef3c7' : '#3a2510', textShadow: isDarkMap ? '1px 1px 2px rgba(0,0,0,0.8)' : '1px 1px 0 rgba(255,255,255,0.5)' }}>
              {portalUpUnlocked ? (mapNumber === 1 ? '🚀' : mapNumber === 2 ? '🏰' : '➡️') : '???'}
            </div>
          </button>
        )}

        {/* Down portal: returns to previous map */}
        {hasPrevMap && (
          <button
            onClick={() => { playClick(); navigate(mapNumber === 2 ? '/adventure' : `/adventure/map/${mapNumber - 1}`); }}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 active:scale-95"
            style={{ left: `${portalDownPos.x}%`, top: `${portalDownPos.y}%` }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
              background: 'radial-gradient(circle at 30% 30%, #a7f3d0, #047857)',
              border: '3px dashed rgba(254,243,199,0.9)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}>
              <ArrowDown className="w-6 h-6" style={{ color: '#fef3c7' }} strokeWidth={3} />
            </div>
            <div className="text-center mt-1 text-[10px] font-bold" style={{ color: '#fef3c7', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
              🗺️ {mapNumber === 2 ? 'I' : 'II'}
            </div>
          </button>
        )}
      </div>

      <Button onClick={() => { playClick(); navigate(mapNumber > 1 ? (mapNumber === 2 ? '/adventure' : `/adventure/map/${mapNumber - 1}`) : '/'); }} variant="ghost" className="gap-2" style={{ color: '#5a3a1a' }}>
        <ArrowLeft className="w-4 h-4" /> {mapNumber > 1 ? `🗺️ ${t.adventureTitle} ${mapNumber === 2 ? 'I' : 'II'}` : t.mainMenu}
      </Button>
    </div>
  );
};

export default AdventureMap;
