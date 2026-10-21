// Vercel Node serverless function: POST /api/tts  { text, voice?, speed? }  ->  audio/mpeg
// Crash-proof: never throws, reads env vars inside the handler, returns JSON errors with real status codes.
export const config = { maxDuration: 30 };

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

    // Body can arrive parsed (object) or as a string, depending on content-type.
    let body: any = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const text = String(body.text || '').trim().slice(0, 600);
    if (!text) {
      return res.status(400).json({ ok: false, error: 'missing_text' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ ok: false, error: 'missing_key', provider: 'openai' });
    }

    const model = process.env.OPENAI_TTS_MODEL || 'tts-1';
    const voice = String(body.voice || process.env.OPENAI_TTS_VOICE || 'nova');
    const speedNum = Number(body.speed);
    const speed = Number.isFinite(speedNum) ? Math.min(4, Math.max(0.25, speedNum)) : 1;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    let upstream: Response;
    try {
      upstream = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, voice, input: text, response_format: 'mp3', speed }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!upstream.ok) {
      let detail = '';
      try { detail = (await upstream.text()).slice(0, 300); } catch { /* ignore */ }
      console.error('[api/tts] OpenAI error', upstream.status, detail);
      const reason =
        upstream.status === 401 ? 'unauthorized' :
        upstream.status === 404 ? 'model_not_found' :
        upstream.status === 429 ? 'quota_or_rate_limit' : 'upstream_error';
      return res.status(502).json({ ok: false, error: reason, provider: 'openai', upstreamStatus: upstream.status, detail });
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', String(buf.length));
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.status(200);
    return res.end(buf);
  } catch (err: any) {
    console.error('[api/tts] crashed', err && (err.stack || err.message || err));
    const aborted = err && err.name === 'AbortError';
    return res.status(aborted ? 504 : 500).json({
      ok: false,
      error: aborted ? 'timeout' : 'internal_error',
      message: String((err && err.message) || err).slice(0, 200),
    });
  }
}
