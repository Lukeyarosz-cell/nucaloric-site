# Public application access

The working application is served through a public HTTPS connector to the main Pi. Accounts, private coin context, allocations, terminal commands and credits use the same native backend and ownership checks as the LAN deployment. Local AI inference still runs on the Distiller.

Current application: https://adjacent-passage-southeast-mega.trycloudflare.com

Current hosted website gateway: https://charlie-rna-belts-engaged.trycloudflare.com

GitHub Pages is the public entry point and static preview. Its pages open the full live application by default. Add `?preview=1` to any page to inspect the static preview. Project plans stored in a browser belong to that origin; export/import the project library to move those local plans between the preview and the live application. Native accounts and private AI workspaces are shared backend records.

The website gateway uses a separate hostname and listener from the account portal. It forwards only GET/HEAD requests to configured main/Distiller static website slots; it does not forward cookies or identity headers or expose billing/AI APIs. Generated website links use this public gateway. Use relative asset paths inside hosted sites. Public routes update shortly after allocation changes.

Both connectors and the origin synchronizer are enabled system services with automatic restart. The synchronizer updates the canonical billing URL, redirects local billing access to HTTPS, and refreshes the static website route map. Public account cookies use Secure, HttpOnly for the session, and SameSite=Lax. Mutating requests still require the exact configured Origin and the native CSRF token.

The account-free connectors provide temporary addresses. A connector restart can change an address. The local GitHub entry publisher follows the current origin and updates the public entry file while the management PC is running. A permanent address requires a domain and a named Cloudflare tunnel; the current setup should not be presented as a permanent production domain. See [Cloudflare Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).

Public access does not configure merchant pricing, a funding treasury, Jupiter paid/Studio credentials, creator GitHub OAuth credentials or an X Money payout API. Free website allocations and installed local AI models work; key-dependent providers retain their existing availability checks.
