const TaskDetail = ({ task, onBack, onUpdate }) => {
  const [photos, setPhotos] = React.useState(task.photos || []);
  const addPhoto = () => setPhotos(p => [...p, { id: Date.now(), queued: task.status === "in_progress" }]);

  return (
    <>
      <HkHeader title="Task" onBack={onBack} online={false} />
      <main style={{ padding: "16px 16px 100px", maxWidth: 640, margin: "0 auto" }}>
        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 18, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "var(--fg-subtle)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Property</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--fg)", margin: "0 0 12px" }}>{task.property}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, color: "var(--fg-muted)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><HkIcon name="calendar" size={15} /> {task.date}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><HkIcon name="map-pin" size={15} /> Bratislavská 12, Poprad</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><HkIcon name="euro" size={15} /> {task.pay.toFixed(2)} € · {task.paid ? "paid" : "unpaid"}</div>
          </div>
          {task.notes && (
            <div style={{ marginTop: 12, padding: 10, background: "var(--surface-2)", borderRadius: 6, fontSize: 13, color: "var(--fg)" }}>
              <strong style={{ fontWeight: 600 }}>Note:</strong> {task.notes}
            </div>
          )}
        </section>

        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 18, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: 0 }}>Photos</h3>
            <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>{photos.length} of 3 min.</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {photos.map(p => (
              <div key={p.id} style={{ aspectRatio: "1", borderRadius: 8, background: "linear-gradient(135deg, var(--accent-100), var(--surface-2))", border: "1px solid var(--border)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-700)" }}>
                <HkIcon name="image" size={24} />
                {p.queued && <span style={{ position: "absolute", top: 4, right: 4, fontSize: 10, background: "var(--warning-500)", color: "white", padding: "1px 5px", borderRadius: 8, fontWeight: 600 }}>Queue</span>}
              </div>
            ))}
            <button onClick={addPhoto} style={{ aspectRatio: "1", borderRadius: 8, background: "var(--surface-2)", border: "1.5px dashed var(--border-strong)", color: "var(--fg-muted)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer" }}>
              <HkIcon name="camera" size={22} />
              <span style={{ fontSize: 11, fontWeight: 500 }}>Add</span>
            </button>
          </div>
        </section>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {task.status === "pending" && (
            <button onClick={() => onUpdate({ status: "in_progress" })}
              style={{ height: 52, background: "var(--accent-500)", color: "white", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <HkIcon name="play" size={18} /> Start task
            </button>
          )}
          {task.status === "in_progress" && (
            <button onClick={() => onUpdate({ status: "completed" })} disabled={photos.length < 3}
              style={{ height: 52, background: photos.length >= 3 ? "var(--success-500)" : "var(--surface-2)", color: photos.length >= 3 ? "white" : "var(--fg-subtle)", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 16, cursor: photos.length >= 3 ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <HkIcon name="check-circle-2" size={18} /> {photos.length >= 3 ? "Mark complete" : `Add ${3 - photos.length} more photo${3 - photos.length === 1 ? "" : "s"}`}
            </button>
          )}
          {task.status === "completed" && (
            <div style={{ padding: 16, background: "var(--success-100)", color: "var(--success-700)", borderRadius: 10, fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
              <HkIcon name="check-circle-2" size={20} />
              <div><div style={{ fontWeight: 600 }}>Task completed</div><div style={{ fontSize: 12, fontWeight: 400, opacity: 0.8 }}>You earned {task.pay.toFixed(2)} €. {task.paid ? "Paid." : "Payment pending."}</div></div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

const PaySummary = () => (
  <>
    <HkHeader title="Pay" />
    <main style={{ padding: 16, maxWidth: 640, margin: "0 auto", paddingBottom: 100 }}>
      <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: "var(--fg-muted)", fontWeight: 500 }}>This month</div>
        <div style={{ fontSize: 36, fontWeight: 600, color: "var(--fg)", letterSpacing: "-0.02em", margin: "4px 0" }}>€ 420,00</div>
        <div style={{ fontSize: 13, color: "var(--success-700)", fontWeight: 500 }}>▲ 60 € vs March</div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <div style={{ flex: 1, padding: 12, background: "var(--success-100)", borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: "var(--success-700)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Paid</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--success-700)" }}>280 €</div>
          </div>
          <div style={{ flex: 1, padding: 12, background: "var(--warning-100)", borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: "var(--warning-700)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Pending</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--warning-700)" }}>140 €</div>
          </div>
        </div>
      </section>
    </main>
  </>
);

Object.assign(window, { TaskDetail, PaySummary });
