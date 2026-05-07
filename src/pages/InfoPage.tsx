import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';
import { useGameBackground } from '@/hooks/useGameBackground';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettings } from '@/contexts/SettingsContext';
import { BackButton } from '@/components/MenuButton';
import { getTutorialSteps } from '@/data/tutorials';
import type { GameMode } from '@/pages/GamePage';

const MODES: { mode: GameMode; nameKey: 'modeClassic' | 'modeSurge' | 'modeFiveplus' | 'modeOneword' | 'modeBomb'; emoji: string }[] = [
  { mode: 'classic',  nameKey: 'modeClassic',  emoji: '⏱️' },
  { mode: 'surge',    nameKey: 'modeSurge',    emoji: '⚡' },
  { mode: 'fiveplus', nameKey: 'modeFiveplus', emoji: '#️⃣' },
  { mode: 'oneword',  nameKey: 'modeOneword',  emoji: '🎯' },
  { mode: 'bomb',     nameKey: 'modeBomb',     emoji: '💣' },
];

const InfoPage = () => {
  const navigate = useNavigate();
  const bg = useGameBackground();
  const { t } = useTranslation();
  const { settings } = useSettings();

  return (
    <div className={`min-h-screen p-4 ${bg.className}`} style={bg.style}>
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 text-white mb-4 mt-2">
          <Info className="w-6 h-6 text-blue-300" />
          <h1 className="text-2xl font-bold">{settings.language === 'sv' ? 'Hur man spelar' : 'How to play'}</h1>
        </div>

        <div className="space-y-5 mb-6">
          {MODES.map(({ mode, nameKey, emoji }) => {
            const steps = getTutorialSteps(mode, settings.language);
            return (
              <section key={mode} className="rounded-2xl p-4" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h2 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                  <span>{emoji}</span>{t[nameKey]}
                </h2>
                <div className="space-y-3">
                  {steps.map((s, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="shrink-0 w-7 h-7 rounded-full bg-blue-500/30 text-blue-100 font-bold text-sm flex items-center justify-center mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-sm">{s.title}</div>
                        <p className="text-white/70 text-xs mt-1 whitespace-pre-line leading-relaxed">{s.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="flex justify-center">
          <BackButton onClick={() => navigate('/settings')} icon={<ArrowLeft className="w-4 h-4" />} label={t.back} />
        </div>
      </div>
    </div>
  );
};

export default InfoPage;
