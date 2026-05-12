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
const ALL_MODES = ["classic", "surge", "fiveplus", "oneword"] as const;
type Mode = typeof ALL_MODES[number];

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

function pickRandomMode(): Mode {
  return ALL_MODES[Math.floor(Math.random() * ALL_MODES.length)];
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
    const requestedMode = body.mode;
    const isRandom = requestedMode === "random";
    if (!isRandom && !ALL_MODES.includes(requestedMode)) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Step 1: Try to join an OPEN match (player2_id IS NULL, status='active')
    const openModes: string[] = isRandom ? [...ALL_MODES] : [requestedMode];
    const { data: openMatches } = await admin
      .from("matches")
      .select("*")
      .is("player2_id", null)
      .eq("status", "active")
      .in("mode", openModes)
      .neq("player1_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1);

    if (openMatches && openMatches.length > 0) {
      const open = openMatches[0];
      const { data: joined, error: joinErr } = await admin
        .from("matches")
        .update({ player2_id: user.id })
        .eq("id", open.id)
        .is("player2_id", null) // race-safety
        .select()
        .single();
      if (!joinErr && joined) {
        await admin.from("matchmaking_queue").delete().eq("user_id", user.id);
        return new Response(
          JSON.stringify({ status: "matched", match: joined }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const pickedMode: Mode = isRandom ? pickRandomMode() : (requestedMode as Mode);

    // Check if user already in queue for this mode
    const { data: existing } = await admin
      .from("matchmaking_queue")
      .select("id")
      .eq("user_id", user.id)
      .eq("mode", pickedMode);

    // Step 2: Look for another player in queue (same picked mode)
    const { data: candidates } = await admin
      .from("matchmaking_queue")
      .select("*")
      .eq("mode", pickedMode)
      .neq("user_id", user.id)
      .order("joined_at", { ascending: true })
      .limit(1);

    if (candidates && candidates.length > 0) {
      const opponent = candidates[0];
      const totalRounds = getTotalRounds(pickedMode);
      const grids = [];
      for (let i = 0; i < totalRounds; i++) grids.push(createGrid(pickedMode));

      const { data: match, error: matchError } = await admin
        .from("matches")
        .insert({
          mode: pickedMode,
          player1_id: opponent.user_id,
          player2_id: user.id,
          status: "active",
          current_turn: opponent.user_id,
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

      await admin.from("matchmaking_queue").delete().eq("id", opponent.id);
      await admin.from("matchmaking_queue").delete().eq("user_id", user.id);

      return new Response(
        JSON.stringify({ status: "matched", match }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!existing || existing.length === 0) {
      await admin.from("matchmaking_queue").insert({
        user_id: user.id,
        mode: pickedMode,
      });
    }

    return new Response(
      JSON.stringify({ status: "queued", mode: pickedMode }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
