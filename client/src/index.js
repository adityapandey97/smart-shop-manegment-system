// ============================================
//   React App Entry Point
//   This is where the React app starts
// ============================================

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Mount the React app to the HTML <div id="root">
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
