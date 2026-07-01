---
description: Launch the Agency HR Portal dev server and verify it's running
---

# Dev Server

Starts the Vite dev server for the Agency HR Portal and confirms it is reachable.

## Steps

1. The project root is `C:\laragon\www\agency`.
2. Confirm `node_modules` exists — if not, run `npm install` first.
3. Start the server with `npm run dev` (runs `vite`). Default port is **5173**.
4. Wait for the line `Local: http://localhost:5173/` in stdout.
5. Hit `http://localhost:5173/` with a quick HTTP check to confirm a 200.
6. Report the local URL to the user.

## Notes

- The app requires `VITE_API_BASE_URL` in `.env` pointing to the Laragon PHP backend (e.g. `http://localhost/backoffice`). If it is missing, the app will start but all API calls will fail.
- If port 5173 is already in use, Vite auto-increments to 5174, 5175, etc. — check stdout for the actual port.
- The build command (`npm run build`) runs `tsc --noEmit --skipLibCheck && vite build`. TypeScript errors will block the build but not the dev server.
- No test suite exists for this project currently.
