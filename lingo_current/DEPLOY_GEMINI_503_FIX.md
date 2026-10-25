# Deploy the Gemini 503 fix

1. In Vercel, open the **LingoArena** project → Settings → Environment Variables.
2. Confirm the Gemini API key exists in the **Production** environment. This patch accepts either `GEMINI_KEY` (the name previously reported) or `GEMINI_API_KEY`. Keep the value secret.
3. Deploy this project ZIP to the same connected GitHub repository/production branch, or apply the four changed `api/*.ts` files to that repository and push.
4. After deployment, open `https://lingoarena.vercel.app/api/health`. Check `configured.gemini`, `keySource.gemini`, and `providers.gemini`.
5. If `configured.gemini` is true but `providers.gemini` is not `ok`, send the JSON response (redact anything secret; the endpoint is designed not to return the key). Then test Free Talk.

Changing environment variables alone requires a redeploy to take effect.
