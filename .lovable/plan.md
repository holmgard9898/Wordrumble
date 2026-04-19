

## Bomb Mode — Bug analysis

**Suspected double-decrement bug** in `src/hooks/useGameState.ts`:
- `pendingBombDecrement.current` is set to `true` only in the "found words" branch.
- The useEffect at line 272 fires whenever `isProcessing` flips false. If a previous swap left the flag `true` (e.g. processing race) or if a cascade fires multiple `setIsProcessing(false)` transitions, bombs can decrement twice in one move → "5 → instant explode" feeling.
- Fix: reset `pendingBombDecrement.current = false` immediately inside the useEffect *before* awaiting the state update, and never spawn a new bomb with timer < remaining safe range.

## Plan

### 1. Bomb Mode rebalance (`useGameState.ts`)
- New bomb spawn timer: `12 + random(0..8)` (min 12, was 10).
- When spawning 3 bombs at once, the lowest is forced to `≥ 15`.
- Bombs never spawn in the 4 corners (`[0,0], [0,7], [9,0], [9,7]`).
- Fix double-decrement: guard useEffect with a local "did decrement this tick" check; clear flag at top.
- Cap the random follow-up spawn so it never lowers existing bomb timers.

### 2. New Power-ups in Bomb Mode
Add `powerup?: 'x2' | 'x3' | 'free5'` to `BubbleData` (in `gameConstants.ts`).
- **x2 / x3 letter multiplier**: same spawn chance as bombs, max 3 total combined on board. When the bubble is part of a popped word, that letter's value is multiplied.
- **5 Free Moves**: 1 in 50 spawn chance per cascade, max 2 on board. When popped, sets `freeMovesRemaining` counter; while > 0, bombs do **not** decrement.
- Visual badges in `Bubble.tsx`: small corner pill — purple "×2", gold "×3", green "+5" with clock icon.
- Power-ups can spawn on any letter (not just vowels), but never in corners.

### 3. Volcano unlock threshold
- `shopData.ts`: change requirement to **200** points in Bomb Mode.
- `GamePage.tsx`: change `score >= 150` → `score >= 200`.
- Update Swedish description string.

### 4. New Beach background
- Generate `bg-beach.jpg` (cartoon beach: starfish, shells, gentle waves, fishing rod stuck in sand with line into water).
- Add `'beach'` to `GameBackground` type in `SettingsContext.tsx`.
- Wire it into `useGameBackground.ts`.
- Add to `bgShopItems` — cost **75 coins**.

### 5. New scoring (Classic / 5+ / OneWord)
Update `calcWordScore`:
- 4 letters: `+3`
- 5 letters: `+6`
- 6 letters: `+9`
- 7 letters: `+12`
- 8 letters: `+12` then `× 2`
- 9 letters: `+12` then `× 3`
- 10 letters: `+12` then `× 4`

Update `.lovable/memory/features/game-modes.md`.

### 6. Settings page additions (`SettingsPage.tsx`)
- New **Account** section showing logged-in user (display name + email + avatar) or "Not logged in".
- "Log in / Log out" button → uses `useAuth().signOut()` or navigates to `/auth`.
- "Change avatar" button → opens dialog with file upload (stored in new `avatars` storage bucket, `avatar_url` saved to `profiles`).
- Translation strings for all new labels (all 11 languages).

### 7. Facebook login
- `AuthPage.tsx`: add "Continue with Facebook" button.
- Use `lovable.auth.signInWithOAuth('facebook', ...)` — but Lovable Cloud's managed providers are **Google, Apple, Microsoft, SSO only**. Facebook is **not supported natively**.
- **Workaround required**: enable Facebook via the Supabase Auth provider settings using `supabase.auth.signInWithOAuth({ provider: 'facebook' })`. This requires the user to create a Facebook App at developers.facebook.com and provide App ID + App Secret as Supabase auth secrets. I'll add the button + code; user provides the credentials.
- After Facebook login, auto-fetch the FB profile picture from `user.user_metadata.avatar_url` and save it to `profiles.avatar_url`.

### 8. Storage bucket for avatars
Migration:
- Create public `avatars` bucket.
- RLS: anyone can read; users can upload/update only their own folder (`auth.uid()::text`).

## Technical details
- Bomb-decrement guard: convert `pendingBombDecrement` from a boolean ref to a numeric "tick id" to make double-fires impossible.
- Power-up rendering: extend `Bubble.tsx` with a `PowerupBadge` component sharing the corner-badge slot (mutually exclusive with `BombBadge`).
- `freeMovesRemaining` lives in `useGameState` state; decremented after each swap; UI shows a small "🛡 5" indicator under move count when > 0.

## Open question
Facebook OAuth is not natively managed by Lovable Cloud — it requires you to:
1. Create a Facebook App in Meta Developer Console.
2. Provide the App ID and App Secret.
3. Configure the redirect URL in your FB App.

Should I proceed by adding the Facebook button + code now (and you handle the FB App setup later), or skip Facebook for now and implement only Google/email + avatar upload?

