import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "../../api/chat";

function sse(chunks: string[]) {
  const body = chunks.map((text) => `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] })}\r\n\r\n`).join("");
  return new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(body)); c.close(); } }), { status: 200, headers: { "content-type": "text/event-stream" } });
}
function fakeRes() {
  const out = { headers: {} as Record<string, string>, written: "", ended: false, statusCode: 200, json: undefined as unknown, code: 0 };
  const res = {
    get statusCode() { return out.statusCode; }, set statusCode(v: number) { out.statusCode = v; },
    setHeader: (k: string, v: string) => { out.headers[k.toLowerCase()] = v; },
    write: (c: string) => { out.written += c; }, end: () => { out.ended = true; }, flushHeaders: () => undefined,
    status: (n: number) => ({ json: (v: unknown) => { out.code = n; out.json = v; } }),
  };
  return { res, out };
}
const body = { stream: true, messages: [], targetName: "English", nativeName: "Spanish", persona: "guide", topic: "Pets and animals" };

describe("/api/chat streaming", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it("streams Gemini text as plain text and puts the topic in the request", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const fetchMock = vi.fn(async () => sse(["Hi! Do you ", "have a pet? ", "\n§ None"]));
    vi.stubGlobal("fetch", fetchMock);
    const { res, out } = fakeRes();
    await handler({ method: "POST", body, headers: {} }, res);
    expect(out.headers["content-type"]).toContain("text/plain");
    expect(out.written).toBe("Hi! Do you have a pet? \n§ None");
    expect(out.ended).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain(":streamGenerateContent?alt=sse");
    expect(String(init.body)).toContain("Pets and animals");
  });

  it("falls back to the next model before any text, then reports JSON 503 if all fail", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const fetchMock = vi.fn(async () => new Response("overloaded", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    const { res, out } = fakeRes();
    await handler({ method: "POST", body, headers: { "x-forwarded-for": "10.0.0.2" } }, res);
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(out.code).toBe(503);
    expect(out.written).toBe("");
  });
});
