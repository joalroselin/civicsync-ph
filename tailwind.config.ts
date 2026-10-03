import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

/**
 * Theme colours are CSS variables (see globals.css) so dark mode is one
 * class on <html>, not a `dark:` variant on every element.
 * - surface/paper/gray: neutrals that flip in dark mode
 * - navy/crimson: brand fills (hero, buttons), the same in both themes
 * - navy-ink/crimson-ink: brand-coloured text and rings, lighter in dark mode
 * - amber/emerald/red/blue 50–200 and 600–900: status badges, re-tuned for dark
 */
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
const shades = (prefix: string, keys: number[]) => Object.fromEntries(keys.map((k) => [k, v(`${prefix}-${k}`)]));

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: "#1E3A8A",
        crimson: "#991B1B",
        paper: v("paper"),
        surface: v("surface"),
        "navy-ink": v("navy-ink"),
        "crimson-ink": v("crimson-ink"),
        gray: shades("gray", [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        amber: { ...colors.amber, ...shades("amber", [50, 100, 200, 800, 900]) },
        emerald: { ...colors.emerald, ...shades("emerald", [50, 200, 600, 700, 800, 900]) },
        red: { ...colors.red, ...shades("red", [50, 200]) },
        blue: { ...colors.blue, ...shades("blue", [50, 200]) },
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Space Grotesk", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
