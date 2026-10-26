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

  it("falls back to OpenAI when every Gemini model fails, streaming its text", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("OPENAI_API_KEY", "test-openai");
    const openaiSse = ["Hi there", "! How are you?"].map((t) => `data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`).join("") + "data: [DONE]\n\n";
    const fetchMock = vi.fn(async (url: string) => url.includes("openai.com")
      ? new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(openaiSse)); c.close(); } }), { status: 200 })
      : new Response("overloaded", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    const { res, out } = fakeRes();
    await handler({ method: "POST", body, headers: { "x-forwarded-for": "10.0.0.3" } }, res);
    expect(out.written).toBe("Hi there! How are you?");
    expect(out.ended).toBe(true);
    const [, init] = fetchMock.mock.calls.find(([u]) => String(u).includes("openai.com"))! as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body)).messages[0].role).toBe("system");
  });

  it("falls back to Claude when Gemini and OpenAI both fail", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("OPENAI_API_KEY", "test-openai");
    vi.stubEnv("ANTHROPIC_API_KEY", "test-anthropic");
    const events = [
      { type: "message_start", message: { id: "msg_1", type: "message", role: "assistant", model: "claude-opus-5-5", content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 0 } } },
      { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
      { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Hello from " } },
      { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Claude!" } },
      { type: "content_block_stop", index: 0 },
      { type: "message_delta", delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 4 } },
      { type: "message_stop" },
    ];
    const claudeSse = events.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join("");
    let claudeBody: Record<string, unknown> = {};
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url.includes("anthropic.com")) {
        claudeBody = JSON.parse(String(init?.body ?? (input instanceof Request ? await input.text() : "{}")));
        return new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(claudeSse)); c.close(); } }), { status: 200, headers: { "content-type": "text/event-stream" } });
      }
      return new Response("down", { status: 503 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const { res, out } = fakeRes();
    await handler({ method: "POST", body, headers: { "x-forwarded-for": "10.0.0.4" } }, res);
    expect(out.written).toBe("Hello from Claude!");
    expect(claudeBody.model).toBe("claude-opus-5-5");
    expect((claudeBody.messages as { role: string }[])[0]!.role).toBe("user");
    expect(claudeBody.fallbacks).toBe("default");
    expect(claudeBody.temperature).toBeUndefined();
  });
});
