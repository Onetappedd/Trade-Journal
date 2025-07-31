# Trade Journal Frontend

A modern, user-centric trading journal dashboard scaffolded with:

- **Next.js 14+ (App Router)**
- **TypeScript**
- **Tailwind CSS** (with custom palette and dark mode)
- **shadcn/ui** (components in `/components/ui`)
- **next-themes** (for dark mode)
- **Ready for Recharts, react-hook-form, zod**

## Setup

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Directory Structure
- `app/` — Next.js App Router pages and layouts
- `components/` — Custom React components
- `components/ui/` — shadcn/ui component source code (owned, not npm package)
- `lib/` — Utilities and helpers

## Theming
- All theming is managed via Tailwind CSS and CSS variables in `globals.css`.
- Dark mode is supported and can be toggled in the UI (see `ThemeProvider`).

---

This scaffold is ready for you to build out the full dashboard UI, forms, and charts as described in your requirements.
