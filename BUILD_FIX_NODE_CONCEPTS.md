# Deployment build fix: empty lesson concepts

## Failure
`src/test/content.test.ts` expects every lesson node in `UNITS` to provide `CONCEPTS_PER_NODE` concepts. The authored phrase bank contains concepts only for the first five units, while the UI exposes more units. `nodeConcepts()` returned an empty array for later units, so the content validation test failed with `Received 0` instead of `3`.

## Change
`src/lib/lingo/content.ts` now returns the authored concepts for authored lessons and deterministic review concept records for later lessons. Review records get unique IDs and correct unit/node metadata so lesson rendering and exercise generation do not receive an empty concept array.

## Important content limitation
The later units are still review/practice units that reuse phrases from the current authored bank. This resolves the empty-concepts runtime/test failure but does NOT mean all 100 units have unique authored phrase content. Continue expanding and validating the phrase bank before claiming a complete no-repeat curriculum.

## Verification
The patch was inspected. Running `npm run validate:content` in this environment was blocked because the local `node_modules/.bin/vitest` executable is missing; therefore the test suite is not claimed as passing. Run `npm ci` and `npm run build` in CI/Vercel after applying this patch.
