import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowUp, Check } from 'lucide-react';
import { useSfx } from '@/hooks/useSfx';
import { useMenuMusic } from '@/hooks/useMenuMusic';
import { useTranslation } from '@/hooks/useTranslation';
import { adventureLevels } from '@/data/adventureLevels';
import { useAdventureProgress } from '@/hooks/useAdventureProgress';
import { useSettings } from '@/contexts/SettingsContext';
import adventureMapBg from '@/assets/adventure-map.jpg';

const AdventureMap = () => {
  useMenuMusic();
  const navigate = useNavigate();
  const { playClick } = useSfx();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { isUnlocked, isCompleted } = useAdventureProgress();
  const lang = settings.language;

  // Build connection lines (slightly curved for treasure-map feel)
  const lines: { from: { x: number; y: number }; to: { x: number; y: number }; key: string }[] = [];
  for (const lvl of adventureLevels) {
    for (const targetId of lvl.connectsTo) {
      const target = adventureLevels.find(l => l.id === targetId);
      if (target) lines.push({ from: lvl.mapPosition, to: target.mapPosition, key: `${lvl.id}-${targetId}` });
    }
  }

  // Portal to next map: appears after last level node, slightly above it
  const lastLevel = adventureLevels[adventureLevels.length - 1];
  const portalPos = { x: Math.min(lastLevel.mapPosition.x + 8, 92), y: Math.max(lastLevel.mapPosition.y - 10, 4) };
  const portalUnlocked = isCompleted(lastLevel.id);

  // Curved-ish path generator: small offset perpendicular for hand-drawn feel
  const curvePath = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    // perpendicular offset
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const off = 3;
    const cx = mx + (-dy / len) * off;
    const cy = my + (dx / len) * off;
    return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center treasure-map-bg p-4">
      <h1 className="text-4xl font-bold mb-2" style={{ color: '#5a3a1a', fontFamily: '"Fredoka One", cursive', textShadow: '2px 2px 0 rgba(255,255,255,0.3)' }}>
        🗺️ {t.adventureTitle}
      </h1>

      <div className="relative w-full max-w-2xl flex-1 my-4 rounded-2xl overflow-hidden" style={{
        aspectRatio: '9/16',
        backgroundImage: `url(${adventureMapBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        boxShadow: 'inset 0 0 60px rgba(60,30,10,0.5), 0 8px 30px rgba(0,0,0,0.4)',
        border: '4px solid rgba(120,70,30,0.6)',
      }}>

        {/* SVG treasure-map style dashed paths */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <filter id="inkBleed" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.15" />
            </filter>
          </defs>
          {lines.map(({ from, to, key }) => (
            <g key={key} filter="url(#inkBleed)">
              {/* soft brown shadow under */}
              <path d={curvePath(from, to)} fill="none" stroke="rgba(60,30,10,0.35)"
                strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2.2,2.2"
                vectorEffect="non-scaling-stroke" transform="translate(0.3,0.3)" />
              {/* main dark sienna dashes */}
              <path d={curvePath(from, to)} fill="none" stroke="#5a2e0c"
                strokeWidth="0.9" strokeLinecap="round" strokeDasharray="2,2"
                vectorEffect="non-scaling-stroke" />
            </g>
          ))}
          {/* Portal connector from last level to portal */}
          {portalUnlocked && (
            <g filter="url(#inkBleed)">
              <path d={curvePath(lastLevel.mapPosition, portalPos)} fill="none" stroke="#5a2e0c"
                strokeWidth="0.9" strokeLinecap="round" strokeDasharray="2,2"
                vectorEffect="non-scaling-stroke" />
            </g>
          )}
        </svg>

        {/* Level nodes */}
        {adventureLevels.map(lvl => {
          const unlocked = isUnlocked(lvl.id);
          const completed = isCompleted(lvl.id);
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
                /* Hand-drawn treasure-map X (no circle bg) */
                <svg width="56" height="56" viewBox="0 0 56 56" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }}>
                  {/* faint ink shadow */}
                  <g stroke="#3a1a06" strokeOpacity="0.4" strokeWidth="6" strokeLinecap="round" fill="none" transform="translate(1.5,1.5)">
                    <path d="M 12 11 Q 28 28 44 45" />
                    <path d="M 44 12 Q 28 28 12 44" />
                  </g>
                  {/* main hand-drawn strokes */}
                  <g stroke="#8a1a0a" strokeWidth="5.5" strokeLinecap="round" fill="none">
                    <path d="M 11 12 Q 20 22 28 28 T 44 44" />
                    <path d="M 44 11 Q 35 21 28 28 T 12 44" />
                  </g>
                  {/* highlight wisp */}
                  <g stroke="#c93824" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.7">
                    <path d="M 14 13 Q 22 22 28 28 T 42 43" />
                    <path d="M 42 13 Q 34 22 28 28 T 14 42" />
                  </g>
                </svg>
              )}
              <div className="text-center mt-1 text-xs font-bold" style={{ color: '#3a2510', textShadow: '1px 1px 0 rgba(255,255,255,0.5)' }}>
                {lvl.number}. {lvl.name[lang]}
              </div>
            </button>
          );
        })}

        {/* Portal to next map (decorative, not playable yet) */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${portalPos.x}%`, top: `${portalPos.y}%`, opacity: portalUnlocked ? 1 : 0.5 }}
          aria-hidden
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
            background: 'radial-gradient(circle at 30% 30%, #fde68a, #b45309)',
            border: '3px dashed rgba(90,46,12,0.8)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}>
            <ArrowUp className="w-6 h-6" style={{ color: '#3a1a06' }} strokeWidth={3} />
          </div>
          <div className="text-center mt-1 text-[10px] font-bold" style={{ color: '#3a2510', textShadow: '1px 1px 0 rgba(255,255,255,0.5)' }}>
            ???
          </div>
        </div>
      </div>

      <Button onClick={() => { playClick(); navigate('/'); }} variant="ghost" className="gap-2" style={{ color: '#5a3a1a' }}>
        <ArrowLeft className="w-4 h-4" /> {t.mainMenu}
      </Button>
    </div>
  );
};

export default AdventureMap;
