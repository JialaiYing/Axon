"use client";

import * as React from "react";

interface UsePomodoroTimerOptions {
  /** Called once when the countdown reaches zero. */
  onComplete?: (totalSeconds: number) => void;
}

export type TimerStatus = "idle" | "running" | "paused" | "finished";

/**
 * A self-contained countdown engine. Callers decide what the countdown
 * means (an objective's estimated time, or a personal timer) and what
 * happens on completion via onComplete.
 */
export function usePomodoroTimer({ onComplete }: UsePomodoroTimerOptions = {}) {
  const [totalSeconds, setTotalSeconds] = React.useState(0);
  const [remainingSeconds, setRemainingSeconds] = React.useState(0);
  const [status, setStatus] = React.useState<TimerStatus>("idle");

  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clearTick = React.useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  React.useEffect(() => clearTick, [clearTick]);

  const start = React.useCallback(
    (seconds: number) => {
      clearTick();
      setTotalSeconds(seconds);
      setRemainingSeconds(seconds);
      setStatus("running");
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearTick();
            setStatus("finished");
            onCompleteRef.current?.(seconds);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTick]
  );

  const pause = React.useCallback(() => {
    clearTick();
    setStatus((prev) => (prev === "running" ? "paused" : prev));
  }, [clearTick]);

  const resume = React.useCallback(() => {
    if (status !== "paused" || remainingSeconds <= 0) return;
    setStatus("running");
    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearTick();
          setStatus("finished");
          onCompleteRef.current?.(totalSeconds);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTick, remainingSeconds, status, totalSeconds]);

  /** Stops the timer early. Returns the number of whole minutes actually elapsed. */
  const stop = React.useCallback(() => {
    clearTick();
    const elapsedSeconds = totalSeconds - remainingSeconds;
    setStatus("idle");
    setTotalSeconds(0);
    setRemainingSeconds(0);
    return Math.floor(elapsedSeconds / 60);
  }, [clearTick, remainingSeconds, totalSeconds]);

  const reset = React.useCallback(() => {
    clearTick();
    setStatus("idle");
    setTotalSeconds(0);
    setRemainingSeconds(0);
  }, [clearTick]);

  /** Adds more time after the timer has finished (e.g. "keep working") and resumes it. */
  const extend = React.useCallback(
    (seconds: number) => {
      clearTick();
      const nextTotal = totalSeconds + seconds;
      setTotalSeconds(nextTotal);
      setRemainingSeconds(seconds);
      setStatus("running");
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearTick();
            setStatus("finished");
            onCompleteRef.current?.(nextTotal);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTick, totalSeconds]
  );

  const elapsedMinutes = Math.floor((totalSeconds - remainingSeconds) / 60);
  const progressFraction = totalSeconds > 0 ? 1 - remainingSeconds / totalSeconds : 0;

  return {
    status,
    totalSeconds,
    remainingSeconds,
    elapsedMinutes,
    progressFraction,
    start,
    pause,
    resume,
    stop,
    reset,
    extend,
  };
}