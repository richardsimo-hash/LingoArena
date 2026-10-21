// GET /api/health        -> which env vars exist + runtime info (no secrets)
// GET /api/health?probe=1 -> also checks the OpenAI key with a free call
export default async function handler(req: any, res: any) {
  try {
    const out: any = {
      ok: true,
      node: process.version,
      env: {
        OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY),
        GEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY),
        OPENAI_TTS_MODEL: process.env.OPENAI_TTS_MODEL || '(default tts-1)',
      },
    };
    const probe = String((req.query && req.query.probe) || '') === '1';
    if (probe && process.env.OPENAI_API_KEY) {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 8000);
      try {
        const r = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
          signal: c.signal,
        });
        out.openai = r.ok ? 'ok' : r.status === 401 ? 'unauthorized' : r.status === 429 ? 'rate_limited_or_no_quota' : `http_${r.status}`;
      } catch (e: any) {
        out.openai = e && e.name === 'AbortError' ? 'timeout' : 'network_error';
      } finally { clearTimeout(t); }
    }
    return res.status(200).json(out);
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: String((e && e.message) || e) });
  }
}
