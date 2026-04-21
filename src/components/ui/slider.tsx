import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  max?: number;
  min?: number;
  step?: number;
  className?: string;
  dir?: "ltr" | "rtl";
}

/**
 * Native range input styled white-fill-from-left.
 * More reliable on mobile (iOS/Android WebKit) than Radix pointer events.
 */
const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ value, onValueChange, max = 100, min = 0, step = 1, className }, ref) => {
    const v = value?.[0] ?? 0;
    const pct = ((v - min) / (max - min)) * 100;

    return (
      <div className={cn("relative flex w-full items-center py-2", className)}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={v}
          onChange={(e) => onValueChange([Number(e.target.value)])}
          className="wr-slider w-full h-3 appearance-none rounded-full cursor-pointer outline-none"
          style={{
            background: `linear-gradient(to right, #ffffff 0%, #ffffff ${pct}%, rgba(0,0,0,0.45) ${pct}%, rgba(0,0,0,0.45) 100%)`,
            border: "1px solid rgba(255,255,255,0.15)",
            touchAction: "none",
          }}
        />
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
