# UX brief for Claude.ai design sessions

Copy-paste this into a new Claude.ai conversation (ideally inside a Claude.ai
Project where you can pin it as project instructions and attach visual
references). It frames the product for design work that will later be
implemented by Claude Code in this repo.

---

## Paste this as the first message in Claude.ai

```markdown
I'm rebuilding a guest registration SaaS for Airbnb hosts in Slovakia.
I need your help designing the UI/UX — start with exploring the flows,
then produce high-fidelity mockups and component designs (React + Tailwind).
Use artifacts. Ask me questions before designing.

## Product in one sentence
A self-service app where Airbnb hosts manage properties, auto-import
reservations from Airbnb's iCal feed, collect legally-required guest
registration forms (name + document scan + GDPR), issue invoices, and
coordinate housekeepers — all in one place.

## Users and their primary devices
| User | Device | What they do |
|---|---|---|
| **Host / admin** (me + ~5 colleagues) | Desktop + occasional mobile | Manage everything below |
| **Housekeeper** (~5–10 cleaners) | Phone (older Android mostly) | See today's tasks, mark complete, photo proof |
| **Guest** (unlimited, anonymous) | Phone (travel context, often non-Czech/Slovak) | Fill one registration form per stay |

## Core flows (design these first, in this order)

### 1. Guest self-registration (public, mobile-first)
- Host emails a link like `airbnb.rlt.sk/register/XYZ123`
- Guest opens on phone at 11 PM after landing, tired, sometimes jetlagged
- Form asks: email, then per-guest (adult or child): first name, last name,
  document type (passport / driving license / citizen ID), document number,
  photo of document, GDPR consent
- Must work with N guests (1 to 10)
- Language picker: EN / CZ / SK (default from `Accept-Language`)
- Submit → confirmation page → email receipt

### 2. Admin dashboard (desktop-primary, responsive)
- Lands on a single screen with:
  - KPIs: arrivals today/this week, pending registrations, unpaid housekeeping, overdue invoices
  - "Needs attention" list (pending guest approvals, failed Airbnb syncs)
- Primary sidebar nav: Dashboard · Properties · Calendars · Trips · Registrations
  · Invoices · Housekeeping · Users · Settings

### 3. Trips list + detail (admin)
- Trips = reservations (manual-added OR auto-imported from Airbnb ics)
- List: filter by property, date range, source (Airbnb vs manual), status
- Detail: guest info, registration status, linked invoice, housekeeping tasks,
  registration-link generator with QR code + copy button

### 4. Registration review (admin)
- Queue of submitted guest registrations
- One-click approve / reject; see uploaded document photos
- Bulk actions for busy check-in days

### 5. Invoices (admin)
- List with status pills (draft / sent / paid / overdue), currency EUR
- Create/edit form with line items (qty × unit_price, VAT %)
- Preview as PDF, send-by-email button
- PDF layout: host branding header (company name, ICO, VAT, address) + items table

### 6. Properties + Calendars + Users (admin CRUD, low visual priority but
   needs to feel consistent)

### 7. Housekeeper mobile (phone-first, large tap targets, one-thumb usable)
- Login → today's task list (property name, date, status)
- Tap task → detail → "Start" / "Upload photos" (from camera) / "Done"
- Offline-capable: photos queued in IndexedDB if no signal, uploaded when online
- After "Done", shows earned pay and payment status

## Visual direction
- Clean, calm, professional (like Linear or Stripe Dashboard, NOT Airbnb-retro)
- Light mode first, dark mode as secondary
- System font stack (ui-sans-serif / -apple-system)
- Neutral greys + one accent color (suggest one)
- Readable on a dusty Xiaomi Redmi from 2021

## Tech constraints (for React code you produce)
- Next.js 15 App Router + React 19 + TypeScript
- Tailwind CSS 4
- shadcn/ui primitives
- React Server Components where possible; 'use client' only for interactive forms
- Forms: react-hook-form + zod
- Icons: lucide-react

## What I want from you (in order)
1. **Ask me 5 questions** about anything unclear above (brand tone, edge cases,
   priorities, look-and-feel references).
2. After I answer, propose a **design system** (palette, type scale, spacing,
   component tokens) as an artifact.
3. Then design screens **one at a time**, each as a self-contained React
   artifact with Tailwind. Start with Guest Registration (mobile), then Admin
   Dashboard, then Housekeeper mobile.
4. After each screen, ask me what to refine before moving to the next.

Do not design everything at once. Iteration beats comprehensiveness.
```

---

## Tips

- **Use Claude.ai Projects.** Create a project "Guest Registration UX", upload
  2–3 reference screenshots (Linear, Stripe Dashboard, whatever vibe you like)
  as project files, and paste the brief above into "Project instructions".
  Every new chat in that project inherits the context automatically.
- **Screenshot each artifact you like.** When Claude.ai renders a screen, take
  a screenshot. Later you'll attach these screenshots to Claude Code prompts
  during M4/M6 implementation ("build this screen").
- **Narrow the brief when iterating.** Once the overall design system is set,
  don't re-paste the whole brief — just send the one flow section you're
  working on.
- **What Claude.ai does well vs. poorly:**
  - ✅ Component visuals, layouts, micro-interactions, copy tone, loading/empty/error states
  - ⚠️ State management, routing, DB shape — leave those to Claude Code in this repo
  - ❌ Do not treat artifacts as "final commit-ready code" — they are design
    proposals; you or your Claude Code agent will adapt them to the project's
    actual imports, modules, and data layer.

## Feeding designs back into the repo

When you have a design you like:

1. Screenshot the artifact (or export the code from Claude.ai).
2. In Claude Code (this repo), start a new session like:
   ```
   Build this admin dashboard screen to match the attached design.
   Use src/app/(admin)/admin/dashboard/page.tsx. Pull KPI data via Prisma.
   Components go in src/components/admin/. Follow the existing shadcn pattern.
   ```
3. Attach the screenshot + any exported JSX snippet as reference.
4. Let Claude Code do the integration (imports, server components, data flow).

Designs live conceptually in Claude.ai; code lives in this repo.
