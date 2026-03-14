# PHL ➟ USA

A personal PWA converter for Philippines ↔ US conversions, installable on iPhone via Safari.

**Live:** https://10pbackpacker.github.io/Currencyconverterapp/

## Features

- **USD / PHP** — live exchange rate via [open.er-api.com](https://open.er-api.com), falls back to approximate rate if unavailable
- **Hectares / Acres** — land area conversion
- **Square Meters / Square Feet** — land area conversion
- Philippines clock (Asia/Manila time) displayed at the top
- Bidirectional input — type in either field
- Full-bleed iOS PWA layout with status bar color matching

## Dev

```bash
npm i
npm run dev    # localhost:5173
npm run build  # production build → dist/
```

Pushing to `main` triggers GitHub Actions, which builds and deploys to GitHub Pages automatically.
