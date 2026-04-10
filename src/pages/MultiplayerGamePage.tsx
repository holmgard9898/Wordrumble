import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDictionary } from '@/hooks/useDictionary';
import { useGameState } from '@/hooks/useGameState';
import { useSfx } from '@/hooks/useSfx';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useSettings } from '@/contexts/SettingsContext';
import { useGameBackground } from '@/hooks/useGameBackground';
import { GameBoard } from '@/components/game/GameBoard';
import { GameInfo } from '@/components/game/GameInfo';
import { WordHistory } from '@/components/game/WordHistory';
import { InGameMenu } from '@/components/game/InGameMenu';
import { Button } from '@/components/ui/button';
import { Menu, ArrowLeft, Trophy, Swords, Clock, Loader2 } from 'lucide-react';
import { createGrid, BubbleData, BUBBLE_COLORS, REDUCED_COLORS } from '@/data/gameConstants';
import { getLanguageConfig } from '@/data/languages';
import type { GameMode } from '@/pages/GamePage';
import { toast } from 'sonner';

interface MatchData {
  id: string;
  mode: 'classic' | 'surge' | 'fiveplus' | 'oneword';
  status: string;
  current_turn: string | null;
  current_round: number;
  current_phase: number;
  total_rounds: number;
  player1_id: string;
  player2_id: string | null;
  player1_score: number;
  player2_score: number;
  player1_rounds_data: any[];
  player2_rounds_data: any[];
  round_grids: Record<string, any>;
  shared_used_words: string[];
  winner_id: string | null;
}

const MODE_LABELS: Record<string, string> = {
  classic: 'Classic',
  surge: 'Word Surge',
  fiveplus: '5+ Bokstäver',
  oneword: 'Längsta Ordet',
};

function getMovesForPhase(mode: string, phase: number): number {
  if (mode === 'classic' || mode === 'fiveplus') {
    // Phase 1: 25, Phase 2: 50, Phase 3: 25
    if (phase === 1) return 25;
    if (phase === 2) return 50;
    return 25;
  }
  if (mode === 'oneword') return 60;
  return 50; // surge
}

const MultiplayerGamePage = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();
  const bg = useGameBackground();
  const langConfig = getLanguageConfig(settings.language);

  const [match, setMatch] = useState<MatchData | null>(null);
  const [opponentName, setOpponentName] = useState('Motståndare');
  const [loadingMatch, setLoadingMatch] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { isValidWord, loading: dictLoading } = useDictionary(settings.language);
  const { playSwap, playWordFound, playGameOver } = useSfx();

  // Determine game mode from match
  const gameMode: GameMode = (match?.mode || 'classic') as GameMode;
  const colors = gameMode === 'fiveplus' ? REDUCED_COLORS : BUBBLE_COLORS;

  const game = useGameState(isValidWord, gameMode, settings.language);

  const [showWords, setShowWords] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useBackgroundMusic(gameStarted && !showMenu);

  // Load match data
  useEffect(() => {
    if (!matchId || !user) return;
    loadMatch();

    const channel = supabase
      .channel(`match-${matchId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'matches',
        filter: `id=eq.${matchId}`,
      }, (payload) => {
        setMatch(payload.new as unknown as MatchData);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchId, user]);

  const loadMatch = async () => {
    if (!matchId) return;
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (error || !data) {
      toast.error('Matchen hittades inte');
      navigate('/challenge');
      return;
    }

    setMatch(data as unknown as MatchData);

    // Load opponent name
    const opponentId = data.player1_id === user?.id ? data.player2_id : data.player1_id;
    if (opponentId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', opponentId)
        .single();
      if (profile) setOpponentName(profile.display_name);
    }

    setLoadingMatch(false);
  };

  // Start game when it's my turn
  useEffect(() => {
    if (!match || !user || dictLoading || gameStarted) return;
    if (match.current_turn !== user.id) return;
    if (match.status !== 'active') return;

    // Determine grid for this phase
    let grid: BubbleData[][];
    const roundGrids = (match.round_grids || {}) as Record<string, any>;
    const currentPhase = match.current_phase || 1;
    const isClassicLike = match.mode === 'classic' || match.mode === 'fiveplus';

    if (isClassicLike && currentPhase > 1) {
      // Phase 2 or 3: use previous phase's final grid
      const prevPhaseKey = `r${match.current_round}_p${currentPhase - 1}`;
      if (roundGrids[prevPhaseKey]) {
        grid = roundGrids[prevPhaseKey] as BubbleData[][];
      } else {
        // Fallback: generate fresh grid
        grid = createGrid(colors, langConfig.letterPool, langConfig.letterValues);
      }
    } else {
      // Phase 1 or non-classic: check for stored starting grid
      const startKey = `r${match.current_round}_start`;
      if (roundGrids[startKey]) {
        grid = roundGrids[startKey] as BubbleData[][];
      } else {
        grid = createGrid(colors, langConfig.letterPool, langConfig.letterValues);
        // Save starting grid
        const newGrids = { ...roundGrids, [startKey]: grid };
        supabase.from('matches').update({ round_grids: newGrids }).eq('id', match.id);
      }
    }

    const blockedWords = match.shared_used_words || [];
    const maxMoves = getMovesForPhase(match.mode, currentPhase);

    game.startFromState(grid, maxMoves, blockedWords);
    setGameStarted(true);
  }, [match, user, dictLoading, gameStarted]);

  useEffect(() => {
    if (game.lastFoundWord) playWordFound();
  }, [game.lastFoundWord, playWordFound]);

  const handleBubbleClick = useCallback((row: number, col: number) => {
    const hadSelection = game.selectedBubble !== null;
    game.handleBubbleClick(row, col);
    if (hadSelection) playSwap();
  }, [game, playSwap]);

  // Submit turn when game is over
  useEffect(() => {
    if (game.gameOver && gameStarted && match && !submitting) {
      submitTurn();
    }
  }, [game.gameOver, gameStarted]);

  const submitTurn = async () => {
    if (!match || !user || submitting) return;
    setSubmitting(true);

    const score = gameMode === 'oneword' ? game.bestWordScore : game.score;

    try {
      const { data, error } = await supabase.functions.invoke('submit-turn', {
        body: {
          match_id: match.id,
          score,
          words: game.usedWords.map(w => ({ word: w.word, score: w.score })),
          best_word: game.bestWord,
          best_word_score: game.bestWordScore,
          final_grid: game.grid,
        },
      });

      if (error) throw error;

      setMatch(data.match as MatchData);
      setGameStarted(false);
      playGameOver();
    } catch (err: any) {
      toast.error('Kunde inte skicka tur');
      setSubmitting(false);
    }
  };

  // Loading states
  if (loadingMatch || dictLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${bg.className}`} style={bg.style}>
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <div className="text-white/60">Laddar match...</div>
      </div>
    );
  }

  if (!match) return null;

  const isMyTurn = match.current_turn === user?.id;
  const isPlayer1 = match.player1_id === user?.id;
  const myScore = isPlayer1 ? match.player1_score : match.player2_score;
  const opponentScore = isPlayer1 ? match.player2_score : match.player1_score;

  // Match completed
  if (match.status === 'completed') {
    const iWon = match.winner_id === user?.id;
    const draw = !match.winner_id;

    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 gap-6 ${bg.className}`} style={bg.style}>
        <Trophy className={`w-16 h-16 ${iWon ? 'text-yellow-400' : draw ? 'text-white/50' : 'text-red-400'}`} />
        <h2 className="text-4xl font-bold text-white">
          {iWon ? 'Du vann!' : draw ? 'Oavgjort!' : `${opponentName} vann!`}
        </h2>

        <div className="flex gap-8 w-full max-w-md">
          <div className="flex-1 rounded-xl p-4 text-center" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <p className="text-blue-400 text-sm font-semibold mb-1">Du</p>
            <p className="text-white text-4xl font-bold">{myScore}</p>
          </div>
          <div className="flex-1 rounded-xl p-4 text-center" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <p className="text-red-400 text-sm font-semibold mb-1">{opponentName}</p>
            <p className="text-white text-4xl font-bold">{opponentScore}</p>
          </div>
        </div>

        {/* Round breakdown */}
        <div className="rounded-xl p-4 w-full max-w-md" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <p className="text-white/70 text-sm mb-2">Omgångar</p>
          {(isPlayer1 ? match.player1_rounds_data : match.player2_rounds_data).map((rd: any, i: number) => {
            const opRd = (isPlayer1 ? match.player2_rounds_data : match.player1_rounds_data)[i];
            return (
              <div key={i} className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/50 text-sm">Omgång {i + 1}</span>
                <span className="text-blue-400 text-sm">{rd?.score ?? 0}</span>
                <span className="text-white/30 text-sm">vs</span>
                <span className="text-red-400 text-sm">{opRd?.score ?? 0}</span>
              </div>
            );
          })}
        </div>

        <Button
          onClick={() => navigate('/challenge')}
          variant="ghost"
          className="text-white/60 hover:text-white hover:bg-white/10 gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Tillbaka
        </Button>
      </div>
    );
  }

  // Waiting for opponent's turn
  if (!isMyTurn && !gameStarted) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 gap-6 ${bg.className}`} style={bg.style}>
        <Clock className="w-12 h-12 text-purple-400 animate-pulse" />
        <h2 className="text-2xl font-bold text-white">Inväntar {opponentName}</h2>
        <p className="text-white/50 text-sm">
          {MODE_LABELS[match.mode]} • Omgång {match.current_round}/{match.total_rounds} • Fas {match.current_phase || 1}/3
        </p>

        <div className="flex gap-8 w-full max-w-sm">
          <div className="flex-1 rounded-xl p-4 text-center" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <p className="text-blue-400 text-sm font-semibold mb-1">Du</p>
            <p className="text-white text-3xl font-bold">{myScore}</p>
          </div>
          <div className="flex-1 rounded-xl p-4 text-center" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <p className="text-red-400 text-sm font-semibold mb-1">{opponentName}</p>
            <p className="text-white text-3xl font-bold">{opponentScore}</p>
          </div>
        </div>

        <Button
          onClick={() => navigate('/challenge')}
          variant="ghost"
          className="text-white/60 hover:text-white hover:bg-white/10 gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Tillbaka till matcher
        </Button>
      </div>
    );
  }

  // Just submitted turn
  if (submitting || (game.gameOver && !isMyTurn)) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 gap-6 ${bg.className}`} style={bg.style}>
        <Swords className="w-12 h-12 text-purple-400" />
        <h2 className="text-2xl font-bold text-white">Tur skickad!</h2>
        <p className="text-white/50 text-sm">
          Du fick {gameMode === 'oneword' ? game.bestWordScore : game.score} poäng denna omgång
        </p>
        <p className="text-white/40 text-xs">Inväntar {opponentName}...</p>

        <Button
          onClick={() => navigate('/challenge')}
          className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Tillbaka till matcher
        </Button>
      </div>
    );
  }

  // Playing phase
  return (
    <div className={`min-h-screen flex flex-col items-center p-2 md:p-4 ${bg.className}`} style={bg.style}>
      <div className="w-full max-w-4xl flex items-center justify-between mb-2 md:mb-4 px-1">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">
            {MODE_LABELS[match.mode]}
          </h1>
          <p className="text-white/50 text-xs">
            Omgång {match.current_round}/{match.total_rounds} • Fas {match.current_phase || 1}/3 • vs {opponentName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-white/40 text-xs">Poäng</p>
            <div className="flex gap-2 text-sm">
              <span className="text-blue-400 font-bold">{myScore}</span>
              <span className="text-white/30">-</span>
              <span className="text-red-400 font-bold">{opponentScore}</span>
            </div>
          </div>
          <button onClick={() => setShowMenu(true)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <Menu className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 md:gap-6 items-center lg:items-start w-full max-w-4xl justify-center">
        <GameBoard
          grid={game.grid}
          selectedBubble={game.selectedBubble}
          poppingCells={game.poppingCells}
          onBubbleClick={handleBubbleClick}
          onSwipe={game.handleSwipe}
        />
        <GameInfo
          movesLeft={game.movesLeft}
          score={game.score}
          lastFoundWord={game.lastFoundWord}
          onResetGame={() => {}}
          onShowWords={() => setShowWords(true)}
          usedWordsCount={game.usedWords.length}
          mode={gameMode}
          bestWordScore={game.bestWordScore}
          bestWord={game.bestWord}
        />
      </div>

      <WordHistory open={showWords} onOpenChange={setShowWords} words={game.usedWords} />
      <InGameMenu open={showMenu} onClose={() => setShowMenu(false)} />
    </div>
  );
};

export default MultiplayerGamePage;
