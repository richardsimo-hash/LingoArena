# Grammar Battle microphone fix

## Changes
- Grammar Battle now starts speech recognition in one-shot mode (`continuous=false`) so browsers can finalize a spoken answer without requiring an open-ended continuous session.
- When speech recognition returns a final transcript, Grammar Battle immediately evaluates it as the answer, instead of only filling the input and requiring a separate Submit click.
- Interim transcript still appears in the input while listening.
- Added a listening hint telling the learner to say the full sentence and pause.

## Validation
- Source-level checks confirm the microphone callback uses one-shot recognition and passes the final recognized transcript into the same answer-checking function used by typed submissions.
- Full Vite build was not run successfully in this environment because dependencies could not be installed before the package-install timeout. Please run `npm ci` and `npm run build` after extracting the ZIP.
- No live browser/microphone test was possible here; microphone permissions and recognition behavior must be confirmed in the deployed browser.
