# Chomsky Hierarchy Explorer

An interactive, browser-based educational tool for exploring the Chomsky Hierarchy of formal languages — built with vanilla HTML, CSS, and JavaScript. No frameworks or build tools required.

---

## Overview

The Chomsky Hierarchy classifies formal languages into four nested types based on the computational power needed to recognize them:

| Type | Class | Automaton |
|------|-------|-----------|
| Type 3 | Regular | Deterministic Finite Automaton (DFA) |
| Type 2 | Context-Free | Pushdown Automaton (PDA) |
| Type 1 | Context-Sensitive | Linear Bounded Automaton (LBA) |
| Type 0 | Recursively Enumerable | Turing Machine (TM) |

The app presents this theory through five interactive tabs, each offering a different way to engage with the material.

---

## Features

### ◈ Diagram Tab
An interactive Venn diagram showing the four language classes as nested rings. Click any ring to open a slide-in panel with:
- Formal grammar production rules
- A plain-English definition
- Canonical language examples
- The corresponding automaton type
- An animated automaton simulation

### ⟳ Simulate Tab
A language classifier with a symbol keyboard and preset dropdown. Type or build a formal language expression, press **Classify**, and receive:
- The tightest Chomsky type that accepts the input
- A step-by-step breakdown of how each type's automaton handles it
- Inline SVG diagrams for each automaton step
- Click-to-expand modal automaton animations

### ⚡ Playground Tab
A free-form workspace for experimenting with language patterns, custom input strings, and automaton behavior.

### ⇄ Compare Tab
A side-by-side comparison table for any two Chomsky types. Select two types from the dropdowns to compare properties such as closure properties, decidability, grammar form, and automaton model.

### ⚖️ Courtroom Tab
A mock trial game. Each case puts a formal language on trial. Watch the prosecution and defense argue, then cast your verdict — is the language Regular, Context-Free, Context-Sensitive, or Recursively Enumerable? Score points for correct verdicts. Includes:
- Typing-indicator animations between arguments
- "OBJECTION!" flash and screen shake effects
- Gavel drop and stamp animation on verdict reveal

---

## File Structure

```
├── index.html            # Main HTML shell; all tabs and nav defined here
├── style.css             # Global styles, CSS variables, layout, all tab styling
├── courtroom_style.css   # Styles specific to the Courtroom tab and its animations
├── app.js                # Tab switching logic and top-level DOMContentLoaded bootstrap
├── data.js               # Single source of truth — CHOMSKY_DATA and SIM_RULES arrays
├── classify.js           # Language classifier engine (pure logic, no DOM)
├── simulate.js           # Simulate tab — keyboard input, display, calls classify.js
├── venn.js               # Venn diagram rendering and automaton diagram/modal builders
├── compare.js            # Compare tab — renders the side-by-side property table
├── playground.js         # Playground tab logic
└── courtroom.js          # Courtroom game — docket, trial flow, voting, verdict
```

---

## How It Works

### Classification Logic (`classify.js`)

Input is normalized into two forms:

- **`text`** — lowercased, used for natural-language keyword matching (e.g. `"equal number of a's and b's"`)
- **`sym`** — compact symbolic form with all superscripts and whitespace collapsed (e.g. `aⁿbⁿcⁿ` → `anbncn`)

Classification runs top-down from most restrictive to least:

```
RE → Context-Sensitive → Context-Free → Regular
```

This ordering is critical. Without it, a CS language like `aⁿbⁿcⁿ` could be prematurely matched by the CF rule for `aⁿbⁿ`.

The `analyzeDependencies()` function inspects the exponent variable sequence in a symbolic expression to detect whether the pattern requires crossing dependencies (CS), nested/sequential pairs (CF), or independent variables (Regular).

### Data (`data.js`)

All language definitions and classification rules live in two objects:

- **`CHOMSKY_DATA`** — definitions, examples, grammar rules, and automaton descriptions for each of the four types; consumed by the Diagram tab info panel and the Simulate tab verdict display.
- **`SIM_RULES`** — an array of pattern-matched rules, each with a `type`, `patterns[]` array, and a `steps[]` array that drives the step-by-step Simulate tab breakdown.

### Courtroom Game (`courtroom.js`)

Six pre-authored cases (e.g. `aⁿbⁿcⁿ`, `ww`, Halting Problem) each contain a scripted exchange of prosecution and defense arguments plus the authoritative verdict text. The game tracks a running score across trials. The `initCourtroom()` function is lazily called the first time the tab is visited (see `app.js`).

---

## Getting Started

No installation or build step needed. Just open `index.html` in any modern browser:

```bash
# Option 1 — open directly
open index.html

# Option 2 — serve locally (avoids any file:// quirks)
npx serve .
# or
python3 -m http.server 8080
```

All dependencies are loaded from Google Fonts CDN (Outfit, JetBrains Mono). The app works fully offline if fonts have been cached.

---

## Browser Support

Tested in modern Chromium and Firefox. Requires support for CSS custom properties, CSS Grid/Flexbox, and standard ES6+ JavaScript. No polyfills are included.

---

## Extending the App

**Adding a new Courtroom case:** Add an entry to the `COURT_CASES` array in `courtroom.js` following the existing schema (`id`, `title`, `language`, `trueType`, `arguments[]`, `verdict`).

**Adding a new classifiable language:** Add an entry to `SIM_RULES` in `data.js` with the appropriate `type`, `patterns[]`, and `steps[]`. The classifier in `classify.js` will pick it up automatically via pattern matching.

**Adding a new Compare row:** Append to the `CMP_ROWS` array in `data.js` (or wherever it is defined for your build) with a `prop` key and values for `reg`, `cf`, `cs`, and `re`.
