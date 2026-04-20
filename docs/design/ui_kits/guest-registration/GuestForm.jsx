const GuestForm = () => {
  const [lang, setLang] = React.useState("en");
  const [email, setEmail] = React.useState("");
  const [guests, setGuests] = React.useState([newGuest()]);

  const inputStyle = { width: "100%", height: 40, padding: "0 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--fg)", fontSize: 15, outline: "none", fontFamily: "inherit" };

  const updateGuest = (i, patch) => setGuests(gs => gs.map((g, idx) => idx === i ? { ...g, ...patch } : g));
  const addGuest = () => setGuests(gs => [...gs, newGuest()]);
  const removeGuest = (i) => setGuests(gs => gs.filter((_, idx) => idx !== i));

  const trip = { title: "Tatranská Perla — Apartment 2B", start: "2026-04-22", end: "2026-04-26", property: "Tatranská Perla", maxGuests: 4 };
  const canSubmit = email.length > 3 && guests.every(g => g.firstName && g.lastName && g.documentNumber && g.gdpr && g.docFile);

  return (
    <>
      <Header lang={lang} setLang={setLang} />
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 120px" }}>
        <TripHero t={trip} lang={lang} />
        <GdprNotice />

        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 18, marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: "0 0 4px" }}>Contact email</h3>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: "0 0 12px", lineHeight: 1.5 }}>We send the confirmation here. One address for the whole group is fine.</p>
          <input type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        </section>

        {guests.map((g, i) => (
          <GuestCard key={g.id} g={g} idx={i} onChange={(p) => updateGuest(i, p)} onRemove={() => removeGuest(i)} canRemove={guests.length > 1} />
        ))}

        <button onClick={addGuest} type="button"
          style={{ width: "100%", height: 44, background: "var(--surface)", border: "1.5px dashed var(--border-strong)", borderRadius: 8, color: "var(--fg)", fontSize: 14, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4 }}>
          <Icon name="plus" size={16} /> Add another guest
        </button>
      </main>

      <SubmitBar enabled={canSubmit} guestCount={guests.length} />
    </>
  );
};

const SubmitBar = ({ enabled, guestCount }) => (
  <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, backdropFilter: "blur(8px)" }}>
    <div style={{ flex: 1, fontSize: 13, color: "var(--fg-muted)" }}>
      {guestCount} {guestCount === 1 ? "guest" : "guests"}
    </div>
    <button disabled={!enabled} style={{ height: 44, padding: "0 20px", background: enabled ? "var(--accent-500)" : "var(--surface-2)", color: enabled ? "white" : "var(--fg-subtle)", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: enabled ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 8 }}>
      Submit registration <Icon name="arrow-right" size={16} />
    </button>
  </div>
);

let idCounter = 0;
const newGuest = () => ({ id: ++idCounter, firstName: "", lastName: "", ageCategory: "adult", documentType: "passport", documentNumber: "", docFile: null, gdpr: false });

Object.assign(window, { GuestForm, SubmitBar });
