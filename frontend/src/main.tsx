import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Hide splash screen when app is ready
window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.classList.add('splash-fade-out');
        setTimeout(() => {
            splash.style.display = 'none';
        }, 500);
    }
});
