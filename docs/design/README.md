# Guest Registration v2 — Design System

**Product:** `airbnb.rlt.sk` — a self-service SaaS for Airbnb hosts in Slovakia to manage properties, auto-import reservations from Airbnb's iCal feed, collect legally-required guest registration forms, issue invoices, and coordinate housekeepers.

**Owner:** Martin Janči (rebuilding the Flask v1 monolith as a Next.js 15 PWA).

**Status:** v2 is pre-build — this design system is the visual foundation for the rewrite. It defines tokens, components, and three product surfaces: guest self-registration (mobile), admin dashboard (desktop), and housekeeper mobile.

---

## Source material

| Source | Location | What it gave us |
|---|---|---|
| v2 design spec | `github.com/martin-janci/guest-registration` → `docs/superpowers/specs/2026-04-20-gws-rewrite-design.md` | Target stack, data model, flows, routes, non-goals |
| v2 M1 plan | same repo → `docs/superpowers/plans/2026-04-20-m1-skeleton.md` | Milestone scope |
| Legacy Flask app | `github.com/32bit-s-r-o/guest-registration-system` | Feature parity reference (Bootstrap 5 look is **not** inherited — v2 is a visual reset) |

The v2 stack is **Next.js 15 App Router + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui + react-hook-form + zod + lucide-react**. This design system mirrors that stack: every CSS variable is Tailwind-ready, every React component in the UI kits is a shadcn-style primitive.

---

## Products (three surfaces, one codebase)

| Surface | Device | Users | Visual priority |
|---|---|---|---|
| **Guest self-registration** (`/register/[code]`) | Phone (travel context) | Unlimited anonymous guests, often tired, often non-CZ/SK speakers | HIGH — this is the product's face to end guests |
| **Admin dashboard** (`/admin/*`) | Desktop + occasional mobile | Host + ~5 colleagues | HIGH — daily workhorse |
| **Housekeeper mobile** (`/housekeeper/*`) | Phone (older Android) | 5–10 cleaners | MEDIUM — offline-capable PWA, big tap targets |

---

## Brand personality

Calm · professional · trustworthy · plain-spoken. We are a **utility**, not a lifestyle brand. Think Linear, Stripe Dashboard, Mercury — not Airbnb marketing. Forms, tables, status pills, keyboard shortcuts. The product helps hosts stay on the right side of the law and helps guests through a tedious form; both groups want speed and clarity, not delight.

**Accent color:** a single indigo/blue — `oklch(0.52 0.17 258)` — signals action and trust without the warmth of Airbnb's red. It is the only color that carries visual weight; everything else is neutral grey.

---

## File index

```
/
├── README.md                       ← this file
├── SKILL.md                        ← Agent Skills–compatible entry point
├── colors_and_type.css             ← CSS vars + semantic classes (single source of truth for tokens)
├── fonts/                          ← none — system stack only, documented in CSS
├── assets/
│   ├── logo.svg                    ← wordmark
│   ├── logo-mark.svg               ← standalone mark (home icon + dot)
│   └── illustrations/              ← empty-state illustrations
├── preview/                        ← Design System tab cards (type / color / spacing / components)
│   ├── type-*.html
│   ├── color-*.html
│   ├── spacing-*.html
│   └── component-*.html
└── ui_kits/
    ├── guest-registration/         ← Guest mobile self-reg (EN/CZ/SK, N guests)
    │   ├── README.md
    │   ├── index.html
    │   └── *.jsx
    ├── admin/                      ← Admin dashboard + sidebar nav
    │   ├── README.md
    │   ├── index.html
    │   └── *.jsx
    └── housekeeper/                ← Housekeeper mobile task flow
        ├── README.md
        ├── index.html
        └── *.jsx
```

---

## CONTENT FUNDAMENTALS

**Tone:** direct, unceremonious, helpful. We don't make jokes. We don't say "Awesome!" when a form submits. We say "Registration submitted."

**Voice:**
- **Sentence case everywhere** — page titles, buttons, labels, headings. No Title Case. No ALL-CAPS except in status pills where it's a deliberate typographic choice (tracking-wider, text-xs).
- **Second person for the user** (*you*), first-person plural only in legal copy (*we process your data…*). Never first-person singular.
- **Plain English (or plain Czech / plain Slovak).** The guest flow will be read by tired travelers at 11 PM. No jargon. "Document number" — not "Identifying document reference". "Upload photo" — not "Capture biometric verification asset".
- **Imperative verbs on buttons.** "Save", "Send invoice", "Approve", "Add guest". Not "Click here to save".
- **State what happened, not how we feel about it.** "3 registrations waiting for review" — not "You have 3 registrations waiting for your attention!"

**Emoji:** none. Never in UI copy. (The legacy app uses 🇨🇿🇸🇰🇬🇧 as language flags in a dropdown — we replace those with `lucide-react` icons + the ISO code.)

**Casing examples:**
- ✅ "Registrations" (nav item)
- ✅ "Pending review" (status)
- ✅ "Send registration link" (button)
- ❌ "SEND REGISTRATION LINK" (except inside a pill component)
- ❌ "Send Registration Link"

**Numbers & currency:** Slovak / EN locale-aware. `1 234,56 €` in SK, `€1,234.56` in EN. Dates are `d.M.y` by default (admin setting).

**Error & empty states:**
- Errors name the field and what's wrong: "Email is required." "Document number must be at least 4 characters."
- Empty states explain what goes here and give a single next action: "No trips yet. Import an Airbnb calendar or add a trip manually."
- Never "Oops!" or "Something went wrong." If a sync fails, say "Airbnb sync failed at 14:03. Retry."

**Language:** every string in EN / CS / SK. `en` is the fallback. Accept-Language drives the default; guest can override with a language picker in the header. The admin setting `dateFormat` drives date rendering in admin and PDF surfaces.

---

## VISUAL FOUNDATIONS

### Colors
- **Neutral grey scale** (slate-tinted, not pure grey) is the chassis. `--bg`, `--surface`, `--surface-2`, `--border`, `--border-strong`, `--fg`, `--fg-muted`, `--fg-subtle`. Light mode is the default; dark mode is a full sibling (inverted grey, same accent).
- **One accent** — indigo `oklch(0.52 0.17 258)` — for primary buttons, links, focus rings, active nav state. Never for decoration. Never as a gradient.
- **Four semantic colors** — success (emerald), warning (amber), danger (red), info (sky). Only used in status pills, banners, and the KPI "needs attention" list. Never as a button fill.
- **No gradients.** Backgrounds are flat. The one exception is a faint top-to-bottom page gradient on the guest registration surface (`--surface` → `--bg`) to soften a tall form on a phone screen.

### Type
- **System font stack** only: `ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. This is deliberate — no webfont flash, no loading delay on an older Redmi, no licensing.
- **Mono stack** for codes, confirmation codes, document numbers: `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`.
- **Scale:** 12 / 13 / 14 / 16 / 18 / 20 / 24 / 30 / 36 / 48. Default body is 14px on admin, 16px on guest/housekeeper (bigger tap-friendly reading on phone).
- **Weights:** 400 / 500 / 600. No 700 (feels heavy against the neutral palette). No italics except in legal footnote text.
- **Line-height:** 1.5 for body, 1.2 for display. `text-wrap: pretty` on headings.

### Spacing & layout
- **4px base grid.** Tailwind's default scale (0.5 = 2px, 1 = 4px, … 16 = 64px).
- **Admin content max-width: 1440px.** Sidebar 240px fixed, main area fluid. Tables go full-width.
- **Guest form max-width: 480px** centered, 16px side padding on phone, 24px on tablet+.
- **Housekeeper content max-width: 640px**, single column, 16px gutter.
- **Vertical rhythm:** 8px between label and input, 16px between fields, 24px between form sections, 32px between top-level page sections.

### Corner radii
- `--radius-sm: 4px` — pills, tags
- `--radius-md: 6px` — inputs, buttons (default)
- `--radius-lg: 8px` — cards, modals
- `--radius-xl: 12px` — hero cards on guest flow
- Never fully rounded except for avatars and tiny status dots. No wild corners.

### Shadows & elevation
- **Borders do most of the work.** `1px solid var(--border)` on cards, inputs, pills.
- **Shadows are soft, never colored.**
  - `--shadow-xs`: `0 1px 2px 0 rgb(0 0 0 / 0.04)` — subtle card lift
  - `--shadow-sm`: `0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.04)` — dropdowns
  - `--shadow-md`: `0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04)` — modals, command palettes
  - `--shadow-focus-ring`: `0 0 0 3px oklch(0.52 0.17 258 / 0.20)` — focus ring (accessibility)
- **No inner shadows.** No colored shadows.

### Backgrounds & imagery
- **No photos.** This is a utility; we don't need a hero image.
- **No hand-drawn illustrations.** Empty states use a simple Lucide icon centered above grey explainer text.
- **No repeating patterns.** The page is white (or slate-950 in dark mode). The only "texture" is the inherent grid of a data table.

### Borders
- `1px solid var(--border)` is the default. `1.5px` on focused inputs (inside the focus ring).
- Dashed borders only on upload drop-zones.
- Divider lines in tables and lists use `var(--border)`, never a darker shade.

### Transparency & blur
- Modal backdrop: `rgb(0 0 0 / 0.40)` with `backdrop-blur-sm` (4px).
- Sticky sidebar header and table header have `backdrop-blur-md` (8px) over `var(--surface) / 0.80` to stay legible when content scrolls underneath.
- Otherwise: no transparency. Cards are opaque.

### Animation
- **Philosophy:** motion confirms a user action, never decorates. If nothing happened, nothing should move.
- **Duration:** 120ms (micro — hover, focus), 180ms (default — open/close), 240ms (page transitions). Nothing over 300ms.
- **Easing:** `cubic-bezier(0.2, 0, 0, 1)` (ease-out-quart). This is the Linear/shadcn default. Never linear. Never elastic. Never bounce.
- **No parallax. No scroll-jacking. No skeleton shimmer loops** (use a static dim placeholder instead).
- **Reduced motion:** respect `prefers-reduced-motion: reduce` — all transitions become instant (0ms).

### Hover & press states
- **Buttons:**
  - Hover: background darkens by ~4% lightness (filled) or surface fills in (outlined/ghost).
  - Active/press: background darkens by ~8%, no scale transform.
  - Focus-visible: 3px accent focus ring.
- **Links:** underline on hover. No color change.
- **Rows (tables, list items):** hover sets `background: var(--surface-2)`. No elevation change.
- **Cards:** no hover state by default. Clickable cards get a subtle border-color shift to `var(--border-strong)`.

### Layout rules
- **Admin:** sticky sidebar (left, 240px), sticky top bar (56px) with breadcrumb + user menu. Main content scrolls inside a 1440px container.
- **Guest:** single-column form, page scrolls naturally. No sticky elements except a sticky-bottom "Continue" button on mobile when the form exceeds 1.5× viewport.
- **Housekeeper:** single column, sticky top bar (56px) with back button + page title, sticky bottom tab bar (64px) for primary nav. Content in between.
- **Tables:** sticky header, zebra-striping off by default (borders are enough), row hover, pagination at the bottom.
- **Modals:** max-width 480px on mobile (full-screen-ish with 16px margin), 560px on desktop, centered.

### Cards
A card is: `background: var(--surface)` + `border: 1px solid var(--border)` + `border-radius: var(--radius-lg)` + optional `box-shadow: var(--shadow-xs)`. Internal padding 16px (compact) or 24px (default). Cards don't have gradients, inner shadows, colored left borders, or icons floating half-outside the edge.

---

## ICONOGRAPHY

**System:** `lucide-react` exclusively. It's already in the v2 stack (confirmed in the spec), it's open-source, it's tree-shakeable, the stroke style (1.5px, rounded line-caps) matches the calm/utility tone.

**Size conventions:**
- 16px — inline with body text, inside buttons
- 20px — sidebar nav, list item leading icons
- 24px — page headers, empty states
- 48px — empty-state hero (e.g. "No trips yet")

**Stroke width:** 1.5px (Lucide default). Never filled, never duo-tone, never colored (icons inherit `currentColor`).

**No emoji.** The legacy app used 🇨🇿🇸🇰🇬🇧 as language-picker flags; we replace with a compact ISO-code pill (`EN` / `CZ` / `SK`) plus a `Globe` icon on the trigger.

**No custom SVG illustrations.** If we ever need a "decorative" shape, we compose it from multiple Lucide icons or from a single icon scaled up in a muted color.

**Common icons (by flow):**
- Guest reg: `User`, `Users`, `FileText`, `Camera`, `Upload`, `CheckCircle2`, `Globe`, `ChevronRight`
- Admin: `LayoutDashboard`, `Home`, `Calendar`, `Plane`, `ClipboardCheck`, `Receipt`, `Broom` (fallback: `Sparkles`), `Users`, `Settings`, `Search`, `Plus`, `Filter`, `Download`, `Mail`, `QrCode`, `Copy`, `MoreHorizontal`, `AlertCircle`, `ArrowUpRight`
- Housekeeper: `CheckCircle2`, `Clock`, `Play`, `Camera`, `CloudOff`, `Cloud`, `Euro`, `Calendar`, `MapPin`, `ChevronLeft`

**CDN strategy:** in the HTML previews we load Lucide via `https://unpkg.com/lucide@latest` and initialize with `lucide.createIcons()`. In production React (Next.js), we use the `lucide-react` npm package.

---

## Index — where to find things

- **Tokens:** `colors_and_type.css`
- **Logos & marks:** `assets/logo.svg`, `assets/logo-mark.svg`
- **Design System cards:** `preview/*.html` (one sub-concept per card)
- **UI Kits:**
  - `ui_kits/guest-registration/` — mobile guest self-registration
  - `ui_kits/admin/` — desktop admin dashboard + sidebar shell
  - `ui_kits/housekeeper/` — mobile housekeeper task flow
- **SKILL entry point:** `SKILL.md`

---

## Caveats (things the user should flag)

- **No brand assets provided** — no logo file, no custom typeface, no illustrations. The logo in `assets/` is a wordmark I designed from scratch using the accent color and the system font. Replace at will.
- **Accent color is my suggestion** (indigo `oklch(0.52 0.17 258)`). Per the brief, "suggest one" — but confirm before production.
- **Icon set is Lucide**, matching the v2 stack. No existing icons to copy from legacy (Font Awesome 6 isn't being carried over).
- **Slovak/Czech copy in UI kits is illustrative.** I am designing in English and adding CS/SK variants only where it matters visually (language picker, date formats). A native speaker should review all three locales before launch.
