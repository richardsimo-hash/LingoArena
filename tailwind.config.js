/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
        muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
        border: "var(--border)",
        primary: { DEFAULT: "var(--primary)", foreground: "var(--primary-foreground)", shadow: "var(--primary-shadow)" },
        secondary: { DEFAULT: "var(--secondary)", foreground: "var(--secondary-foreground)" },
        accent: { DEFAULT: "var(--accent)", foreground: "var(--accent-foreground)" },
        destructive: { DEFAULT: "var(--destructive)", foreground: "var(--destructive-foreground)" },
        flame: "var(--flame)",
        heart: "var(--heart)",
        gem: "var(--gem)",
        success: { DEFAULT: "var(--success)", foreground: "var(--success-foreground)" },
        "success-soft": "var(--success-soft)",
        "danger-soft": "var(--danger-soft)",
        warn: { DEFAULT: "var(--warn)", foreground: "var(--warn-foreground)" },
        locked: "var(--locked)",
      },
      keyframes: {
        pop: { "0%": { transform: "scale(0.92)" }, "60%": { transform: "scale(1.06)" }, "100%": { transform: "scale(1)" } },
        shake: { "0%,100%": { transform: "translateX(0)" }, "25%": { transform: "translateX(-6px)" }, "75%": { transform: "translateX(6px)" } },
        "pulse-ring": { "0%": { boxShadow: "0 0 0 0 color-mix(in oklch, var(--heart) 50%, transparent)" }, "100%": { boxShadow: "0 0 0 16px transparent" } },
        "in-up": { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "zoom-in": { "0%": { opacity: "0", transform: "scale(0.95)" }, "100%": { opacity: "1", transform: "scale(1)" } },
      },
      animation: {
        pop: "pop 0.35s ease",
        shake: "shake 0.35s ease",
        "pulse-ring": "pulse-ring 1.2s ease-out infinite",
        "in": "in-up 0.25s ease",
        "zoom-in-95": "zoom-in 0.2s ease",
      },
    },
  },
  plugins: [],
};
