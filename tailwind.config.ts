import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        headline: ["var(--font-manrope)", "sans-serif"],
        editorial: ["var(--font-newsreader)", "serif"]
      },
      colors: {
        ink: "#09111f",
        panel: "#111d31",
        line: "#26385a",
        cream: "#fff5db",
        midnight: "#0e1320",
        "midnight-2": "#041329",
        "surface-dark": "#1a1f2c",
        "surface-dark-2": "#252a37",
        "surface-deep": "#0d1c32",
        "line-soft": "#45464c",
        "text-muted": "#c6c6cd",
        "text-bright": "#dee2f4",
        aqua: "#4fdbc8",
        cyan: "#00d1ff",
        "sky-soft": "#adc6ff",
        amber: "#e0c1a3",
        "warning-soft": "#ffba49",
        "success-strong": "#04b4a2",
        "light-bg": "#f8f9ff",
        "light-panel": "#ebeef7",
        "light-panel-2": "#f1f3fc",
        "light-line": "#bbc9cf",
        "light-text": "#181c22",
        "light-muted": "#3c494e",
        "brand-primary": "#00677f",
        "brand-primary-2": "#00d1ff",
        "brand-secondary": "#25fea8",
        "signal-red": "#ff533d",
        "signal-green": "#23d18b",
        "signal-amber": "#ffbf3c",
        "signal-blue": "#41a4ff"
      },
      boxShadow: {
        arena: "0 18px 60px rgba(4, 10, 22, 0.32)",
        insetGlow: "inset 0 1px 0 rgba(255,255,255,0.12)",
        glow: "0 18px 60px rgba(0, 209, 255, 0.16)",
        panel: "0 24px 80px rgba(8, 15, 28, 0.18)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      backgroundImage: {
        hero: "radial-gradient(circle at top, rgba(255, 83, 61, 0.28), transparent 36%), linear-gradient(160deg, #08101d 0%, #0e1b31 42%, #071220 100%)",
        panel: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        streak: "linear-gradient(135deg, #ff533d 0%, #ff9d2f 44%, #41a4ff 100%)",
        "finance-hero":
          "radial-gradient(circle at top left, rgba(173,198,255,0.14), transparent 24%), radial-gradient(circle at top right, rgba(79,219,200,0.12), transparent 20%), linear-gradient(180deg, #0e1320 0%, #101524 40%, #0c1019 100%)",
        "app-shell":
          "radial-gradient(circle at top left, rgba(0,210,255,0.12), transparent 24%), radial-gradient(circle at top right, rgba(0,240,232,0.10), transparent 24%), linear-gradient(180deg, #041329 0%, #07192d 48%, #06111d 100%)",
        "light-mesh":
          "radial-gradient(circle at top right, rgba(0,209,255,0.08), transparent 28%), radial-gradient(circle at bottom left, rgba(37,254,168,0.07), transparent 28%), linear-gradient(180deg, #f8f9ff 0%, #f5f7ff 100%)"
      }
    }
  },
  plugins: []
};

export default config;
