# ZealCanvas

*Frontend Product Requirements Document*

Version 1.0 | April 2026 | Confidential

No-Code Form Builder — World Class UX

*Inspired by Tally.so · Typeform · Notion · Linear*

---

## 1. Product Overview

### 1.1 Problem Statement

Building forms today is unnecessarily complex, slow, or ugly. Legacy tools like Google Forms lack design quality; enterprise tools like JotForm are bloated with features that overwhelm non-technical users. Typeform and Tally.so changed the game by putting UX first — but each has gaps in real-time collaboration, schema portability, and conditional logic flexibility.

ZealCanvas fills this void: a schema-driven, collaboration-first form builder that delivers a premium, minimal UX without sacrificing power for advanced users.

### 1.2 Target Users

| **User Persona** | **Primary Use Case** |
|---|---|
| Product Managers | Build NPS surveys, feedback forms, product research forms |
| Startup Founders | Customer discovery, waitlist registration, intake forms |
| Designers & Agencies | Client onboarding, brand questionnaires, project briefs |
| HR & Operations | Job application forms, employee surveys, event registration |
| Developers | Embed schema-driven forms in their own products via JSON export |

### 1.3 Design Philosophy

> **Design Manifesto**
>
> Every pixel must earn its place. ZealCanvas is designed with the conviction that removing friction, clutter, and cognitive load is itself a feature. The product should feel like a premium notebook — clean, structured, and inviting.

- **Minimal over maximal:** surfaces only what is needed at the right moment
- **Typography-first:** Inter or Geist as the system font; generous line-height, clean hierarchy
- **Whitespace as structure:** spacing defines relationships, not borders or cards
- **Micro-interactions:** subtle, purposeful — not decorative
- **Progressive disclosure:** advanced settings hidden until needed

---

## 2. User Flows

### 2.1 Creating a Form

1. User lands on the Dashboard (`/dashboard`). Clicks "New Form".
2. A modal prompts for a form title (inline editable, auto-focused, placeholder: "Untitled form").
3. User is routed to the Workshop (builder) at `/builder/:formId`.
4. An empty canvas is shown with a centered "+" Add field button and keyboard shortcut hint.
5. User clicks "+" or presses `/` to open the Field Picker popover.
6. User selects a field type. The field appears in the canvas with inline label editing activated.
7. User can drag-and-drop to reorder fields. A blue insertion line indicator appears during drag.
8. Form auto-saves to local state (debounced 500ms); a "Saved" indicator appears in the top bar.
9. User clicks "Preview" to open Stage in a side panel or new tab.
10. User clicks "Publish" to generate a public URL and copy-to-clipboard confirmation toast.

### 2.2 Editing a Form

1. User navigates to an existing form from the Dashboard.
2. The Workshop loads the persisted JSON schema and rehydrates all fields.
3. Clicking any field opens the Config Panel on the right with field-specific options.
4. Changes are reflected instantly in the canvas (optimistic UI); schema updates are debounced.
5. Undo (`Cmd+Z`) and Redo (`Cmd+Shift+Z`) are available across all schema mutations.
6. If collaborators are present, their remote cursors are shown as colored avatar indicators.

### 2.3 Filling a Form (Respondent Flow)

1. Respondent opens the public form URL (`/f/:formId`).
2. The Stage renders fields one-at-a-time (Typeform-mode) or all-at-once (Classic-mode) based on form settings.
3. Each field validates on blur; errors appear inline with a subtle shake animation.
4. Conditional logic evaluates in real-time: dependent fields appear/disappear with fade transitions.
5. On final submit, a customizable thank-you screen is shown.
6. All responses are stored and appear in the Vault dashboard.

### 2.4 Viewing Responses

1. User navigates to the Vault (`/vault/:formId`).
2. A paginated table lists all submissions with timestamps and field values.
3. User can filter by date range, search by content, or toggle columns.
4. Export buttons for CSV and JSON are available in the top-right toolbar.

---

## 3. UI/UX Breakdown

### 3.1 Workshop — Builder Layout

The builder is a three-panel layout with proportional widths:

| **Panel** | **Purpose & Behavior** |
|---|---|
| Left Sidebar (240px) | Navigation, form pages (if multi-page), and a compact field palette. Collapses to 48px icon rail on smaller screens. |
| Center Canvas (flex-grow) | The main editing surface. Fields are rendered as interactive cards in natural document flow. Drag handles appear on hover. |
| Right Config Panel (320px) | Contextually appears when a field is selected. Shows label, placeholder, required toggle, validation rules, and conditional logic trigger. Slides in from right with a 200ms ease-out transition. |

**Top Navigation Bar**

- **Left:** ZealCanvas logo (links to Dashboard), form title (inline editable), save status indicator ("Saving..." / "Saved ✓" / "Unsaved changes")
- **Center:** Workshop | Preview | Logic | Theme tabs
- **Right:** Collaborator avatars, Share button, Publish button (primary CTA, indigo fill)

### 3.2 Component Hierarchy

```
App
├── Router
│   ├── Dashboard (/)
│   ├── Workshop (/builder/:id)
│   │   ├── TopBar
│   │   ├── LeftSidebar
│   │   ├── Canvas
│   │   │   ├── FieldCard (×N)
│   │   │   └── AddFieldButton
│   │   └── ConfigPanel
│   ├── Stage (/f/:id)
│   │   ├── FormRenderer
│   │   └── ThankYouScreen
│   └── Vault (/vault/:id)
│       ├── ResponseTable
│       └── ExportToolbar
├── GlobalModals
└── ToastProvider
```

### 3.3 Interaction Patterns

| **Interaction** | **Pattern** |
|---|---|
| Field selection | Click → highlight with 2px indigo left border, expand Config Panel |
| Field reordering | Drag handle (appears on hover, ⠿ icon) + dnd-kit sortable |
| Field type change | Dropdown in Config Panel with type icons — warns if data is incompatible |
| Delete field | Hover → red trash icon → confirm with Undo toast (5s countdown) |
| Conditional logic | Logic tab in Config Panel — rule builder with IF/THEN dropdowns |
| Keyboard nav | `/` to open field picker, `Tab` to move between fields, `Escape` to deselect |

### 3.4 Minimal Design Maintenance

- **Color palette:** Maximum 3 brand colors (Indigo-600 as primary, Violet-600 as secondary, Gray-900 for text). All other colors are neutral grays.
- **Iconography:** Lucide icons only — consistent stroke weight, no fills
- **Spacing scale:** 4px base unit (0.5, 1, 1.5, 2, 3, 4, 6, 8 rem tokens)
- **Borders:** Used sparingly — 1px gray-200, never decorative
- **Shadows:** One system shadow only (`sm: 0 1px 3px rgba(0,0,0,0.08)`) — used only for floating panels
- **Animations:** 150–250ms duration only, ease-out curves, never looping

---

## 4. State Management Design

### 4.1 Global vs Local State

| **State Category** | **Location & Tool** |
|---|---|
| Form schema (fields, logic, theme) | Zustand global store — `formStore` |
| UI state (selected field, panel open) | Zustand UI store — `uiStore` (ephemeral) |
| Undo/Redo history stack | Middleware on `formStore` (Immer + custom history) |
| Collaboration cursors | React context fed by WebSocket listener |
| Server data (forms list, responses) | TanStack Query — fetched, cached, synced |
| Form renderer state | Local React state (`useReducer` per form) |
| Toast / modal state | Lightweight Zustand slice |

### 4.2 Schema Structure

The form schema is the single source of truth. Everything — rendering, validation, logic — derives from it.

```json
{
  "id": "form_abc123",
  "title": "Customer Feedback Survey",
  "version": 2,
  "settings": {
    "mode": "typeform" | "classic",
    "showProgressBar": true,
    "submitLabel": "Submit",
    "thankYouMessage": "Thank you!"
  },
  "theme": {
    "preset": "minimal" | "dark" | "brand",
    "primaryColor": "#4F46E5",
    "fontFamily": "Inter",
    "customCSS": ""
  },
  "fields": [ <FieldSchema[]> ],
  "logicRules": [ <LogicRule[]> ]
}
```

**FieldSchema Definition**

```json
{
  "id": "field_xyz",
  "type": "text" | "email" | "number" | "dropdown"
         | "multiselect" | "date" | "daterange" | "file",
  "label": "What is your name?",
  "placeholder": "Type your answer...",
  "required": true,
  "order": 0,
  "validation": {
    "minLength": 2,
    "maxLength": 100,
    "pattern": "^[a-zA-Z ]+$",
    "min": null, /* for number */
    "max": null
  },
  "options": [ /* for dropdown / multiselect */
    { "id": "opt_1", "label": "Option A", "value": "a" }
  ],
  "meta": {
    "description": "", /* helper text below field */
    "hidden": false,   /* hidden by default unless logic shows it */
    "width": "full" | "half"
  }
}
```

**LogicRule Definition**

```json
{
  "id": "rule_001",
  "conditions": [
    { "fieldId": "field_xyz", "operator": "equals", "value": "yes" }
  ],
  "conditionOperator": "AND" | "OR",
  "action": {
    "type": "show" | "hide" | "require" | "skip_to",
    "targetFieldId": "field_abc"
  }
}
```

### 4.3 Undo/Redo Strategy

Implemented as an immutable history stack alongside the main Zustand store using Immer for structural sharing:

- Every schema mutation produces a new immutable state snapshot via Immer
- A history array stores up to 100 past snapshots; pointer tracks current position
- `Cmd+Z` moves pointer backward (undo); `Cmd+Shift+Z` moves forward (redo)
- Mutations from remote collaborators are **not** added to local history (they are applied directly)
- Volatile UI changes (panel open/close, hover state) do not create history entries

### 4.4 Real-time Sync Considerations

- WebSocket connection is established on entering the Workshop
- All local mutations are broadcast as operation deltas (not full schema) in JSON Patch format (RFC 6902)
- Incoming remote patches are applied via `fast-json-patch` before triggering React re-renders
- **Conflict resolution:** Last-Write-Wins (LWW) per field property with field-level locking when a user is actively editing a field
- **Reconnection:** exponential backoff with optimistic local state preserved; on reconnect, a full schema sync is requested

---

## 5. Component Architecture

| **Component** | **Responsibility** |
|---|---|
| `<Canvas />` | The sortable drag-and-drop surface. Uses dnd-kit's `SortableContext`. Renders `FieldCard` for each field in order. |
| `<FieldCard />` | A single field representation on the canvas. Shows label, type icon, drag handle, delete button. Calls `uiStore.selectField` on click. |
| `<ConfigPanel />` | Right drawer with tabs: Settings, Validation, Logic. Reads `selectedFieldId` from `uiStore` and the field from `formStore`. |
| `<FieldPicker />` | Popover/modal with a grid of field type options. Keyboard navigable. Triggers `schema.addField` action on selection. |
| `<FormRenderer />` | Stage component. Reads the JSON schema and renders appropriate input components. Manages local form answer state. |
| `<LogicEngine />` | Pure utility (not a React component). Evaluates `logicRules` against current answer state. Returns a visibility map. |
| `<ResponseTable />` | Vault component. Virtualized table (TanStack Virtual) for large response sets. Supports column sorting and filtering. |
| `<ThemeProvider />` | Injects CSS custom properties from the schema's theme object into the document root. Instant re-render on change. |
| `<CollabCursors />` | Absolutely positioned overlay showing remote user cursor positions as colored avatar chips. |
| `<UndoToast />` | Appears after destructive actions (field delete). Countdown progress bar. Calls `undo()` if clicked within 5s. |

---

## 6. Schema Design

### 6.1 Extensibility Principles

- New field types are registered in a `fieldRegistry` map — the renderer and builder discover them automatically
- Validation rules are defined per-type in the registry with a Zod schema — no hard-coded switch statements
- Logic operators are also registered — adding "contains" or "starts_with" operators requires zero renderer changes
- Theme tokens are CSS custom properties — themes are simple JSON objects mapped to CSS vars, never hard-coded

### 6.2 Complete Example Schema

```json
{
  "id": "form_demo_001",
  "title": "Product Feedback",
  "version": 3,
  "settings": {
    "mode": "typeform",
    "showProgressBar": true,
    "submitLabel": "Send Feedback",
    "thankYouMessage": "We appreciate your feedback!"
  },
  "theme": {
    "preset": "minimal",
    "primaryColor": "#4F46E5",
    "fontFamily": "Inter",
    "customCSS": ""
  },
  "fields": [
    {
      "id": "f1", "type": "text", "order": 0,
      "label": "What is your name?",
      "placeholder": "Your full name",
      "required": true,
      "validation": { "minLength": 2, "maxLength": 80 },
      "meta": { "hidden": false, "width": "full" }
    },
    {
      "id": "f2", "type": "dropdown", "order": 1,
      "label": "How did you hear about us?",
      "required": false,
      "options": [
        { "id": "o1", "label": "Social Media", "value": "social" },
        { "id": "o2", "label": "Friend", "value": "friend" },
        { "id": "o3", "label": "Search Engine", "value": "search" }
      ],
      "meta": { "hidden": false, "width": "full" }
    },
    {
      "id": "f3", "type": "text", "order": 2,
      "label": "Which platform? (Social only)",
      "required": false,
      "validation": {},
      "meta": { "hidden": true, "width": "full" }
    }
  ],
  "logicRules": [
    {
      "id": "rule_01",
      "conditions": [
        { "fieldId": "f2", "operator": "equals", "value": "social" }
      ],
      "conditionOperator": "AND",
      "action": { "type": "show", "targetFieldId": "f3" }
    }
  ]
}
```

---

## 7. Validation Strategy

### 7.1 Client-side Validation

- All validation is defined in the schema's `validation` object per field
- A centralized `validateField(field, value)` utility returns `{ valid: boolean, error: string | null }`
- Validation is triggered on field blur in Classic mode; on "Next" press in Typeform mode
- The entire form is validated on submit; invalid fields are scrolled into view
- Zod is used internally to build validators from the schema — this ensures type safety and easy extension

### 7.2 Error UI/UX

| **State** | **Visual Treatment** |
|---|---|
| Pristine (untouched) | No indicator — empty field border is gray-200 |
| Valid (touched) | Subtle green checkmark icon at input right edge |
| Invalid (error) | 1px red-400 border + error message below (caption size, red-500, slide-down animation) |
| Required but empty | "This field is required" — shown only after first submit attempt |
| Submit attempt with errors | Top-level inline error summary (if > 3 errors); individual field errors always shown |

---

## 8. Edge Cases

| **Edge Case** | **Handling Strategy** |
|---|---|
| Empty form submitted | Publish is disabled if form has zero fields. A tooltip explains: "Add at least one field to publish." |
| Invalid JSON schema | Schema is validated with Zod on load. If corrupt, a recovery modal shows the raw JSON with a "Reset to last valid" option. |
| Circular logic rules | LogicEngine runs a cycle-detection algorithm (DFS) before applying rules. Circular rules are highlighted in red in the Logic Editor with an explanatory tooltip. |
| Conflicting logic (show + hide same field) | First matching rule wins (rules are ordered). A warning indicator appears in the Logic tab when conflicts are detected. |
| Real-time edit collision | Field-level locking: a field being edited by another user is shown as "Locked by [name]" with a greyed-out appearance. Locks expire after 3s of inactivity. |
| WebSocket disconnect mid-edit | Local edits are queued in localStorage. On reconnect, queued operations are replayed in order with server conflict resolution. |
| Very long field labels | Labels truncate at 2 lines in the canvas view with an ellipsis. Full label is shown in Config Panel and on hover tooltip. |
| File upload field (UI only) | Renders a dropzone with file type/size constraints visible. On the Stage, shows a drag-and-drop area; actual upload infrastructure is backend-owned. |

---

## 9. Performance Considerations

### 9.1 Large Forms (50+ Fields)

- Canvas fields are rendered with `React.memo` — only fields whose schema slice changed will re-render
- The Config Panel is mounted lazily (`React.lazy` + Suspense) — not included in initial bundle
- Schema updates use Immer structural sharing — unchanged field objects maintain referential equality
- Field addition/removal uses keyed reconciliation — React never re-mounts unchanged fields

### 9.2 Virtualization

- The Canvas does **not** virtualize by default (drag-and-drop requires DOM presence for all items)
- Above 100 fields, a virtual window is applied using `@dnd-kit/virtualizer` (experimental) with recycled DOM nodes
- The Response Table (Vault) always uses TanStack Virtual for row virtualization — only visible rows are in the DOM

### 9.3 Bundle & Load Performance

- Code splitting at route level: Workshop, Stage, and Vault are separate lazy chunks
- The Stage (public form renderer) is a standalone lightweight bundle (< 60kb gzipped) with zero builder dependencies
- Field type components are lazy-imported from the `fieldRegistry` on demand — only used types are bundled per form
- Schema is fetched with stale-while-revalidate (SWR) — instant perceived load from cache, background refresh

---

## 10. Suggested Frontend Tech Stack

| **Concern** | **Recommended Tool & Rationale** |
|---|---|
| Framework | React 19 with RSC — industry standard, best ecosystem for complex interactive UIs |
| Meta-framework | Next.js 15 — App Router for routing, RSC for Stage (SEO-friendly form rendering), API routes for BFF |
| State Management | Zustand — lightweight, boilerplate-free, middleware support for undo history; TanStack Query for server state |
| Drag & Drop | dnd-kit — accessible, performant, composable; better than react-beautiful-dnd (maintained) |
| Schema Validation | Zod — TypeScript-first, composable validators; used both for form input validation and schema integrity |
| Styling | Tailwind CSS v4 + CSS custom properties for theming — utility-first, zero-runtime, excellent DX |
| Component Library | Radix UI primitives (headless) + custom design system — accessibility built-in, full visual control |
| Animation | Framer Motion (targeted use) — layout animations for field reorder; CSS transitions for everything else |
| WebSocket | Socket.io-client or native WebSocket with a thin reconnect wrapper — use Yjs for CRDT-based conflict resolution |
| Data Tables | TanStack Table v9 + TanStack Virtual — headless, type-safe, virtualizes large response sets |
| Icons | Lucide React — consistent, tree-shakeable, MIT licensed |
| Testing | Vitest + Testing Library for unit/integration; Playwright for E2E form submission flows |
| Bundler | Turbopack (via Next.js) — fast HMR; esbuild for the standalone Stage bundle |

---

## Appendix: Keyboard Shortcuts Reference

| **Shortcut** | **Action** |
|---|---|
| `/` | Open field picker |
| `Cmd + Z` | Undo last schema change |
| `Cmd + Shift + Z` | Redo |
| `Cmd + S` | Force save (schema is usually auto-saved) |
| `Escape` | Deselect field / close Config Panel |
| `Tab / Shift+Tab` | Navigate between fields on canvas |
| `Delete / Backspace` | Delete selected field (shows Undo toast) |
| `Cmd + D` | Duplicate selected field |
| `Cmd + P` | Open preview in side panel |
| `Cmd + K` | Open command palette (global search & actions) |

---

*— End of Document —*
