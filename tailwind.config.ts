// tailwind.config.ts

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/contents/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-noto-sans-kr)", "Noto Sans KR", "sans-serif"],
      },

      colors: {
        brand: {
          navy: "#0f172a",
          navy2: "#0f2b5b",
          blue: "#1d4ed8",
          blueStrong: "#1e40af",
          cyan: "#06b6d4",
          light: "#f8fbff",
          border: "#e2e8f0",
          muted: "#5b6472",
          success: "#059669",
          warning: "#d97706",
          danger: "#dc2626",
        },
      },

      borderRadius: {
        sm: "12px",
        md: "18px",
        lg: "24px",
        xl: "32px",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },

      boxShadow: {
        "brand-soft": "0 12px 30px rgba(15, 23, 42, 0.06)",
        "brand-card": "0 20px 60px rgba(15, 23, 42, 0.08)",
        "brand-strong": "0 24px 60px rgba(30, 64, 175, 0.14)",
        "brand-dark": "0 24px 70px rgba(2, 6, 23, 0.38)",
        "brand-hero": "0 30px 90px rgba(15, 23, 42, 0.12)",
      },

      maxWidth: {
        "8xl": "90rem",
      },

      backgroundImage: {
        "brand-hero":
          "radial-gradient(circle at top left, rgba(59,130,246,0.10), transparent 28%), radial-gradient(circle at bottom right, rgba(6,182,212,0.10), transparent 30%), linear-gradient(to bottom, #f8fbff, #ffffff 35%, #f8fafc 100%)",
        "brand-light":
          "radial-gradient(circle at top left, rgba(59,130,246,0.06), transparent 22%), linear-gradient(to bottom, #ffffff 0%, #f8fbff 38%, #ffffff 100%)",
        "brand-dark":
          "radial-gradient(circle at top right, rgba(59,130,246,0.10), transparent 18%), linear-gradient(to bottom right, #0f172a, #020617)",
        "brand-card":
          "linear-gradient(to bottom right, rgba(255,255,255,1), rgba(248,250,252,1))",
      },

      keyframes: {
        "fade-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(12px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "soft-float": {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-6px)",
          },
        },
        shimmer: {
          "0%": {
            backgroundPosition: "-200% 0",
          },
          "100%": {
            backgroundPosition: "200% 0",
          },
        },
      },

      animation: {
        "fade-up": "fade-up 0.6s ease-out",
        "soft-float": "soft-float 4s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
      },

      transitionTimingFunction: {
        brand: "cubic-bezier(0.22, 1, 0.36, 1)",
      },

      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
        30: "7.5rem",
      },
    },
  },

  plugins: [],
};

export default config;
