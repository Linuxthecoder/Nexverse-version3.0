import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { registerAxiosInterceptors } from "./lib/axios";

registerAxiosInterceptors();

// Console override to only allow one specific log
const origConsole = { ...console };
console.log = function(...args) {
  if (args.length === 2 && args[0] === allowedMsg[0] && args[1] === allowedMsg[1]) {
    origConsole.log(...args);
  }
};
console.warn = function(){};
console.error = function(){};
console.info = function(){};
console.debug = function(){};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </StrictMode>
);
