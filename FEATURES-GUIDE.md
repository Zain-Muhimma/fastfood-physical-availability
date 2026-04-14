# Feature Implementation Guide: Top-Right Buttons + Dock/Undock Panels + Chatbot + Report Export

> Complete guide for replicating these features in a new dashboard.

---

## 0. Top-Right Action Buttons (TopBar)

### How It Works

Three action buttons sit in the top-right corner of the TopBar: **HOW TO READ** (blue outline), **GENERATE REPORT** (filled orange), **RESET** (orange outline). These are always visible on every page.

### Implementation

**File: `src/components/TopBar.jsx`**

```jsx
import { ArrowCounterClockwise, Info, FileArrowDown } from '@phosphor-icons/react';
import BrandFilter from './BrandFilter.jsx';
import DemographicFilters from './DemographicFilters.jsx';
import ExportButton from './ExportButton.jsx';
import { useFilters, useGuide } from '../data/dataLoader.jsx';

const TopBar = () => {
  const { setFocusedBrand, defaultBrand, setActiveSegment } = useFilters();
  const { guideOpen, setGuideOpen, currentGuide } = useGuide();

  const handleReset = () => {
    setFocusedBrand(defaultBrand);
    setActiveSegment('Total');
  };

  return (
    <header className="bg-card border-b border-gray-200 px-6 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <BrandFilter />
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* HOW TO READ — blue outline, opens guide panel */}
          {currentGuide && (
            <button
              onClick={() => setGuideOpen(!guideOpen)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-blue-info text-blue-info text-[12px] font-bold uppercase tracking-wide hover:bg-blue-50 transition-colors"
            >
              <Info size={16} weight="fill" />
              How to Read
            </button>
          )}

          {/* GENERATE REPORT — filled orange, dropdown */}
          <ExportButton />

          {/* RESET — orange outline */}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-orange-primary text-orange-primary text-[12px] font-bold uppercase tracking-wide hover:bg-orange-light transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
      <DemographicFilters />
    </header>
  );
};
```

### Button Styles

| Button | Style | Behavior |
|--------|-------|----------|
| HOW TO READ | `border-2 border-blue-info text-blue-info` (outline, blue `#1565C0`) | Toggles `guideOpen` via `useGuide()`. Only visible when `currentGuide` is registered by a page. |
| GENERATE REPORT | `bg-orange-primary text-white` (filled, `#F36B1F`) | Opens dropdown with "Quick Summary" and "Full Report" options. Navigates to `/report?scope=...` |
| RESET | `border-2 border-orange-primary text-orange-primary` (outline, orange) | Resets `focusedBrand` to default and `activeSegment` to 'Total'. Always visible. |

### Color Tokens (from `tailwind.config.js`)

| Token | Hex | Usage |
|-------|-----|-------|
| `orange-primary` | `#F36B1F` | Primary CTA, focused brand highlight, presence dimension |
| `orange-hover` | `#E05E15` | Hover state for orange buttons |
| `orange-light` | `#FEF0E7` | Light orange backgrounds |
| `blue-info` | `#1565C0` | How to Read button, info accents |
| `text-primary` | `#3B3B3B` | Main body text |
| `text-secondary` | `#5A5A5A` | Muted/secondary text |

---

## 1. "How to Read" Guide System (with Dock/Undock)

### Architecture

```
TopBar "HOW TO READ" button  →  toggles guideOpen
                                     ↓
Page mounts  →  registers sections via setCurrentGuide()
                                     ↓
GuidePanel renders  →  dockable/undockable panel
```

### The Two Floating Buttons (Bottom-Right Corner)

Both buttons are rendered **OUTSIDE** the main layout `<div>` in `App.jsx` — this is critical because the main content has `overflow-hidden`, which would clip fixed elements.

```
Bottom-right corner stack:
┌──────────────────┐
│  Guide Button    │  ← fixed, bottom: 96px, right: 24px (blue circle, Info icon)
│  (How to Read)   │
├──────────────────┤
│  Chat Button     │  ← fixed, bottom: 24px, right: 24px (orange circle, Chat icon)
│  (Ask the Data)  │
└──────────────────┘
```

**Guide button**: `bottom: 96px` — sits ABOVE the chat button
**Chat button**: `bottom: 24px` — sits at the very bottom
**Both**: `right: 24px`, `z-50`, `w-14 h-14` (56px circle)

### Files

| File | Role |
|---|---|
| `src/data/dataLoader.jsx` | GuideProvider context: `currentGuide`, `guideOpen`, `setCurrentGuide`, `setGuideOpen` |
| `src/components/GuideButton.jsx` | Floating blue circle button (bottom-right, above chat) |
| `src/components/GuidePanel.jsx` | Dockable panel with dock/undock toggle |
| `src/hooks/useDraggable.js` | Shared hook for dock/undock + drag behavior |
| `src/data/metricGuides.js` | All guide content organized by route |

### The Hook: useDraggable(initialPos)

**`src/hooks/useDraggable.js`** — shared by both Guide and Chat panels.

```javascript
import { useState, useCallback, useEffect, useRef } from 'react';

export default function useDraggable(initialPos = { x: 400, y: 100 }) {
  const [pos, setPos] = useState(initialPos);
  const [dragging, setDragging] = useState(false);
  const [docked, setDocked] = useState(true);
  const offset = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback((e) => {
    if (docked) return; // Can't drag when docked
    if (e.target.closest('button, input, textarea, select, a')) return;
    setDragging(true);
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  }, [docked, pos]);

  const toggleDock = useCallback(() => {
    setDocked(prev => {
      if (!prev) setPos(initialPos); // Reset position on dock
      return !prev;
    });
  }, [initialPos]);

  // Mouse move/up listeners while dragging
  useEffect(() => { /* ... mousemove/mouseup handlers ... */ }, [dragging]);

  return { pos, onMouseDown, dragging, docked, toggleDock };
}
```

**State it manages:**

| Property | Type | Purpose |
|---|---|---|
| `pos` | `{x, y}` | Current panel position (pixels from top-left) |
| `dragging` | `boolean` | Is user currently dragging? |
| `docked` | `boolean` | Is panel pinned to default position? (starts `true`) |
| `onMouseDown` | `function` | Attach to header's `onMouseDown` — starts drag |
| `toggleDock` | `function` | Switches between docked/undocked |

### How Panels Use the Dock/Undock System

Both panels follow the same pattern:

```jsx
import { X, DotsSixVertical, ArrowsOutCardinal, PushPin } from '@phosphor-icons/react';
import useDraggable from '../hooks/useDraggable';

export default function MyPanel({ isOpen, onClose }) {
  const { pos, onMouseDown, dragging, docked, toggleDock } = useDraggable({
    x: typeof window !== 'undefined' ? window.innerWidth - 444 : 400,
    y: typeof window !== 'undefined' ? Math.max(window.innerHeight - 700, 60) : 100,
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed z-50 w-[min(380px,90vw)] max-h-[min(500px,70vh)] bg-white rounded-card flex flex-col overflow-hidden"
      style={docked
        ? { bottom: '164px', right: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }
        : { left: pos.x, top: pos.y, boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            userSelect: dragging ? 'none' : undefined }
      }
    >
      {/* Header — drag handle */}
      <div
        className={`px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between select-none ${docked ? '' : 'cursor-move'}`}
        onMouseDown={onMouseDown}
      >
        <div className="flex items-center gap-2">
          {!docked && <DotsSixVertical size={14} weight="bold" className="text-gray-400" />}
          <span className="text-[13px] font-bold text-text-primary">Panel Title</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Dock/Undock toggle */}
          <button
            onClick={toggleDock}
            title={docked ? 'Undock to move freely' : 'Dock to default position'}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
              docked
                ? 'text-gray-400 hover:text-orange-primary hover:bg-orange-light'
                : 'text-orange-primary bg-orange-light hover:bg-orange-200'
            }`}
            onMouseDown={e => e.stopPropagation()}
          >
            {docked ? <ArrowsOutCardinal size={14} weight="bold" /> : <PushPin size={14} weight="bold" />}
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-text-primary hover:bg-gray-100 transition-colors"
            onMouseDown={e => e.stopPropagation()}
          >
            <X size={15} weight="bold" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Your content here */}
      </div>
    </div>
  );
}
```

**Key detail**: The dock/undock button has `onMouseDown={e => e.stopPropagation()}` — this prevents clicking the button from starting a drag.

### Visual States

| State | Position | Cursor | Drag Dots | Dock Button Icon |
|-------|----------|--------|-----------|------------------|
| **Docked** | CSS `bottom/right` | Default | Hidden | `ArrowsOutCardinal` (undock me) |
| **Undocked** | `left: pos.x, top: pos.y` | `cursor-move` | Visible `DotsSixVertical` | `PushPin` (dock me back) |

### Guide Content Data Structure

**`src/data/metricGuides.js`**

```javascript
export const guides = {
  '/': {
    title: 'Executive Summary',
    sections: [
      {
        title: 'Three Dimensions',
        type: 'definitions',    // Bold term + gray definition
        items: [
          { term: 'Presence Score', def: 'Equal to the Ease of Access score...' },
        ],
      },
      {
        title: 'Dimension Colors',
        type: 'legend',         // Colored dot + bold label + description
        items: [
          { color: '#F36B1F', label: 'Presence', desc: 'Orange — Ease of Access' },
          { color: '#FDB55B', label: 'Prominence', desc: 'Golden — Positive Standout' },
          { color: '#707070', label: 'Portfolio', desc: 'Grey — Range Coverage' },
        ],
      },
      {
        title: 'Bar Colors',
        type: 'colors',         // Colored square + label (inline)
        items: [
          { color: '#F36B1F', label: 'Focused Brand' },
          { color: '#D1D5DB', label: 'Other Brands' },
        ],
      },
    ],
  },
  '/your-route': { ... },
};
```

**Three section types**: `definitions`, `legend`, `colors`

### How Pages Register Their Guide

```javascript
import { useGuide } from '../data/dataLoader.jsx';
import { guides } from '../data/metricGuides.js';

const { setCurrentGuide } = useGuide();
useEffect(() => {
  setCurrentGuide({ sections: guides['/your-route'].sections });
  return () => setCurrentGuide(null);
}, [setCurrentGuide]);
```

### Mounting in App.jsx

```jsx
function AppShell() {
  return (
    <>
      <div className="flex h-screen bg-page">
        {/* Sidebar + Main content */}
      </div>
      {/* OUTSIDE overflow-hidden div */}
      <GuideButton />
      <GuidePanel />
      <ChatWidget />
    </>
  );
}
```

### Stacking Multiple Buttons

| Button | Bottom | Purpose |
|--------|--------|---------|
| Chat | 24px | Primary floating button |
| Guide | 96px | Secondary (24 + 56 button + 16 gap) |
| Button 3 | 168px | Add another 72px per button |

Each panel's docked `bottom` should be its button's bottom + ~68px.

---

## 2. AI Chatbot System (with Dock/Undock)

### Files

| File | Role |
|---|---|
| `src/hooks/useChatbot.js` | Core hook: message state, system prompt builder, send function |
| `src/components/ChatButton.jsx` | Floating orange FAB (bottom: 24px, right: 24px) |
| `src/components/ChatPanel.jsx` | `ChatWidget` — self-contained component with button + dockable panel |
| `vite.config.js` | Dev server `/api/chat` middleware |
| `functions/api/chat.js` | Cloudflare Pages Function for production |

### ChatButton

```jsx
import { ChatCircle } from '@phosphor-icons/react';

export default function ChatButton({ onClick, unreadCount = 0 }) {
  return (
    <button
      onClick={onClick}
      className="z-50 w-14 h-14 rounded-full bg-orange-primary flex items-center justify-center transition-transform duration-200 hover:scale-110"
      style={{ position: 'fixed', bottom: '24px', right: '24px', boxShadow: '0 4px 12px rgba(243,107,31,0.45)' }}
    >
      <ChatCircle size={22} weight="fill" color="white" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
```

### ChatPanel (ChatWidget)

The `ChatWidget` component manages its own open/close state and renders both the button and the dockable panel. Uses `useDraggable` for dock/undock.

```jsx
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { pos, onMouseDown, dragging, docked, toggleDock } = useDraggable({...});

  return (
    <>
      {!open && <ChatButton onClick={() => setOpen(true)} />}
      {open && (
        <div
          className="fixed z-50 w-[min(400px,90vw)] h-[min(560px,75vh)] bg-white rounded-card flex flex-col"
          style={docked
            ? { bottom: '96px', right: '24px', boxShadow: '...' }
            : { left: pos.x, top: pos.y, boxShadow: '...' }
          }
        >
          {/* Header with dock/undock + close + clear */}
          {/* Message list with ReactMarkdown rendering */}
          {/* Input field with send button */}
        </div>
      )}
    </>
  );
}
```

### API Endpoint

**Dev** (`vite.config.js` middleware):
```javascript
// Uses fetch() to call Groq API directly
const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, max_tokens: 1024 }),
});
```

**Production** (`functions/api/chat.js` — Cloudflare Pages Function):
```javascript
export async function onRequestPost(context) {
  const { messages } = await context.request.json();
  const apiKey = context.env.GROQ_API_KEY;
  // Same fetch to Groq API
}
```

### Environment Variables

| Variable | Dev | Production |
|---|---|---|
| `GROQ_API_KEY` | `.env.local` file | Cloudflare Dashboard → Settings → Environment Variables (Secret/Encrypted) |

---

## 3. Report / Export System

### ExportButton (Top-Right, filled orange)

```jsx
const ExportButton = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-primary text-white text-[12px] font-bold uppercase tracking-wide hover:bg-orange-hover transition-colors"
      >
        <FileArrowDown size={16} weight="bold" />
        Generate Report
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-white rounded-card shadow-lg border z-50 min-w-[160px]">
          <button onClick={() => navigate('/report?scope=summary')}>Quick Summary</button>
          <button onClick={() => navigate('/report?scope=full')}>Full Report</button>
        </div>
      )}
    </div>
  );
};
```

### Report Page

Renders printable sections with A4 landscape print CSS:
```css
@media print {
  @page { size: A4 landscape; margin: 10mm 15mm; }
  .no-print { display: none !important; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
```

---

## 4. Dimension Color System

Use these colors consistently across ALL charts, bars, legends:

| Dimension | Hex | Tailwind | Usage |
|-----------|-----|----------|-------|
| Presence | `#F36B1F` | `bg-orange-primary` | Ease of Access bars, KPI cards, legends |
| Prominence | `#FDB55B` | custom | Positive Standout bars, KPI cards, legends |
| Portfolio | `#707070` | custom | Range Coverage bars, KPI cards, legends |

---

## Quick Reference: Files to Copy per Feature

### Top-Right Buttons
- [ ] `src/components/TopBar.jsx` — Button layout + HOW TO READ + GENERATE REPORT + RESET
- [ ] `src/components/ExportButton.jsx` — Dropdown export button

### "How to Read" Guide (with Dock/Undock)
- [ ] `src/hooks/useDraggable.js` — Dock/undock + drag hook (shared)
- [ ] `src/components/GuideButton.jsx` — Blue floating FAB
- [ ] `src/components/GuidePanel.jsx` — Dockable guide panel
- [ ] `src/data/metricGuides.js` — ALL guide content (customize per topic)
- [ ] Page components — `setCurrentGuide()` registration in each page

### Chatbot (with Dock/Undock)
- [ ] `src/hooks/useChatbot.js` — System prompt builder (customize per topic)
- [ ] `src/components/ChatButton.jsx` — Orange floating FAB
- [ ] `src/components/ChatPanel.jsx` — Dockable chat panel with ReactMarkdown
- [ ] `vite.config.js` — Dev API middleware
- [ ] `functions/api/chat.js` — Production Cloudflare Pages Function
- [ ] `.env.local` — `GROQ_API_KEY`

### Report Export
- [ ] `src/components/ExportButton.jsx` — Dropdown button
- [ ] `src/pages/Report.jsx` — Report page with print CSS
- [ ] `src/components/report/*.jsx` — Report section components

### Shared Dependencies (copy as-is)
- `src/hooks/useDraggable.js`
- `@phosphor-icons/react` (npm dependency)
- `react-markdown` (npm dependency for chatbot)
- `groq-sdk` (npm dependency for chatbot)
