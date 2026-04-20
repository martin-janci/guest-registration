const GuestCard = ({ g, idx, onChange, onRemove, canRemove }) => {
  const inputStyle = { width: "100%", height: 40, padding: "0 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--fg)", fontSize: 15, fontFamily: "inherit", outline: "none" };
  return (
    <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 18, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent-100)", color: "var(--accent-700)", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{idx + 1}</div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: 0 }}>Guest {idx + 1}</h3>
        </div>
        {canRemove && (
          <button onClick={onRemove} style={{ background: "transparent", border: "none", color: "var(--fg-muted)", fontSize: 13, cursor: "pointer", padding: "4px 8px", borderRadius: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="x" size={14} /> Remove
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <Field label="First name" required>
          <input style={inputStyle} value={g.firstName} onChange={e => onChange({ firstName: e.target.value })} placeholder="Anna" />
        </Field>
        <Field label="Last name" required>
          <input style={inputStyle} value={g.lastName} onChange={e => onChange({ lastName: e.target.value })} placeholder="Novotná" />
        </Field>
      </div>

      <Field label="Age" required>
        <div style={{ display: "flex", gap: 8 }}>
          {["adult", "child"].map(opt => (
            <button key={opt} onClick={() => onChange({ ageCategory: opt })} style={{ flex: 1, height: 40, padding: "0 12px", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: "pointer", border: `1px solid ${g.ageCategory === opt ? "var(--accent-500)" : "var(--border)"}`, background: g.ageCategory === opt ? "var(--accent-50)" : "var(--surface)", color: g.ageCategory === opt ? "var(--accent-700)" : "var(--fg)" }}>
              {opt === "adult" ? "Adult" : "Child"}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Document type" required>
        <div style={{ position: "relative" }}>
          <select value={g.documentType} onChange={e => onChange({ documentType: e.target.value })} style={{ ...inputStyle, appearance: "none", paddingRight: 32 }}>
            <option value="passport">Passport</option>
            <option value="driving_license">Driving license</option>
            <option value="citizen_id">Citizen ID</option>
          </select>
          <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--fg-muted)" }}><Icon name="chevron-down" size={14} /></div>
        </div>
      </Field>

      <Field label="Document number" required>
        <input style={{ ...inputStyle, fontFamily: "var(--font-mono)" }} value={g.documentNumber} onChange={e => onChange({ documentNumber: e.target.value })} placeholder="P1234567" />
      </Field>

      <DocUpload file={g.docFile} onChange={(f) => onChange({ docFile: f })} />

      <label style={{ display: "flex", gap: 10, marginTop: 12, fontSize: 13, color: "var(--fg)", cursor: "pointer", lineHeight: 1.5 }}>
        <input type="checkbox" checked={g.gdpr} onChange={e => onChange({ gdpr: e.target.checked })} style={{ marginTop: 2, accentColor: "oklch(0.52 0.17 258)" }} />
        <span>I consent to processing my personal data for guest registration, as required by Slovak law. <a href="#">Read policy</a></span>
      </label>
    </section>
  );
};

const Field = ({ label, required, children }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--fg)", marginBottom: 6 }}>
      {label}{required && <span style={{ color: "var(--danger-500)", marginLeft: 2 }}>*</span>}
    </label>
    {children}
  </div>
);

const DocUpload = ({ file, onChange }) => {
  const inputRef = React.useRef(null);
  return (
    <Field label="Document photo" required>
      {file ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 6, background: "var(--accent-100)", color: "var(--accent-700)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="file-image" size={22} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{file.name || "document.jpg"}</div>
            <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>{file.size ? `${(file.size/1024).toFixed(0)} KB` : "Uploaded"}</div>
          </div>
          <button onClick={() => onChange(null)} style={{ background: "transparent", border: "none", color: "var(--fg-muted)", cursor: "pointer", padding: 6 }}><Icon name="x" size={16} /></button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} type="button"
          style={{ width: "100%", padding: "18px 16px", border: "1.5px dashed var(--border-strong)", borderRadius: 8, background: "var(--surface-2)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", color: "var(--fg-muted)" }}>
          <Icon name="camera" size={22} />
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg)" }}>Take photo or upload</div>
          <div style={{ fontSize: 12 }}>JPG or PNG · under 10 MB</div>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onChange({ name: f.name, size: f.size }); }} />
    </Field>
  );
};

Object.assign(window, { GuestCard, Field, DocUpload });
