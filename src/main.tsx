import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme before first render to avoid FOUC
const savedTheme = localStorage.getItem('gc_theme') || 'dark';
document.documentElement.classList.add(savedTheme);

// Apply saved locale
const savedLocale = localStorage.getItem('sv_locale') || navigator.language.slice(0, 2) || 'en';
document.documentElement.lang = ['en', 'fr'].includes(savedLocale) ? savedLocale : 'en';

createRoot(document.getElementById("root")!).render(<App />);
