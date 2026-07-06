# AGENTS.md

## Cursor Cloud specific instructions

### Overview
`Ingles Facil` is a fully static, client-side web app for teaching basic English to Portuguese speakers. It consists of only `index.html`, `styles.css`, and `script.js` — there is no build system, no package manager, no backend, and no automated tests or lint config.

### Running the app (dev)
Serve the folder as static files from the repo root, e.g. `python3 -m http.server 8000`, then open `http://localhost:8000/` (see `README.md`). Any static file server works; there is nothing to build or compile.

### Caveats
- No dependencies to install; the update script is intentionally a no-op.
- The "Ouvir pronuncia" / audio buttons use the browser Web Speech API (`speechSynthesis`). This depends on browser/OS voices and may be silent in headless or voice-less environments — this is not an app bug.
- There are no lint or test commands. Validate changes by loading the page and exercising the lesson tabs, flashcards, and quiz manually.
