import { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      style={{
        position: "fixed",
        top: "20px",
        right: "30px",
        background: "var(--card-bg)",
        border: "1px solid #d1d5db",
        padding: "10px 12px",
        borderRadius: "8px",
        boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
        cursor: "pointer",
        zIndex: 2000,
      }}
    >
      {theme === "light" ? (
        <FaMoon size={18} color="#2563eb" />
      ) : (
        <FaSun size={18} color="#facc15" />
      )}
    </button>
  );
}
