"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

type RaceRow = {
  id: string;
  name: string;
  image: string | null;
  value: number;
};

type RaceFrame = {
  label: string;
  rows: RaceRow[];
};

type LeaderboardRaceChartProps = {
  frames: RaceFrame[];
};

const shortName = (name: string) => {
  const words = name.trim().split(/\s+/);
  const base = words.length >= 4 ? words.slice(0, 3).join(" ") : name;
  return base.length > 22 ? `${base.slice(0, 21)}…` : base;
};

export default function LeaderboardRaceChart({ frames }: LeaderboardRaceChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const rootRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const axisRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const rowsRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const jornadaRef = useRef<d3.Selection<SVGTextElement, unknown, null, undefined> | null>(null);
  const prevValuesRef = useRef<Map<string, number>>(new Map());

  const raceData = useMemo(
    () =>
      frames.map((f) => ({
        label: f.label,
        rows: f.rows
          .map((r) => ({ ...r, name: shortName(r.name) }))
          .sort((a, b) => b.value - a.value),
      })),
    [frames],
  );

  const frameCount = raceData.length;
  const safeFrameCount = Math.max(1, frameCount);
  const [journey, setJourney] = useState(safeFrameCount);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<"slow" | "medium" | "fast">("slow");

  useEffect(() => {
    setJourney(safeFrameCount);
    prevValuesRef.current = new Map();
  }, [safeFrameCount]);

  useEffect(() => {
    if (!svgRef.current || raceData.length === 0) return;

    const width = 900;
    const height = 760;
    const margin = { top: 56, right: 40, bottom: 28, left: 210 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    if (rootRef.current) return;

    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const root = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    rootRef.current = root;

    root
      .append("rect")
      .attr("x", -margin.left)
      .attr("y", -margin.top)
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#faf9f4");

    root
      .append("image")
      .attr("href", "/fwc2026.png")
      .attr("x", 566)
      .attr("y", 572)
      .attr("width", 70)
      .attr("height", 70)
      .attr("preserveAspectRatio", "xMidYMid meet");

    root
      .append("text")
      .attr("x", 0)
      .attr("y", -24)
      .attr("font-size", 28)
      .attr("font-weight", 800)
      .attr("fill", "#1f2937")
      .text("Posiciones por jornada");

    jornadaRef.current = root
      .append("text")
      .attr("x", innerWidth)
      .attr("y", -22)
      .attr("text-anchor", "end")
      .attr("font-size", 20)
      .attr("font-weight", 700)
      .attr("fill", "#0f766e")
      .text("");

    axisRef.current = root.append("g").attr("transform", `translate(0,${innerHeight})`);

    root
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 42)
      .attr("text-anchor", "middle")
      .attr("font-size", 13)
      .attr("font-weight", 600)
      .attr("fill", "#374151")
      .text("Puntos acumulados");

    rowsRef.current = root.append("g");
  }, [raceData]);

  useEffect(() => {
    if (!rootRef.current || !axisRef.current || !rowsRef.current || !jornadaRef.current) return;
    if (raceData.length === 0) return;

    const width = 900;
    const height = 760;
    const margin = { top: 56, right: 40, bottom: 28, left: 210 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const frame = raceData[Math.max(0, journey - 1)] || raceData[raceData.length - 1];
    const data = frame.rows;

    const x = d3
      .scaleLinear()
      .domain([0, (d3.max(data, (d) => d.value) || 1) * 1.12])
      .range([0, innerWidth]);
    const y = d3
      .scaleBand<string>()
      .domain(data.map((d) => d.id))
      .range([0, innerHeight])
      .paddingInner(0.18);

    const durationBySpeed = { slow: 1400, medium: 900, fast: 550 } as const;
    const t = d3.transition().duration(durationBySpeed[speed]).ease(d3.easeCubicInOut);

    jornadaRef.current.text(
      frame.label === "Torneo por iniciar"
        ? "Torneo por iniciar"
        : `Jornada ${journey} · ${frame.label}`,
    );

    axisRef.current
      .transition(t)
      .call(
        d3
          .axisBottom(x)
          .ticks(5)
          .tickSize(-innerHeight)
          .tickFormat((d) => `${d}`),
      )
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#d1d5db"))
      .call((g) => g.selectAll(".tick text").attr("fill", "#6b7280"));

    const rows = rowsRef.current.selectAll<SVGGElement, RaceRow>("g.row").data(data, (d: any) => d.id);

    const rowsEnter = rows
      .enter()
      .append("g")
      .attr("class", "row")
      .attr("transform", `translate(0,${innerHeight})`);

    rowsEnter
      .append("rect")
      .attr("height", y.bandwidth())
      .attr("rx", 8)
      .attr("fill", "#14b8a6")
      .attr("width", 0);

    rowsEnter
      .append("text")
      .attr("class", "score")
      .attr("x", 0)
      .attr("y", y.bandwidth() / 2 + 5)
      .attr("font-size", 14)
      .attr("font-weight", 700)
      .attr("fill", "#111827")
      .text("0");

    rowsEnter
      .append("text")
      .attr("x", -52)
      .attr("y", y.bandwidth() / 2 + 5)
      .attr("font-size", 12)
      .attr("font-weight", 600)
      .attr("fill", "#111827")
      .attr("text-anchor", "end")
      .text((d) => d.name);

    rowsEnter
      .append("circle")
      .attr("cx", -26)
      .attr("cy", y.bandwidth() / 2)
      .attr("r", 14)
      .attr("fill", "#9ca3af");

    rowsEnter
      .append("text")
      .attr("x", -26)
      .attr("y", y.bandwidth() / 2 + 4)
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .attr("font-weight", 700)
      .attr("fill", "#ffffff")
      .text((d) => d.name[0] || "?");

    rowsEnter
      .filter((d) => !!d.image)
      .append("image")
      .attr("href", (d) => d.image || "")
      .attr("x", -40)
      .attr("y", y.bandwidth() / 2 - 14)
      .attr("width", 28)
      .attr("height", 28);

    const merged = rowsEnter.merge(rows as any);

    merged.transition(t).attr("transform", (d) => `translate(0,${y(d.id) ?? innerHeight})`);

    merged
      .select("rect")
      .transition(t)
      .attr("height", y.bandwidth())
      .attr("width", (d: any) => x(d.value));

    merged
      .select("text.score")
      .transition(t)
      .attr("x", (d: any) => x(d.value) + 10)
      .tween("text", function (d: any) {
        const node = this as SVGTextElement;
        const start = prevValuesRef.current.get(d.id) ?? d.value;
        const end = d.value;
        const interp = d3.interpolateNumber(start, end);
        return (tt: number) => {
          node.textContent = `${Math.round(interp(tt))}`;
        };
      })
      .on("end", function (event: any, d: any) {
        prevValuesRef.current.set(d.id, d.value);
      });

    rows
      .exit()
      .transition(t)
      .attr("transform", `translate(0,${innerHeight})`)
      .style("opacity", 0)
      .remove();
  }, [journey, raceData, speed]);

  useEffect(() => {
    if (!isPlaying || raceData.length === 0) return;
    const intervalBySpeed = { slow: 1700, medium: 1200, fast: 800 } as const;
    const timer = setInterval(() => {
      setJourney((prev) => (prev >= safeFrameCount ? 1 : prev + 1));
    }, intervalBySpeed[speed]);
    return () => clearInterval(timer);
  }, [isPlaying, raceData.length, speed, safeFrameCount]);

  return (
    <div className="rounded-xl border bg-white p-2">
      <div className="mb-2 flex items-center justify-end">
        <div className="mr-2 inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSpeed("slow")}
            className={`inline-flex items-center justify-center rounded-md border p-1 ${
              speed === "slow" ? "bg-gray-100 border-gray-400" : "border-gray-300"
            }`}
            aria-label="Velocidad lenta"
          >
            <span className="px-1 text-xs font-semibold text-[#1f2937]">1x</span>
          </button>
          <button
            type="button"
            onClick={() => setSpeed("medium")}
            className={`inline-flex items-center justify-center rounded-md border p-1 ${
              speed === "medium" ? "bg-gray-100 border-gray-400" : "border-gray-300"
            }`}
            aria-label="Velocidad media"
          >
            <span className="px-1 text-xs font-semibold text-[#1f2937]">2x</span>
          </button>
          <button
            type="button"
            onClick={() => setSpeed("fast")}
            className={`inline-flex items-center justify-center rounded-md border p-1 ${
              speed === "fast" ? "bg-gray-100 border-gray-400" : "border-gray-300"
            }`}
            aria-label="Velocidad rapida"
          >
            <span className="px-1 text-xs font-semibold text-[#1f2937]">3x</span>
          </button>
          <button
            type="button"
            onClick={() => setJourney((j) => (j <= 1 ? safeFrameCount : j - 1))}
            disabled={isPlaying}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 p-1 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Paso atras"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-[#1f2937]" />
          </button>
          <button
            type="button"
            onClick={() => setJourney((j) => (j >= safeFrameCount ? 1 : j + 1))}
            disabled={isPlaying}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 p-1 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Paso adelante"
          >
            <ChevronRight className="h-3.5 w-3.5 text-[#1f2937]" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setIsPlaying((p) => !p)}
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-[#1f2937] hover:bg-gray-50"
          aria-label={isPlaying ? "Pausar animacion" : "Reproducir animacion"}
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {isPlaying ? "Pausar" : "Reproducir"}
        </button>
      </div>
      <svg ref={svgRef} className="w-full h-auto" />
    </div>
  );
}
