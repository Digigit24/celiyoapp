import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animates a numeric KPI value over ~450ms on change, using requestAnimationFrame
 * and plain numbers only — deliberately NOT React Native's core `Animated.Value`,
 * which throws synchronously ("Attempting to set value to undefined") if it's ever
 * handed a non-finite number, and that throw was destabilizing the tree when many
 * StatTiles animate at once. Snaps instantly under reduced-motion.
 */
export function useCountUp(target: number, durationMs = 450): number {
  const safeTarget = Number.isFinite(target) ? target : 0;
  const [display, setDisplay] = useState(safeTarget);
  const fromRef = useRef(safeTarget);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const from = fromRef.current;

    if (from === safeTarget) {
      return;
    }

    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (cancelled) return;
        if (reduced) {
          fromRef.current = safeTarget;
          setDisplay(safeTarget);
          return;
        }

        const startTime = Date.now();
        const tick = () => {
          if (cancelled) return;
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / durationMs, 1);
          setDisplay(from + (safeTarget - from) * easeOutCubic(progress));
          if (progress < 1) {
            rafRef.current = requestAnimationFrame(tick);
          } else {
            fromRef.current = safeTarget;
          }
        };
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch(() => {
        if (!cancelled) {
          fromRef.current = safeTarget;
          setDisplay(safeTarget);
        }
      });

    return () => {
      cancelled = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeTarget]);

  return display;
}
