# Feature Implementation Guide: How to Read + Report Export + Chatbot

> Detailed guide for replicating these three features in a new dashboard with a different topic.

---

## 1. "How to Read" Guide System

### How It Works

A floating info button appears on every page. When clicked, it opens a draggable panel showing metric definitions and color legends specific to the current page and view mode.

### Architecture

```
Page mounts → registers guide content via setCurrentGuide()
                ↓
GuideContext stores it → GuideButton appears (bottom-right)
                ↓
User clicks → GuidePanel opens → renders sections
```

### Files

| File | Role |
|---|---|
| `src/components/GuideContext.jsx` | React context: `currentGuide`, `guideOpen`, `setCurrentGuide`, `setGuideOpen` |
| `src/components/GuideButton.jsx` | Floating info button (appears only if guide content exists) |
| `src/components/GuidePanel.jsx` | Draggable panel that renders guide sections |
| `src/data/metricGuides.js` | All guide content organized by route + view mode |

### Data Structure

```javascript
// metricGuides.js
export const guides = {
  '/':       { overview: [...], deepDive: [...], title: 'Executive Summary' },
  '/cep':    { overview: [...], deepDive: [...], title: 'CEP Opportunity Map' },
  '/mpen':   { overview: [...], deepDive: [...], title: 'Mental Penetration' },
  // ... one entry per page route
};
```

Each guide is an array of sections. Three section types are supported:

#### Type: `definitions`
```javascript
{
  title: 'Key Metrics',
  type: 'definitions',
  items: [
    { term: 'Mental Market Share (MMS)', def: 'Share of all brand-CEP associations...' },
    { term: 'Mental Penetration (MPen%)', def: '% of buyers who associate...' },
  ]
}
```
Renders: **Bold term** with gray definition text below.

#### Type: `legend`
```javascript
{
  title: 'Color Coding',
  type: 'legend',
  items: [
    { color: '#2E7D32', label: 'Positive MA', desc: 'Brand outperforms expected share...' },
    { color: '#C62828', label: 'Negative MA', desc: 'Brand underperforms...' },
    // Also supports Tailwind classes: { color: 'bg-red-500', label: '...', desc: '...' }
  ]
}
```
Renders: Colored dot + bold label + smaller description.

#### Type: `colors`
```javascript
{
  title: 'Bar Colors',
  type: 'colors',
  items: [
    { color: '#94a3b8', label: 'CEP Incidence' },
    { color: '#F36B1F', label: 'Content Mix' },
  ]
}
```
Renders: Colored square + label (inline, wrapping).

### How Pages Register Their Guide

Every page registers its guide in a `useEffect`:

```javascript
import { useGuide } from '../components/GuideContext';
import { guides } from '../data/metricGuides';

// Inside your page component:
const { setCurrentGuide } = useGuide();
useEffect(() => {
  setCurrentGuide({
    sections: isDeepDive ? guides['/your-route'].deepDive : guides['/your-route'].overview
  });
  return () => setCurrentGuide(null);  // Clean up on unmount
}, [isDeepDive, setCurrentGuide]);
```

### What to Customize for a New Topic

1. **`src/data/metricGuides.js`** — Replace ALL metric definitions and legend items:
   - Change term names (e.g. "Mental Penetration" → "Distribution Reach")
   - Change definitions to match your framework
   - Update color legend descriptions
   - Add/remove sections as needed

2. **Page registration** — Update route keys to match your new routes

3. **No changes needed** to GuideContext, GuideButton, or GuidePanel — they're generic.

---

## 2. Report / Export System

### How It Works

User clicks "Generate Report" → navigates to `/report` page with URL params → Report page renders printable React components → User clicks "Save as PDF" → browser print dialog.

### Architecture

```
ExportButton dropdown → navigate('/report?scope=...&from=...')
          ↓
Report.jsx reads URL params → loads metrics
          ↓
Renders CoverSection + page-specific sections
          ↓
User clicks "Save as PDF" → window.print() → browser PDF dialog
```

### Files

| File | Role |
|---|---|
| `src/components/ExportButton.jsx` | Dropdown button with scope options + filter/deep-dive toggles |
| `src/pages/Report.jsx` | Report page: reads params, loads data, renders sections |
| `src/components/report/ReportPage.jsx` | Print-ready page wrapper (A4 landscape) |
| `src/components/report/ReportBrandTable.jsx` | Printable brand ranking table |
| `src/components/report/ReportHeroKPI.jsx` | Large KPI card for reports |
| `src/components/report/ReportInsightCard.jsx` | Narrative + highlights card |
| `src/components/report/ReportSegmentCard.jsx` | Segment breakdown card |
| `src/components/report/SectionGuide.jsx` | Inline guide for report pages |
| `src/components/report/sections/CoverSection.jsx` | Title/cover page |
| `src/components/report/sections/ExecOverviewSection.jsx` | Executive Summary section |
| `src/components/report/sections/CEPSection.jsx` | CEP section |
| `src/components/report/sections/MPenSection.jsx` | Mental Penetration section |
| `src/components/report/sections/NSSection.jsx` | Network Size section |
| `src/components/report/sections/MASection.jsx` | Mental Advantage section |
| `src/components/report/sections/SocialSection.jsx` | Social Listening section |
| `src/components/report/sections/HowToReadSection.jsx` | Methodology guide page |
| `src/lib/export/pdfGenerator.js` | jsPDF helpers (createDoc, addHeader, addTable, etc.) |
| `src/lib/export/pdfTheme.js` | PDF styling constants (colors, fonts, margins) |
| `src/components/export/ExportRenderer.jsx` | Browser print engine (alternative flow) |

### Export Scopes

| Button | URL Param | What Renders |
|---|---|---|
| Quick Summary | `scope=summary` | CoverSection only |
| This Page | `scope=page&from=/cep` | Cover + one section matching `from` route |
| Full Dashboard | `scope=full` | Cover + all 6 page sections |

### URL Parameters

| Param | Values | Effect |
|---|---|---|
| `scope` | `summary`, `page`, `full` | What to render |
| `from` | `/`, `/cep`, `/mpen`, etc. | Which page (for scope=page) |
| `unfiltered` | `1` | Use full-sample metrics (ignore active filters) |
| `nodeepdive` | `1` | Skip deep-dive detail pages |

### Props Passed to Every Section

```javascript
{
  metrics,           // Filtered or full-sample computeAllMetrics result
  filters,           // Active filter state (or empty if unfiltered)
  selectedBrands,    // Array of selected brand names (or [] for all)
  focusedBrand,      // Currently focused brand name
  activeBrands,      // Effective visible brand list
  includeDeepDive,   // Boolean — show detailed pages?
  data,              // Raw data (demographics, q23, etc.)
  totalRespondents,  // Number of respondents in sample
}
```

### How a Report Section Works (Example: ExecOverviewSection)

```javascript
export default function ExecOverviewSection({ metrics, focusedBrand, activeBrands, includeDeepDive }) {
  // 1. Extract focused brand metrics
  const mmsRow = metrics.mms.find(r => r.brand === focusedBrand);
  const mpenRow = metrics.mpen.find(r => r.brand === focusedBrand);

  // 2. Generate insight narrative
  const insight = generateBrandInsight(focusedBrand, metrics);

  // 3. Render printable pages
  return (
    <>
      <ReportPage title={`${focusedBrand} — Executive Overview`}>
        {/* KPI cards */}
        <ReportHeroKPI label="Market Share" value={pct(mmsRow.mms)} rank={mmsRow.rank} />
        {/* Brand table */}
        <ReportBrandTable columns={[...]} rows={[...]} focusedBrand={focusedBrand} />
      </ReportPage>

      {includeDeepDive && (
        <ReportPage title="Detailed Analysis">
          <ReportInsightCard title="Strategic Read" narrative={insight.narrative} />
        </ReportPage>
      )}
    </>
  );
}
```

### Print CSS (in Report.jsx)

- `@page { size: A4 landscape; margin: 10mm 15mm; }`
- `.report-page` gets `break-before: always` (except first)
- Background colors forced: `-webkit-print-color-adjust: exact`
- Control bar hidden in print

### What to Customize for a New Topic

1. **`src/components/report/sections/`** — Rewrite each section:
   - Change metric names, labels, descriptions
   - Adjust which KPIs are shown as ReportHeroKPI cards
   - Update table columns for your metrics
   - Update insight generation calls

2. **`src/components/report/sections/CoverSection.jsx`** — Update title, subtitle, branding

3. **`src/components/report/sections/HowToReadSection.jsx`** — Rewrite methodology guide

4. **`src/pages/Report.jsx`** — Update `PAGE_TO_SECTION` mapping if routes change

5. **`src/lib/export/pdfGenerator.js`** — Update footer text, filename prefix

6. **`src/components/ExportButton.jsx`** — No changes needed (generic)

7. **Reusable components** (no changes needed):
   - ReportPage, ReportHeroKPI, ReportBrandTable, ReportInsightCard, ReportSegmentCard

---

## 3. AI Chatbot System

### How It Works

Floating chat button → opens chat panel → user types question → system prompt with ALL metrics injected → sent to Groq LLM API → response rendered as markdown.

### Architecture

```
ChatButton (FAB) → toggles ChatPanel
          ↓
ChatPanel loads data → computes fullMetrics (always unfiltered)
          ↓
useChatbot hook builds system prompt with all metric data
          ↓
User sends message → POST /api/chat (messages array)
          ↓
Groq API (llama-3.3-70b-versatile) → response
          ↓
Response rendered as Markdown in chat bubble
```

### Files

| File | Role |
|---|---|
| `src/hooks/useChatbot.js` | Core hook: message state, system prompt builder, send function |
| `src/components/ChatButton.jsx` | Floating orange button (bottom-right) with unread badge |
| `src/components/ChatPanel.jsx` | Draggable chat drawer with message list + input |
| `vite.config.js` | Dev server middleware for `/api/chat` |
| `worker.js` | Cloudflare Worker for production `/api/chat` |

### System Prompt Structure

The system prompt is rebuilt on EVERY message send. It contains:

```
1. ROLE DEFINITION
   "You are an expert [topic] analyst embedded in the [platform] dashboard..."

2. FRAMEWORK DEFINITIONS
   - Each metric defined: what it measures, how to interpret
   - Key interpretation patterns (e.g. "High MPen + Low NS = reach without depth")

3. CEP/OCCASION LIST
   - All 14 category entry points with numbers

4. BRAND LIST
   - Dynamically generated from metrics data (alphabetical)

5. FILTER AWARENESS
   - Current dashboard filters shown (but AI told to use full-sample data)

6. FULL-SAMPLE METRICS (injected as text tables)
   --- Mental Market Share (ranked) ---
     1. Brand1: 15.3%
     2. Brand2: 14.1%

   --- Mental Penetration (ranked) ---
   --- Network Size (ranked) ---
   --- MPen by Segment ---
   --- NS by Segment ---
   --- Brand MA Aggregates ---
   --- Mental Advantage per Brand×CEP ---

7. SOCIAL LISTENING DATA (if available)
   - Brand scorecard (posts, breadth, avgSOV per brand)
   - Top RED gaps (high priority content gaps)
   - Top YELLOW gaps (demand gaps)

8. WHAT YOU CAN ANSWER (scope definition)
   - Factual, interpretive, forward-looking, methodology, competitive, social, cross-data

9. FORMAT RULES
   - How to display percentages, NS values, MA values, traffic lights
```

### Key Code: buildSystemPrompt()

```javascript
function buildSystemPrompt(metrics, filters, socialMetrics) {
  // 1. Build filter awareness section
  const filterLines = [
    filters.region?.length ? `Region: ${filters.region.join(', ')}` : null,
    // ... nationality, gender, ageGroup
  ].filter(Boolean);

  // 2. Format metric tables as text
  const mmsTable = metrics.mms
    .sort((a, b) => a.rank - b.rank)
    .map(r => `  ${r.rank}. ${r.brand}: ${pct(r.mms)}`)
    .join('\n');
  // ... same for mpen, ns, segments, MA, brandInsights

  // 3. Build social listening section
  const socialSection = buildSocialSection(socialMetrics);

  // 4. Combine into one massive string
  return `You are an expert...
    FRAMEWORK: ...
    THE 14 CEPs: ...
    THE ${brands.length} BRANDS: ${brandList}
    ${filtersSection}
    FULL-SAMPLE METRICS:
    ${mmsTable}
    ${mpenTable}
    ...
    ${socialSection}
    WHAT YOU CAN ANSWER: ...
    FORMAT RULES: ...`;
}
```

### Social Listening Section Builder

```javascript
function buildSocialSection(socialMetrics) {
  // Builds a text block with:
  // 1. Brand Scorecard (one line per brand):
  //    Brand: 2847 posts, breadth 11/14, avgSOV 8.3%, 2RED 3YEL 7GRN 2BLU 0GRY
  // 2. Top 15 RED gaps (sorted by incidence):
  //    Brand × CEP: incidence=35.2%, contentMix=8.1%, SOV=4.2%
  // 3. Top 10 YELLOW gaps
}
```

### API Endpoint

**Dev** (vite.config.js middleware):
```javascript
server.middlewares.use('/api/chat', async (req, res) => {
  const groq = new Groq({ apiKey: env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: req.body.messages,
    max_tokens: 1024,
  });
  res.end(JSON.stringify({ content: completion.choices[0].message.content }));
});
```

**Production** (worker.js — Cloudflare Worker):
```javascript
// Fetches Groq API directly via fetch()
const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${apiKey}` },
  body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, max_tokens: 1024 }),
});
```

### Message Flow

```
User types message
  → sendMessage(text) called
  → Build messages array:
      [
        { role: 'system', content: buildSystemPrompt(...) },  // ALL context
        { role: 'user', content: 'earlier question' },
        { role: 'assistant', content: 'earlier response' },
        { role: 'user', content: 'new question' }
      ]
  → POST /api/chat with { messages }
  → Groq returns { content: '...' }
  → Append to messages state
  → ChatPanel renders via ReactMarkdown
```

### Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `GROQ_API_KEY` | `.env.local` (dev) | API key for Groq LLM (starts with `gsk_`) |
| `GROQ_API_KEY` | Cloudflare Workers secret (prod) | Same key, set via `wrangler secret put GROQ_API_KEY` |

**Security**: API key NEVER reaches the browser. Server-side only (Vite middleware / Cloudflare Worker).

### What to Customize for a New Topic

#### Required Changes:

1. **`src/hooks/useChatbot.js`** — This is the MAIN file to customize:

   a. **WELCOME_MESSAGE** — Update greeting text:
   ```javascript
   export const WELCOME_MESSAGE = {
     id: 'welcome',
     role: 'assistant',
     content: "Hi! I can answer questions about Physical Availability data for these brands..."
   };
   ```

   b. **Role definition** — Change the opening line:
   ```javascript
   return `You are an expert Physical Availability analyst embedded in the Muhimma dashboard.
   This tool analyzes [N] brands in [country] using [your framework]...`
   ```

   c. **FRAMEWORK section** — Replace ALL metric definitions:
   ```
   - Distribution Reach: % of stores carrying the brand...
   - Shelf Space Index: Average shelf facings per store...
   // etc.
   ```

   d. **KEY INTERPRETATION PATTERNS** — Write new patterns for your metrics:
   ```
   - High Reach + High Shelf = dominant physical presence
   - High Reach + Low Shelf = listed but poorly merchandised
   // etc.
   ```

   e. **CEP/OCCASION LIST** — Replace with your category's buying situations

   f. **Metric table formatting** — Update to match your metric names and formats:
   ```javascript
   const reachTable = metrics.reach
     .sort((a, b) => a.rank - b.rank)
     .map(r => `  ${r.rank}. ${r.brand}: ${pct(r.reach)}`)
     .join('\n');
   ```

   g. **WHAT YOU CAN ANSWER** — Update scope of questions

   h. **FORMAT RULES** — Update display formats for your metrics

2. **`src/data/socialMetrics.js`** — If you have social listening data, update the `computeSocialMetrics()` function or remove the social section from the system prompt if not applicable.

3. **`worker.js`** + **`vite.config.js`** — No changes needed unless switching LLM provider.

4. **`src/components/ChatPanel.jsx`** — Update placeholder text:
   ```javascript
   placeholder="Ask about distribution, shelf space, availability..."
   ```

5. **`src/components/ChatButton.jsx`** — No changes needed (generic).

#### Optional: Change LLM Provider

To use a different LLM (e.g. Claude, OpenAI):
- **vite.config.js**: Replace Groq SDK with your provider's SDK
- **worker.js**: Replace Groq API URL with your provider's endpoint
- Update model name in both files
- Env var name can stay `GROQ_API_KEY` or rename to match provider

---

## Quick Reference: Files to Touch per Feature

### "How to Read" Guide
- [ ] `src/data/metricGuides.js` — ALL content (definitions, legends, colors)
- [ ] Page components — Update route keys in `setCurrentGuide`

### Report Export
- [ ] `src/components/report/sections/*.jsx` — ALL section content
- [ ] `src/components/report/sections/CoverSection.jsx` — Branding
- [ ] `src/components/report/sections/HowToReadSection.jsx` — Methodology
- [ ] `src/lib/export/pdfGenerator.js` — Footer text, filename
- [ ] `src/pages/Report.jsx` — Route mappings (if routes change)

### Chatbot
- [ ] `src/hooks/useChatbot.js` — System prompt (this is 90% of the work)
- [ ] `src/components/ChatPanel.jsx` — Placeholder text
- [ ] `.env.local` — API key
- [ ] `worker.js` — Production API key (via wrangler secret)

### Shared Dependencies (no changes needed)
- `src/components/GuideContext.jsx`
- `src/components/GuideButton.jsx`
- `src/components/GuidePanel.jsx`
- `src/components/ChatButton.jsx`
- `src/components/report/ReportPage.jsx`
- `src/components/report/ReportHeroKPI.jsx`
- `src/components/report/ReportBrandTable.jsx`
- `src/components/report/ReportInsightCard.jsx`
- `src/components/export/ExportRenderer.jsx`
- `src/hooks/useDraggable.js`
