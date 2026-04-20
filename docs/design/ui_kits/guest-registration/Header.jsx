// Shared mini-components for guest reg kit
const Icon = ({ name, size = 16, className = "", strokeWidth = 1.75 }) => {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && window.lucide) window.lucide.createIcons({ nameAttr: "data-lucide", attrs: {}, icons: undefined });
  });
  return <i ref={ref} data-lucide={name} className={className} style={{ width: size, height: size, display: "inline-flex", strokeWidth }} />;
};

const Header = ({ lang, setLang }) => (
  <header style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(8px)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <img src="../../assets/logo-mark.svg" width="24" height="24" alt="" />
      <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>
        airbnb<span style={{ color: "var(--accent-500)" }}>.rlt</span>.sk
      </span>
    </div>
    <LangPicker lang={lang} setLang={setLang} />
  </header>
);

const LangPicker = ({ lang, setLang }) => {
  const [open, setOpen] = React.useState(false);
  const langs = [
    { code: "en", name: "English" },
    { code: "cs", name: "Čeština" },
    { code: "sk", name: "Slovenčina" },
  ];
  const current = langs.find(l => l.code === lang);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--fg)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
        <Icon name="globe" size={14} />
        {current.code.toUpperCase()}
        <Icon name="chevron-down" size={12} />
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "var(--shadow-md)", minWidth: 160, padding: 4, zIndex: 20 }}>
          {langs.map(l => (
            <button key={l.code} onClick={() => { setLang(l.code); setOpen(false); }}
              style={{ display: "flex", width: "100%", alignItems: "center", gap: 8, padding: "8px 10px", background: l.code === lang ? "var(--surface-2)" : "transparent", border: "none", borderRadius: 4, fontSize: 13, color: "var(--fg)", cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-muted)", minWidth: 20 }}>{l.code.toUpperCase()}</span>
              {l.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const TripHero = ({ t, lang }) => {
  const fmt = (d) => new Date(d).toLocaleDateString(lang === "en" ? "en-GB" : lang === "cs" ? "cs-CZ" : "sk-SK", { day: "numeric", month: "long", year: "numeric" });
  return (
    <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: "var(--shadow-xs)" }}>
      <div style={{ fontSize: 11, color: "var(--fg-subtle)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Registering for</div>
      <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.015em", marginBottom: 14, color: "var(--fg)" }}>{t.title}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, color: "var(--fg-muted)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name="calendar" size={15} /> {fmt(t.start)} – {fmt(t.end)}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name="map-pin" size={15} /> {t.property}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name="users" size={15} /> Up to {t.maxGuests} guests</div>
      </div>
    </section>
  );
};

const GdprNotice = () => (
  <div style={{ display: "flex", gap: 10, padding: "12px 14px", background: "var(--info-100)", border: "1px solid transparent", borderRadius: 8, marginBottom: 20, color: "var(--info-700)", fontSize: 13, lineHeight: 1.5 }}>
    <Icon name="shield-check" size={18} className="gdpr-icon" />
    <div>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>Your data is protected</div>
      Registration is required by Slovak law. Document photos are deleted after the host approves your stay.
    </div>
  </div>
);

Object.assign(window, { Icon, Header, LangPicker, TripHero, GdprNotice });
