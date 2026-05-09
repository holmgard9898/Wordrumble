import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export interface TutorialStep {
  title: string;
  body: string;
  visual?: React.ReactNode;
  /** If true, "Next" is disabled until `interactiveDone` is true. */
  interactive?: boolean;
  /**
   * Render-prop variant: receives a `done()` callback so the visual can mark
   * the step as complete from inside.
   */
  renderVisual?: (ctx: { done: () => void }) => React.ReactNode;
}

interface Props {
  open: boolean;
  steps: TutorialStep[];
  onClose: () => void;
}

export const TutorialModal: React.FC<Props> = ({ open, steps, onClose }) => {
  const { t, lang } = useTranslation();
  const [i, setI] = useState(0);
  const [doneSteps, setDoneSteps] = useState<Record<number, boolean>>({});
  const last = i === steps.length - 1;
  const first = i === 0;
  const step = steps[i];

  const close = useCallback(() => {
    setI(0);
    setDoneSteps({});
    onClose();
  }, [onClose]);

  const markDone = useCallback((idx: number) => {
    setDoneSteps((d) => ({ ...d, [idx]: true }));
  }, []);

  if (!step) return null;

  const stepDone = !!doneSteps[i];
  const interactiveLocked = step.interactive && !stepDone;
  const skipLabel = lang === 'sv' ? 'Hoppa över' : 'Skip';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-sm rounded-3xl border-white/10 p-0 overflow-hidden" style={{ background: 'linear-gradient(160deg, rgba(30,40,90,0.98), rgba(15,20,45,0.98))' }}>
        <button onClick={close} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80">
          <X className="w-4 h-4" />
        </button>

        <div className="px-6 pt-6 pb-4">
          <h3 className="text-white text-xl font-bold text-center mb-3">{step.title}</h3>
          {(step.visual || step.renderVisual) && (
            <div className="my-4 flex items-center justify-center min-h-[110px]">
              {step.renderVisual
                ? step.renderVisual({ done: () => markDone(i) })
                : step.visual}
            </div>
          )}
          {step.body && (
            <p className="text-white/80 text-sm leading-relaxed text-center whitespace-pre-line">{step.body}</p>
          )}
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5 pb-3">
          {steps.map((_, idx) => (
            <span key={idx} className={`h-1.5 rounded-full transition-all ${idx === i ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`} />
          ))}
        </div>

        {/* Nav */}
        <div className="flex items-center justify-between gap-2 px-4 pb-4">
          <button
            onClick={() => setI((n) => Math.max(0, n - 1))}
            disabled={first}
            className="flex items-center gap-1 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" /> {t.back}
          </button>

          {interactiveLocked ? (
            <button
              onClick={() => markDone(i)}
              className="text-white/50 hover:text-white/80 text-xs underline px-3 py-2"
            >
              {skipLabel}
            </button>
          ) : last ? (
            <button onClick={close} className="flex-1 px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold shadow-lg shadow-emerald-500/30">
              {t.play}
            </button>
          ) : (
            <button
              onClick={() => setI((n) => Math.min(steps.length - 1, n + 1))}
              className="flex items-center gap-1 px-4 py-2.5 rounded-full bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold shadow-lg shadow-blue-500/30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TutorialModal;
