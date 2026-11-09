# web dsh

DeepSeek Harness in a browser tab, served as plain static files.

Open https://peng456.github.io/dsh/

This repository holds the **built** site (there is no build step here). The
source lives in [`peng456/webdsh`](https://github.com/peng456/webdsh), which is
the browser-only build of dsh; the runtime is
[Vivari](https://github.com/maitrungduc1410/vivari) (MIT), so Node, npm and the
shell run in the page itself.

Notes:

- The page isolates itself through its service worker (COOP/COEP headers a
  static host cannot send), so the first load reloads once.
- `assets/` is rewritten at build time to be path-relative, so the app works
  from a project path and not only from an origin root.
- Files, sessions and model keys live in this browser's storage.
