import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./styles.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn(
    "[FlashType] VITE_CLERK_PUBLISHABLE_KEY is not set. " +
    "Auth features will be disabled. Copy client/.env.example → client/.env and fill in your keys."
  );
}

function Root() {
  if (!PUBLISHABLE_KEY) {
    // Run without Clerk if key is missing (dev fallback)
    return (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
  }
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
