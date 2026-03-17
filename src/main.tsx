import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import dagawieLogo from "@/assets/dagawie-logo.png";

// Ensure the Dagawie logo is used as the favicon
const existingFavicon = document.querySelector('link[rel="icon"]');
if (existingFavicon instanceof HTMLLinkElement) {
  existingFavicon.href = dagawieLogo;
}

function mountError(message: string) {
  const root = document.getElementById("root");
  if (!root) return;
  root.innerHTML = "";
  const pre = document.createElement("pre");
  pre.style.whiteSpace = "pre-wrap";
  pre.style.wordBreak = "break-word";
  pre.style.padding = "1rem";
  pre.style.background = "rgba(255, 0, 0, 0.08)";
  pre.style.color = "#700";
  pre.textContent = message;
  root.appendChild(pre);
}

window.addEventListener("error", (event) => {
  mountError(`Uncaught error: ${event.error || event.message}`);
});

window.addEventListener("unhandledrejection", (event) => {
  mountError(`Unhandled promise rejection: ${event.reason}`);
});

createRoot(document.getElementById("root")!).render(<App />);
