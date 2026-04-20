# UI Kit · Guest Self-Registration (mobile)

Public, anonymous, mobile-first form. Lands at `/register/[code]`.

Designed for: tired traveler, 11 PM, non-CZ/SK speaker, older Android phone, patchy wi-fi.

## Components
- `Header.jsx` — logo + language picker
- `TripHero.jsx` — trip summary card with dates, property, max guests
- `GdprNotice.jsx` — yellow info panel
- `EmailSection.jsx` — group email input
- `GuestCard.jsx` — single-guest sub-form (name, age, doc type, doc number, photo upload, GDPR checkbox)
- `DocUpload.jsx` — file input with camera capture
- `LangPicker.jsx` — EN / CZ / SK switcher (no emoji flags)
- `SubmitBar.jsx` — sticky bottom CTA

## Flow covered by index.html
1. Landing on the form (trip info shown)
2. Adding a second guest
3. Sticky bottom submit bar appears when form > viewport
