const HkIcon = ({ name, size = 18, strokeWidth = 1.75 }) => (
  <i data-lucide={name} style={{ width: size, height: size, display: "inline-flex", strokeWidth }} />
);

const HkHeader = ({ title, onBack, online = true }) => (
  <header style={{ position: "sticky", top: 0, zIndex: 10, height: 56, background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "0 16px", gap: 12, backdropFilter: "blur(8px)" }}>
    {onBack ? (
      <button onClick={onBack} style={{ background: "transparent", border: "none", padding: 8, marginLeft: -8, color: "var(--fg)", cursor: "pointer", display: "flex" }}>
        <HkIcon name="chevron-left" size={22} />
      </button>
    ) : (
      <img src="../../assets/logo-mark.svg" width="28" height="28" />
    )}
    <h1 style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)", margin: 0, flex: 1 }}>{title}</h1>
    {!online && (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--warning-700)", background: "var(--warning-100)", padding: "3px 8px", borderRadius: 999 }}>
        <HkIcon name="cloud-off" size={12} /> Offline
      </span>
    )}
  </header>
);

const BottomTabs = ({ active, onChange }) => {
  const tabs = [
    { id: "today", label: "Today", icon: "clipboard-list" },
    { id: "calendar", label: "Calendar", icon: "calendar" },
    { id: "pay", label: "Pay", icon: "euro" },
    { id: "me", label: "Me", icon: "user" },
  ];
  return (
    <nav style={{ position: "fixed", left: 0, right: 0, bottom: 0, height: 64, background: "var(--surface)", borderTop: "1px solid var(--border)", display: "flex", zIndex: 5 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, background: "transparent", border: "none", color: active === t.id ? "var(--accent-600)" : "var(--fg-muted)", cursor: "pointer", padding: "6px 0" }}>
          <HkIcon name={t.icon} size={22} strokeWidth={active === t.id ? 2 : 1.75} />
          <span style={{ fontSize: 11, fontWeight: active === t.id ? 600 : 500 }}>{t.label}</span>
        </button>
      ))}
    </nav>
  );
};

const TaskCard = ({ task, onOpen }) => {
  const statusTone = { pending: { bg: "var(--surface-2)", fg: "var(--fg-muted)", dot: "var(--fg-subtle)", label: "Pending" },
                      in_progress: { bg: "var(--info-100)", fg: "var(--info-700)", dot: "var(--info-500)", label: "In progress" },
                      completed: { bg: "var(--success-100)", fg: "var(--success-700)", dot: "var(--success-500)", label: "Completed" } }[task.status];
  return (
    <button onClick={onOpen} style={{ display: "flex", width: "100%", padding: "14px 16px", gap: 12, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, cursor: "pointer", textAlign: "left", marginBottom: 10 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--accent-50)", color: "var(--accent-700)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <HkIcon name="sparkles" size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", marginBottom: 2 }}>{task.property}</div>
        <div style={{ fontSize: 13, color: "var(--fg-muted)", display: "flex", alignItems: "center", gap: 6 }}>
          <HkIcon name="calendar" size={12} /> {task.date} · € {task.pay.toFixed(2)}
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500, background: statusTone.bg, color: statusTone.fg, padding: "2px 8px", borderRadius: 999, marginTop: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusTone.dot }} /> {statusTone.label}
        </div>
      </div>
      <HkIcon name="chevron-right" size={18} />
    </button>
  );
};

Object.assign(window, { HkIcon, HkHeader, BottomTabs, TaskCard });
