# Grammar Battle TypeScript build fix

Fixed `src/components/lingo/GrammarBattle.tsx` by changing the Submit button from `onClick={submit}` to `onClick={() => submit()}`. The `submit` function accepts an optional string, but React's `onClick` passes a MouseEvent; wrapping the call prevents that event from being passed as the answer.

Validation: verified the exact handler change and ZIP integrity. A full `npm run build` could not be completed in this environment because `npm ci` timed out before installing TypeScript/Vite dependencies. Please run `npm ci && npm run build` in CI/Vercel after applying this ZIP.
