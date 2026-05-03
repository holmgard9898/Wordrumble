
-- ============================================================
-- 1. Restrict matches UPDATE to safe columns only
-- ============================================================
-- A BEFORE UPDATE trigger enforces column-level write rules.
-- The service_role (used by submit-turn edge function) bypasses
-- this check so authoritative game logic still works.

CREATE OR REPLACE FUNCTION public.enforce_matches_update_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_uid uuid := auth.uid();
  caller_role text := auth.role();
BEGIN
  -- Service role / postgres bypass: trust server-side mutations
  IF caller_role = 'service_role' OR caller_uid IS NULL THEN
    RETURN NEW;
  END IF;

  -- Caller must be a participant (RLS already enforces this, double-check)
  IF caller_uid <> OLD.player1_id AND caller_uid <> OLD.player2_id THEN
    RAISE EXCEPTION 'Not a participant of this match';
  END IF;

  -- Immutable identity / structural fields
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.player1_id IS DISTINCT FROM OLD.player1_id
     OR NEW.player2_id IS DISTINCT FROM OLD.player2_id
     OR NEW.mode IS DISTINCT FROM OLD.mode
     OR NEW.is_ai_match IS DISTINCT FROM OLD.is_ai_match
     OR NEW.total_rounds IS DISTINCT FROM OLD.total_rounds
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.started_at IS DISTINCT FROM OLD.started_at THEN
    RAISE EXCEPTION 'Cannot modify match identity fields from client';
  END IF;

  -- Score / winner / completion / phase progression are server-only
  IF NEW.player1_score IS DISTINCT FROM OLD.player1_score
     OR NEW.player2_score IS DISTINCT FROM OLD.player2_score
     OR NEW.winner_id IS DISTINCT FROM OLD.winner_id
     OR NEW.completed_at IS DISTINCT FROM OLD.completed_at
     OR NEW.current_turn IS DISTINCT FROM OLD.current_turn
     OR NEW.current_phase IS DISTINCT FROM OLD.current_phase
     OR NEW.current_round IS DISTINCT FROM OLD.current_round
     OR NEW.shared_used_words IS DISTINCT FROM OLD.shared_used_words THEN
    RAISE EXCEPTION 'Score / turn / phase fields can only be changed by the server';
  END IF;

  -- Players cannot write to the opponent's rounds data
  IF caller_uid = OLD.player1_id
     AND NEW.player2_rounds_data IS DISTINCT FROM OLD.player2_rounds_data THEN
    RAISE EXCEPTION 'Cannot modify opponent rounds data';
  END IF;
  IF caller_uid = OLD.player2_id
     AND NEW.player1_rounds_data IS DISTINCT FROM OLD.player1_rounds_data THEN
    RAISE EXCEPTION 'Cannot modify opponent rounds data';
  END IF;
  -- Own rounds data should also flow through the server normally; block client writes.
  IF NEW.player1_rounds_data IS DISTINCT FROM OLD.player1_rounds_data
     OR NEW.player2_rounds_data IS DISTINCT FROM OLD.player2_rounds_data THEN
    RAISE EXCEPTION 'Rounds data can only be appended via the server';
  END IF;

  -- Status transitions allowed from clients:
  --   waiting  -> active   (accepting / starting)
  --   active   -> forfeit  (giving up)
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
      (OLD.status = 'waiting' AND NEW.status = 'active')
      OR (OLD.status = 'active' AND NEW.status = 'forfeit')
    ) THEN
      RAISE EXCEPTION 'Status transition % -> % not allowed from client', OLD.status, NEW.status;
    END IF;
  END IF;

  -- Allowed client writes: status (limited transitions above), round_grids, last_move_at
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_matches_update_rules ON public.matches;
CREATE TRIGGER enforce_matches_update_rules
BEFORE UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.enforce_matches_update_rules();

-- ============================================================
-- 2. RLS on realtime.messages — restrict channel subscriptions
-- ============================================================
-- Without this, any authenticated user can subscribe to any topic
-- (including private match / chat / matchmaking topics). We allow
-- subscription only to topics owned by the authenticated user:
--   - match-<matchId>          : must be a participant
--   - friendships-changes      : any authenticated user (global feed they already filter)
--   - friend-requests          : any authenticated user
--   - match-updates            : any authenticated user (filtered client-side via RLS on matches)

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can subscribe to allowed topics"
  ON realtime.messages;

CREATE POLICY "Authenticated users can subscribe to allowed topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Generic global feeds the app already uses
  realtime.topic() IN ('friendships-changes', 'friend-requests', 'match-updates')
  -- Per-match channel: must be a participant
  OR (
    realtime.topic() LIKE 'match-%'
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id::text = substring(realtime.topic() from 7)
        AND (m.player1_id = auth.uid() OR m.player2_id = auth.uid())
    )
  )
);
