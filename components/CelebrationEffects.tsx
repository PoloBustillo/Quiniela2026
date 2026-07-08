"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

interface CelebrationEffectsProps {
  /**
   * Si es true, dispara el efecto al montar el componente.
   * @default true
   */
  active?: boolean;
  /**
   * Duración total del efecto en ms.
   * @default 2500
   */
  duration?: number;
}

export function CelebrationEffects({
  active = true,
  duration = 2500,
}: CelebrationEffectsProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!active || firedRef.current) return;
    firedRef.current = true;

    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 100,
      colors: ["#EAB308", "#FACC15", "#FFFFFF", "#3B82F6", "#EF4444"],
    };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, [active, duration]);

  return null;
}
