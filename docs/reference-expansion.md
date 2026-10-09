# Explore, Launch and the Toolbox

Explore now combines a coin collection with feed profile pictures, a saved shelf, pool activity and an accessible quick-look dialog. Pictures come from the pool response's `info.imageUrl`; missing, broken or unsafe URLs leave initials visible. Name/mint searches use the market endpoint. Refresh and retry replace the previous observation; unavailable feeds remove obsolete prices. DEX Screener's [API reference](https://docs.dexscreener.com/api/reference) documents the profile image field. Listings remain attributed separately to their sources.

Launch is a four-step editor over the existing local coin plan: Identity, Budget, Supply and Revenue. Optional modules, artwork, autosave, import/export and budget calculations retain their native controllers. Invalid export fields reveal their step before receiving focus. Saving a plan does not submit a transaction.

The Toolbox has a light entrance and a searchable 25-tool catalog drawn from every entry in `data/services.json`. Adding a tool creates a library record for later setup. It does not execute commands, install packages, buy subscriptions or connect a provider automatically. Details link to the existing setup surface or the provider's official guide. For example: [Docker](https://docs.docker.com/get-started/) and [Tailscale](https://tailscale.com/docs/how-to/quickstart).

The shared library appears in Dashboard's My tools panel and the Billing/Services profile pages. Public previews explicitly store it on the device. On the native origin, authenticated sessions use the private app-library API; tools can stay in a profile or be assigned to an owned server. Importing device tools into an account is explicit. Writes are serialized, use native CSRF, and preserve existing records on failure. Corrupt local records are preserved for recovery.

The private companion controller stores account metadata atomically under `var/nucaloric-apps/<user>/library.json`, enforces the catalog allowlist and workspace ownership, and uses account-specific locks. The native authenticated/verified web middleware and throttles cover its routes. The Pi backup must include this directory. This backend is prepared separately from the public frontend; account persistence requires its deployment on the Pi.

Dashboard chat and Terminal share a faint blue-white dot field below their existing nodes. Pause and reduced motion use the existing shared renderer; panel switches preserve the conversation, draft input and terminal session. Hosting adds the supplied transparent server graphic and four clearly external provider cards. Shared framing touches retain the established home, pixel animations and white-blue endings.

Asset provenance and the exact cutout prompt are in [the reference asset notes](../assets/reference/README.md).

Validation runners: `tools/review/reference-expansion.cjs`, `dashboard-atelier.cjs`, `working-features.cjs` and `campaign.cjs`. The private PHP harness separately covers account isolation, ownership, idempotency, corruption, permissions and concurrent additions. Browser account checks use isolated contract fixtures; they are not evidence of a live Pi deployment.
