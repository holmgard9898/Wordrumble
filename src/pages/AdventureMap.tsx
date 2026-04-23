import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X, Check } from 'lucide-react';
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

  // Build connection lines
  const lines: { from: { x: number; y: number }; to: { x: number; y: number }; key: string }[] = [];
  for (const lvl of adventureLevels) {
    for (const targetId of lvl.connectsTo) {
      const target = adventureLevels.find(l => l.id === targetId);
      if (target) lines.push({ from: lvl.mapPosition, to: target.mapPosition, key: `${lvl.id}-${targetId}` });
    }
  }

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

        {/* SVG dashed paths */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {lines.map(({ from, to, key }) => (
            <line key={key} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke="#8b5a2b" strokeWidth="0.4" strokeDasharray="1.5,1" vectorEffect="non-scaling-stroke" />
          ))}
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
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg relative" style={{
                background: completed ? 'linear-gradient(135deg, #4ade80, #16a34a)' : unlocked ? 'linear-gradient(135deg, #fbbf24, #d97706)' : 'linear-gradient(135deg, #94a3b8, #475569)',
                border: '3px solid rgba(255,255,255,0.9)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}>
                {!unlocked ? <X className="w-7 h-7 text-white" strokeWidth={4} style={{ color: '#dc2626' }} /> : <span>{lvl.icon}</span>}
                {completed && <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center"><Check className="w-3 h-3 text-green-600" /></div>}
              </div>
              <div className="text-center mt-1 text-xs font-bold" style={{ color: '#3a2510', textShadow: '1px 1px 0 rgba(255,255,255,0.5)' }}>
                {lvl.number}. {lvl.name[lang]}
              </div>
            </button>
          );
        })}
      </div>

      <Button onClick={() => { playClick(); navigate('/'); }} variant="ghost" className="gap-2" style={{ color: '#5a3a1a' }}>
        <ArrowLeft className="w-4 h-4" /> {t.mainMenu}
      </Button>
    </div>
  );
};

export default AdventureMap;
