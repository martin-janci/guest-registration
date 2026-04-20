const Pill = ({ tone, children }) => {
  const colors = {
    success: { bg: "var(--success-100)", fg: "var(--success-700)", dot: "var(--success-500)" },
    warning: { bg: "var(--warning-100)", fg: "var(--warning-700)", dot: "var(--warning-500)" },
    danger:  { bg: "var(--danger-100)",  fg: "var(--danger-700)",  dot: "var(--danger-500)" },
    info:    { bg: "var(--info-100)",    fg: "var(--info-700)",    dot: "var(--info-500)" },
    neutral: { bg: "var(--surface-2)",   fg: "var(--fg)",          dot: "var(--fg-subtle)" },
  }[tone] || { bg: "var(--surface-2)", fg: "var(--fg)", dot: "var(--fg-subtle)" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", fontSize: 12, fontWeight: 500, borderRadius: 999, background: colors.bg, color: colors.fg }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: colors.dot }} /> {children}
    </span>
  );
};

const AttentionList = () => {
  const items = [
    { type: "registration", tone: "warning", icon: "clipboard-check", title: "Anna Novotná submitted registration", meta: "Tatranská Perla · 14:32", action: "Review" },
    { type: "registration", tone: "warning", icon: "clipboard-check", title: "Lukas Müller submitted registration", meta: "Donovaly Cottage · 09:08", action: "Review" },
    { type: "sync", tone: "danger", icon: "alert-circle", title: "Airbnb sync failed for Tatranská Perla", meta: "Last success 14:03 · HTTP 503", action: "Retry" },
    { type: "invoice", tone: "danger", icon: "receipt", title: "Invoice 2026-0041 is overdue", meta: "€ 420,00 · Müller GmbH · 8 days", action: "Remind" },
  ];
  return (
    <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", margin: 0 }}>Needs attention</h3>
        <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>{items.length} items</span>
      </div>
      <div>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: it.tone === "danger" ? "var(--danger-100)" : "var(--warning-100)", color: it.tone === "danger" ? "var(--danger-700)" : "var(--warning-700)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <AdminIcon name={it.icon} size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>{it.title}</div>
              <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>{it.meta}</div>
            </div>
            <button style={{ height: 28, padding: "0 10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12, fontWeight: 500, color: "var(--fg)", cursor: "pointer" }}>{it.action}</button>
          </div>
        ))}
      </div>
    </section>
  );
};

const RecentTrips = () => {
  const rows = [
    { title: "Tatranská Perla — Apt 2B", guest: "Novotná, Anna", dates: "22–26 Apr", source: "Airbnb", status: "warning", statusLabel: "Awaiting reg" },
    { title: "Donovaly Cottage", guest: "Müller, Lukas", dates: "23–25 Apr", source: "Airbnb", status: "success", statusLabel: "Registered" },
    { title: "Bratislava Loft", guest: "Dvořák, Tomáš", dates: "24 Apr – 2 May", source: "Manual", status: "success", statusLabel: "Registered" },
    { title: "Tatranská Perla — Apt 1A", guest: "—", dates: "26–28 Apr", source: "Airbnb", status: "neutral", statusLabel: "No guest info" },
  ];
  return (
    <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", margin: 0 }}>Arriving this week</h3>
        <a href="#" style={{ fontSize: 12, color: "var(--accent-600)" }}>View all trips</a>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>{["Trip", "Guest", "Dates", "Source", "Status"].map(h => (
            <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 500, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.04em", background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none" }}>
              <td style={{ padding: "12px 16px", color: "var(--fg)", fontWeight: 500 }}>{r.title}</td>
              <td style={{ padding: "12px 16px", color: "var(--fg)" }}>{r.guest}</td>
              <td style={{ padding: "12px 16px", color: "var(--fg-muted)" }}>{r.dates}</td>
              <td style={{ padding: "12px 16px" }}><Pill tone={r.source === "Airbnb" ? "info" : "neutral"}>{r.source}</Pill></td>
              <td style={{ padding: "12px 16px" }}><Pill tone={r.status}>{r.statusLabel}</Pill></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

Object.assign(window, { Pill, AttentionList, RecentTrips });
