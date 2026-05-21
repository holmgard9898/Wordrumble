ALTER TABLE public.matches ADD COLUMN language text NOT NULL DEFAULT 'sv';
ALTER TABLE public.matchmaking_queue ADD COLUMN language text NOT NULL DEFAULT 'sv';

CREATE INDEX IF NOT EXISTS idx_matches_open_lookup
  ON public.matches (status, mode, language, player2_id);
CREATE INDEX IF NOT EXISTS idx_queue_lookup
  ON public.matchmaking_queue (mode, language, joined_at);

CREATE OR REPLACE FUNCTION public.enforce_matches_update_rules()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  caller_uid uuid := auth.uid();
  caller_role text := auth.role();
BEGIN
  IF caller_role = 'service_role' OR caller_uid IS NULL THEN
    RETURN NEW;
  END IF;

  IF caller_uid <> OLD.player1_id AND caller_uid <> OLD.player2_id THEN
    RAISE EXCEPTION 'Not a participant of this match';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.player1_id IS DISTINCT FROM OLD.player1_id
     OR NEW.player2_id IS DISTINCT FROM OLD.player2_id
     OR NEW.mode IS DISTINCT FROM OLD.mode
     OR NEW.language IS DISTINCT FROM OLD.language
     OR NEW.is_ai_match IS DISTINCT FROM OLD.is_ai_match
     OR NEW.total_rounds IS DISTINCT FROM OLD.total_rounds
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.started_at IS DISTINCT FROM OLD.started_at THEN
    RAISE EXCEPTION 'Cannot modify match identity fields from client';
  END IF;

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

  IF caller_uid = OLD.player1_id
     AND NEW.player2_rounds_data IS DISTINCT FROM OLD.player2_rounds_data THEN
    RAISE EXCEPTION 'Cannot modify opponent rounds data';
  END IF;
  IF caller_uid = OLD.player2_id
     AND NEW.player1_rounds_data IS DISTINCT FROM OLD.player1_rounds_data THEN
    RAISE EXCEPTION 'Cannot modify opponent rounds data';
  END IF;
  IF NEW.player1_rounds_data IS DISTINCT FROM OLD.player1_rounds_data
     OR NEW.player2_rounds_data IS DISTINCT FROM OLD.player2_rounds_data THEN
    RAISE EXCEPTION 'Rounds data can only be appended via the server';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
      (OLD.status = 'waiting' AND NEW.status = 'active')
      OR (OLD.status = 'active' AND NEW.status = 'forfeit')
    ) THEN
      RAISE EXCEPTION 'Status transition % -> % not allowed from client', OLD.status, NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;