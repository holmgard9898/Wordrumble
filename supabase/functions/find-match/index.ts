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
    const language: GameLanguage = isValidLanguage(body.language) ? body.language : "sv";
    const isRandom = requestedMode === "random";
    if (!isRandom && !ALL_MODES.includes(requestedMode)) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Step 1: Try to join an OPEN match in the SAME LANGUAGE
    const openModes: string[] = isRandom ? [...ALL_MODES] : [requestedMode];
    const { data: openMatches } = await admin
      .from("matches")
      .select("*")
      .is("player2_id", null)
      .eq("status", "active")
      .eq("language", language)
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
        .is("player2_id", null)
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

    // Step 2: Check existing queue entry (mode + language)
    const { data: existing } = await admin
      .from("matchmaking_queue")
      .select("id")
      .eq("user_id", user.id)
      .eq("mode", pickedMode)
      .eq("language", language);

    // Step 3: Look for another player in queue (same mode + language)
    const { data: candidates } = await admin
      .from("matchmaking_queue")
      .select("*")
      .eq("mode", pickedMode)
      .eq("language", language)
      .neq("user_id", user.id)
      .order("joined_at", { ascending: true })
      .limit(1);

    if (candidates && candidates.length > 0) {
      const opponent = candidates[0];
      const totalRounds = getTotalRounds(pickedMode);
      const grids = [];
      for (let i = 0; i < totalRounds; i++) grids.push(createGrid(pickedMode, language));

      const { data: match, error: matchError } = await admin
        .from("matches")
        .insert({
          mode: pickedMode,
          language,
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
      // Rensa eventuella queue-rader i andra språk/mode för denna user
      await admin.from("matchmaking_queue").delete().eq("user_id", user.id);
      await admin.from("matchmaking_queue").insert({
        user_id: user.id,
        mode: pickedMode,
        language,
      });
    }

    return new Response(
      JSON.stringify({ status: "queued", mode: pickedMode, language }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
