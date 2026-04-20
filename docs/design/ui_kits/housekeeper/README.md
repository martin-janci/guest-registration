# UI Kit · Housekeeper Mobile (phone, offline-capable)

Phone-first PWA for cleaners. Big tap targets (44px+), single column, sticky top bar, sticky bottom tab nav.

## Components
- `HkHeader.jsx` — top bar with user chip + offline indicator
- `TaskCard.jsx` — single task list item
- `TaskDetail.jsx` — task view with photo upload + status buttons
- `BottomTabs.jsx` — Today / Calendar / Pay / Me
- `OfflineQueue.jsx` — shows pending upload count

## index.html
Tap a task to open detail, mark in progress, upload photo, complete. Returns to list.
