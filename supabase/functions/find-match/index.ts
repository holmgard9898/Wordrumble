import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ROWS = 10;
const COLS = 8;
const BUBBLE_COLORS = ["red", "green", "blue", "yellow", "pink"];
const REDUCED_COLORS = ["red", "green", "blue"];

const SV_LETTER_POOL =
  "AAAAAAAABBDDDDDEEEEEEEFFGGGHIIIIIJKKKLLLLLMMMNNNNNNOOOOOOPPRRRRRRRRSSSSSSSSSTTTTTTTTTUUUVVXYÅÅÄÄÖÖ";
const SV_LETTER_VALUES: Record<string, number> = {
  A: 1, B: 4, C: 8, D: 1, E: 1, F: 3, G: 2, H: 3, I: 1, J: 7,
  K: 2, L: 1, M: 2, N: 1, O: 2, P: 4, R: 1, S: 1, T: 1,
  U: 4, V: 3, X: 8, Y: 7, Z: 10, Å: 4, Ä: 4, Ö: 4,
};

function createGrid(mode: string) {
  const colors = mode === "fiveplus" ? REDUCED_COLORS : BUBBLE_COLORS;
  const pool = SV_LETTER_POOL;
  const values = SV_LETTER_VALUES;
  let counter = 0;

  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const letter = pool[Math.floor(Math.random() * pool.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      row.push({
        id: `b-${counter++}`,
        letter,
        value: values[letter] ?? 1,
        color,
      });
    }
    grid.push(row);
  }
  return grid;
}

function getTotalRounds(mode: string): number {
  return mode === "surge" ? 3 : 2;
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

    // User client for auth check
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
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
    const mode = body.mode;
    if (!["classic", "surge", "fiveplus", "oneword"].includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client for cross-user operations
    const admin = createClient(supabaseUrl, serviceKey);

    // Check if user already in queue
    const { data: existing } = await admin
      .from("matchmaking_queue")
      .select("id")
      .eq("user_id", user.id)
      .eq("mode", mode);

    if (existing && existing.length > 0) {
      // Already queued, look for match
    }

    // Look for another player in the queue with same mode (not self)
    const { data: candidates } = await admin
      .from("matchmaking_queue")
      .select("*")
      .eq("mode", mode)
      .neq("user_id", user.id)
      .order("joined_at", { ascending: true })
      .limit(1);

    if (candidates && candidates.length > 0) {
      const opponent = candidates[0];

      // Generate grids for all rounds
      const totalRounds = getTotalRounds(mode);
      const grids = [];
      for (let i = 0; i < totalRounds; i++) {
        grids.push(createGrid(mode));
      }

      // Create match
      const { data: match, error: matchError } = await admin
        .from("matches")
        .insert({
          mode,
          player1_id: opponent.user_id, // Earlier queuer is player1
          player2_id: user.id,
          status: "active",
          current_turn: opponent.user_id, // Player 1 goes first
          current_round: 1,
          total_rounds: totalRounds,
          round_grids: grids,
          shared_used_words: [],
          player1_rounds_data: [],
          player2_rounds_data: [],
        })
        .select()
        .single();

      if (matchError) {
        return new Response(JSON.stringify({ error: matchError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Remove both from queue
      await admin.from("matchmaking_queue").delete().eq("id", opponent.id);
      await admin.from("matchmaking_queue").delete().eq("user_id", user.id);

      return new Response(
        JSON.stringify({ status: "matched", match }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No match found - add to queue if not already there
    if (!existing || existing.length === 0) {
      await admin.from("matchmaking_queue").insert({
        user_id: user.id,
        mode,
      });
    }

    return new Response(
      JSON.stringify({ status: "queued" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
