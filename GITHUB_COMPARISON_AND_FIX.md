# GitHub comparison and combined fix

Repository checked: https://github.com/richardsimo-hash/LingoArena (main).

## Verified discrepancy
The public GitHub `api/tts.ts` currently contains `openAiTts`, reads `OPENAI_API_KEY`, and returns `provider: "gemini_then_openai"`. This conflicts with the requested Gemini-only behavior. The combined source in this ZIP uses Gemini-only TTS and returns an explicit Gemini failure with `fallback: "browser_speech_synthesis"`.

## Grammar Battle TypeScript fix
`src/components/lingo/GrammarBattle.tsx` now passes `onClick={() => submit(input)}` rather than passing the answer function directly as the React click handler. This prevents React's `MouseEvent` from being interpreted as the answer string.

## Deployment status
This ZIP is a local patch bundle. It has not been pushed to GitHub and no Vercel deployment is claimed. After applying it, commit/push and verify the Vercel deployment uses that commit.

## Validation limits
ZIP integrity and source assertions were checked. A full build could not be completed in this environment because the installed `node_modules` tree is incomplete (missing Vitest and type definitions). Run `npm ci && npm run build` in a clean environment before deployment.
