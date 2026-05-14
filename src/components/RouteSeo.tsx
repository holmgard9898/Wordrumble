import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";

interface RouteMeta {
  title: string;
  description: string;
}

const META: Record<string, RouteMeta> = {
  "/": {
    title: "Word Rumble — Bubble Word Puzzle Game",
    description: "Play Word Rumble: swap colorful bubbles to form words, beat adventure levels, and challenge friends in async multiplayer.",
  },
  "/play": {
    title: "Play — Word Rumble",
    description: "Pick a singleplayer mode: Classic, Word Surge, 5+, One Word, or Bomb. Beat your high score in Word Rumble.",
  },
  "/challenge": {
    title: "Multiplayer Challenge — Word Rumble",
    description: "Async multiplayer word battles. Find a match or invite a friend in Word Rumble.",
  },
  "/settings": {
    title: "Settings — Word Rumble",
    description: "Adjust language, sound, and music settings for Word Rumble.",
  },
  "/statistics": {
    title: "Statistics — Word Rumble",
    description: "Track your high scores, multiplayer record, and achievements in Word Rumble.",
  },
  "/shop": {
    title: "Shop — Word Rumble",
    description: "Unlock backgrounds, bubble themes, and power-ups with the coins you earn in Word Rumble.",
  },
  "/shop/powerups": {
    title: "Power-ups — Word Rumble",
    description: "Buy power-ups for 100 coins each — swap letter, swap color, rocket — usable across all adventure levels.",
  },
  "/daily": {
    title: "Daily Challenge — Word Rumble",
    description: "A new word puzzle every day. Earn up to 3 stars and rich coin rewards in Word Rumble.",
  },
  "/auth": {
    title: "Sign in — Word Rumble",
    description: "Sign in to Word Rumble to save progress and play multiplayer matches.",
  },
  "/privacy": {
    title: "Privacy Policy — Word Rumble",
    description: "How Word Rumble handles data and third-party advertising services.",
  },
  "/info": {
    title: "How to play — Word Rumble",
    description: "Learn every Word Rumble mode — Classic, Word Surge, 5+, One Word, and Bomb.",
  },
  "/adventure": {
    title: "Adventure Map — Word Rumble",
    description: "Climb through Word Rumble's story-driven adventure levels with unique mechanics each map.",
  },
};

function metaForPath(pathname: string): RouteMeta {
  if (META[pathname]) return META[pathname];
  if (pathname.startsWith("/adventure/map/")) return META["/adventure"];
  if (pathname.startsWith("/adventure/")) {
    return { title: "Adventure Level — Word Rumble", description: "Tackle a Word Rumble adventure level with unique rules and obstacles." };
  }
  if (pathname.startsWith("/match/")) {
    return { title: "Multiplayer Match — Word Rumble", description: "Play your turn in an async Word Rumble multiplayer match." };
  }
  if (pathname.startsWith("/game/")) {
    return { title: "Game — Word Rumble", description: "Find words and score points in Word Rumble." };
  }
  return META["/"];
}

export function RouteSeo() {
  const { pathname } = useLocation();
  const meta = metaForPath(pathname);
  const url = pathname || "/";
  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
    </Helmet>
  );
}
