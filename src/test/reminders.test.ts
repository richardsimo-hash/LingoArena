import { describe, expect, it } from "vitest";
import { reminderIcs } from "@/lib/reminders";

describe("calendar reminder", () => {
  it("is a daily event at the chosen local hour with an alarm and the app link", () => {
    const ics = reminderIcs(19, "LingoArena: lesson", "Keep going:", "https://lingoarena.vercel.app", new Date(2026, 9, 25, 20, 0));
    expect(ics).toContain("RRULE:FREQ=DAILY");
    expect(ics).toContain("DTSTART:20261026T190000"); // 19:00 already passed today -> starts tomorrow
    expect(ics).toContain("BEGIN:VALARM");
    expect(ics).toContain("URL:https://lingoarena.vercel.app");
    expect(ics.split("\r\n").length).toBeGreaterThan(10);
  });
});
