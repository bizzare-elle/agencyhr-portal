# Project Notes

## UI Preferences
- **Dark mode**: Always active via `class="dark"` on `<html>`. Never use hardcoded light colors (`bg-white`, `bg-gray-*`, `bg-zinc-*`, `text-gray-800`, hex values like `bg-[#36454F]`). Always use CSS variable-based Tailwind classes.
- **Theme**: shadcn preset `b1a1crD4y` — blue-tinted palette. Dark background `oklch(0.148 0.004 228.8)`, card `oklch(0.218 0.008 223.9)`, primary is muted blue `oklch(0.45 0.085 224.283)`, radius `0.45rem`.
- **Accent color**: Yellow (`bg-yellow-500 text-white hover:bg-yellow-600`) is the app's primary action color for submit/CTA buttons.
- **Primary button**: Use `bg-primary text-primary-foreground` for standard actions; yellow for main CTAs.
- **Status badges**: Use opacity tints — `bg-green-500/10 text-green-400`, `bg-yellow-500/10 text-yellow-400`, `bg-red-500/10 text-red-400`.
- **Employee header cards**: Use `bg-card border` with a yellow avatar bubble (`bg-yellow-500/20 text-yellow-400`). Never `bg-[#36454F]`.
- **Preferred classes**: `bg-card`, `bg-muted`, `bg-accent`, `text-foreground`, `text-muted-foreground`, `border-border`. These auto-adapt to dark mode via CSS variables.
