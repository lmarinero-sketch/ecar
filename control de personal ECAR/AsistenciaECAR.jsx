import React, { useState, useEffect, useCallback, useMemo } from "react";

/*
  Control de Asistencia — ECAR Constructora
  - Vista "Kiosco": el obrero ingresa su legajo en un teclado numérico y marca su llegada.
    Solo permite una marcación por legajo por día.
  - Vista "RRHH": protegida por PIN. Permite alta/baja de empleados, asignar legajos,
    y ver el registro de asistencia por fecha.

  Almacenamiento: usa window.storage en modo compartido (shared=true) para que la
  tablet de entrada y la PC de RRHH vean siempre los mismos datos.

  Para cambiar el PIN de acceso de RRHH, editar la constante ADMIN_PIN más abajo.
*/

const ADMIN_PIN = "2026";

const COLORS = {
  navy: "#0F2340",
  blue: "#2C6CB0",
  blueLight: "#5B9BD9",
  red: "#C4272B",
  bg: "#F4F6F9",
  surface: "#FFFFFF",
  success: "#2F9E44",
  muted: "#66707C",
  border: "#E2E6EC",
};

function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateAR(d = new Date()) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

function formatHourAR(d = new Date()) {
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

function Diamond({ size = 28, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" {...props}>
      <defs>
        <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={COLORS.navy} />
          <stop offset="100%" stopColor={COLORS.blueLight} />
        </linearGradient>
      </defs>
      <polygon points="50,2 95,50 50,98 5,50" fill="url(#diamondGrad)" />
      <polygon points="50,2 50,98 5,50" fill="url(#diamondGrad)" opacity="0.001" />
      <polygon points="50,20 78,50 50,80 22,50" fill={COLORS.bg} />
    </svg>
  );
}

async function safeGet(key, shared) {
  try {
    const res = await window.storage.get(key, shared);
    return res ? JSON.parse(res.value) : null;
  } catch (e) {
    return null;
  }
}

async function safeSet(key, value, shared) {
  try {
    await window.storage.set(key, JSON.stringify(value), shared);
    return true;
  } catch (e) {
    return false;
  }
}

export default function AsistenciaECAR() {
  const [view, setView] = useState("kiosk");
  const [employees, setEmployees] = useState(null);
  const [loading, setLoading] = useState(true);

  const [pinInput, setPinInput] = useState("");
  const [rrhhAuthed, setRrhhAuthed] = useState(false);
  const [pinError, setPinError] = useState(false);

  const [legajoInput, setLegajoInput] = useState("");
  const [message, setMessage] = useState(null); // { type: 'ok'|'error'|'warn', text }
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000 * 15);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      const emp = (await safeGet("employees", true)) || [];
      setEmployees(emp);
      setLoading(false);
    })();
  }, []);

  const activeEmployees = useMemo(
    () => (employees || []).filter((e) => e.activo),
    [employees]
  );

  const clearMessageLater = useCallback(() => {
    setTimeout(() => setMessage(null), 6000);
  }, []);

  async function handleDigit(d) {
    if (legajoInput.length >= 6) return;
    setLegajoInput((prev) => prev + d);
  }

  function handleBackspace() {
    setLegajoInput((prev) => prev.slice(0, -1));
  }

  function handleClear() {
    setLegajoInput("");
  }

  async function handleMarcar() {
    if (!legajoInput) return;
    const legajo = legajoInput.trim();
    const emp = (employees || []).find((e) => e.legajo === legajo);

    if (!emp) {
      setMessage({ type: "error", text: `El legajo ${legajo} no está registrado. Avisá a RRHH.` });
      setLegajoInput("");
      clearMessageLater();
      return;
    }
    if (!emp.activo) {
      setMessage({ type: "error", text: `El legajo ${legajo} está dado de baja. Avisá a RRHH.` });
      setLegajoInput("");
      clearMessageLater();
      return;
    }

    const key = `attendance:${todayKey()}`;
    const list = (await safeGet(key, true)) || [];
    const already = list.find((r) => r.legajo === legajo);

    if (already) {
      setMessage({
        type: "warn",
        text: `${emp.nombre} ya marcó su llegada hoy a las ${already.hora}.`,
      });
      setLegajoInput("");
      clearMessageLater();
      return;
    }

    const now = new Date();
    const record = {
      legajo,
      nombre: emp.nombre,
      hora: formatHourAR(now),
      fecha: formatDateAR(now),
      ts: now.toISOString(),
    };
    const newList = [...list, record];
    await safeSet(key, newList, true);

    setMessage({
      type: "ok",
      text: `Bienvenido ${emp.nombre}, Ingreso ${record.hora} ${record.fecha}`,
    });
    setLegajoInput("");
    clearMessageLater();
  }

  function handlePinSubmit() {
    if (pinInput === ADMIN_PIN) {
      setRrhhAuthed(true);
      setPinError(false);
      setPinInput("");
    } else {
      setPinError(true);
      setPinInput("");
    }
  }

  function goRrhh() {
    setView("rrhh");
  }

  function goKiosk() {
    setView("kiosk");
    setMessage(null);
  }

  return (
    <div
      style={{
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
        background: COLORS.bg,
        minHeight: "600px",
        width: "100%",
        color: COLORS.navy,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 22px",
          background: COLORS.surface,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Diamond size={26} />
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.5 }}>
              ECAR <span style={{ color: COLORS.red }}>CONSTRUCTORA</span>
            </div>
            <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 500 }}>
              Control de asistencia
            </div>
          </div>
        </div>
        <button
          onClick={view === "kiosk" ? goRrhh : goKiosk}
          style={{
            border: `1px solid ${COLORS.border}`,
            background: COLORS.bg,
            color: COLORS.muted,
            fontSize: 12,
            fontWeight: 600,
            padding: "7px 12px",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          {view === "kiosk" ? "Panel RRHH" : "Volver al kiosco"}
        </button>
      </header>

      {view === "kiosk" ? (
        <KioskView
          loading={loading}
          legajoInput={legajoInput}
          onDigit={handleDigit}
          onBackspace={handleBackspace}
          onClear={handleClear}
          onMarcar={handleMarcar}
          message={message}
          clock={clock}
        />
      ) : !rrhhAuthed ? (
        <PinGate
          pinInput={pinInput}
          setPinInput={setPinInput}
          onSubmit={handlePinSubmit}
          error={pinError}
        />
      ) : (
        <RrhhView employees={employees} setEmployees={setEmployees} />
      )}
    </div>
  );
}

function KioskView({ loading, legajoInput, onDigit, onBackspace, onClear, onMarcar, message, clock }) {
  const dateStr = clock.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = formatHourAR(clock);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: COLORS.surface,
          borderRadius: 16,
          boxShadow: "0 1px 3px rgba(15,35,64,0.08), 0 8px 24px rgba(15,35,64,0.06)",
          padding: "26px 24px 22px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 13, color: COLORS.muted, textTransform: "capitalize" }}>
            {dateStr}
          </div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 800,
              fontVariantNumeric: "tabular-nums",
              color: COLORS.navy,
              letterSpacing: 0.5,
            }}
          >
            {timeStr}
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            fontSize: 12,
            fontWeight: 700,
            color: COLORS.muted,
            letterSpacing: 1,
            marginBottom: 6,
          }}
        >
          NÚMERO DE LEGAJO
        </div>
        <div
          style={{
            border: `2px solid ${COLORS.border}`,
            borderRadius: 10,
            padding: "12px 10px",
            textAlign: "center",
            fontSize: 30,
            fontWeight: 800,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: 4,
            marginBottom: 14,
            minHeight: 48,
            color: legajoInput ? COLORS.navy : "#C4CBD4",
            background: COLORS.bg,
          }}
        >
          {legajoInput || "— — — —"}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
            marginBottom: 12,
          }}
        >
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <KeyButton key={d} onClick={() => onDigit(d)}>
              {d}
            </KeyButton>
          ))}
          <KeyButton onClick={onClear} muted>
            C
          </KeyButton>
          <KeyButton onClick={() => onDigit("0")}>0</KeyButton>
          <KeyButton onClick={onBackspace} muted>
            ⌫
          </KeyButton>
        </div>

        <button
          onClick={onMarcar}
          disabled={loading || !legajoInput}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 10,
            border: "none",
            background: !legajoInput ? "#CBD3DC" : COLORS.red,
            color: "#fff",
            fontWeight: 800,
            fontSize: 16,
            letterSpacing: 0.5,
            cursor: !legajoInput ? "default" : "pointer",
          }}
        >
          MARCAR LLEGADA
        </button>

        {message && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 14px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              textAlign: "center",
              background:
                message.type === "ok"
                  ? "rgba(47,158,68,0.1)"
                  : message.type === "warn"
                  ? "rgba(230,160,20,0.12)"
                  : "rgba(196,39,43,0.1)",
              color:
                message.type === "ok"
                  ? COLORS.success
                  : message.type === "warn"
                  ? "#B07800"
                  : COLORS.red,
            }}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}

function KeyButton({ children, onClick, muted }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "14px 0",
        fontSize: 18,
        fontWeight: 700,
        borderRadius: 8,
        border: `1px solid ${COLORS.border}`,
        background: muted ? COLORS.bg : "#fff",
        color: muted ? COLORS.muted : COLORS.navy,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function PinGate({ pinInput, setPinInput, onSubmit, error }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          background: COLORS.surface,
          borderRadius: 14,
          padding: "26px 28px",
          width: 300,
          boxShadow: "0 1px 3px rgba(15,35,64,0.08), 0 8px 24px rgba(15,35,64,0.06)",
          textAlign: "center",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Acceso RRHH</div>
        <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16 }}>
          Ingresá el PIN para gestionar legajos y ver asistencia
        </div>
        <input
          type="password"
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: `1px solid ${error ? COLORS.red : COLORS.border}`,
            fontSize: 16,
            textAlign: "center",
            letterSpacing: 4,
            marginBottom: 10,
            boxSizing: "border-box",
          }}
          placeholder="PIN"
        />
        {error && (
          <div style={{ color: COLORS.red, fontSize: 12, marginBottom: 10 }}>
            PIN incorrecto
          </div>
        )}
        <button
          onClick={onSubmit}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: 8,
            border: "none",
            background: COLORS.blue,
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Ingresar
        </button>
      </div>
    </div>
  );
}

function RrhhView({ employees, setEmployees }) {
  const [tab, setTab] = useState("empleados");
  const [nombre, setNombre] = useState("");
  const [legajo, setLegajo] = useState("");
  const [formError, setFormError] = useState("");

  const [fecha, setFecha] = useState(todayKey());
  const [dayList, setDayList] = useState([]);
  const [loadingDay, setLoadingDay] = useState(false);

  const list = employees || [];

  const nextLegajo = useMemo(() => {
    const nums = list.map((e) => parseInt(e.legajo, 10)).filter((n) => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return String(max + 1);
  }, [list]);

  useEffect(() => {
    setLegajo(nextLegajo);
  }, [nextLegajo]);

  useEffect(() => {
    if (tab !== "asistencia") return;
    (async () => {
      setLoadingDay(true);
      const data = (await safeGet(`attendance:${fecha}`, true)) || [];
      setDayList(data);
      setLoadingDay(false);
    })();
  }, [tab, fecha]);

  async function persistEmployees(newList) {
    setEmployees(newList);
    await safeSet("employees", newList, true);
  }

  async function handleAdd() {
    setFormError("");
    const legajoTrim = legajo.trim();
    const nombreTrim = nombre.trim();
    if (!legajoTrim || !nombreTrim) {
      setFormError("Completá legajo y nombre.");
      return;
    }
    if (list.some((e) => e.legajo === legajoTrim)) {
      setFormError(`El legajo ${legajoTrim} ya existe.`);
      return;
    }
    const newList = [...list, { legajo: legajoTrim, nombre: nombreTrim, activo: true }];
    await persistEmployees(newList);
    setNombre("");
  }

  async function handleToggleActivo(legajoTarget) {
    const newList = list.map((e) =>
      e.legajo === legajoTarget ? { ...e, activo: !e.activo } : e
    );
    await persistEmployees(newList);
  }

  async function handleDelete(legajoTarget) {
    const newList = list.filter((e) => e.legajo !== legajoTarget);
    await persistEmployees(newList);
  }

  const activos = list.filter((e) => e.activo);
  const ausentes = activos.filter((e) => !dayList.some((r) => r.legajo === e.legajo));

  return (
    <div style={{ flex: 1, padding: "20px 24px", maxWidth: 780, margin: "0 auto", width: "100%" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <TabButton active={tab === "empleados"} onClick={() => setTab("empleados")}>
          Empleados
        </TabButton>
        <TabButton active={tab === "asistencia"} onClick={() => setTab("asistencia")}>
          Asistencia
        </TabButton>
      </div>

      {tab === "empleados" && (
        <div>
          <div
            style={{
              background: COLORS.surface,
              borderRadius: 12,
              padding: 18,
              marginBottom: 18,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
              Agregar empleado
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600 }}>
                  Legajo
                </label>
                <input
                  value={legajo}
                  onChange={(e) => setLegajo(e.target.value.replace(/[^0-9]/g, ""))}
                  style={inputStyle(90)}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 160 }}>
                <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600 }}>
                  Nombre y apellido
                </label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  style={inputStyle("100%")}
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <button onClick={handleAdd} style={primaryButtonStyle}>
                Agregar
              </button>
            </div>
            {formError && (
              <div style={{ color: COLORS.red, fontSize: 12, marginTop: 8 }}>{formError}</div>
            )}
          </div>

          <div
            style={{
              background: COLORS.surface,
              borderRadius: 12,
              border: `1px solid ${COLORS.border}`,
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: COLORS.bg, textAlign: "left" }}>
                  <th style={thStyle}>Legajo</th>
                  <th style={thStyle}>Nombre</th>
                  <th style={thStyle}>Estado</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: 18, textAlign: "center", color: COLORS.muted }}>
                      Todavía no hay empleados cargados.
                    </td>
                  </tr>
                )}
                {list
                  .slice()
                  .sort((a, b) => parseInt(a.legajo) - parseInt(b.legajo))
                  .map((e) => (
                    <tr key={e.legajo} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                      <td style={tdStyle}>{e.legajo}</td>
                      <td style={tdStyle}>{e.nombre}</td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 20,
                            background: e.activo ? "rgba(47,158,68,0.12)" : "rgba(102,112,124,0.12)",
                            color: e.activo ? COLORS.success : COLORS.muted,
                          }}
                        >
                          {e.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        <button
                          onClick={() => handleToggleActivo(e.legajo)}
                          style={linkButtonStyle}
                        >
                          {e.activo ? "Dar de baja" : "Reactivar"}
                        </button>
                        <button
                          onClick={() => handleDelete(e.legajo)}
                          style={{ ...linkButtonStyle, color: COLORS.red, marginLeft: 10 }}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "asistencia" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600 }}>Fecha:</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              style={inputStyle(160)}
            />
          </div>

          <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
            <StatCard label="Presentes" value={dayList.length} color={COLORS.success} />
            <StatCard label="Ausentes" value={ausentes.length} color={COLORS.red} />
            <StatCard label="Total activos" value={activos.length} color={COLORS.blue} />
          </div>

          <div
            style={{
              background: COLORS.surface,
              borderRadius: 12,
              border: `1px solid ${COLORS.border}`,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <div style={{ padding: "10px 14px", fontWeight: 700, fontSize: 13, borderBottom: `1px solid ${COLORS.border}` }}>
              Llegadas registradas
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: COLORS.bg, textAlign: "left" }}>
                  <th style={thStyle}>Legajo</th>
                  <th style={thStyle}>Nombre</th>
                  <th style={thStyle}>Hora de ingreso</th>
                </tr>
              </thead>
              <tbody>
                {loadingDay && (
                  <tr>
                    <td colSpan={3} style={{ padding: 16, textAlign: "center", color: COLORS.muted }}>
                      Cargando...
                    </td>
                  </tr>
                )}
                {!loadingDay && dayList.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: 16, textAlign: "center", color: COLORS.muted }}>
                      Sin marcaciones para esta fecha.
                    </td>
                  </tr>
                )}
                {!loadingDay &&
                  dayList
                    .slice()
                    .sort((a, b) => a.hora.localeCompare(b.hora))
                    .map((r) => (
                      <tr key={r.legajo} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                        <td style={tdStyle}>{r.legajo}</td>
                        <td style={tdStyle}>{r.nombre}</td>
                        <td style={tdStyle}>{r.hora}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {ausentes.length > 0 && (
            <div
              style={{
                background: COLORS.surface,
                borderRadius: 12,
                border: `1px solid ${COLORS.border}`,
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "10px 14px", fontWeight: 700, fontSize: 13, borderBottom: `1px solid ${COLORS.border}` }}>
                Sin marcar
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: COLORS.bg, textAlign: "left" }}>
                    <th style={thStyle}>Legajo</th>
                    <th style={thStyle}>Nombre</th>
                  </tr>
                </thead>
                <tbody>
                  {ausentes.map((e) => (
                    <tr key={e.legajo} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                      <td style={tdStyle}>{e.legajo}</td>
                      <td style={tdStyle}>{e.nombre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        borderRadius: 8,
        border: `1px solid ${active ? COLORS.navy : COLORS.border}`,
        background: active ? COLORS.navy : COLORS.surface,
        color: active ? "#fff" : COLORS.muted,
        fontWeight: 700,
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div
      style={{
        flex: 1,
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: "12px 16px",
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function inputStyle(width) {
  return {
    width,
    padding: "8px 10px",
    borderRadius: 7,
    border: `1px solid ${COLORS.border}`,
    fontSize: 13,
    boxSizing: "border-box",
  };
}

const primaryButtonStyle = {
  padding: "9px 16px",
  borderRadius: 7,
  border: "none",
  background: COLORS.blue,
  color: "#fff",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  height: 34,
};

const thStyle = {
  padding: "9px 12px",
  fontSize: 11,
  color: COLORS.muted,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const tdStyle = {
  padding: "10px 12px",
};

const linkButtonStyle = {
  border: "none",
  background: "none",
  color: COLORS.blue,
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer",
  padding: 0,
};
