"use client";

import { useEffect, useState } from "react";

function formatDuration(ms: number): string {
  if (ms <= 0) return "ahora";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function useCountdown(targetDate: Date, offsetMs: number = 0) {
  const [label, setLabel] = useState(() => {
    const now = new Date(Date.now() + offsetMs);
    const diff = targetDate.getTime() - now.getTime();
    return formatDuration(diff);
  });

  useEffect(() => {
    const compute = () => {
      const now = new Date(Date.now() + offsetMs);
      const diff = targetDate.getTime() - now.getTime();
      return formatDuration(diff);
    };

    setLabel(compute);
    const id = setInterval(() => setLabel(compute), 30000);
    return () => clearInterval(id);
  }, [targetDate, offsetMs]);

  return label;
}
