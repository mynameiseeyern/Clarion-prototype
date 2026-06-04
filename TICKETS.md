# Clarity — Fleet Dashboard · User Stories & Tickets

Prototype scope mapped to epics, stories and acceptance criteria. Status reflects
the current prototype (dummy data): ✅ built · 🟡 partial · ⬜ backlog.

Structure:

- **Overview** — Endpoints overview, Alerts overview
- **Endpoints** — Endpoint table, Endpoint drilldown
- **Alerts** — Alerts table, Alerts drilldown (impacted endpoints)
- **Foundations & cross-cutting** — tokens, search, theming, live data

---

## Epic 1 — Overview

The supervisor's landing page: fleet health at a glance, then drill toward the
worst location / issue.

### 1.1 Endpoints overview (map + locations) ✅

> As a supervisor, I want to see fleet endpoint health by region on a map and a
> locations list, so I can spot where problems are concentrated and drill in.

Acceptance criteria

- Fleet KPI strip: Online endpoints (with healthy/warning/critical split bar),
  Active alerts, Clarity™ Network Score, plus "N total endpoints". ✅
- World map **clusters endpoints by country**; each country marker shows
  aggregated count + worst status. ✅
- Drilling a country reveals its **cities/centres**; a city can be selected to
  preview it. ✅
- Locations list mirrors the map: regions at top level, cities one level down,
  with an **"All locations"** control back to the world view; list is scrollable. ✅
- Each city row has a drill affordance into that city's endpoints. ✅
- KPI numbers stay internally consistent (country aggregates = sum of cities;
  fleet total preserved). ✅

Backlog / next

- Real geographic map tiles instead of the stylised placeholder. ⬜
- Country-level endpoints filter (currently endpoints filter is per-city). ⬜

### 1.2 Alerts overview (active alerts) ✅

> As a supervisor, I want the overview to summarise active alerts (or recent
> recovery when clear), so I know if anything needs attention right now.

Acceptance criteria

- When there are active alerts, show a list of **rollups** — alerts grouped by
  cause (e.g. "Elevated packet loss · 52 endpoints") with affected count, avatars
  and "started Xm ago". ✅
- Rollups mix multi-endpoint issues with **isolated, endpoint-specific** issues
  (e.g. "High CPU utilisation" affecting 1). ✅
- When there are no active alerts, show a **24h recovery snapshot**
  (Resolved / Average time / Auto-fixed). ✅
- Clicking a rollup opens the endpoint drilldown, flicking through that rollup's
  affected endpoints. ✅
- "View all alerts" navigates to the Alerts page. ✅

---

## Epic 2 — Endpoints

### 2.1 Endpoint table ✅

> As a supervisor, I want a filterable table of endpoints so I can triage which
> ones need attention.

Acceptance criteria

- Columns: User / Machine, Status, Location (auto-hidden when filtered to one
  location), Clarity™ Score, Primary issue. ✅
- **Primary issue** is derived from telemetry vs thresholds (worst breaching
  signal); shows "—" when healthy. ✅
- Default sort **worst-first** (critical → warning → healthy, then lowest score). ✅
- Sortable column headers; hostname/user search with clear button;
  Location + Status filters; client-side pagination (10/15/25/50). ✅
- **"Issues only"** toggle (default on) hides healthy endpoints; mutually
  exclusive with an explicit Status selection. ✅
- **Primary issue column auto-hides** when the current view is all-healthy;
  all-clear empty state shown. ✅
- Arriving via "View endpoints" pre-filters to the chosen location and the page
  title reflects it. ✅
- ~2,847 seeded endpoints, counts consistent with the Overview. ✅

Backlog / next

- Column chooser / saved views. ⬜
- Bulk selection + actions. ⬜
- Sticky severity grouping option (group stays even when sorting another column). ⬜

### 2.2 Endpoint drilldown ✅

> As a supervisor, I want a detailed view of a single endpoint so I can diagnose
> the cause without leaving the list.

Acceptance criteria

- Opens as a right-side sheet (CRM record style) from any table row, alert
  rollup, or search result. ✅
- Header: avatar, name, status, machine, location · ISP·IP · team · connection. ✅
- Tabs: **Network** (internet health + speed/connection), **UC/CC platforms**
  (per-platform metrics + "why this matters"), **Devices**, **System**. ✅
- **Flick up/down** between endpoints (↑/↓ keys + buttons) within the current
  sorted/filtered set; "N of M" indicator. ✅
- **Expand** to a near-fullscreen dialog; lower page dimmed with the scrim token. ✅
- When opened from an alert, a **"back to alert"** control returns to the rollup. ✅

Backlog / next

- Historical charts / time-series per metric. ⬜
- Actions (remote fix, message user, acknowledge). ⬜
- "Open in new tab" / full-page route. ⬜

---

## Epic 3 — Alerts

### 3.1 Alerts table ✅

> As a supervisor, I want a table of active alerts across the fleet so I can work
> through them.

Acceptance criteria

- Lists alert rollups fleet-wide: cause/title, location, affected count +
  avatars, severity, started. ✅
- Location + Severity filters, search, worst-first ordering. ✅
- Row click opens the alert drilldown. ✅

Backlog / next

- Acknowledge / resolve / snooze actions + state. ⬜
- Alert history / resolved tab. ⬜
- Pagination once volume grows. ⬜

### 3.2 Alert drilldown (impacted endpoints) ✅

> As a supervisor, I want to open an alert and see every endpoint it impacts so I
> can assess blast radius and jump to a specific endpoint.

Acceptance criteria

- Sheet with alert header (cause, severity, location, affected count, started). ✅
- **Lists impacted endpoints**; each row shows status + its specific reason. ✅
- Clicking an impacted endpoint opens the endpoint drilldown (and can flick
  through all impacted endpoints), with a back path to the alert. ✅

Backlog / next

- Correlation hints ("3 other locations show the same cause"). ⬜
- Per-alert timeline / activity. ⬜

---

## Epic 4 — Foundations & cross-cutting

| Item | Story | Status |
|---|---|---|
| Design tokens | Build on the `@ir/tokens` primitive + semantic tokens; every component reads semantic tokens, light + dark. | ✅ |
| shadcn component library | Themed shadcn components (button, card, badge, table, tabs, select, etc.) wired to Clarity tokens. | ✅ |
| Global search (⌘K) | Command palette over endpoints + locations; selecting opens drilldown / filters endpoints. | ✅ |
| Dark mode | Theme toggle flips all tokens via one `.dark` class. | ✅ |
| Live streaming feel | "Streaming Xs ago" + jittering fleet numbers (online never exceeds total). | ✅ |
| Sidebar nav | Overview / Endpoints / Alerts / Thresholds with active state + breadcrumb. | ✅ |
| Thresholds page | Configure warning/critical limits per metric. | ⬜ |
| Auth / roles | Sign-in, workspace switching, permissions. | ⬜ |
| Real data / API | Replace dummy data with live telemetry + alerting engine. | ⬜ |

---

## Key concepts (glossary)

- **Rollup** — multiple endpoints sharing one cause, collated into a single alert
  with an affected-endpoint count (vs. one row per endpoint).
- **Primary issue** — the single worst-breaching signal for an endpoint, derived
  from its metrics vs. thresholds.
- **Cluster** — countries group their cities/centres on the map; drill a country
  to see its cities.
- **Clarity™ Network Score** — the headline 1.0–5.0 quality score (formerly MOS).
