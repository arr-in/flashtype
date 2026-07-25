import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./styles.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isValidClerkKey = Boolean(
  PUBLISHABLE_KEY &&
  typeof PUBLISHABLE_KEY === "string" &&
  PUBLISHABLE_KEY.startsWith("pk_")
);

if (!isValidClerkKey) {
  console.warn(
    "[FlashType] VITE_CLERK_PUBLISHABLE_KEY is not set or invalid in environment. " +
    "Auth features will be disabled until added to Vercel/env settings."
  );
}

function Root() {
  if (!isValidClerkKey) {
    // Run without Clerk if key is missing (dev / unconfigured production fallback)
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
