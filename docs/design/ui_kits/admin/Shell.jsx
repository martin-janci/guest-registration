const AdminIcon = ({ name, size = 16, strokeWidth = 1.75 }) => (
  <i data-lucide={name} style={{ width: size, height: size, display: "inline-flex", strokeWidth }} />
);

const Sidebar = ({ active, onNav }) => {
  const items = [
    { group: "Main", items: [
      { id: "dashboard", label: "Dashboard", icon: "layout-dashboard" },
      { id: "trips", label: "Trips", icon: "plane" },
      { id: "registrations", label: "Registrations", icon: "clipboard-check", badge: 5 },
      { id: "invoices", label: "Invoices", icon: "receipt" },
      { id: "housekeeping", label: "Housekeeping", icon: "sparkles" },
    ]},
    { group: "Manage", items: [
      { id: "properties", label: "Properties", icon: "home" },
      { id: "calendars", label: "Calendars", icon: "calendar" },
      { id: "users", label: "Users", icon: "users" },
      { id: "settings", label: "Settings", icon: "settings" },
    ]},
  ];
  return (
    <aside style={{ width: 240, background: "var(--surface)", borderRight: "1px solid var(--border)", padding: "16px 10px", display: "flex", flexDirection: "column", gap: 18, height: "100%", position: "sticky", top: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px 10px" }}>
        <img src="../../assets/logo-mark.svg" width="24" height="24" />
        <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--fg)" }}>
          airbnb<span style={{ color: "var(--accent-500)" }}>.rlt</span>.sk
        </span>
      </div>
      {items.map(group => (
        <div key={group.group} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: 11, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, padding: "4px 10px 8px" }}>{group.group}</div>
          {group.items.map(it => (
            <button key={it.id} onClick={() => onNav(it.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", fontSize: 13, color: active === it.id ? "var(--accent-700)" : "var(--fg-muted)", background: active === it.id ? "var(--accent-50)" : "transparent", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: active === it.id ? 500 : 400, width: "100%", textAlign: "left" }}>
              <AdminIcon name={it.icon} size={16} />
              <span>{it.label}</span>
              {it.badge && <span style={{ marginLeft: "auto", background: "var(--warning-100)", color: "var(--warning-700)", fontSize: 11, padding: "1px 6px", borderRadius: 10, fontWeight: 500 }}>{it.badge}</span>}
            </button>
          ))}
        </div>
      ))}
      <div style={{ marginTop: "auto", padding: "12px 10px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent-500)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>MJ</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis" }}>Martin Janči</div>
          <div style={{ fontSize: 11, color: "var(--fg-subtle)" }}>Admin</div>
        </div>
      </div>
    </aside>
  );
};

const TopBar = ({ title }) => (
  <header style={{ height: 56, borderBottom: "1px solid var(--border)", background: "var(--surface)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", padding: "0 24px", gap: 16, position: "sticky", top: 0, zIndex: 5 }}>
    <h1 style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)", margin: 0, letterSpacing: "-0.01em" }}>{title}</h1>
    <div style={{ flex: 1 }} />
    <div style={{ position: "relative" }}>
      <AdminIcon name="search" size={14} />
      <input placeholder="Search trips, guests, invoices…" style={{ height: 32, padding: "0 10px 0 30px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13, color: "var(--fg)", width: 280, outline: "none" }} />
      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)", pointerEvents: "none" }}><AdminIcon name="search" size={14} /></span>
    </div>
    <button style={{ height: 32, padding: "0 12px", background: "var(--accent-500)", color: "white", border: "none", borderRadius: 6, fontWeight: 500, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
      <AdminIcon name="plus" size={14} /> New trip
    </button>
  </header>
);

const Kpi = ({ label, value, delta, tone = "muted" }) => {
  const toneColors = { muted: "var(--fg-muted)", up: "var(--success-700)", warn: "var(--warning-700)", danger: "var(--danger-700)" };
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 12, color: "var(--fg-muted)", fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.015em", color: "var(--fg)", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 12, color: toneColors[tone], fontWeight: 500 }}>{delta}</div>
    </div>
  );
};

Object.assign(window, { AdminIcon, Sidebar, TopBar, Kpi });
