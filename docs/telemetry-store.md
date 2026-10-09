# Registry, app store, and server telemetry

The Registry entrance follows the centered icon composition and diagonal light bands in the [store reference](https://www.pinterest.com/pin/835136324707217851/). It keeps NUCALORIC's company font, pink/blue palette, animated dot fields, 49 capability cards, search, and selected toolset. Open Store opens the app catalog directly; the separate store entrance remains available.

The [telemetry reference](https://www.pinterest.com/pin/1052927587895699537/) informs the dark framed panel, large counters and activity pixels. Hosting and the dashboard Servers panel show occupied, open and unavailable slots, installed/loaded AI models, actual inference activity, and measured RX/TX history. Stopped containers retain their allocation. Missing or stale observations never advertise free capacity. Decorative dot animations do not drive telemetry values.

The store has four installable browser apps and 25 provider integrations. Clicking an app icon opens its implementation details. Notes, Task Board, JSON Studio, and Pixel Canvas install as verified static files within an owned website server; they use its existing container and no additional server slot. Provider integrations retain their native controls or connection guides.

App installation uses the authenticated Paymenter session and CSRF protection. Both the account controller and allocator enforce ownership. The allocator serializes installation, removal and website publishing. Actual website and app files share the existing 1 MiB content allowance. Package checksums, path checks and size limits run before installation; removal frees the actual bytes. Website publishing preserves managed apps and checks the combined quota. App documents stay in the user's browser and can be exported; these are public static app files, with no new database service.

Account Services, Billing and Dashboard → My tools display a separate inventory of installed server apps. Saved tools remain bookmarks and setup intentions, with their existing device/account persistence.

Public GitHub Pages supports browsing and previews. Account installation and measured telemetry require the Pi backend. The corresponding native release is staged separately with backups, checksums and guards against overwriting changed runtime files or public-origin configuration. The main Pi still requires its private sudo credential for deployment; the Distiller is offline.

Validation includes real temporary server file installation and removal, exact disk accounting, concurrent quota enforcement, publish preservation, owner isolation, unavailable/stale telemetry, native PHP controller behavior, working app previews and responsive browser checks. Review fixtures do not use customer records or mutate the live Pi.
