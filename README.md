# LingoArena refactor — drop-in files

Copy these over the same paths in the project (keep everything else as is):

src/lib/lingo/{content,i18n,store,audio,engine}.ts, chat.functions.ts (new)
src/components/lingo/{ui,LearnPath,SpeechArena,GrammarBattle,Settings,Stats}.tsx, FreeChat.tsx (new)
src/routes/index.tsx
src/test/content.test.ts (new)

Free Chat needs the AI backend: enable Lovable Cloud / Lovable AI so LOVABLE_API_KEY exists on the server.
Without it the avatar still works with simple offline replies.
