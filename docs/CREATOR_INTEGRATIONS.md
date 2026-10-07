# Creator connections and provider setup

The Pi website supports Wallet Standard discovery and Solana provider fallbacks for Phantom, Solflare, Jupiter Wallet, Brave Wallet and Backpack. Connections require wallet approval. A server-generated, five-minute, single-use, account-bound message and Ed25519 verification link a public address to the account. Private keys never enter NUCALORIC. A wallet remains linked after browser disconnect; an authenticated unlink API is available.

Creator connections and balances appear beside the terminal and private AI in the continuous dashboard. Terminal commands include `/wallet`, `/github`, `/credits`, `/server stats` and `/server logs`.

## Private configuration

Copy `nucaloric-paymenter/integration-settings.example.json` to `/srv/nucaloric/state/nucaloric-integrations.json`. It is mounted inside Paymenter at `/app/var/nucaloric-integrations.json`, owned by UID 100, mode 600, and included in private backups. Configure credentials directly on the server; never put keys in browser code, GitHub repositories or chat. Existing settings must be preserved when deploying.

The site currently uses a LAN HTTP address. Wallet extensions may require HTTPS, and creator OAuth is deliberately gated until the canonical site origin is HTTPS. Set the public origin in the existing deployment environment and native account app URL together, preserving the `/billing` prefix, secure cookie and trusted proxy configuration. Use a stable company domain rather than the temporary noVNC desktop tunnel.

## GitHub brand app

After creating the NUCALORIC GitHub account, register a GitHub App owned by the brand:

- Homepage: the public company HTTPS site.
- User authorization callback: `https://YOUR-DOMAIN/billing/nucaloric/github/callback`.
- Repository permissions: Contents read-only, Metadata read-only; no write, admin or workflow permissions.
- Permit installation on creator accounts and selected repositories. Enable expiring user access tokens.
- Fill `github.clientId`, `github.clientSecret`, and `github.appSlug` in the private configuration.

Creators click Connect GitHub, authorize their own account, install the app on selected repositories, then load and publish a built static website directory. OAuth uses PKCE S256, session-bound state and encrypted user/refresh tokens. Each deployment resolves a specific commit and verifies each Git blob hash. Ownership is checked before the allocator publishes to the selected main-Pi or Distiller slot. Limits: 100 static files, 1 MB total, root index.html; no arbitrary build commands or Docker images. Existing files are replaced and one previous revision is held privately. Container state is preserved, including a deliberately stopped site. Disconnect revokes access when GitHub is reachable and always deletes the local connection.

Official authorization documentation: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app

## Jupiter

The backend uses fixed Jupiter endpoints for token search v2, price v3, Swap v2 order/execute and Studio create/submit. Provider requests are serialized and bounded, with read caches. Keys stay on the server. Wallet signatures are checked against the exact prepared transaction; requests are account-bound, expire in two minutes and store execution results for retries.

Set `jupiter.apiKey`. Enable `executeEnabled` only after reviewing live quotes and wallet approvals. `launchEnabled` additionally requires the company API key. Live keyless token search was verified from the Pi deployment. Provider access and rate limits can vary by endpoint; the UI reports errors without substituting mock prices. A company API key is still required for the gated Studio launch flow.

Studio launches are explicitly separate from the existing project blueprint: the implemented preset uses a USDC Meteora bonding curve, 1% trading fees and locked LP. Revenue routing and vesting in the local planner are not executed by this flow. Review all parameters and wallet transaction details before launching. Token artwork and descriptions are public metadata.

Official references:
https://developers.jup.ag/docs/swap/order-and-execute
https://developers.jup.ag/docs/studio/create-token
https://developers.jup.ag/docs/tool-kits/wallet-kit/jupiter-wallet-extension

## Credits

Current Free website plans stay free. AI uses the existing shared allowance unless `pricing.aiCreditsPerMessage` is explicitly set above zero. Positive prices are deducted once per request ID; failed or cancelled jobs are refunded once. Credits are separate integer balances (`ai`, `server`) with an account-owned ledger. Server credits are held for future paid plans; no current server-slot charges are imposed.

Funding is disabled until the company chooses a treasury, network, authenticated/trusted HTTPS RPC and reviewed bundles. Start with devnet. Set `payments.network` (`devnet` or `mainnet-beta`), `rpcUrl`, `treasury`, `enabled`, and a bundles object such as `{ "YOUR-BUNDLE-ID": { "kind": "ai", "units": YOUR-UNITS, "lamports": YOUR-SOL-PRICE-IN-LAMPORTS } }`. Choose prices yourself; the code supplies no live prices.

Payments use a server-prepared SOL transfer plus unique Memo. The linked wallet signs exactly that transfer. The backend sends the signed transaction and grants credits only after a finalized, successful transaction matches payer, treasury, amount, memo, network configuration and payment time. Signatures and references cannot be credited twice. Pending payments can be checked later from any signed-in browser; confirmation never relies on browser-reported balances.

## Docker and Tailscale

Docker remains behind the account-ownership boundary. Neither the public website nor billing has a Docker socket. Main-Pi and Distiller publishing, stats and bounded logs use the existing private allocator and forced-command worker RPC. Website containers retain the pinned static image, UID 101, read-only root, dropped capabilities, 32 MB RAM, 0.25 CPU and 32-process ceiling.

Tailscale is installed and enabled on both Pis with restart-on-failure. Each node must be enrolled in the same tailnet using the device login URL supplied in chat. SSH-over-Tailscale, route acceptance and DNS changes remain disabled. Fleet status exposes only installed/connected/backend-state; enrollment URLs and tailnet identities stay private. Until enrollment completes, existing authorized LAN links continue carrying fleet, file and inference traffic.

Official installation instructions: https://tailscale.com/docs/install/linux

## X Money

The requested provider is X Money within X. Creators can save account-owned USD payout plans for their own coin workspaces, recipients by X handle, holder rewards, promotions, collaborators and other purposes. Plans use idempotent request IDs, can be cancelled, and link to the recipient profile and official X Money page. They do not move money, verify token holdings, or mark payments settled. X’s public help confirms in-app person-to-person transfers; no documented public third-party payout API was found. Automatic transfer, receipts and settlement must wait for official integration access. The separate xmoney.com merchant service is not used.

Official reference: https://money.x.com/en/i/faq
