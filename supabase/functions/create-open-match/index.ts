import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { LANG_POOLS, isValidLanguage, type GameLanguage } from "../_shared/languagePools.ts";

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

function createGrid(mode: string, language: GameLanguage) {
  const colors = mode === "fiveplus" ? REDUCED_COLORS : BUBBLE_COLORS;
  const { pool, values } = LANG_POOLS[language];
  let counter = 0;
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const letter = pool[Math.floor(Math.random() * pool.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      row.push({ id: `b-${counter++}`, letter, value: values[letter] ?? 1, color });
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
    const language: GameLanguage = isValidLanguage(body.language) ? body.language : "sv";
    const isRandom = requested === "random";

    const admin = createClient(supabaseUrl, serviceKey);
    const pickedMode: Mode = isRandom
      ? ALL_MODES[Math.floor(Math.random() * ALL_MODES.length)]
      : (requested as Mode);

    // 1. Hitta öppen match i samma språk + läge
    const { data: openMatch } = await admin
      .from("matches")
      .select("*")
      .is("player2_id", null)
      .neq("player1_id", user.id)
      .eq("mode", pickedMode)
      .eq("language", language)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (openMatch) {
      const { data: joinedMatch, error: joinError } = await admin
        .from("matches")
        .update({ player2_id: user.id })
        .eq("id", openMatch.id)
        .is("player2_id", null)
        .select()
        .single();

      if (!joinError && joinedMatch) {
        await admin.from("matchmaking_queue").delete().eq("user_id", user.id);
        return new Response(
          JSON.stringify({ status: "joined", match: joinedMatch }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 2. Har vi redan egen öppen match i detta läge + språk?
    const { data: existingOpen } = await admin
      .from("matches")
      .select("*")
      .eq("player1_id", user.id)
      .is("player2_id", null)
      .eq("status", "active")
      .eq("mode", pickedMode)
      .eq("language", language)
      .limit(1);

    if (existingOpen && existingOpen.length > 0) {
      await admin.from("matchmaking_queue").delete().eq("user_id", user.id);
      return new Response(
        JSON.stringify({ status: "open", match: existingOpen[0] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Skapa ny öppen match
    const totalRounds = getTotalRounds(pickedMode);
    const grids = [];
    for (let i = 0; i < totalRounds; i++) grids.push(createGrid(pickedMode, language));

    const { data: match, error } = await admin.from("matches").insert({
      mode: pickedMode,
      language,
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
