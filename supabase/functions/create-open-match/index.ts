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
  let counter = 0;
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const letter = SV_LETTER_POOL[Math.floor(Math.random() * SV_LETTER_POOL.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      row.push({ id: `b-${counter++}`, letter, value: SV_LETTER_VALUES[letter] ?? 1, color });
    }
    grid.push(row);
  }
  return grid;
}

function getTotalRounds(mode: string): number {
  return mode === "surge" ? 3 : 2;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const requested = body.mode;
    const isRandom = requested === "random";
    if (!isRandom && !ALL_MODES.includes(requested)) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const pickedMode: Mode = isRandom
      ? ALL_MODES[Math.floor(Math.random() * ALL_MODES.length)]
      : (requested as Mode);

    // Avoid creating duplicate open matches: re-use any existing open match by this user in this mode
    const { data: existingOpen } = await admin
      .from("matches")
      .select("*")
      .eq("player1_id", user.id)
      .is("player2_id", null)
      .eq("status", "active")
      .eq("mode", pickedMode)
      .limit(1);

    if (existingOpen && existingOpen.length > 0) {
      await admin.from("matchmaking_queue").delete().eq("user_id", user.id);
      return new Response(
        JSON.stringify({ status: "open", match: existingOpen[0] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const totalRounds = getTotalRounds(pickedMode);
    const grids = [];
    for (let i = 0; i < totalRounds; i++) grids.push(createGrid(pickedMode));

    const { data: match, error } = await admin.from("matches").insert({
      mode: pickedMode,
      player1_id: user.id,
      player2_id: null,
      status: "active",
      current_turn: user.id,
      current_round: 1,
      total_rounds: totalRounds,
      round_grids: grids,
      shared_used_words: [],
      player1_rounds_data: [],
      player2_rounds_data: [],
    }).select().single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("matchmaking_queue").delete().eq("user_id", user.id);

    return new Response(
      JSON.stringify({ status: "open", match }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
