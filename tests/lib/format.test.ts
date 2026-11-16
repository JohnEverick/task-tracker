import { describe, expect, it } from "vitest";

import { EXTEND_SECONDS, focusBlockSeconds } from "@/lib/focus";
import { formatClock, formatMins } from "@/lib/format";
import { formatTodayLabel } from "@/lib/use-today-label";

describe("formatMins", () => {
  it.each([
    [0, "0m"],
    [5, "5m"],
    [59, "59m"],
    [60, "1h"],
    [90, "1h 30m"],
    [195, "3h 15m"],
    [300, "5h"],
  ])("%i minutes → %s", (mins, expected) => {
    expect(formatMins(mins)).toBe(expected);
  });
});

describe("formatClock", () => {
  it.each([
    [0, "00:00"],
    [5, "00:05"],
    [65, "01:05"],
    [2700, "45:00"],
    [5400, "90:00"],
    [59.9, "00:59"],
    [-10, "00:00"],
  ])("%d seconds → %s", (secs, expected) => {
    expect(formatClock(secs)).toBe(expected);
  });
});

describe("focusBlockSeconds", () => {
  it("uses the estimate, kept between 15 and 90 minutes", () => {
    expect(focusBlockSeconds(5)).toBe(15 * 60);
    expect(focusBlockSeconds(45)).toBe(45 * 60);
    expect(focusBlockSeconds(240)).toBe(90 * 60);
  });

  it("extends by five minutes", () => {
    expect(EXTEND_SECONDS).toBe(300);
  });
});

describe("formatTodayLabel", () => {
  it("formats weekday, day and month", () => {
    expect(formatTodayLabel(new Date(2026, 10, 16))).toBe("Monday, November 16");
  });
});
