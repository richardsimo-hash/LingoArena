# Implementation status — public GitHub baseline + local patch

Baseline reviewed: https://github.com/richardsimo-hash/LingoArena (public `main`) and the user-uploaded ZIP. Network access from the build container did not permit `git clone`; changes are applied to the uploaded snapshot, whose layout matches the public repository.

## Applied
- Learn Path now wires the live interim transcript callback to visible UI while browser SpeechRecognition is listening.
- Local Whisper receives an explicit language and `task: transcribe` option.
- STT failures now preserve the actual local Whisper exception alongside the cloud error instead of replacing it with an uninformative elapsed-time summary.
- Curriculum has a 100-unit progression map with themed titles and honest labeling for the review portion.

## Important content limitation
The source phrase bank contains only 45 authored multilingual concepts (5 units × 9 concepts). This patch makes the 100-unit structure visible, but it does NOT fabricate 855+ fully authored, validated new concepts. Units beyond the authored bank currently rely on review practice and must not be marketed as 100 units of unique authored content. A genuine no-repeat curriculum requires authoring/validating the remaining content in all seven target languages and adding validation tests for every translation.

## Validation
- ZIP integrity is checked at packaging.
- Full build/tests could not be executed in this environment because the archive does not contain complete usable `node_modules`, and outbound package installation is unavailable.
- No live microphone, iOS/Android, or Vercel deployment test was performed.
