import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculatePoints,
  isPredictionClosed,
  parseMatchDate,
  fromMexicoCityTime,
} from "../../lib/points";

// ─── calculatePoints ──────────────────────────────────────────────────────────

describe("calculatePoints", () => {
  describe("5 points – exact score", () => {
    it("returns 5 for identical scores (1-0)", () => {
      expect(calculatePoints(1, 0, 1, 0)).toBe(5);
    });

    it("returns 5 for identical scores (0-0)", () => {
      expect(calculatePoints(0, 0, 0, 0)).toBe(5);
    });

    it("returns 5 for identical scores (3-2)", () => {
      expect(calculatePoints(3, 2, 3, 2)).toBe(5);
    });
  });

  describe("3 points – correct winner (not exact)", () => {
    it("returns 3 when both predict home win, different margins (1-0 vs 2-0)", () => {
      expect(calculatePoints(1, 0, 2, 0)).toBe(3);
    });

    it("returns 3 when both predict away win (0-1 vs 0-3)", () => {
      expect(calculatePoints(0, 1, 0, 3)).toBe(3);
    });

    it("returns 3 when both predict home win, large margins (1-0 vs 5-1)", () => {
      expect(calculatePoints(1, 0, 5, 1)).toBe(3);
    });
  });

  describe("3 points – correct draw (not exact score)", () => {
    it("returns 3 when predicted draw (1-1) and actual draw (2-2)", () => {
      expect(calculatePoints(1, 1, 2, 2)).toBe(3);
    });

    it("returns 3 when predicted draw (2-2) and actual draw (0-0)", () => {
      expect(calculatePoints(2, 2, 0, 0)).toBe(3);
    });
  });

  describe("0 points – wrong prediction", () => {
    it("returns 0 when predicted home win but away won (1-0 vs 0-1)", () => {
      expect(calculatePoints(1, 0, 0, 1)).toBe(0);
    });

    it("returns 0 when predicted draw but home won (1-1 vs 2-1)", () => {
      expect(calculatePoints(1, 1, 2, 1)).toBe(0);
    });

    it("returns 0 when predicted draw but away won (0-0 vs 0-2)", () => {
      expect(calculatePoints(0, 0, 0, 2)).toBe(0);
    });

    it("returns 0 when predicted home win but draw (2-0 vs 1-1)", () => {
      expect(calculatePoints(2, 0, 1, 1)).toBe(0);
    });

    it("returns 0 when predicted away win but home won (0-2 vs 3-1)", () => {
      expect(calculatePoints(0, 2, 3, 1)).toBe(0);
    });
  });

  describe("coerces string inputs to numbers", () => {
    it("returns 5 for string '2' vs actual 2", () => {
      // @ts-expect-error testing runtime coercion
      expect(calculatePoints("2", "1", "2", "1")).toBe(5);
    });
  });
});

// ─── isPredictionClosed ───────────────────────────────────────────────────────

describe("isPredictionClosed", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false when match is in the future", () => {
    vi.setSystemTime(new Date("2026-06-11T10:00:00Z"));
    const matchDate = new Date("2026-06-11T15:00:00Z");
    expect(isPredictionClosed(matchDate)).toBe(false);
  });

  it("returns true when match is in the past", () => {
    vi.setSystemTime(new Date("2026-06-11T16:00:00Z"));
    const matchDate = new Date("2026-06-11T15:00:00Z");
    expect(isPredictionClosed(matchDate)).toBe(true);
  });

  it("returns true when now is exactly at match time", () => {
    const matchDate = new Date("2026-06-11T15:00:00Z");
    vi.setSystemTime(matchDate);
    expect(isPredictionClosed(matchDate)).toBe(true);
  });

  it("returns false 1 second before match", () => {
    vi.setSystemTime(new Date("2026-06-11T14:59:59Z"));
    const matchDate = new Date("2026-06-11T15:00:00Z");
    expect(isPredictionClosed(matchDate)).toBe(false);
  });

  it("returns true 1 second after match", () => {
    vi.setSystemTime(new Date("2026-06-11T15:00:01Z"));
    const matchDate = new Date("2026-06-11T15:00:00Z");
    expect(isPredictionClosed(matchDate)).toBe(true);
  });
});

// ─── parseMatchDate ───────────────────────────────────────────────────────────

describe("parseMatchDate", () => {
  it("parses a UTC-6 date string into the correct UTC Date", () => {
    // "2026-06-11 15:00:00-06" = 21:00 UTC
    const d = parseMatchDate("2026-06-11 15:00:00-06");
    expect(d.toISOString()).toBe("2026-06-11T21:00:00.000Z");
  });

  it("returns a valid Date object", () => {
    const d = parseMatchDate("2026-07-19 20:00:00-06");
    expect(d).toBeInstanceOf(Date);
    expect(isNaN(d.getTime())).toBe(false);
  });

  it("preserves timezone offset correctly for +00 (UTC)", () => {
    const d = parseMatchDate("2026-06-11 21:00:00+00");
    expect(d.toISOString()).toBe("2026-06-11T21:00:00.000Z");
  });
});

// ─── fromMexicoCityTime ───────────────────────────────────────────────────────

describe("fromMexicoCityTime", () => {
  it("converts Mexico City date+time to UTC correctly", () => {
    // "2026-06-11" + "15:00" in UTC-6 = "2026-06-11T21:00:00.000Z"
    const d = fromMexicoCityTime("2026-06-11", "15:00");
    expect(d.toISOString()).toBe("2026-06-11T21:00:00.000Z");
  });

  it("returns a Date instance", () => {
    const d = fromMexicoCityTime("2026-07-19", "18:00");
    expect(d).toBeInstanceOf(Date);
  });

  it("returns a fallback Date (not NaN) for empty inputs", () => {
    const d = fromMexicoCityTime("", "");
    expect(d).toBeInstanceOf(Date);
    expect(isNaN(d.getTime())).toBe(false);
  });
});
