import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { GalleryProvider } from "./context/GalleryContext.jsx";
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <GalleryProvider>
      <BrowserRouter>
        <App />
        <Toaster position="bottom-right" richColors />
      </BrowserRouter>
    </GalleryProvider>
  </GoogleOAuthProvider>
);
