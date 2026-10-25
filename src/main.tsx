import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./routes/index";
import { AudioDebugPanel } from "./components/lingo/DebugPanel";
import { IOSAudioTest } from "./components/lingo/IOSAudioTest";
import { TestCenter } from "./components/lingo/TestCenter";

const route = window.location.pathname.replace(/\/$/, "");
const Root = route === "/debug" ? AudioDebugPanel : route === "/ios-audio-test" ? IOSAudioTest : route === "/test" ? TestCenter : App;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
