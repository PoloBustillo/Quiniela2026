"use client";

import { Trophy, Medal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface PodiumUser {
  id: string;
  name: string;
  image: string | null;
  rank: number;
  points: number;
}

interface WinnersPodiumProps {
  top3: PodiumUser[];
  paidCount: number;
  isFinalPhase?: boolean;
}

const PRIZE_PER_ENTRY = 100;

const basePrize = (bote: number, position: number): number => {
  if (position === 1) return Math.round(bote * 0.7 - 50);
  if (position === 2) return Math.round(bote * 0.3 - 50);
  if (position === 3) return 100;
  return 0;
};

const calculatePrize = (
  paidCount: number,
  rank: number,
  tiedCount: number,
): number | null => {
  const bote = paidCount * PRIZE_PER_ENTRY;
  let total = 0;
  for (let i = 0; i < tiedCount; i++) {
    total += basePrize(bote, rank + i);
  }
  const prize = Math.round(total / tiedCount);
  return prize > 0 ? prize : null;
};

const RANK_STYLES: Record<
  number,
  {
    wrapper: string;
    prize: string;
    order: string;
  }
> = {
  1: {
    wrapper:
      "border-amber-400/40 bg-gradient-to-b from-amber-500/[0.12] via-amber-500/[0.06] to-background shadow-amber-500/10",
    prize: "bg-amber-500/15 text-amber-700",
    order: "order-2",
  },
  2: {
    wrapper:
      "border-slate-400/40 bg-gradient-to-b from-slate-500/[0.10] via-slate-400/[0.05] to-background shadow-slate-500/10",
    prize: "bg-slate-400/15 text-slate-600",
    order: "order-1",
  },
  3: {
    wrapper:
      "border-amber-800/40 bg-gradient-to-b from-amber-800/[0.10] via-amber-700/[0.05] to-background shadow-amber-800/10",
    prize: "bg-amber-800/15 text-amber-900",
    order: "order-3",
  },
};

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) {
    return (
      <div className="rounded-full bg-amber-100 p-2 sm:p-2.5 text-amber-600 shadow-sm">
        <Trophy className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "rounded-full p-1.5 sm:p-2 shadow-sm",
        rank === 2 && "bg-slate-100 text-slate-500",
        rank === 3 && "bg-amber-100 text-amber-800",
      )}
    >
      <Medal className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
    </div>
  );
};

export function WinnersPodium({
  top3,
  paidCount,
  isFinalPhase,
}: WinnersPodiumProps) {
  if (top3.length < 3) return null;

  const tiedCount = (rank: number) =>
    top3.filter((u) => u.rank === rank).length;

  return (
    <Card className="border-primary/10 bg-gradient-to-br from-primary/[0.03] via-background to-primary/[0.03]">
      <CardContent className="px-2 sm:px-3 py-3 sm:py-4">
        <p className="text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 sm:mb-3">
          {isFinalPhase
            ? "Líderes actuales · Campeón por definirse"
            : "Podio del torneo"}
        </p>
        <div className="flex items-end justify-center gap-1.5 sm:gap-3">
          {top3.map((user) => {
            const styles = RANK_STYLES[user.rank] ?? RANK_STYLES[3];
            const prize = calculatePrize(
              paidCount,
              user.rank,
              tiedCount(user.rank),
            );
            const isFirst = user.rank === 1;

            return (
              <div
                key={user.id}
                className={cn(
                  "flex flex-col items-center text-center rounded-xl border shadow-sm flex-1 min-w-0",
                  isFirst ? "py-3 sm:py-5 px-1.5 sm:px-2" : "py-2 sm:py-3 px-1 sm:px-2",
                  styles.wrapper,
                  styles.order,
                )}
              >
                <RankIcon rank={user.rank} />
                <div className="mt-1.5 sm:mt-2 mb-1">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name}
                      width={isFirst ? 40 : 32}
                      height={isFirst ? 40 : 32}
                      className={cn(
                        "rounded-full mx-auto ring-2 ring-background",
                        isFirst ? "w-8 h-8 sm:w-10 sm:h-10" : "w-7 h-7 sm:w-8 sm:h-8",
                      )}
                    />
                  ) : (
                    <div
                      className={cn(
                        "rounded-full bg-muted flex items-center justify-center font-bold mx-auto ring-2 ring-background",
                        isFirst
                          ? "w-8 h-8 text-xs sm:w-10 sm:h-10 sm:text-sm"
                          : "w-7 h-7 text-[10px] sm:w-8 sm:h-8 sm:text-xs",
                      )}
                    >
                      {user.name[0]}
                    </div>
                  )}
                </div>
                <p
                  className={cn(
                    "font-semibold truncate w-full px-0.5 text-foreground",
                    isFirst ? "text-xs sm:text-sm" : "text-[10px] sm:text-xs",
                  )}
                  title={user.name}
                >
                  {user.name}
                </p>
                <p className="text-base sm:text-lg font-black text-foreground leading-none mt-0.5">
                  {user.points}
                  <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground ml-0.5">
                    pts
                  </span>
                </p>
                {prize != null && (
                  <p
                    className={cn(
                      "mt-1 sm:mt-1.5 text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full",
                      styles.prize,
                    )}
                  >
                    ${prize}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
