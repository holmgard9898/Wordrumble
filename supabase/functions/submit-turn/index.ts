import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    // Get the match
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

    // Verify it's this player's turn
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

    // Build round result
    const roundResult = {
      round: match.current_round,
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
    const newRoundsData = [...currentRoundsData, roundResult];
    const newTotalScore = (match[scoreKey] as number) + score;

    // Add words to shared used words for this round
    const sharedWords = (match.shared_used_words as string[]) || [];
    const wordStrings = (words || []).map((w: any) => 
      typeof w === 'string' ? w.toLowerCase() : w.word?.toLowerCase()
    ).filter(Boolean);
    const newSharedWords = [...sharedWords, ...wordStrings];

    // Determine if opponent has already played this round
    const opponentRoundsKey = isPlayer1 ? "player2_rounds_data" : "player1_rounds_data";
    const opponentRounds = (match[opponentRoundsKey] as any[]) || [];
    const opponentPlayedThisRound = opponentRounds.some(
      (r: any) => r.round === match.current_round
    );

    let updates: any = {
      [roundsDataKey]: newRoundsData,
      [scoreKey]: newTotalScore,
      shared_used_words: newSharedWords,
      last_move_at: new Date().toISOString(),
    };

    if (opponentPlayedThisRound) {
      // Both have played this round - advance to next round
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
      } else {
        // Next round - reset shared words, player1 starts
        updates.current_round = nextRound;
        updates.current_turn = match.player1_id;
        updates.shared_used_words = [];
      }
    } else {
      // Switch turn to opponent
      updates.current_turn = opponentId;
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

    // Get updated match
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
