import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./routes/index";
import { AudioDebugPanel } from "./components/lingo/DebugPanel";

const Root = window.location.pathname.replace(/\/$/, "") === "/debug" ? AudioDebugPanel : App;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
