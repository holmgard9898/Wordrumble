import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function getPhaseConfig(mode: string) {
  // Classic and fiveplus use 3 phases per round: 25 → 50 → 25
  if (mode === "classic" || mode === "fiveplus") {
    return { phases: 3, moves: [25, 50, 25], sharedWords: true };
  }
  // Surge: each player plays independently, no shared words
  if (mode === "surge") {
    return { phases: 2, moves: [50, 50], sharedWords: false };
  }
  // Oneword: each player plays independently
  return { phases: 2, moves: [60, 60], sharedWords: false };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { match_id, score, words, best_word, best_word_score, final_grid } = body;

    if (!match_id || score === undefined) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: match, error: matchErr } = await admin
      .from("matches")
      .select("*")
      .eq("id", match_id)
      .single();

    if (matchErr || !match) {
      return new Response(JSON.stringify({ error: "Match not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (match.current_turn !== user.id) {
      return new Response(JSON.stringify({ error: "Not your turn" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (match.status !== "active") {
      return new Response(JSON.stringify({ error: "Match not active" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isPlayer1 = match.player1_id === user.id;
    const opponentId = isPlayer1 ? match.player2_id : match.player1_id;
    const currentPhase = match.current_phase || 1;
    const phaseConfig = getPhaseConfig(match.mode);

    // Build phase result
    const phaseResult = {
      round: match.current_round,
      phase: currentPhase,
      score,
      words: words || [],
      best_word: best_word || null,
      best_word_score: best_word_score || 0,
      final_grid: final_grid || null,
    };

    // Append to player's rounds data
    const roundsDataKey = isPlayer1 ? "player1_rounds_data" : "player2_rounds_data";
    const scoreKey = isPlayer1 ? "player1_score" : "player2_score";
    const currentRoundsData = (match[roundsDataKey] as any[]) || [];
    const newRoundsData = [...currentRoundsData, phaseResult];
    const newTotalScore = (match[scoreKey] as number) + score;

    // Add words to shared used words
    const sharedWords = (match.shared_used_words as string[]) || [];
    const wordStrings = (words || []).map((w: any) =>
      typeof w === "string" ? w.toLowerCase() : w.word?.toLowerCase()
    ).filter(Boolean);
    const newSharedWords = phaseConfig.sharedWords
      ? [...sharedWords, ...wordStrings]
      : sharedWords;

    // Store phase grid for next phase to use
    const roundGrids = (match.round_grids as any[]) || [];
    const phaseGridKey = `r${match.current_round}_p${currentPhase}`;
    const newRoundGrids = { ...Object.fromEntries(roundGrids.map ? [] : Object.entries(roundGrids || {})) };
    // Store as object keyed by round_phase
    let gridStore: Record<string, any> = {};
    if (typeof roundGrids === "object" && !Array.isArray(roundGrids)) {
      gridStore = { ...(roundGrids as Record<string, any>) };
    }
    if (final_grid) {
      gridStore[phaseGridKey] = final_grid;
    }

    let updates: any = {
      [roundsDataKey]: newRoundsData,
      [scoreKey]: newTotalScore,
      shared_used_words: newSharedWords,
      round_grids: gridStore,
      last_move_at: new Date().toISOString(),
    };

    // Determine next phase/round
    if (phaseConfig.phases === 3) {
      // Classic / fiveplus: 3 phases per round
      if (currentPhase === 1) {
        // P1 done 25 moves → P2's turn (phase 2, 50 moves)
        updates.current_phase = 2;
        updates.current_turn = opponentId;
      } else if (currentPhase === 2) {
        // P2 done 50 moves → P1's turn (phase 3, 25 moves)
        updates.current_phase = 3;
        updates.current_turn = opponentId; // back to the other player (P1)
      } else {
        // Phase 3 done → round complete
        const nextRound = match.current_round + 1;
        if (nextRound > match.total_rounds) {
          // Match complete
          const p1Score = isPlayer1 ? newTotalScore : match.player1_score;
          const p2Score = isPlayer1 ? match.player2_score : newTotalScore;
          let winnerId = null;
          if (p1Score > p2Score) winnerId = match.player1_id;
          else if (p2Score > p1Score) winnerId = match.player2_id;

          updates.status = "completed";
          updates.completed_at = new Date().toISOString();
          updates.winner_id = winnerId;
          updates.current_turn = null;
          updates.current_phase = 1;
        } else {
          // Next round - swap starter: P2 starts round 2
          const roundStarter = match.current_round % 2 === 0 ? match.player1_id : match.player2_id;
          updates.current_round = nextRound;
          updates.current_turn = roundStarter;
          updates.current_phase = 1;
          updates.shared_used_words = [];
        }
      }
    } else {
      // Surge / oneword: 2 phases (each player plays once per round)
      const opponentRoundsKey = isPlayer1 ? "player2_rounds_data" : "player1_rounds_data";
      const opponentRounds = (match[opponentRoundsKey] as any[]) || [];
      const opponentPlayedThisRound = opponentRounds.some(
        (r: any) => r.round === match.current_round
      );

      if (opponentPlayedThisRound) {
        const nextRound = match.current_round + 1;
        if (nextRound > match.total_rounds) {
          const p1Score = isPlayer1 ? newTotalScore : match.player1_score;
          const p2Score = isPlayer1 ? match.player2_score : newTotalScore;
          let winnerId = null;
          if (p1Score > p2Score) winnerId = match.player1_id;
          else if (p2Score > p1Score) winnerId = match.player2_id;

          updates.status = "completed";
          updates.completed_at = new Date().toISOString();
          updates.winner_id = winnerId;
          updates.current_turn = null;
        } else {
          updates.current_round = nextRound;
          updates.current_turn = match.player1_id;
          updates.shared_used_words = [];
        }
      } else {
        updates.current_turn = opponentId;
      }
    }

    const { error: updateErr } = await admin
      .from("matches")
      .update(updates)
      .eq("id", match_id);

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: updatedMatch } = await admin
      .from("matches")
      .select("*")
      .eq("id", match_id)
      .single();

    return new Response(
      JSON.stringify({ status: "ok", match: updatedMatch }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
