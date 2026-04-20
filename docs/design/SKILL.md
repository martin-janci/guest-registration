---
name: airbnb-rlt-sk-design
description: Use this skill to generate well-branded interfaces and assets for airbnb.rlt.sk (Guest Registration v2) — a Slovak-market SaaS for Airbnb hosts. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping the three surfaces (guest self-registration mobile, admin dashboard desktop, housekeeper mobile).
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code (Next.js 15 + Tailwind 4 + shadcn/ui + lucide-react), copy the tokens from `colors_and_type.css` into the Tailwind config and read the rules here to become an expert in designing with this brand.

Key things to remember:
- **System font stack only** — no webfonts. Light mode first, dark mode sibling.
- **One accent color** — indigo `oklch(0.52 0.17 258)`. Never as gradient. Never decorative.
- **Sentence case everywhere.** Imperative verbs on buttons. No emoji in UI.
- **Icons = Lucide** at stroke-width 1.75, `currentColor` only.
- **Three surfaces, three viewports:** guest (420×720), housekeeper (420×760), admin (1440 max).
- **Motion is functional.** 120/180/240ms, ease-out-quart only. Respect `prefers-reduced-motion`.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
