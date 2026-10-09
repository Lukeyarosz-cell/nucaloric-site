# Dashboard redesign

October 9, 2026. A full visual and layout redesign of `dashboard.html`, following the founder's request for more class. This replaces the previous four-column dashboard composition described in `EXPERIENCE_REBUILD.md` and `CREATOR_DESK.md`.

The dashboard uses solid ink, warm white Manrope type, restrained glass, thin dividers, alternating corner shapes and small pink/white/blue pixel accents. The supplied black glass dashboard and etched payment tile references informed the material and spacing; the brand lettering and pixel renderer remain native site assets.

The navigation rail separates workspace tools from account tools. A large project heading and a quiet overview show actual local projects, completed/planned milestones and account state. Intelligence and Terminal share a spacious workbench. Library and Details occupy one context panel rather than squeezing both tools between permanent columns. Focus mode expands the workbench and removes the hidden context from keyboard navigation. Escape restores it. New project, command search, backups, motion controls and the existing keyboard shortcuts remain available.

`dashboard-atelier.js` repositions existing DOM nodes after `workspace-shell.js`; it does not recreate the AI or terminal surfaces. Context switches preserve unsaved brief edits, unsent chat drafts, an in-flight AI reply and the owned terminal session. The native controllers retain project persistence, milestones, archives, imports/exports, coin knowledge, model choices, connections, credits, billing gates and server access. Overview counts are derived from saved projects, with no demonstration records in production.

At narrower desktop sizes the rail becomes icons. Tablets use a horizontal tool rail. Phones show the context above the workbench, with horizontal project cards, readable scrolling navigation and 16px form fields. The native tool navigation brings Intelligence or Terminal into view. The workbench retains its own conversation and terminal scroll regions. Motion pause uses the shared pixel renderer, persists across reloads and respects reduced motion.

Changes are limited to `dashboard.html`, `workspace-shell.js`, the two new dashboard assets and review/documentation files. The dashboard stylesheet loads last and is scoped to `body.atelier-dashboard`. Backend APIs, product pricing and the live-origin publishing configuration retain their existing behavior.

## Validation

`tools/review/dashboard-atelier.cjs` exercises real local project creation/editing, milestone counts and reload, context changes, archives, backup contents, keyboard focus, motion pause persistence, reduced motion and blocked storage. Browser-only API fixtures in `dashboard-fixtures.cjs` exercise the authenticated conversation, pending reply, knowledge save and terminal session ownership without executing commands on a real server or creating real account/billing records. Authenticated chat and terminal bounds are checked at 1920, 1440, 1280, 1024, 768, 760, 390 and 320 pixels.

The existing `working-features.cjs` and `campaign.cjs` runners check project workflows, imports/exports, market/service failure states, idea handoff, film controls and all sixteen pages at desktop/phone widths. Browser screenshots and JSON reports are stored outside the production site in `/home/luke/Projects/nucaloric-dashboard-review/` and mirrored into the Obsidian evidence folder.

All 159 local checks pass: 49 dashboard checks, 40 working-feature checks and 70 campaign/site checks. No runtime errors or changed asset failures were recorded. Private API behavior was checked with isolated fixtures while both Pis were unreachable.

Example with an installed Playwright browser:

```sh
PLAYWRIGHT_MODULE=/path/to/node_modules/playwright \
REVIEW_BROWSER=/path/to/chromium \
REVIEW_BASE_URL=http://127.0.0.1:8097 \
REVIEW_OUTPUT=/tmp/dashboard-review \
node tools/review/dashboard-atelier.cjs
```

The GitHub Pages preview can use local projects while the private backend is unavailable. Live account, AI and terminal access still require Main Pi and Distiller. A cumulative, backup-first frontend package is prepared in the fleet deployment directory when the machines cannot be reached; it includes the earlier campaign and pixel/glass dependencies and preserves backend files, account data and `data/live-site.json`.
