import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "../../api/feedback";

function call(body: Record<string, unknown>, ip = "10.1.0.1") {
  const out = { code: 0, json: undefined as unknown };
  return handler({ method: "POST", body, headers: { "x-forwarded-for": ip } }, { status: (n) => ({ json: (v) => { out.code = n; out.json = v; } }) }).then(() => out);
}
const valid = { conceptId: "u0c3", target: "en", native: "es", phraseTarget: "Thank you very much", phraseNative: "Muchas gracias", reason: "unnatural", comment: "ok" };

describe("/api/feedback", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
  it("accepts a valid report and logs it when no database is configured", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const out = await call(valid);
    expect(out.code).toBe(202);
    expect(String(warn.mock.calls[0]?.[0])).toContain("translation_report");
    warn.mockRestore();
  });
  it("rejects malformed reports", async () => {
    expect((await call({ ...valid, conceptId: "x; drop" }, "10.1.0.2")).code).toBe(400);
    expect((await call({ ...valid, reason: "spam" }, "10.1.0.3")).code).toBe(400);
    expect((await call({ ...valid, target: "xx" }, "10.1.0.4")).code).toBe(400);
  });
  it("stores in Supabase with the server-only key when configured", async () => {
    vi.stubEnv("SUPABASE_URL", "https://proj.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
    const fetchMock = vi.fn(async () => new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const out = await call(valid, "10.1.0.5");
    expect(out.code).toBe(201);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://proj.supabase.co/rest/v1/translation_reports");
    expect(JSON.parse(String(init.body))).toMatchObject({ concept_id: "u0c3", reason: "unnatural" });
  });
});
