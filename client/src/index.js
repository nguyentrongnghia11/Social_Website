import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import 'admin-lte/dist/css/adminlte.min.css';

// Suppress findDOMNode warning from react-quill
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('findDOMNode')) {
    return;
  }
  originalError.call(console, ...args);
};

const root = ReactDOM.createRoot(document.getElementById("root"));

// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', () => {
//         navigator.serviceWorker
//             .register('/firebase-messaging-sw.js')
//             .then(registration => {
//                 console.log('Service Worker registered:', registration);
//             })
//             .catch(err => {
//                 console.error('Service Worker registration failed:', err);
//             });
//     });
// }


root.render(<App />);
