---
name: Multiplayer rules
description: Turn-based multiplayer rules per game mode, matchmaking, friends, chat, 48h timeout
type: feature
---
## General
- Max 20 active matches per player
- 48h timeout between turns → auto-forfeit
- Quizkampen-style: can start playing before opponent matched (random)
- Between rounds, can see opponent's results
- Chat available in matches
- Bomb Mode: singleplayer only, hidden from multiplayer menu

## Classic (Multiplayer)
- 2 rounds, shared used words per round (reset between rounds)
- Turn order: P1 plays 25 moves → P2 plays 50 moves → P1 plays 25 moves
- Round 2: starter swaps, words reset, scores carry over
- Winner: highest total score after both rounds

## Word Surge (Multiplayer)
- 3 rounds, same starting grid per round for both players
- Words NOT shared between players
- Turn order: P1 round 1 → P2 round 1+2 → P1 round 2+3 → P2 round 3
- Can't see opponent's words until own round is complete

## 5+ Bokstäver (Multiplayer)
- Same rules as Classic multiplayer (2 rounds, 25+50+25, shared words)

## Ett Ord / Längsta Ordet (Multiplayer)
- 2 rounds, can see opponent's best word after own round
- Winner: highest single word score across both rounds

## Opponent Types
- Random: matchmaking queue, can play first round before matched
- Friend: invite via friend list
- AI: local AI opponent

## Database
- Tables: profiles, friendships, matches, match_chat, matchmaking_queue
- Realtime enabled on matches + match_chat
