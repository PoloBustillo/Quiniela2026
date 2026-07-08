"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface TeamLike {
  name: string;
  flag: string;
}

interface SideFigureProps {
  team: TeamLike;
  playerSrc: string | null;
  side: "home" | "away";
  visualWinner?: "home" | "away" | "draw" | null;
  sizes?: string;
  className?: string;
  fallbackClassName?: string;
}

export default function SideFigure({
  team,
  playerSrc,
  side,
  visualWinner,
  sizes = "(max-width: 640px) 80px, (max-width: 768px) 96px, 112px",
  className = "h-28 w-20 sm:h-32 sm:w-24 md:h-36 md:w-28",
  fallbackClassName = "h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20",
}: SideFigureProps) {
  const isWinner = visualWinner === side;
  const isLoser =
    visualWinner !== side && visualWinner !== null && visualWinner !== "draw";
  const isDraw = visualWinner === "draw";

  if (playerSrc) {
    return (
      <div
        className={cn(
          "relative flex-shrink-0 select-none transition-transform duration-300 hover:scale-110 hover:-translate-y-1 active:scale-95",
          className,
        )}
        aria-hidden="true"
      >
        <Image
          src={team.flag}
          alt={team.name}
          fill
          className="object-cover rounded-xl opacity-40"
          unoptimized
          sizes={sizes}
        />
        {isWinner && (
          <div
            className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.5),transparent_70%)] blur-md pointer-events-none animate-glow-pulse"
            aria-hidden="true"
          />
        )}
        <Image
          src={playerSrc}
          alt=""
          fill
          className={cn(
            "object-contain transition-all duration-300",
            isWinner &&
              "scale-110 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] drop-shadow-[0_0_22px_rgba(250,204,21,0.5)]",
            isLoser && "grayscale opacity-50",
            isDraw && "opacity-75",
          )}
          unoptimized
          sizes={sizes}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex-shrink-0",
        fallbackClassName,
      )}
    >
      <Image
        src={team.flag}
        alt={team.name}
        fill
        className="object-contain"
        unoptimized
        sizes="(max-width: 640px) 56px, (max-width: 768px) 64px, 80px"
      />
    </div>
  );
}
