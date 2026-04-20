# UI Kit · Admin Dashboard (desktop)

Primary surface for hosts. Runs at `/admin/*`. Sticky sidebar + top bar, main canvas is a 1440px container.

## Components
- `Shell.jsx` — layout frame (sidebar + topbar + content)
- `Sidebar.jsx` — primary nav with active state + badge
- `TopBar.jsx` — breadcrumb + search + user menu
- `KpiRow.jsx` — 4 dashboard KPI cards
- `AttentionList.jsx` — "needs attention" items
- `RecentTrips.jsx` — upcoming arrivals table
- `DataTable.jsx` — generic table shell with status pills

## index.html
Renders the dashboard view. Clicking a sidebar item swaps content (Dashboard / Registrations / Invoices shown as mocks).
