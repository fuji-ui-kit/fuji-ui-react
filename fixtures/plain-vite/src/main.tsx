import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fujiui/react/styles.css";
import "./host-conflicts.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
