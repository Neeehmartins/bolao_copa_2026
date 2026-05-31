import { useState, useEffect } from "react";

const STORAGE_KEY_USERS = "bolao_users";
const STORAGE_KEY_PREDICTIONS = "bolao_predictions";
const STORAGE_KEY_GAMES = "bolao_games";

const DEFAULT_GAMES = [
  { id: 1, home: "Brasil", away: "Argentina", flag_home: "🇧🇷", flag_away: "🇦🇷", group: "Grupo A", date: "2026-06-14" },
  { id: 2, home: "França", away: "Alemanha", flag_home: "🇫🇷", flag_away: "🇩🇪", group: "Grupo B", date: "2026-06-14" },
  { id: 3, home: "Espanha", away: "Portugal", flag_home: "🇪🇸", flag_away: "🇵🇹", group: "Grupo C", date: "2026-06-15" },
  { id: 4, home: "Inglaterra", away: "Holanda", flag_home: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", flag_away: "🇳🇱", group: "Grupo D", date: "2026-06-15" },
  { id: 5, home: "Uruguai", away: "México", flag_home: "🇺🇾", flag_away: "🇲🇽", group: "Grupo A", date: "2026-06-16" },
  { id: 6, home: "Japão", away: "Senegal", flag_home: "🇯🇵", flag_away: "🇸🇳", group: "Grupo E", date: "2026-06-16" },
  { id: 7, home: "Croácia", away: "Marrocos", flag_home: "🇭🇷", flag_away: "🇲🇦", group: "Grupo F", date: "2026-06-17" },
  { id: 8, home: "EUA", away: "Canadá", flag_home: "🇺🇸", flag_away: "🇨🇦", group: "Grupo G", date: "2026-06-17" },
];

const DEFAULT_USERS = [
  { id: 1, username: "admin", password: "admin123", name: "Administrador", avatar: "AD" },
  { id: 2, username: "joao", password: "joao123", name: "João Silva", avatar: "JS" },
  { id: 3, username: "maria", password: "maria123", name: "Maria Santos", avatar: "MS" },
];

const COLORS = {
  gold: "#D4A017",
  green: "#ce009b",
  greenLight: "#2ea065",
  blue: "#06b186",
  bluedciano : "#227cb1a0",
  dark: "#0a1628",
  darker: "#060e1d",
  card: "#0d1f3c",
  cardLight: "#12284f",
  border: "#003d8d",
  text: "#e8eef8",
  muted: "#fdfdfd",
  white: "#040029eb",
};

function getStorage(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch { return fallback; }
}

function setStorage(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

const styles = {
  app: {
    minHeight: "100vh",
    background: `linear-gradient(135deg, ${COLORS.darker} 0%, ${COLORS.dark} 50%, #c2db30 100%)`,
    fontFamily: "'Barlow Condensed', 'Oswald', sans-serif",
    color: COLORS.text,
    position: "relative",
    overflow: "hidden",
  },
  bg: {
    position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
    background: `
      radial-gradient(ellipse at 20% 50%, rgba(17, 107, 134, 0.692) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 20%, rgba(3, 83, 27, 0.644) 0%, transparent 50%)
    `,
  },
};

export default function App() {
  const [users, setUsers] = useState(() => {
    const stored = getStorage(STORAGE_KEY_USERS, null);
    if (!stored) { setStorage(STORAGE_KEY_USERS, DEFAULT_USERS); return DEFAULT_USERS; }
    return stored;
  });
  const [games] = useState(() => {
    const stored = getStorage(STORAGE_KEY_GAMES, null);
    if (!stored) { setStorage(STORAGE_KEY_GAMES, DEFAULT_GAMES); return DEFAULT_GAMES; }
    return stored;
  });
  const [predictions, setPredictions] = useState(() => getStorage(STORAGE_KEY_PREDICTIONS, {}));
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState("login");
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [registerData, setRegisterData] = useState({ username: "", password: "", name: "" });
  const [registerError, setRegisterError] = useState("");
  const [activeTab, setActiveTab] = useState("palpites");
  const [draftScores, setDraftScores] = useState({});
  const [saved, setSaved] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = () => {
    const user = users.find(u => u.username === loginData.username && u.password === loginData.password);
    if (!user) { setLoginError("Usuário ou senha incorretos."); return; }
    setCurrentUser(user);
    setLoginError("");
    setView("app");
    showToast(`Bem-vindo, ${user.name}! ⚽`);
  };

  const handleRegister = () => {
    if (!registerData.username || !registerData.password || !registerData.name) {
      setRegisterError("Preencha todos os campos."); return;
    }
    if (users.find(u => u.username === registerData.username)) {
      setRegisterError("Nome de usuário já existe."); return;
    }
    const initials = registerData.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const newUser = { id: Date.now(), username: registerData.username, password: registerData.password, name: registerData.name, avatar: initials };
    const updated = [...users, newUser];
    setUsers(updated);
    setStorage(STORAGE_KEY_USERS, updated);
    setRegisterError("");
    setView("login");
    showToast("Cadastro realizado! Faça o login.");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView("login");
    setLoginData({ username: "", password: "" });
  };

  const getUserPrediction = (userId, gameId) => {
    return predictions[`${userId}_${gameId}`] || null;
  };

  const isLocked = (userId, gameId) => {
    return !!getUserPrediction(userId, gameId);
  };

  const savePrediction = (gameId) => {
    const key = `${currentUser.id}_${gameId}`;
    const draft = draftScores[gameId];
    if (!draft || draft.home === undefined || draft.away === undefined) {
      showToast("Informe o placar dos dois times.", "error"); return;
    }
    const updated = { ...predictions, [key]: { home: draft.home, away: draft.away, savedAt: new Date().toISOString() } };
    setPredictions(updated);
    setStorage(STORAGE_KEY_PREDICTIONS, updated);
    setSaved(s => ({ ...s, [gameId]: true }));
    showToast("Palpite salvo e bloqueado! 🔒");
    setTimeout(() => setSaved(s => ({ ...s, [gameId]: false })), 2000);
  };

  const setDraft = (gameId, side, val) => {
    const num = Math.max(0, Math.min(20, parseInt(val) || 0));
    setDraftScores(d => ({ ...d, [gameId]: { ...d[gameId], [side]: num } }));
  };

  const userPredictions = games.map(g => ({ game: g, pred: getUserPrediction(currentUser?.id, g.id) }));
  const filledCount = userPredictions.filter(x => x.pred).length;

  const allUserStats = users.map(u => {
    const count = games.filter(g => getUserPrediction(u.id, g.id)).length;
    return { ...u, count };
  }).sort((a, b) => b.count - a.count);

  if (view === "login" || view === "register") {
    return (
      <div style={styles.app}>
        <div style={styles.bg} />
        <GoogleFonts />
        {toast && <Toast toast={toast} />}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", minHeight: "100vh", padding: "1rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ fontSize: "5rem", marginBottom: "3rem", paddingTop: "6rem" }}>🏆</div>
            <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 900, letterSpacing: "0.05em", margin: 0, WebkitBackgroundClip: "text", WebkitTextFillColor: "white" }}>BOLÃO DA COPA</h1>
            <p style={{ color: COLORS.muted, fontSize: "1.2rem", margin: "1rem 0 0", letterSpacing: "0.15em" }}>MUNDIAL 2026</p>
          </div>

          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "400px", backdropFilter: "blur(10px)" }}>
            <div style={{ display: "flex", borderBottom: `1px solid ${COLORS.border}`, marginBottom: "1.5rem" }}>
              {["login", "register"].map(tab => (
                <button key={tab} onClick={() => { setView(tab); setLoginError(""); setRegisterError(""); }}
                  style={{ flex: 1, padding: "0.75rem", background: "none", border: "none", color: view === tab ? COLORS.gold : COLORS.muted, fontFamily: "inherit", fontSize: "1rem", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", borderBottom: view === tab ? `2px solid ${COLORS.gold}` : "2px solid transparent", transition: "all 0.2s" }}>
                  {tab === "login" ? "ENTRAR" : "CADASTRAR"}
                </button>
              ))}
            </div>

            {view === "login" ? (
              <div>
                <Input label="Usuário" value={loginData.username} onChange={v => setLoginData(d => ({ ...d, username: v }))} placeholder="seu_usuario" onEnter={handleLogin} />
                <Input label="Senha" type="password" value={loginData.password} onChange={v => setLoginData(d => ({ ...d, password: v }))} placeholder="••••••" onEnter={handleLogin} />
                {loginError && <p style={{ color: "#ff6b6b", fontSize: "0.875rem", margin: "0 0 1rem" }}>{loginError}</p>}
                <Btn onClick={handleLogin} label="ENTRAR NO BOLÃO" />
                <p style={{ color: COLORS.muted, fontSize: "0.8rem", textAlign: "center", marginTop: "1rem" }}>Teste: Vanessa / Vanessa123</p>
              </div>
            ) : (
              <div>
                <Input label="Nome completo" value={registerData.name} onChange={v => setRegisterData(d => ({ ...d, name: v }))} placeholder="Seu nome" />
                <Input label="Usuário" value={registerData.username} onChange={v => setRegisterData(d => ({ ...d, username: v }))} placeholder="seu_usuario" />
                <Input label="Senha" type="password" value={registerData.password} onChange={v => setRegisterData(d => ({ ...d, password: v }))} placeholder="••••••" onEnter={handleRegister} />
                {registerError && <p style={{ color: "#ff6b6b", fontSize: "0.875rem", margin: "0 0 1rem" }}>{registerError}</p>}
                <Btn onClick={handleRegister} label="CRIAR CONTA" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <div style={styles.bg} />
      <GoogleFonts />
      {toast && <Toast toast={toast} />}

      <header style={{ position: "sticky", top: 0, zIndex: 100, background: `${COLORS.darker}ee`, borderBottom: `1px solid ${COLORS.border}`, backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 1rem", display: "flex", alignItems: "center", gap: "1rem", height: "60px" }}>
          <span style={{ fontSize: "1.5rem" }}>🏆</span>
          <span style={{ fontWeight: 800, fontSize: "1.3rem", letterSpacing: "0.1em", background: `linear-gradient(135deg, ${COLORS.gold}, #f5d060)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", flex: 1 }}>BOLÃO 2026</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.green})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0 }}>{currentUser.avatar}</div>
            <span style={{ color: COLORS.muted, fontSize: "0.9rem", display: "none" }}>{currentUser.name}</span>
            <button onClick={handleLogout} style={{ background: "none", border: `1px solid ${COLORS.border}`, color: COLORS.muted, padding: "0.35rem 0.75rem", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.8rem", letterSpacing: "0.05em" }}>SAIR</button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.5rem 1rem", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", gap: "1rem", background: COLORS.white, borderRadius: "12px", padding: "0.5rem", marginBottom: "1.5rem", border: `1px solid ${COLORS.border}` }}>
          {[["palpites", "⚽ MEUS PALPITES"], ["placar", "📊 PLACAR GERAL"]].map(([t, l]) => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ flex: 1, padding: "0.7rem", background: activeTab === t ? `linear-gradient(135deg, ${COLORS.green}, ${COLORS.greenLight})` : "none", border: "none", color: activeTab === t ? "#fff" : COLORS.muted, borderRadius: "8px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.08em", transition: "all 0.2s" }}>
              {l}
            </button>
          ))}
        </div>

        {activeTab === "palpites" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, letterSpacing: "0.05em" }}>Meus Palpites</h2>
                <p style={{ margin: "0.25rem 0 0", color: COLORS.gold, fontSize: "0.9rem" }}>{filledCount}/{games.length} jogos preenchidos</p>
              </div>
              <div style={{ background: `linear-gradient(135deg, ${COLORS.blue}33, ${COLORS.green}33)`, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "0.5rem 1rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: COLORS.gold }}>{filledCount}</div>
                <div style={{ fontSize: "0.7rem", color: COLORS.muted, letterSpacing: "0.1em" }}>PALPITES</div>
              </div>
            </div>

            {games.map(game => {
              const pred = getUserPrediction(currentUser.id, game.id);
              const locked = isLocked(currentUser.id, game.id);
              const draft = draftScores[game.id] || {};
              return (
                <div key={game.id} style={{ background: locked ? `${COLORS.cardLight}` : COLORS.card, border: `1px solid ${locked ? COLORS.green + "66" : COLORS.border}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "0.75rem", transition: "all 0.3s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <span style={{ background: `${COLORS.blue}44`, color: COLORS.muted, fontSize: "0.7rem", letterSpacing: "0.1em", padding: "0.2rem 0.6rem", borderRadius: "4px", fontWeight: 700 }}>{game.group}</span>
                    <span style={{ color: COLORS.muted, fontSize: "0.8rem" }}>{new Date(game.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
                    {locked && <span style={{ marginLeft: "auto", background: `${COLORS.green}33`, color: COLORS.greenLight, fontSize: "0.7rem", letterSpacing: "0.08em", padding: "0.2rem 0.6rem", borderRadius: "4px", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}>🔒 SALVO</span>}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "1.8rem" }}>{game.flag_home}</span>
                      <span style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "0.05em" }}>{game.home}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {locked ? (
                        <>
                          <ScoreDisplay val={pred.home} />
                          <span style={{ color: COLORS.muted, fontWeight: 700, fontSize: "1.2rem" }}>×</span>
                          <ScoreDisplay val={pred.away} />
                        </>
                      ) : (
                        <>
                          <ScoreInput val={draft.home} onChange={v => setDraft(game.id, "home", v)} />
                          <span style={{ color: COLORS.muted, fontWeight: 700, fontSize: "1.2rem" }}>×</span>
                          <ScoreInput val={draft.away} onChange={v => setDraft(game.id, "away", v)} />
                        </>
                      )}
                    </div>

                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "flex-end" }}>
                      <span style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "0.05em", textAlign: "right" }}>{game.away}</span>
                      <span style={{ fontSize: "1.8rem" }}>{game.flag_away}</span>
                    </div>
                  </div>

                  {!locked && (
                    <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center" }}>
                      <button onClick={() => savePrediction(game.id)}
                        style={{ background: `linear-gradient(135deg, ${COLORS.green}, ${COLORS.greenLight})`, border: "none", color: "#fff", padding: "0.6rem 2rem", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.1em", transition: "all 0.2s", opacity: saved[game.id] ? 0.7 : 1 }}>
                        {saved[game.id] ? "✓ SALVO!" : "💾 SALVAR PALPITE"}
                      </button>
                    </div>
                  )}

                  {locked && pred.savedAt && (
                    <p style={{ margin: "0.5rem 0 0", color: COLORS.muted, fontSize: "0.75rem", textAlign: "center" }}>
                      Salvo em {new Date(pred.savedAt).toLocaleString("pt-BR")} — não pode ser alterado
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "placar" && (
          <div>
            <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.4rem", fontWeight: 800, letterSpacing: "0.05em" }}>Placar Geral</h2>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {allUserStats.map((u, i) => (
                <div key={u.id} style={{ background: u.id === currentUser.id ? `${COLORS.cardLight}` : COLORS.card, border: `1px solid ${u.id === currentUser.id ? COLORS.gold + "55" : COLORS.border}`, borderRadius: "12px", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: "32px", fontWeight: 800, fontSize: "1.2rem", color: i === 0 ? COLORS.gold : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : COLORS.muted, textAlign: "center" }}>{i + 1}º</div>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.green})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.9rem", flexShrink: 0 }}>{u.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "1rem" }}>{u.name} {u.id === currentUser.id && <span style={{ color: COLORS.gold, fontSize: "0.75rem" }}>(você)</span>}</div>
                    <div style={{ color: COLORS.muted, fontSize: "0.8rem" }}>{u.count}/{games.length} palpites enviados</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: COLORS.gold }}>{u.count}</div>
                    <div style={{ fontSize: "0.7rem", color: COLORS.muted, letterSpacing: "0.08em" }}>PALPITES</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "2rem" }}>
              <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.08em", color: COLORS.muted }}>TODOS OS PALPITES POR JOGO</h3>
              {games.map(game => {
                const preds = users.map(u => ({ user: u, pred: getUserPrediction(u.id, game.id) })).filter(x => x.pred);
                return (
                  <div key={game.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "1rem", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: preds.length > 0 ? "0.75rem" : 0 }}>
                      <span style={{ fontSize: "1.4rem" }}>{game.flag_home}</span>
                      <span style={{ fontWeight: 700 }}>{game.home}</span>
                      <span style={{ color: COLORS.muted }}>vs</span>
                      <span style={{ fontWeight: 700 }}>{game.away}</span>
                      <span style={{ fontSize: "1.4rem" }}>{game.flag_away}</span>
                      <span style={{ marginLeft: "auto", color: COLORS.muted, fontSize: "0.8rem" }}>{preds.length} palpite{preds.length !== 1 ? "s" : ""}</span>
                    </div>
                    {preds.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {preds.map(({ user, pred }) => (
                          <div key={user.id} style={{ background: `${COLORS.cardLight}`, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.4rem 0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                            <span style={{ color: COLORS.muted }}>{user.avatar}</span>
                            <span style={{ fontWeight: 700, color: COLORS.gold }}>{pred.home} × {pred.away}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {preds.length === 0 && <p style={{ margin: 0, color: COLORS.muted, fontSize: "0.85rem" }}>Nenhum palpite ainda.</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GoogleFonts() {
  return <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;800&display=swap');`}</style>;
}

function Input({ label, value, onChange, placeholder, type = "text", onEnter }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", color: COLORS.muted, fontSize: "0.75rem", letterSpacing: "0.15em", marginBottom: "0.4rem", fontWeight: 700 }}>{label.toUpperCase()}</label>
      <input type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onEnter?.()}
        style={{ width: "100%", background: `${COLORS.dark}`, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.75rem 1rem", color: COLORS.text, fontFamily: "inherit", fontSize: "1rem", outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}

function Btn({ onClick, label }) {
  return (
    <button onClick={onClick}
      style={{ width: "100%", padding: "0.85rem", background: `linear-gradient(135deg, ${COLORS.white}, ${COLORS.greenLight})`, border: "none", borderRadius: "8px", color: "#ffffff", fontFamily: "inherit", fontWeight: 800, fontSize: "1rem", letterSpacing: "0.12em", cursor: "pointer" }}>
      {label}
    </button>
  );
}

function ScoreInput({ val, onChange }) {
  return (
    <input type="number" min={0} max={20} value={val ?? ""} placeholder="0"
      onChange={e => onChange(e.target.value)}
      style={{ width: "52px", textAlign: "center", background: COLORS.dark, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.6rem 0.25rem", color: COLORS.text, fontFamily: "inherit", fontWeight: 800, fontSize: "1.4rem", outline: "none" }} />
  );
}

function ScoreDisplay({ val }) {
  return (
    <div style={{ width: "52px", textAlign: "center", background: `${COLORS.green}22`, border: `1px solid ${COLORS.green}55`, borderRadius: "8px", padding: "0.6rem 0.25rem", fontWeight: 800, fontSize: "1.4rem", color: COLORS.gold }}>
      {val}
    </div>
  );
}

function Toast({ toast }) {
  return (
    <div style={{ position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", background: toast.type === "error" ? "#7a1a1a" : COLORS.card, border: `1px solid ${toast.type === "error" ? "#ff6b6b55" : COLORS.green + "88"}`, borderRadius: "10px", padding: "0.75rem 1.5rem", color: COLORS.text, zIndex: 999, fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.05em", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>
      {toast.msg}
    </div>
  );
}
