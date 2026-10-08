# Website recovery

The CM5 is the public website gateway. Normally it forwards the workspace to the main Pi, where account records and credit accounting live. It checks main availability regularly and uses a restricted SSH recovery command to restore stopped platform services.

If the main Pi cannot recover, the CM5 serves a synchronized copy of the public website. The recovery banner explains what is available. Browsing, pricing, Explore and local planning remain available; account changes, payments, customer terminal access and account AI chat resume when main returns. Keeping one authoritative account database avoids duplicate credit or payment records.

The site returns to the main Pi automatically under the same public gateway address. The CM5 also updates the GitHub entry when a temporary public connector address changes. A permanent custom domain is still pending.

Verified with live HTTPS login, all four installed models, a stopped website container recovered over SSH, a simulated unreachable main node, current fallback pages and rejected account writes.
