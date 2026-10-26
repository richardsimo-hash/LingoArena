import { useEffect, useRef, useState } from "react";

export type TutorState = "idle" | "listening" | "thinking" | "speaking";

/**
 * Chloe, the animated cartoon tutor. Pure SVG + CSS (no image assets): breathes and blinks when
 * idle, waves hello, tilts her head and shows sound rings while listening, looks up with a
 * thought bubble while thinking, and moves her mouth while speaking. The mouth follows real
 * audio level when available (`lingo-audio-level`) and pulses on each spoken word
 * (`lingo-speech-boundary`, from browser speech synthesis); otherwise it uses a chatter loop.
 * Honors prefers-reduced-motion.
 */
export function TutorAvatar({ state, size = 176, greet = false, className = "" }: { state: TutorState; size?: number; greet?: boolean; className?: string }) {
  const [mouth, setMouth] = useState(0);
  const [waving, setWaving] = useState(greet);
  const lastLevelAt = useRef(0);
  const speaking = state === "speaking";

  useEffect(() => {
    if (!greet) return;
    setWaving(true);
    const timer = window.setTimeout(() => setWaving(false), 2600);
    return () => window.clearTimeout(timer);
  }, [greet]);

  useEffect(() => {
    if (!speaking) { setMouth(0); return; }
    let closeTimer = 0;
    const onLevel = (event: Event) => {
      const level = Number((event as CustomEvent<{ level?: number }>).detail?.level || 0);
      lastLevelAt.current = performance.now();
      setMouth(Math.min(1, level * 2.2));
    };
    // Each spoken word: open wide, then ease back so speech looks articulated.
    const onBoundary = () => {
      if (performance.now() - lastLevelAt.current < 300) return; // real audio level wins
      setMouth(0.65 + Math.random() * 0.35);
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(() => setMouth(0.15), 130);
    };
    window.addEventListener("lingo-audio-level", onLevel);
    window.addEventListener("lingo-speech-boundary", onBoundary);
    return () => {
      window.removeEventListener("lingo-audio-level", onLevel);
      window.removeEventListener("lingo-speech-boundary", onBoundary);
      window.clearTimeout(closeTimer);
    };
  }, [speaking]);

  // Mouth opening (px of the inner ellipse); when no level/boundary data arrives, CSS chatter takes over.
  const open = speaking ? 3 + mouth * 13 : 0;
  return (
    <div className={`tutor ${`tutor-${state}`} ${className}`} style={{ width: size, height: size }} role="img" aria-label={`Chloe, your tutor, is ${state}`}>
      <style>{TUTOR_CSS}</style>
      <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true">
        <defs>
          <radialGradient id="tutor-halo" cx="50%" cy="45%" r="55%"><stop offset="0%" stopColor="#fff7d6" /><stop offset="100%" stopColor="#ffd6f0" /></radialGradient>
          <linearGradient id="tutor-hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7a4a2b" /><stop offset="100%" stopColor="#5a321b" /></linearGradient>
          <linearGradient id="tutor-shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4fc3f7" /><stop offset="100%" stopColor="#2196f3" /></linearGradient>
        </defs>
        <circle cx="100" cy="100" r="96" fill="url(#tutor-halo)" />
        {/* listening rings */}
        <g className="tutor-rings" fill="none" stroke="#10b981" strokeWidth="5">
          <circle cx="100" cy="92" r="70" /><circle cx="100" cy="92" r="70" />
        </g>
        <g className="tutor-body">
          {/* shoulders + shirt */}
          <path d="M38 200 C40 160 62 146 100 146 C138 146 160 160 162 200 Z" fill="url(#tutor-shirt)" />
          <path d="M84 146 L100 166 L116 146 Z" fill="#fff" />
          <circle cx="100" cy="178" r="5" fill="#ffeb3b" />
          {/* waving hand */}
          <g className={`tutor-hand ${waving ? "tutor-hand-wave" : ""}`}>
            <path d="M150 196 C154 176 160 160 166 146" stroke="url(#tutor-shirt)" strokeWidth="16" strokeLinecap="round" fill="none" />
            <circle cx="168" cy="138" r="12" fill="#ffcfa8" />
            <path d="M162 128 l-2 -10 M168 126 l0 -11 M174 128 l2 -10" stroke="#ffcfa8" strokeWidth="5" strokeLinecap="round" />
          </g>
          <g className="tutor-head">
            {/* hair back */}
            <path d="M48 96 C44 50 72 26 100 26 C128 26 156 50 152 96 C154 124 148 146 136 150 L64 150 C52 146 46 124 48 96 Z" fill="url(#tutor-hair)" />
            {/* neck + face */}
            <rect x="90" y="128" width="20" height="20" rx="8" fill="#f5b58c" />
            <ellipse cx="100" cy="92" rx="44" ry="46" fill="#ffd2ad" />
            <ellipse cx="57" cy="96" rx="7" ry="10" fill="#ffc49b" />
            <ellipse cx="143" cy="96" rx="7" ry="10" fill="#ffc49b" />
            {/* bangs + star clip */}
            <path d="M56 80 C58 48 82 38 102 40 C124 42 142 54 146 80 C132 66 118 60 104 66 C92 56 72 62 56 80 Z" fill="url(#tutor-hair)" />
            <path d="M132 58 l3.5 7 7.5 1 -5.5 5 1.5 7.5 -7 -3.5 -7 3.5 1.5 -7.5 -5.5 -5 7.5 -1 Z" fill="#ffd54f" stroke="#f9a825" strokeWidth="1.2" className="tutor-star" />
            {/* eyebrows */}
            <g className="tutor-brows" stroke="#5a321b" strokeWidth="3.5" strokeLinecap="round" fill="none">
              <path d="M70 72 Q80 66 90 71" /><path d="M110 71 Q120 66 130 72" />
            </g>
            {/* eyes */}
            <g className="tutor-eyes">
              {[80, 120].map((cx) => (
                <g key={cx} className="tutor-eye">
                  <ellipse cx={cx} cy="90" rx="10.5" ry="12" fill="#fff" />
                  <g className="tutor-pupil"><circle cx={cx} cy="91" r="7" fill="#3e2723" /><circle cx={cx + 2.5} cy="88" r="2.4" fill="#fff" /></g>
                  <rect className="tutor-lid" x={cx - 12} y="76" width="24" height="28" fill="#ffd2ad" />
                </g>
              ))}
            </g>
            {/* cheeks */}
            <ellipse cx="70" cy="108" rx="8" ry="5" fill="#ff8a80" opacity="0.45" />
            <ellipse cx="130" cy="108" rx="8" ry="5" fill="#ff8a80" opacity="0.45" />
            <path d="M97 101 Q100 105 103 101" stroke="#e8a07a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* mouth */}
            <g className="tutor-mouth">
              {speaking ? (
                <g className={mouth ? "" : "tutor-chatter"}>
                  <ellipse cx="100" cy="117" rx={8 + (open > 6 ? 2 : 0)} ry={open} fill="#8d2b2b" />
                  <ellipse cx="100" cy={117 + open * 0.55} rx="5" ry={Math.max(1, open * 0.35)} fill="#ff8a80" />
                </g>
              ) : state === "thinking" ? (
                <ellipse cx="104" cy="118" rx="4" ry="3.2" fill="#8d2b2b" />
              ) : (
                <path d="M88 114 Q100 126 112 114" stroke="#8d2b2b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              )}
            </g>
          </g>
        </g>
        {/* thought bubble */}
        <g className="tutor-thought">
          <circle cx="150" cy="44" r="4" fill="#fff" /><circle cx="160" cy="32" r="6" fill="#fff" />
          <rect x="146" y="2" width="48" height="24" rx="12" fill="#fff" />
          <circle cx="160" cy="14" r="3.5" fill="#7c4dff" className="tutor-dot" /><circle cx="170" cy="14" r="3.5" fill="#7c4dff" className="tutor-dot" /><circle cx="180" cy="14" r="3.5" fill="#7c4dff" className="tutor-dot" />
        </g>
      </svg>
    </div>
  );
}

const TUTOR_CSS = `
.tutor { display: inline-block; }
.tutor svg { overflow: visible; }
.tutor-body { transform-origin: 100px 200px; animation: tutor-breathe 3.2s ease-in-out infinite; }
.tutor-head { transform-origin: 100px 140px; transition: transform .35s ease; }
.tutor-lid { transform-origin: center top; transform-box: fill-box; transform: scaleY(0); animation: tutor-blink 4.6s infinite; }
.tutor-pupil { transition: transform .4s ease; animation: tutor-look 9s ease-in-out infinite; }
.tutor-brows { transition: transform .3s ease; }
.tutor-rings, .tutor-thought { opacity: 0; transition: opacity .3s ease; }
.tutor-hand { transform-origin: 150px 196px; transform: rotate(48deg) translateY(30px); opacity: 0; transition: opacity .3s ease, transform .4s ease; }
.tutor-hand-wave { opacity: 1; transform: rotate(0); animation: tutor-wave .55s ease-in-out 4 alternate; }
.tutor-star { transform-origin: 132px 68px; animation: tutor-twinkle 2.4s ease-in-out infinite; }

.tutor-listening .tutor-head { transform: rotate(-6deg); }
.tutor-listening .tutor-brows { transform: translateY(-3px); }
.tutor-listening .tutor-rings { opacity: 1; }
.tutor-listening .tutor-rings circle { transform-origin: 100px 92px; animation: tutor-ring 1.6s ease-out infinite; }
.tutor-listening .tutor-rings circle:nth-child(2) { animation-delay: .8s; }
.tutor-thinking .tutor-pupil { animation: none; transform: translate(4px, -5px); }
.tutor-thinking .tutor-head { transform: rotate(4deg); }
.tutor-thinking .tutor-brows { transform: translateY(-4px); }
.tutor-thinking .tutor-thought { opacity: 1; }
.tutor-thinking .tutor-dot { animation: tutor-dot 1s ease-in-out infinite; }
.tutor-thinking .tutor-dot:nth-child(4) { animation-delay: .15s; }
.tutor-thinking .tutor-dot:nth-child(5) { animation-delay: .3s; }
.tutor-speaking .tutor-body { animation-duration: 1.6s; }
.tutor-speaking .tutor-head { animation: tutor-nod 1.3s ease-in-out infinite; }
.tutor-chatter { transform-origin: 100px 117px; animation: tutor-chatter .42s ease-in-out infinite; }

@keyframes tutor-breathe { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
@keyframes tutor-blink { 0%,92%,100% { transform: scaleY(0) } 95% { transform: scaleY(1) } }
@keyframes tutor-look { 0%,30%,100% { transform: translate(0,0) } 40%,55% { transform: translate(-3px,1px) } 65%,80% { transform: translate(3px,0) } }
@keyframes tutor-ring { from { transform: scale(.82); opacity: .9 } to { transform: scale(1.2); opacity: 0 } }
@keyframes tutor-dot { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
@keyframes tutor-nod { 0%,100% { transform: rotate(0) translateY(0) } 25% { transform: rotate(-2deg) translateY(1px) } 75% { transform: rotate(2deg) translateY(-1px) } }
@keyframes tutor-chatter { 0%,100% { transform: scaleY(.35) } 30% { transform: scaleY(1) } 60% { transform: scaleY(.6) } 80% { transform: scaleY(.9) } }
@keyframes tutor-wave { from { transform: rotate(-12deg) } to { transform: rotate(14deg) } }
@keyframes tutor-twinkle { 0%,100% { transform: rotate(0) scale(1) } 50% { transform: rotate(14deg) scale(1.12) } }
@media (prefers-reduced-motion: reduce) {
  .tutor *, .tutor *::before { animation: none !important; transition: none !important; }
}
`;
