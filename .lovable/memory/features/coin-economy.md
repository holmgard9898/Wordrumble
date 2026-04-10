---
name: Coin economy
description: Coin earning rates per game mode, length/super word bonuses, multiplayer bonuses, caps
type: feature
---
## Base rate (score → coins)
- Classic: score / 100
- Word Surge: score / 120
- Bomb: score / 80
- Ett Ord: bestWordScore × 0.1
- 5+: score / 100

## Length bonus per word
- Standard modes: 8 letters = +0.5, 9 = +1, 10 = +2
- 5+ mode (stricter): 8 = +0.25, 9 = +0.5, 10 = +1

## Super word bonus
- Any word scoring 50+ points: +1 coin

## Endurance bonus
- Surge: +0.5 per 25 extra moves beyond 50 (cap: +3)
- Bomb: +0.5 per 20 moves survived (cap: +5)

## Multiplayer
- Win: +3, Draw: +1.5, Loss: +0.5
- Opponent forfeit: min(moves/30, 1) × 1 coin
- You forfeit: 0 coins

## Cap
- 10 coins max per game round
