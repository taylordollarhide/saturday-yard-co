# Saturday Yard Co. — Project Handoff

## What This Is
A lawn care business website + private route management app for Taylor Dollarhide in Erie, CO. Two separate products in one repo.

---

## Repo & Deploy
- **GitHub:** `taylordollarhide/saturday-yard-co`
- **Netlify:** `saturdayyardco.netlify.app` (auto-deploys on push to `main`)
- **Domain:** `saturdayyardco.com` (registered via Squarespace, pointed to Netlify)
- **Stack:** Plain HTML/CSS/JS — no build tools, no framework
- **Local path:** `/Users/taylordollarhide/Library/Mobile Documents/com~apple~CloudDocs/saturdayyardco/`
- **iCloud sync note:** Files live in iCloud Drive. Wait for sync before committing or git may pick up stale versions.

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | Public marketing website |
| `schedule.html` | Private PIN-gated route manager (PWA) |
| `customer.html` | Customer-facing service record page (shared via link) |
| `manifest.json` | PWA manifest for home screen install |
| `sw.js` | Service worker — caches app shell for offline use |
| `netlify.toml` | Publish dir + security headers |
| `erie-test.csv` | 12-client test route (Erie Highlands + Colliers Hill) |
| `SaturdayYardCompany_Logo.png` | Retro patch logo |
| `app-icon.png` | PWA icon / favicon |
| `logo.png` | Horizontal wordmark (used in marketing header) |

---

## Marketing Site (`index.html`)
- Font: Georgia serif for headlines, system-ui for body
- Colors: `--cream: #f6f1e7`, `--paper: #fffaf0`, `--black: #151613`, `--green: #243c2a`, `--gold: #b9862f`, `--muted: #706b5e`
- Sticky header hides on scroll down, reappears on scroll up
- Mobile hamburger menu (full-screen overlay, outside `.header-wrap`)
- **Netlify Forms** wired up: `<form name="lawn-log" method="POST" netlify enctype="multipart/form-data">` — submits via fetch, shows inline success, supports photo upload
- OG image points to `SaturdayYardCompany_Logo.png`

---

## Route Manager (`schedule.html`)
A single-file app. All data in `localStorage`. No backend, no database.

### Auth
- PIN gate on load. Default PIN: `1234`
- PIN stored in `localStorage` key `syc_pin`
- `sessionStorage` not used — PIN persists via localStorage

### Data Model
```js
// syc_clients (array)
{
  id,        // UUID string
  first, last,
  address, phone, email,
  service,   // "Weekly" | "Bi-Weekly"
  yardSize,  // "Small" | "Standard" | "Large"
  price,     // number (per mow)
  day,       // "Saturday" | "Sunday"
  order,     // integer (route position)
  notes,
  log: [{ date: "YYYY-MM-DD", status: "Completed"|"Skipped", notes }]
}
```

### localStorage Keys
| Key | Contents |
|-----|---------|
| `syc_clients` | All client data |
| `syc_pin` | Current PIN |
| `syc_start_time` | Route start time (default `07:00`) |
| `syc_venmo` | Venmo handle (for EOD emails) |
| `syc_coords` | `{ clientId: { lat, lng } }` — geocoded addresses |
| `syc_leg_times` | `{ map: { "id1->id2": minutes } }` — drive time cache |
| `syc_theme` | `"light"` or `"dark"` |

### Job Durations
```js
const JOB_DURATION = { Small: 17, Standard: 28, Large: 48 }
```

### Tabs
1. **Route** — ordered daily schedule with times, drive badges, map toggle, EOD Send
2. **Clients** — alphabetical list with share/edit/delete
3. **Stats** — revenue breakdown, $/hr by yard size, top earners, insights
4. **Settings** — Clear clients, Clear route cache, Change PIN, Start time, Venmo handle

### Drive Times
- Geocoding: Nominatim API, Colorado bounding box restricted, 1.1s rate limit
- Drive time calculation: **haversine distance × 1.35 road factor ÷ 30mph** — runs in background on load, no external routing API
- Cache format: `{ map: { "clientId->clientId": minutes } }` — keyed dict, NOT array indices
- OSRM (`router.project-osrm.org`) is used ONLY for the map view road-following polyline
- On load, old array-format cache is auto-detected and wiped

### Route List Timing Logic
```
timeCursor = startMins (e.g. 7:00 = 420)
for each client in day order:
  driveTime = legMap["prevId->thisId"]  // walk backward if not found
  timeCursor += driveTime
  arrival = timeCursor
  departure = timeCursor + jobMins
  timeCursor += jobMins
```

### Completed State
- Card fades to 50% opacity, order number → ✓
- Triggers if most recent log entry is `Completed` and within last 7 days
- Resets automatically each week

### EOD Send
- Button appears below each day's route (Saturday / Sunday separately)
- Shows all clients logged `Completed` today
- Each has a `mailto:` pre-filled with completion message + Venmo payment link
- Venmo URL: `https://venmo.com/HANDLE?txn=pay&amount=PRICE&note=...`

### Map View
- Leaflet.js + OpenStreetMap tiles
- OSRM road-following route drawn in gold (`#b9862f`)
- Drive time pills on map are separate from the route list badges

### PWA
- Manifest: `manifest.json` — standalone display, dark forest green theme
- Service worker: `sw.js` — caches app shell, passes through map/routing APIs
- iOS: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`
- Topbar uses `env(safe-area-inset-top)` to clear Dynamic Island / notch
- Install: Safari → Share → Add to Home Screen

### Dark Mode
- `[data-theme="dark"]` on `<html>` overrides CSS variables
- Dark palette: bg `#141f16`, surface `#1b2d1e`, text `#eee8d8`, green `#4a7a54`
- Applied before paint via inline `<script>` to avoid flash
- Toggle button (sun/moon) in topbar, persists to `syc_theme` in localStorage
- Respects `prefers-color-scheme` if no manual preference set

### Material Icons
- Loaded from `fonts.googleapis.com/icon?family=Material+Icons`
- Used throughout — `check`, `edit`, `delete`, `navigation`, `download`, `upload`, `person_add`, `mark_email_read`, etc.

### CSV Import/Export
- Export: all clients as quoted CSV
- Import: merges by ID (updates existing, adds new, never deletes)
- Test file: `erie-test.csv` (12 clients, Erie Highlands + Colliers Hill, real street names)

---

## Customer Page (`customer.html`)
- URL param: `?id=clientId`
- Reads from `localStorage` (same device as route manager)
- Shows: service type, rate, route day, full log history
- Summary pills: Completed count, Skipped count, Since [first date]

---

## Known Issues / Active Work
- Drive times only show after Nominatim geocodes all clients (first load can take ~20s for a full route — subsequent loads use cached coords and are instant)
- OSRM demo server is unreliable for background calls — haversine used instead; map view still uses OSRM and can occasionally fail if server is down

---

## Conventions
- Commit with: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- Push to `main` — Netlify auto-deploys
- No build step, no node_modules, no package.json
- All JS is inline in each HTML file
- CSS variables for all colors — always use `var(--name)`, never hardcode hex in new rules
