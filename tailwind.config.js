/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./index.ts", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  // "media" is the default, but stated explicitly: NativeWind v4 tracks the
  // system appearance via the internal Appearance observable and routes both
  // `dark:` utility classes AND `@media (prefers-color-scheme: dark)` root
  // variables through the same observable, so dark mode flips in lockstep
  // across the whole tree when our ThemeProvider calls `setColorScheme`.
  darkMode: "media",
  theme: {
    extend: {
      // Tokens mirror celiyohms/src/styles/globals.css; values resolve from
      // the CSS variables declared in global.css (light + .dark).
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "foreground-secondary": "var(--foreground-secondary)",
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        popover: "var(--popover)",
        "popover-foreground": "var(--popover-foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        destructive: "var(--destructive)",
        "destructive-foreground": "var(--destructive-foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        "chart-1": "var(--chart-1)",
        "chart-2": "var(--chart-2)",
        "chart-3": "var(--chart-3)",
        "chart-4": "var(--chart-4)",
        "chart-5": "var(--chart-5)",
        sidebar: "var(--sidebar)",
        "sidebar-foreground": "var(--sidebar-foreground)",
        "sidebar-primary": "var(--sidebar-primary)",
        "sidebar-primary-foreground": "var(--sidebar-primary-foreground)",
        "sidebar-accent": "var(--sidebar-accent)",
        "sidebar-accent-foreground": "var(--sidebar-accent-foreground)",
        "sidebar-border": "var(--sidebar-border)",
        "sidebar-ring": "var(--sidebar-ring)",
      },
      borderRadius: {
        // 0.5rem base (web root 14px ≈ 7px → 8 on native); sm/md at 0.6x/0.8x.
        sm: 4,
        md: 6,
        lg: 8,
        xl: 11,
        "2xl": 14,
        "3xl": 18,
      },
    },
  },
  plugins: [],
};
