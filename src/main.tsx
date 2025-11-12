import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress errors from browser extensions
window.addEventListener("error", (e) => {
  if (e.filename && e.filename.includes("content_script")) {
    e.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);

