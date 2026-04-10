import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WordHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  words: { word: string; score: number }[];
  blockedWords?: { word: string; score: number }[];
}

export function WordHistory({ open, onOpenChange, words, blockedWords }: WordHistoryProps) {
  const totalScore = words.reduce((s, w) => s + w.score, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle>Kombinerade ord ({words.length})</DialogTitle>
          <DialogDescription className="text-gray-400">
            Totalt: {totalScore} poäng
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          {words.length === 0 && (!blockedWords || blockedWords.length === 0) ? (
            <p className="text-gray-500 text-center py-8">Inga ord ännu!</p>
          ) : (
            <div className="space-y-1">
              {words.map((w, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center px-3 py-2 rounded-lg bg-gray-800/50"
                >
                  <span className="font-mono font-bold tracking-wider">{w.word}</span>
                  <span className="text-yellow-400 font-semibold">+{w.score}</span>
                </div>
              ))}
              {blockedWords && blockedWords.length > 0 && (
                <>
                  <div className="pt-3 pb-1 px-1">
                    <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Motståndarens ord (blockerade)</p>
                  </div>
                  {blockedWords.map((w, i) => (
                    <div
                      key={`blocked-${i}`}
                      className="flex justify-between items-center px-3 py-2 rounded-lg bg-red-900/20 border border-red-500/20"
                    >
                      <span className="font-mono font-bold tracking-wider text-white/40">{w.word}</span>
                      <span className="text-red-400/60 text-xs">blockerat</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
