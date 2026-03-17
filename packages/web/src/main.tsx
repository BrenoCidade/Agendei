import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { PwaInstallPrompt } from "./components/PwaInstallPrompt.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <PwaInstallPrompt />
  </>
);
