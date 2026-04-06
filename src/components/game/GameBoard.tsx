import { BubbleData, Position } from '@/data/gameConstants';
import { Bubble } from './Bubble';

interface GameBoardProps {
  grid: BubbleData[][];
  selectedBubble: Position | null;
  poppingCells: Set<string>;
  onBubbleClick: (row: number, col: number) => void;
}

export function GameBoard({ grid, selectedBubble, poppingCells, onBubbleClick }: GameBoardProps) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-2xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
      {grid.map((row, r) => (
        <div key={r} className="flex gap-1 justify-center">
          {row.map((bubble, c) => {
            const isSelected = selectedBubble?.row === r && selectedBubble?.col === c;
            const isPopping = poppingCells.has(`${r}-${c}`);
            return (
              <Bubble
                key={bubble.id}
                bubble={bubble}
                isSelected={isSelected}
                isPopping={isPopping}
                onClick={() => onBubbleClick(r, c)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
