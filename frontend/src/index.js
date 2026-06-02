import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { AdminDataProvider } from "./context/AdminDataContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AuthProvider>
    <AdminDataProvider>
      <App />
    </AdminDataProvider>
  </AuthProvider>
);

