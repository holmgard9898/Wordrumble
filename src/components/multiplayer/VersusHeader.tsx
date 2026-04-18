import { User } from 'lucide-react';

interface RoundResult {
  myScore: number;
  opponentScore: number;
  bothPlayed: boolean;
}

interface VersusHeaderProps {
  opponentName: string;
  opponentAvatarUrl?: string | null;
  myName?: string;
  myAvatarUrl?: string | null;
  myScore: number;
  opponentScore: number;
  opponentHasPlayedCurrentRound: boolean;
  totalRounds: number;
  currentRound: number;
  rounds: RoundResult[]; // length = totalRounds
}

function Avatar({ url, fallbackColor }: { url?: string | null; fallbackColor: string }) {
  return (
    <div
      className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center overflow-hidden border-2"
      style={{
        background: `linear-gradient(135deg, ${fallbackColor}40, ${fallbackColor}20)`,
        borderColor: `${fallbackColor}80`,
      }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <User className="w-5 h-5 md:w-6 md:h-6 text-white/80" />
      )}
    </div>
  );
}

function RoundDots({
  rounds,
  currentRound,
  side,
}: {
  rounds: RoundResult[];
  currentRound: number;
  side: 'me' | 'opponent';
}) {
  return (
    <div className="flex gap-1 mt-1">
      {rounds.map((r, i) => {
        const roundNum = i + 1;
        const isCurrent = roundNum === currentRound;
        let won = false;
        if (r.bothPlayed) {
          won = side === 'me' ? r.myScore > r.opponentScore : r.opponentScore > r.myScore;
        }
        const filled = r.bothPlayed && won;
        return (
          <div
            key={i}
            className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all ${
              isCurrent ? 'ring-1 ring-white/50 ring-offset-1 ring-offset-transparent' : ''
            }`}
            style={{
              background: filled
                ? side === 'me'
                  ? 'hsl(217, 91%, 60%)'
                  : 'hsl(0, 84%, 60%)'
                : 'transparent',
              border: `1.5px solid ${
                side === 'me' ? 'hsl(217, 91%, 60%)' : 'hsl(0, 84%, 60%)'
              }`,
            }}
          />
        );
      })}
    </div>
  );
}

export function VersusHeader({
  opponentName,
  opponentAvatarUrl,
  myName = 'Du',
  myAvatarUrl,
  myScore,
  opponentScore,
  opponentHasPlayedCurrentRound,
  totalRounds,
  currentRound,
  rounds,
}: VersusHeaderProps) {
  return (
    <div
      className="w-full rounded-xl px-3 py-2 md:px-4 md:py-3 flex items-center justify-between gap-2"
      style={{
        background: 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Opponent (left) */}
      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
        <Avatar url={opponentAvatarUrl} fallbackColor="hsl(0, 84%, 60%)" />
        <div className="min-w-0 flex-1">
          <div className="text-white font-semibold text-sm md:text-base truncate">
            {opponentName}
          </div>
          <RoundDots rounds={rounds} currentRound={currentRound} side="opponent" />
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-red-400/70">Poäng</div>
          <div className="text-red-400 font-bold text-xl md:text-2xl tabular-nums leading-none">
            {opponentHasPlayedCurrentRound ? opponentScore : '?'}
          </div>
        </div>
      </div>

      {/* VS divider */}
      <div className="px-1 md:px-2">
        <div className="text-white/30 text-xs md:text-sm font-bold tracking-widest">VS</div>
      </div>

      {/* Me (right) */}
      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 flex-row-reverse">
        <Avatar url={myAvatarUrl} fallbackColor="hsl(217, 91%, 60%)" />
        <div className="min-w-0 flex-1 text-right">
          <div className="text-white font-semibold text-sm md:text-base truncate">{myName}</div>
          <div className="flex justify-end">
            <RoundDots rounds={rounds} currentRound={currentRound} side="me" />
          </div>
        </div>
        <div className="text-left">
          <div className="text-[10px] uppercase tracking-wider text-blue-400/70">Poäng</div>
          <div className="text-blue-400 font-bold text-xl md:text-2xl tabular-nums leading-none">
            {myScore}
          </div>
        </div>
      </div>
    </div>
  );
}
