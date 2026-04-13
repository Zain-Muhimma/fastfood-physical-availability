# Muhimma Dashboard — Reusable Template Guide
> Use this file as CLAUDE.md when setting up a new dashboard (e.g. Physical Availability).
> Copy the entire codebase, then follow the adaptation steps below.

---

## Tech Stack

| Package | Version | Role |
|---|---|---|
| react | ^18.3.1 | UI framework |
| react-dom | ^18.3.1 | DOM rendering |
| react-router-dom | ^7.13.1 | Client-side routing (BrowserRouter) |
| vite | ^6.0.0 | Dev server + build |
| tailwindcss | ^3.4.19 | Utility CSS |
| recharts | ^3.8.1 | Charts (RadarChart in ExecDeepDive, SOV chart) |
| @phosphor-icons/react | ^2.1.10 | Icon library |
| jspdf + jspdf-autotable | ^4.2.1 / ^5.0.7 | PDF export |
| react-markdown | ^10.1.0 | Chat response rendering |
| groq-sdk | ^1.1.2 | AI chatbot backend |

**Fonts**: Poppins (body) + Bebas Neue (display headings) — loaded via Google Fonts in `index.html`.

---

## Architecture Overview

### Provider Chain (App.jsx)
```
DataProvider → BrowserRouter → UIProvider → FilterProvider → GuideProvider → ViewModeProvider → Routes
```

### Data Flow
```
public/data/*.json
  → fetch() in loadAllData()
  → DataProvider (context)
  → useData() hook
  → FilterProvider (selectedBrands, focusedBrand, defaultBrand, demographic filters)
  → useFilters() hook
  → useMetrics() hook (filters demographics → computes all metrics)
  → Pages consume metrics
```

### Key Rules
- `selectedBrands=[]` means "all brands shown"
- `defaultBrand` = first brand alphabetically (computed in FilterProvider)
- `focusedBrand` falls back to `defaultBrand` everywhere
- Brand sorting is **alphabetical** (`localeCompare`), not by any custom sort field
- Demographic filter is intersection: only respondents matching ALL active criteria
- Chatbot always uses **full unfiltered** metrics regardless of active filters

---

## Folder Structure

```
src/
├── App.jsx                      # Provider chain + routes + shell layout
├── main.jsx                     # Entry point
├── index.css                    # Tailwind directives + keyframes
├── data/
│   ├── dataLoader.jsx           # DataProvider, FilterProvider, useMetrics, loadAllData
│   ├── metrics.js               # computeAllMetrics() — pure functions
│   ├── socialMetrics.js         # computeSocialMetrics() — SOV, traffic lights
│   ├── insights.js              # Template-based narrative generators
│   └── metricGuides.js          # "How to Read" guide content per page
├── hooks/
│   ├── useChatbot.js            # Chat state + system prompt + API call
│   └── useDraggable.js          # Mouse drag for chat panel
├── lib/
│   ├── chartColors.js           # getBrandChartColor(brand, focusedBrand)
│   └── export/
│       ├── pdfGenerator.js      # jsPDF helpers
│       └── pdfTheme.js          # PDF styling constants
├── components/
│   ├── Sidebar.jsx              # Fixed 240px, 7 nav items + disabled placeholder
│   ├── TopBar.jsx               # BrandFilter + DemographicFilters + buttons
│   ├── BrandFilter.jsx          # Logo chips, alphabetical, grayscale when unselected
│   ├── DemographicFilters.jsx   # 4 dropdown filters
│   ├── ViewModeContext.jsx      # Sub-nav state context
│   ├── PageViewModeFallback.jsx # Pill-style view mode toggle (below heading)
│   ├── UIContext.jsx            # UI state context (extensible)
│   ├── GuideContext.jsx         # Help panel state
│   ├── ExpandableCard.jsx       # Fullscreen modal wrapper for any content
│   ├── HeatmapTable.jsx         # Generic CEP × Brand matrix with conditional coloring
│   ├── ChatButton.jsx           # Fixed FAB bottom-right
│   ├── ChatPanel.jsx            # Draggable chat drawer
│   ├── [Metric]CompactView.jsx  # Overview layout per metric
│   ├── [Metric]DeepDive.jsx     # Deep-dive layout per metric
│   ├── [Metric]InsightPanel.jsx # Narrative + KPI panel per metric
│   ├── [Metric]BrandCards.jsx   # Brand card grid per metric
│   ├── [Metric]MegaTable.jsx    # Comparison table per metric
│   ├── export/                  # Browser print engine components
│   └── report/                  # Printable report sections
├── pages/
│   ├── ExecutiveSummary.jsx     # Route: /
│   ├── CEPOpportunityMap.jsx    # Route: /cep
│   ├── MentalPenetration.jsx    # Route: /mpen  (rename for your domain)
│   ├── NetworkSize.jsx          # Route: /ns    (rename for your domain)
│   ├── MentalAdvantage.jsx      # Route: /ma    (rename for your domain)
│   ├── SocialListening.jsx      # Route: /social
│   ├── EarlyWarning.jsx         # Route: /early-warning (disabled placeholder)
│   └── Report.jsx               # Route: /report (print-only)
public/
├── data/                        # Pre-processed JSON files
│   ├── demographics.json        # Respondent records
│   ├── q23.json                 # CEP × Brand association rows
│   ├── buyers.json              # Purchase behavior rows
│   ├── ad_awareness.json        # Ad exposure rows
│   ├── logos_new.json           # Brand metadata (name, logo path, sort order)
│   ├── cep_size.json            # CEP occasion sizes
│   └── social_listening.json    # Social media post data
└── logos/                       # Brand logo PNGs + platform logo
```

---

## Design System (tailwind.config.js)

### Colors
| Token | Value | Usage |
|---|---|---|
| `orange-primary` | `#F36B1F` | CTA, active nav, focused brand, progress bars |
| `orange-hover` | `#E05E15` | Hover states |
| `orange-light` | `#FEF0E7` | Highlight backgrounds |
| `orange-tint` | `#F5F3F0` | Subtle warm backgrounds |
| `green-positive` | `#2E7D32` | Positive values |
| `red-negative` | `#C62828` | Negative values |
| `blue-info` | `#1565C0` | Info segments (Seen Ad) |
| `page` | `#F7F6F4` | App background |
| `card` | `#FFFFFF` | Card backgrounds |
| `text-primary` | `#3B3B3B` | Main text |
| `text-secondary` | `#5A5A5A` | Muted text |

### Typography
- Body: `font-sans` → Poppins
- Headings: `font-display` → Bebas Neue
- Page titles: `text-[36px]` (same in overview and deep-dive)

### Border Radius
- Cards: `rounded-card` (14px)
- Pills: `rounded-full`
- Cells: `rounded-[6px]`

### Animations (index.css)
- `animate-slide-up` — entrance animation with stagger via `animationDelay`
- `barExpand` — progress bar fill (inline style)
- `dotPop` — spring scale for dot visualizations
- `panelFadeIn` — panel transitions
- `anim-delay-0/1/2/3` — preset stagger classes (0/80/160/240ms)

---

## UI Patterns

### Page Heading + Sub-Nav
Every page follows this pattern in both overview and deep-dive modes:
```jsx
<div className="flex flex-col flex-shrink-0 mb-3">
  <h1 className="font-display text-[36px] leading-none text-text-primary tracking-wide">Page Title</h1>
  <p className="text-[11px] text-text-secondary font-medium mt-1">Page description...</p>
  <div className="mt-2"><PageViewModeFallback /></div>
</div>
```

### View Mode Registration (in each page)
```jsx
const { setViewMode } = useViewMode();
useEffect(() => {
  setViewMode({
    path: '/your-route',
    modes: [
      { key: 'overview', label: 'Overview' },
      { key: 'table', label: 'Comparison' },
      { key: 'deepdive', label: 'Deep-Dive Analysis' },
    ],
    current: isDeepDive ? 'deepdive' : view,
    onChange: (key) => { /* toggle state */ },
  });
  return () => setViewMode(null);
}, [deps]);
```

### Sub-Nav Component (PageViewModeFallback)
- Pill-style segmented control with orange stroke border
- Active tab: `bg-orange-primary text-white`
- Inactive: `text-text-muted hover:text-orange-primary`
- Always visible (no sidebar collapse dependency)

### Sidebar
- Fixed 240px width, no collapse
- Logo + platform title in header
- NavLink items with Phosphor icons
- Active: `text-orange-primary font-semibold`
- Mobile: hamburger toggle with overlay

### Deep-Dive Card Layout
```
[Focused Brand Card]  [Brand Ranking Leaderboard]  [Detailed Analysis]
```
- Focused brand card: logo on top, name + "Focused Brand" below, crown top-right for top-3
- Brand ranking: clickable chips to switch focus
- Detailed analysis: auto-generated narrative from insights.js
- Below: 3 segment cards (e.g. Buyers/Weight/Ad Exposure)

### Brand Filter (TopBar)
- 48×48 logo images, alphabetical order
- Unselected: `grayscale opacity-90`
- Selected: full color
- Click toggles selection and sets `focusedBrand`

### Demographic Filters
- 4 compact dropdowns: Region, Nationality, Gender, Age Group
- Padding: `px-3 py-1.5`, label `text-[10px]`, value `text-[12px]`

### ExpandableCard
- Wraps any chart/table with a top-right expand button
- Expands to fullscreen modal (96vw × 94vh) via React Portal

### Chart Colors (chartColors.js)
- `getBrandChartColor(brand, focusedBrand)` — focused brand gets orange, all others get deterministic gray
- SOV chart: hovered brand turns orange in both legend and bars

### Viewport Height
- Pages use `h-[calc(100vh-155px)]` or `min-h-[calc(100vh-155px)]`
- 155px accounts for TopBar height

---

## Data Schema

### demographics.json
```json
{ "UniqueKey": "3_59", "wave_id": 3, "gender": "Woman", "nationality": "Non-Saudi Arab", "region": "Riyadh", "age_group": "25-36" }
```

### q23.json (CEP × Brand associations)
```json
{ "UniqueKey": "3_59", "CEP": "Craving a specific menu item", "Brand": "McDonald's" }
```
- `Brand` can be `"None"` — always exclude in metrics

### buyers.json
```json
{ "UniqueKey": "3_59", "Brand": "McDonald's", "buyer_status": "Buyer", "heavy_light": "Heavy" }
```

### ad_awareness.json
```json
{ "UniqueKey": "3_59", "Brand": "McDonald's", "ad_awareness": "Yes" }
```

### logos_new.json
```json
{ "brand": "McDonald's", "brand_sort": 9, "logo": "/logos/mcdonalds.png" }
```

### cep_size.json
```json
{ "cep": "Craving a specific menu item", "respondent_count": 796, "size": 0.6628 }
```

### social_listening.json
```json
{
  "meta": { "date_range": {...}, "total_rows": 4702, "brands": [...], "social_ceps": [...] },
  "rows": [
    { "post_id": "...", "brand": "...", "date": "...", "source": "tiktok", "cep": "...", "likes": 169, "views": 4328 }
  ]
}
```

---

## Metrics Engine (metrics.js)

All functions are pure — no side effects, no brand-specific logic.

| Function | Output | Scale |
|---|---|---|
| `computeMMS()` | Mental Market Share per brand | 0-1 fraction |
| `computeMPen()` | Mental Penetration per brand | 0-1 fraction |
| `computeNS()` | Network Size per brand | 0-14 decimal |
| `computeMA()` | Mental Advantage per brand×CEP | signed fraction |
| `computeMPenSegments()` | MPen by buyer/weight/ad segments | 0-100 (already %) |
| `computeNSSegments()` | NS by buyer/weight/ad segments | raw decimals |

**Important**: `mpenSegments` values are already ×100. Do NOT multiply again.

---

## Adaptation Checklist for New Dashboard

### 1. Global Branding
- [ ] `index.html` — Update `<title>` and `<meta description>`
- [ ] `src/components/Sidebar.jsx` — Update logo path, header text
- [ ] `public/logos/` — Add your platform logo + all brand logos

### 2. Data Files
- [ ] `public/data/demographics.json` — Your respondent data
- [ ] `public/data/q23.json` — Your CEP × Brand associations
- [ ] `public/data/buyers.json` — Your purchase behavior data
- [ ] `public/data/ad_awareness.json` — Your ad exposure data
- [ ] `public/data/logos_new.json` — Your brand list + logo paths
- [ ] `public/data/cep_size.json` — Your CEP/occasion definitions + sizes
- [ ] `public/data/social_listening.json` — Your social media data (optional)

### 3. Page Names & Routes (if domain changes)
- [ ] Rename page files and components (e.g. MentalPenetration → PhysicalPenetration)
- [ ] Update route paths in `App.jsx`
- [ ] Update nav items in `Sidebar.jsx`
- [ ] Update `metricGuides.js` route keys

### 4. Content & Copy
- [ ] `src/data/metricGuides.js` — Update all metric definitions and guide text
- [ ] `src/data/insights.js` — Update narrative templates (thresholds may differ)
- [ ] `src/hooks/useChatbot.js` — Update system prompt: platform name, brand list, CEP list, framework description
- [ ] Page description text in each page file (below `<h1>`)
- [ ] `src/components/export/ExportHeader.jsx` — Update title
- [ ] `src/components/export/pages/FullReportExport.jsx` — Update title
- [ ] `src/components/report/sections/CoverSection.jsx` — Update cover page
- [ ] `src/lib/export/pdfGenerator.js` — Update footer text and filename prefix

### 5. Metrics (usually no changes needed)
- [ ] `src/data/metrics.js` — Same formulas work for any Ehrenberg-Bass framework
- [ ] `src/data/socialMetrics.js` — Same SOV/traffic light logic applies
- [ ] `src/data/dataLoader.jsx` — No changes unless data schema differs

### 6. Component Naming (optional, for clarity)
- [ ] Rename `Mpen*` → `PPen*` (Physical Penetration) etc.
- [ ] Update `getLogoPath()` maps in components that have local copies

### 7. Verification
- [ ] `npm run dev` — Check all 6 pages load
- [ ] Test brand filter (select/deselect brands)
- [ ] Test demographic filters
- [ ] Test deep-dive mode on each page
- [ ] Test sub-nav switching on each page
- [ ] Test export/report generation
- [ ] Test chatbot responses
- [ ] Check mobile responsive sidebar toggle

---

## Commands

```bash
npm run dev           # Dev server (localhost:5173)
npm run build         # Production build → dist/
npm run preview       # Preview production build
```

**Environment variables:**
- `.env.local`: `GROQ_API_KEY=gsk_...`
- Cloudflare Workers: `GROQ_API_KEY` via `wrangler secret put`
