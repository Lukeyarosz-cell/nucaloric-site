# Account, server setup and files

The Account button opens a dark glass sign-in panel with clipped corners, blue and pink light rails, the company wordmark and Manrope. It uses the same Paymenter customer account as billing, server ownership and balances. Native remember-me, logout, CAPTCHA and two-factor handling remain authoritative. An expired account session opens the same sign-in panel again.

`setup.html` guides users through five steps:

1. Choose an existing server or a new Basic/Full monthly server.
2. Choose Notes, Task Board, JSON Studio and Pixel Canvas to install; select terminal shortcuts and shared AI preferences.
3. Choose files, AI and GitHub integration preferences, with an optional repository.
4. Name the server.
5. Review price, storage and selections, then explicitly apply them.

New purchases retain the existing native idempotency key and paid eligibility checks. A partial app install retains its allocated workspace for retry. The final screen verifies installed app integrity, saved account preferences and actual disk usage. The website server does not host an LLM; AI preferences connect to the shared inference worker and show its current availability.

The dashboard Files workspace manages both private account text documents and public website assets. Server operations include folders, binary uploads, text edits, renaming, downloads and deletion. Website assets and installed apps share the existing 1 MiB quota. Revision checks prevent overwriting a newer file. The apps folder is managed by the store; `index.html` remains the entry point. File content is not saved to browser storage.

Saved terminal shortcuts type into the actual interactive shell without pressing Enter, and preserve a command already being edited. Switching between Files and the workbench keeps the same mounted terminal and AI conversation.

## Validation

The browser review covers sign-in errors, password visibility, the shared session, binary uploads, text edits and revisions, renaming, reviewed deletion, setup installation, prepaid approval, interrupted setup retry, real terminal presets and layouts at 320 px and 390 px. Existing dashboard regressions also pass.

Private native reviews cover account ownership, expired enrollments, traversal and symlinks, atomic quota failures, concurrent file revisions, app disk accounting, native login/logout actions, CAPTCHA, two-factor challenges and rate limiting. Native source and deploy instructions live in the private fleet project.

## References

Login reference: https://pin.it/2IF0baU3l. The implementation recreates its panel structure and lighting in HTML/CSS using NUCALORIC assets.

The second reference, https://pin.it/625d6Y7Ps, redirects to Pinterest's homepage and could not be retrieved. The setup page follows the site's existing paper, glass, blue and pink pixel treatment until a working reference is available.
