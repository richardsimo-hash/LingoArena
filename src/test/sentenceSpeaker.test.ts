import { beforeEach, describe, expect, it, vi } from "vitest";

const spoken: string[] = [];
let endCurrent: (() => void) | null = null;
vi.mock("@/lib/voice", () => ({
  speak: (text: string, _opts: unknown, cb?: { onStart?: () => void; onEnd?: () => void }) => {
    spoken.push(text); cb?.onStart?.(); endCurrent = () => cb?.onEnd?.(); return true;
  },
}));
const { createSentenceSpeaker } = await import("@/lib/lingo/sentenceSpeaker");
const { splitReply } = await import("@/lib/lingo/chat.functions");

describe("createSentenceSpeaker", () => {
  beforeEach(() => { spoken.length = 0; endCurrent = null; });

  it("starts speaking the first sentence before the stream ends, then queues the rest", () => {
    const onDone = vi.fn();
    const speaker = createSentenceSpeaker({ lang: "en-US", rate: 1, onDone });
    speaker.update("Oh nice, I love pasta.");
    expect(spoken).toEqual([]); // could still be mid-sentence ("pasta. Mr")
    speaker.update("Oh nice, I love pasta. What");
    expect(spoken).toEqual(["Oh nice, I love pasta."]);
    speaker.update("Oh nice, I love pasta. What do you usually cook?", true);
    expect(spoken).toHaveLength(1); // second waits for the first to finish
    endCurrent!();
    expect(spoken).toEqual(["Oh nice, I love pasta.", "What do you usually cook?"]);
    expect(onDone).not.toHaveBeenCalled();
    endCurrent!();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("speaks a reply with no final punctuation and stops after cancel", () => {
    const onDone = vi.fn();
    const speaker = createSentenceSpeaker({ lang: "en-US", rate: 1, onDone });
    speaker.update("Tell me more", true);
    expect(spoken).toEqual(["Tell me more"]);
    speaker.cancel();
    endCurrent!();
    expect(onDone).not.toHaveBeenCalled();
  });
});

describe("splitReply", () => {
  it("separates the spoken reply from the correction line", () => {
    expect(splitReply("I went there too! When?\n§ Say 'I went', not 'I goed'.")).toEqual({ reply: "I went there too! When?", correction: "Say 'I went', not 'I goed'.", goals: [] });
    expect(splitReply("Just a reply.")).toEqual({ reply: "Just a reply.", correction: "", goals: [] });
    expect(splitReply("Here you go! That's 3 euros.\n§ Say 'a coffee'.\n¶ g1,g2")).toEqual({ reply: "Here you go! That's 3 euros.", correction: "Say 'a coffee'.", goals: ["g1", "g2"] });
    expect(splitReply("Hi! What can I get you?\n¶")).toEqual({ reply: "Hi! What can I get you?", correction: "", goals: [] });
  });
});
