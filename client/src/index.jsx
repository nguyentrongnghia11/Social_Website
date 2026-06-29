import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import 'admin-lte/dist/css/adminlte.min.css';

const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('findDOMNode')) {
    return;
  }
  originalError.call(console, ...args);
};

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(<App />);
