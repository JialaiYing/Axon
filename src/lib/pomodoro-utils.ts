export function formatClock(totalSeconds: number): string {
    const clamped = Math.max(0, Math.round(totalSeconds));
    const minutes = Math.floor(clamped / 60);
    const seconds = clamped % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  
  export const PERSONAL_TIMER_PRESETS = [
    { label: "25 min", minutes: 25 },
    { label: "15 min", minutes: 15 },
    { label: "5 min", minutes: 5 },
  ];