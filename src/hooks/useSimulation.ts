import { useState, useCallback, useEffect, useRef } from 'react';

export type SimulationState = 'idle' | 'running' | 'complete';

export function useSimulation(durationMs = 2000) {
  const [state, setState] = useState<SimulationState>('idle');
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);

  const runSimulation = useCallback(() => {
    setState('running');
    setProgress(0);

    const intervalTime = 50;
    const steps = durationMs / intervalTime;
    let currentStep = 0;

    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
    }

    timerRef.current = window.setInterval(() => {
      currentStep++;
      setProgress(Math.min((currentStep / steps) * 100, 100));

      if (currentStep >= steps) {
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setState('complete');
      }
    }, intervalTime);
  }, [durationMs]);

  const reset = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState('idle');
    setProgress(0);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  return { state, progress, runSimulation, reset };
}
