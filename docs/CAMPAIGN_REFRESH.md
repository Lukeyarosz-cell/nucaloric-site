# Make It Real website refresh

October 8, 2026. Inspired by the approved v20 brand film.

The homepage now starts with a thought and leads into a project brief, a toolset and a workspace. Large Instrument Sans type, rose studio lighting, sharply defined product cards and a white-to-blue brand finish carry the film’s visual direction into the site. Studio, Hosting, Registry, pricing, Explore and the creator dashboard share the same typography and treatment. Shared navigation, footers and motion controls tie the remaining tool pages together.

## Working interactions

- The homepage idea form carries a thought and workload to a new Studio brief. Existing library projects remain intact. Saving creates a separate record; refreshing resumes it. Failed browser storage reports the problem and still permits a Markdown export.
- The three-step walkthrough responds to clicks, arrow keys, Home and End. Its examples link to the real tools and clearly identify illustrative content.
- The approved film loads after an explicit Watch action. Closing or hiding the page pauses playback. Escape closes the modal and returns focus.
- Ambient loops are silent, stop outside the viewport and respect the shared motion preference and reduced-motion setting. Reduced motion uses still posters without downloading the loops.
- Native account, wallet, credits, server and terminal controls retain their existing data and event hooks. No backend or billing behavior was changed.

## Assets

The exact existing NUCALORIC vector lettering remains the brand mark. Instrument Sans and its OFL license came from the ad project. Two six-second, 960 × 540 silent atmospheres were rendered using the ad’s shader and four reference motion plates. They use approximately 200 KB combined. The approved 27-second film has a 1280 × 720, 30 fps web copy of approximately 1.9 MB, loaded on demand. The complete campaign asset folder is approximately 2.3 MB.

No new runtime library is needed. The site retains its existing GSAP installation, uses native video and dialog elements, and uses ordinary document scrolling.

## Verification

160 browser checks pass:

- 70 campaign checks cover motion, film playback and focus, keyboard walkthrough, project handoff, preservation, reload, blocked storage, assets and all 16 full pages at 1440, 390 and 320 pixels.
- 40 working-feature checks cover project libraries, milestones, archives, portable backups, hostile imports, watchlists, public pool observations and provider failure reporting.
- 39 workbench checks cover preferences, coin identity, budgets, module state, uploaded artwork, portable plans, legacy migration and responsive layouts.
- 11 hosting checks cover configured checkout links, own-hardware plans, saved fields, portable JSON and setup scripts, and invalid app addresses.

Browser reports contain no runtime errors or failed campaign assets. Tests use isolated browser profiles and fixture data; they do not execute payments or customer terminal commands. Real authenticated operations could not be rechecked while the Pi servers were unreachable from the workstation.

```bash
PLAYWRIGHT_MODULE=/path/to/playwright REVIEW_BROWSER=/path/to/chromium \
REVIEW_BASE_URL=http://127.0.0.1:8095 node tools/review/campaign.cjs
```

The other review scripts are in `tools/review/`. Some older runners use the browser path supplied by Playwright; install its paired Chromium build or adapt that path when using a separately installed executable.

## Deployment

The public frontend is served by GitHub Pages. `?preview=1` retains the public preview when the CM5 gateway is reachable. The Pi frontend requires the same campaign files before the gateway can serve the new design. Static browsing and local planning work independently; authenticated tools require the existing Pi backend.

The workstation keeps the preceding frontend and a manifest-based Pi installation bundle. Deployment copies only changed public frontend files, preserves a backup, and does not restart containers or change account data. The existing live-origin announcement remains owned by the CM5 publisher.
