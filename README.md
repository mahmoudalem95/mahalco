# MAHALCO – transportation engineering site

Static site served by GitHub Pages at https://mahmoudalem95.github.io/mahalco/

| Folder | Contents |
|---|---|
| `/` (root) | Hebrew landing (`index.html`), PWA files (`manifest.webmanifest`, `sw.js`, icons), SEO/verification files, `app-release-signed.apk` |
| `he/` | Hebrew tools (local calculators) · `he/legal/` policy |
| `en/` | English landing (`en/index.html`, tools use the Render API) and English pages · `en/legal/` policies |
| `ar/` | Arabic landing and tools (UAE-oriented) · `ar/legal/` policy |
| `js/` | `calc-client.js` (talks to the `mahalco-calc` API and renders results safely) and `js/tools/*.js` (per-page field lists) |
| `assets/`, `typical-sections/`, `tool/` | Built app bundle and its entry pages (paths are root-absolute – do not move) |

Old root URLs (e.g. `worklog.html`, `apis.html`) are small redirect pages that forward to the new location, so bookmarks, Google results and the Android app keep working.

Server code does not belong here: the DWG converter and the calculation service for the local tools (`mahalco-calc`, used via `js/calc-client.js`) live in the private `MalAlCo/MahAlCo-dwg` repo and the Junction LOS API in `mahmoudalem95/mahalco-api`. Never commit keys or `.env` files – this repo is public.
