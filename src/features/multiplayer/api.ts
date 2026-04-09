import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';
import type { GameLanguage } from '@/data/languages';
import { createMatchProgress, calculateMatchTotals, getCurrentRound, getCurrentTurn, getPlayerRoundData } from './state';
import type { HeadToHeadStats, MatchPlayerSlot, MatchProgressState, MPMode } from './types';

export type MatchRow = Tables<'matches'>;

export function getOpponentUserId(match: MatchRow, userId: string) {
  if (match.player1_id === userId) return match.player2_id;
  if (match.player2_id === userId) return match.player1_id;
  return null;
}

export function buildMatchUpdate(
  match: MatchRow,
  progress: MatchProgressState,
  options?: { forfeitBy?: MatchPlayerSlot },
): TablesUpdate<'matches'> {
  const totals = calculateMatchTotals(progress);
  const activeRound = getCurrentRound(progress);
  const activeTurn = getCurrentTurn(activeRound);
  const status: MatchRow['status'] = options?.forfeitBy
    ? 'forfeit'
    : progress.phase === 'match_over'
      ? 'completed'
      : 'active';

  let winnerId: string | null = null;
  if (options?.forfeitBy) {
    const winnerSlot = options.forfeitBy === 'player1' ? 'player2' : 'player1';
    winnerId = winnerSlot === 'player1' ? match.player1_id : match.player2_id;
  } else if (status === 'completed') {
    if (totals.player1 > totals.player2) winnerId = match.player1_id;
    if (totals.player2 > totals.player1) winnerId = match.player2_id;
  }

  const currentTurnId = status !== 'active'
    ? null
    : progress.phase === 'between_rounds'
      ? match.player1_id
      : activeTurn
        ? (activeTurn.player === 'player1' ? match.player1_id : match.player2_id ?? null)
        : null;

  return {
    current_round: activeRound?.roundNumber ?? progress.rounds.length,
    current_turn: currentTurnId,
    status,
    winner_id: winnerId,
    player1_score: totals.player1,
    player2_score: totals.player2,
    player1_rounds_data: getPlayerRoundData(progress, 'player1') as never,
    player2_rounds_data: getPlayerRoundData(progress, 'player2') as never,
    round_grids: progress as never,
    shared_used_words: (activeRound?.sharedUsedWords ?? []) as never,
    last_move_at: new Date().toISOString(),
    completed_at: status === 'active' ? null : new Date().toISOString(),
    total_rounds: progress.rounds.length,
  };
}

export async function createAiMatch(userId: string, mode: MPMode, language: GameLanguage) {
  const starter: MatchPlayerSlot = Math.random() < 0.5 ? 'player1' : 'player2';
  const progress = createMatchProgress(mode, language, starter);

  const { data, error } = await supabase
    .from('matches')
    .insert({
      mode,
      player1_id: userId,
      is_ai_match: true,
      status: 'active',
      current_round: 1,
      current_turn: starter === 'player1' ? userId : null,
      total_rounds: progress.rounds.length,
      player1_score: 0,
      player2_score: 0,
      player1_rounds_data: getPlayerRoundData(progress, 'player1') as never,
      player2_rounds_data: getPlayerRoundData(progress, 'player2') as never,
      round_grids: progress as never,
      shared_used_words: [] as never,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function fetchMatchById(matchId: string) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateMatch(matchId: string, updates: TablesUpdate<'matches'>) {
  const { data, error } = await supabase
    .from('matches')
    .update(updates)
    .eq('id', matchId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function fetchUserMatches(userId: string) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
    .in('status', ['active', 'waiting'])
    .order('last_move_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchProfileNames(userIds: string[]) {
  if (userIds.length === 0) return {} as Record<string, string>;

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', Array.from(new Set(userIds)));

  if (error) throw error;

  return Object.fromEntries((data ?? []).map((profile) => [profile.user_id, profile.display_name || 'Spelare']));
}

export async function fetchHeadToHeadStats(userId: string, match: MatchRow): Promise<HeadToHeadStats> {
  let query = supabase.from('matches').select('status, winner_id, player1_id, player2_id, player1_score, player2_score, is_ai_match');

  if (match.is_ai_match) {
    query = query.eq('player1_id', userId).eq('is_ai_match', true);
  } else {
    const opponentId = getOpponentUserId(match, userId);
    if (!opponentId) {
      return { wins: 0, losses: 0, draws: 0 };
    }
    query = query.or(
      `and(player1_id.eq.${userId},player2_id.eq.${opponentId}),and(player1_id.eq.${opponentId},player2_id.eq.${userId})`,
    );
  }

  const { data, error } = await query.in('status', ['completed', 'forfeit']);
  if (error) throw error;

  return (data ?? []).reduce<HeadToHeadStats>((stats, item) => {
    if (item.status === 'forfeit') {
      if (item.winner_id === userId) return { ...stats, wins: stats.wins + 1 };
      return { ...stats, losses: stats.losses + 1 };
    }

    if (item.winner_id === userId) return { ...stats, wins: stats.wins + 1 };
    if (item.winner_id && item.winner_id !== userId) return { ...stats, losses: stats.losses + 1 };

    const userScore = item.player1_id === userId ? item.player1_score : item.player2_score;
    const opponentScore = item.player1_id === userId ? item.player2_score : item.player1_score;

    if (userScore > opponentScore) return { ...stats, wins: stats.wins + 1 };
    if (opponentScore > userScore) return { ...stats, losses: stats.losses + 1 };
    return { ...stats, draws: stats.draws + 1 };
  }, { wins: 0, losses: 0, draws: 0 });
}
