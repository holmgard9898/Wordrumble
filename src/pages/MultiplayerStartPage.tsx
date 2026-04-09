import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { useSettings } from '@/contexts/SettingsContext';
import { useGameBackground } from '@/hooks/useGameBackground';
import { useAuth } from '@/hooks/useAuth';
import { createAiMatch } from '@/features/multiplayer/api';
import type { MPMode } from '@/features/multiplayer/types';

const VALID_MODES: MPMode[] = ['classic', 'surge', 'fiveplus', 'oneword'];

const MultiplayerStartPage = () => {
  const { mode = 'mp-classic' } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const bg = useGameBackground();
  const { user, loading } = useAuth();
  const startedRef = useRef(false);
  const matchMode = mode.replace('mp-', '') as MPMode;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [loading, navigate, user]);

  useEffect(() => {
    if (loading || !user || startedRef.current) return;
    if (!VALID_MODES.includes(matchMode)) {
      navigate('/challenge', { replace: true });
      return;
    }

    startedRef.current = true;
    createAiMatch(user.id, matchMode, settings.language)
      .then((match) => {
        navigate(`/challenge/match/${match.id}`, { replace: true });
      })
      .catch(() => {
        toast({
          title: 'Kunde inte starta matchen',
          description: 'Försök igen från Utmana-menyn.',
        });
        navigate('/challenge', { replace: true });
      });
  }, [loading, matchMode, navigate, settings.language, user]);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${bg.className}`} style={bg.style}>
      <div className="text-white text-2xl font-bold">Skapar match...</div>
      <div className="w-56 h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full w-2/3 rounded-full bg-primary animate-pulse" />
      </div>
    </div>
  );
};

export default MultiplayerStartPage;
