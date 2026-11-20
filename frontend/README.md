# ScamShield AI Frontend

This directory contains the React 19 and Vite frontend for ScamShield AI.

For complete setup, architecture, API, database, environment, testing, and project documentation, see the [project README](../README.md).

## Development

```powershell
npm install
npm run dev
```

The Vite development server proxies `/api` requests to `http://127.0.0.1:8000`.

## Checks

```powershell
npm run lint
npm run build
npm run preview
```

## Main source files

- `src/main.jsx`: React entry point
- `src/App.jsx`: application views and API integration
- `src/App.css`: component styles
- `src/index.css`: global styles and design tokens
- `vite.config.js`: Vite plugins and backend proxy
