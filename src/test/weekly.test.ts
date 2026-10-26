import { describe, expect, it } from "vitest";
import { isoWeek, weeklyXp } from "@/lib/lingo/weekly";

describe("weekly leaderboard helpers", () => {
  it("computes ISO weeks (Monday start, year boundaries)", () => {
    expect(isoWeek(new Date(2026, 9, 26))).toBe("2026-W44"); // Monday
    expect(isoWeek(new Date(2026, 9, 25))).toBe("2026-W43"); // Sunday
    expect(isoWeek(new Date(2027, 0, 1))).toBe("2026-W53");
  });
  it("sums only this week's XP", () => {
    expect(weeklyXp({ "2026-10-26": 20, "2026-10-28": 15, "2026-10-25": 50 }, new Date(2026, 9, 29))).toBe(35);
  });
});
