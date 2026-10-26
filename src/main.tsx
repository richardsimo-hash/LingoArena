import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./routes/index";
// Diagnostic pages are separate chunks; learners never download them.
const AudioDebugPanel = lazy(() => import("./components/lingo/DebugPanel").then((m) => ({ default: m.AudioDebugPanel })));
const IOSAudioTest = lazy(() => import("./components/lingo/IOSAudioTest").then((m) => ({ default: m.IOSAudioTest })));
const TestCenter = lazy(() => import("./components/lingo/TestCenter").then((m) => ({ default: m.TestCenter })));

const route = window.location.pathname.replace(/\/$/, "");
const Root = route === "/debug" ? AudioDebugPanel : route === "/ios-audio-test" ? IOSAudioTest : route === "/test" ? TestCenter : App;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={null}><Root /></Suspense>
  </StrictMode>,
);

// Installable app + offline lessons (production only; the dev server must not be cached).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => console.warn("[LingoArena] service worker registration failed", error));
  });
}
