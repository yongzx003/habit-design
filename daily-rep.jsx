import { useState, useEffect, useRef } from "react";

const DEFAULT_IDENTITIES = [
  { id: "entrepreneur", emoji: "🧱", color: "#1D9E75", bg: "rgba(29,158,117,0.06)", label: "Entrepreneur" },
  { id: "finance", emoji: "💰", color: "#C08620", bg: "rgba(192,134,32,0.06)", label: "Financially literate" },
  { id: "learner", emoji: "📚", color: "#534AB7", bg: "rgba(83,74,183,0.05)", label: "Effective learner" },
  { id: "looks", emoji: "💪", color: "#D85A30", bg: "rgba(216,90,48,0.05)", label: "Good-looking man" },
  { id: "healthy", emoji: "🌿", color: "#0F6E56", bg: "rgba(15,110,86,0.05)", label: "Healthy person" },
  { id: "confident", emoji: "🗣️", color: "#378ADD", bg: "rgba(55,138,221,0.05)", label: "Confident connector" },
  { id: "ask", emoji: "✋", color: "#D4537E", bg: "rgba(212,83,126,0.05)", label: "Ask muscle" },
  { id: "nownothow", emoji: "⚡", color: "#888780", bg: "rgba(0,0,0,0.03)", label: "Now, not how" },
];

const DEFAULT_MAP = {
  entrepreneur: { now: "Selling durian puffs, building SOPs with team", next: "First paying consulting client" },
  finance: { now: "40/50/10 system running, ASNB funds active", next: "3 months perfect payday ritual" },
  learner: { now: "Reading daily, capturing into Discord Second Brain", next: "5 ideas implemented within 24hr" },
  looks: { now: "Gym consistent, skincare automatic, posture work ongoing", next: "12-week body comp with visible results" },
  healthy: { now: "Movement routines active, sleep target 11pm", next: "14 consecutive days sleeping by 11pm" },
  confident: { now: "Talking to customers, attending meetings", next: "1 new person/week for 8 weeks straight" },
  ask: { now: "Starting to make asks", next: "1 uncomfortable ask/week for 8 weeks" },
  nownothow: { now: "Aware of the principle, catching myself", next: "Catch and redirect 3x this week" },
};

const DEFAULT_HABITS = [
  { id: "e1", identity: "entrepreneur", text: "Deep work on business", ideal: "3hr focused block", broken: "30 min on #1 task", threshold: 66 },
  { id: "e2", identity: "entrepreneur", text: "Creative thinking", ideal: "1hr brainstorm + write-up", broken: "1 idea into Second Brain", threshold: 66 },
  { id: "e3", identity: "entrepreneur", text: "Communication / outreach", ideal: "Meeting or customer talk", broken: "1 WhatsApp to warm contact", threshold: 66 },
  { id: "f1", identity: "finance", text: "Log expenses", ideal: "Full log same day", broken: "WhatsApp yourself each purchase", threshold: 66 },
  { id: "l1", identity: "learner", text: "Read + capture idea", ideal: "10pg AM + 5pg PM, write idea", broken: "1 page + 1 thought captured", threshold: 66 },
  { id: "l2", identity: "learner", text: "Articulate practice", ideal: "Count 1-10 fully energized", broken: "1 sentence with full clarity", threshold: 66 },
  { id: "g3", identity: "looks", text: "Gym / training", ideal: "Full gym session", broken: "20 push-ups + 1 min plank", threshold: 66 },
  { id: "g4", identity: "looks", text: "Movement routine", ideal: "Full AM + PM stretches", broken: "Chest stretch + chin tuck", threshold: 66 },
  { id: "h1", identity: "healthy", text: "Sleep by 11pm", ideal: "Lights out, phone outside", broken: "In bed 11:30pm, no screen", threshold: 66 },
  { id: "h2", identity: "healthy", text: "Meditation", ideal: "2 min focused breathing", broken: "3 deep breaths before sleep", threshold: 66 },
  { id: "c1", identity: "confident", text: "Connect with someone", ideal: "Introduce to 1 stranger", broken: "1 deeper question in any convo", threshold: 66 },
  { id: "a1", identity: "ask", text: "Make one ask", ideal: "Something uncomfortable", broken: "Something small (opinion, help)", threshold: 66 },
];

const DEFAULT_GRADUATED = [
  { id: "g1", identity: "looks", text: "AM skincare", note: "Cleanser → Ceradan → SPF", reps: 66 },
  { id: "g2", identity: "looks", text: "PM skincare", note: "Cleanser → Adapalene → Ceradan", reps: 66 },
];

const MAX_ACTIVE = 14;
const WKDAYS = ["S","M","T","W","T","F","S"];

function dk(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function wkDates(){const t=new Date(),day=t.getDay(),mon=new Date(t);mon.setDate(t.getDate()-((day+6)%7));return Array.from({length:7},(_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return d})}

function countReps(days, habitId) {
  let c = 0;
  Object.values(days).forEach(d => { if (d[habitId] === "done" || d[habitId] === "broken") c++; });
  return c;
}

export default function App() {
  const [tab, setTab] = useState("today");
  const [data, setData] = useState({
    days: {}, reflections: {},
    habits: DEFAULT_HABITS,
    graduated: DEFAULT_GRADUATED,
    map: DEFAULT_MAP,
  });
  const [ready, setReady] = useState(false);
  const [showAdd, setShowAdd] = useState(null);
  const [newH, setNewH] = useState({ text: "", ideal: "", broken: "", threshold: 66 });
  const [editMap, setEditMap] = useState(null);
  const [mapDraft, setMapDraft] = useState({ now: "", next: "" });
  const [showGrad, setShowGrad] = useState(false);
  const once = useRef(false);
  const today = dk();
  const todayD = new Date();
  const isSun = todayD.getDay() === 0;

  useEffect(() => {
    if (once.current) return; once.current = true;
    (async () => {
      try {
        const r = await window.storage.get("dailyrep-v5");
        if (r?.value) {
          const parsed = JSON.parse(r.value);
          setData(prev => ({ ...prev, ...parsed, habits: parsed.habits || DEFAULT_HABITS, graduated: parsed.graduated || DEFAULT_GRADUATED, map: parsed.map || DEFAULT_MAP }));
        }
      } catch(e) {}
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(async () => {
      try { await window.storage.set("dailyrep-v5", JSON.stringify(data)); } catch(e) {}
    }, 400);
    return () => clearTimeout(t);
  }, [data, ready]);

  const hToday = data.days[today] || {};
  const rToday = data.reflections[today] || {};
  const habits = data.habits || [];
  const graduated = data.graduated || [];
  const identities = DEFAULT_IDENTITIES;
  const mapData = data.map || DEFAULT_MAP;

  function setHabit(id, val) {
    const cur = hToday[id];
    const next = cur === val ? null : val;
    setData(p => ({ ...p, days: { ...p.days, [today]: { ...p.days[today], [id]: next } } }));
  }
  function setR(k, v) { setData(p => ({ ...p, reflections: { ...p.reflections, [today]: { ...p.reflections[today], [k]: v } } })); }
  function setSunR(k, v) { setData(p => ({ ...p, reflections: { ...p.reflections, [`sun-${today}`]: { ...p.reflections[`sun-${today}`], [k]: v } } })); }

  function addHabit(identityId) {
    if (habits.length >= MAX_ACTIVE) return;
    if (!newH.text.trim()) return;
    const h = { id: `h${Date.now()}`, identity: identityId, text: newH.text.trim(), ideal: newH.ideal.trim() || newH.text.trim(), broken: newH.broken.trim() || "Minimum version", threshold: Number(newH.threshold) || 60 };
    setData(p => ({ ...p, habits: [...p.habits, h] }));
    setNewH({ text: "", ideal: "", broken: "", threshold: 66 });
    setShowAdd(null);
  }

  function graduateHabit(habit) {
    const reps = countReps(data.days, habit.id);
    setData(p => ({
      ...p,
      habits: p.habits.filter(h => h.id !== habit.id),
      graduated: [...(p.graduated || []), { id: habit.id, identity: habit.identity, text: habit.text, note: habit.ideal, reps }],
    }));
  }

  function removeHabit(id) {
    setData(p => ({ ...p, habits: p.habits.filter(h => h.id !== id) }));
  }

  function saveMap(identityId) {
    setData(p => ({ ...p, map: { ...p.map, [identityId]: { now: mapDraft.now, next: mapDraft.next } } }));
    setEditMap(null);
  }

  const done = habits.filter(h => hToday[h.id] === "done" || hToday[h.id] === "broken").length;
  const total = habits.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const wd = wkDates();

  const tabs = [
    { key: "today", label: "Today", icon: "○" },
    { key: "week", label: "Week", icon: "▤" },
    { key: "map", label: "Map", icon: "◎" },
    ...(isSun ? [{ key: "review", label: "Review", icon: "☀" }] : []),
  ];

  if (!ready) return <div style={{ padding: 60, textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 14 }}>Loading...</div>;

  const groupedHabits = identities.filter(id => !id.isPassive && id.id !== "nownothow").map(id => ({
    ...id,
    habits: habits.filter(h => h.identity === id.id),
    grad: graduated.filter(g => g.identity === id.id),
  })).filter(g => g.habits.length > 0 || g.grad.length > 0);

  return (
    <div style={{ fontFamily: "var(--font-sans)", maxWidth: 500, margin: "0 auto", color: "var(--color-text-primary)" }}>

      <div style={{ padding: "28px 20px 12px" }}>
        <div style={{ fontSize: 11, letterSpacing: 2.5, textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: 4 }}>The daily rep</div>
        <div style={{ fontSize: 20, fontWeight: 500 }}>
          {todayD.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </div>
        <div style={{ fontSize: 13, color: "var(--color-text-tertiary)", marginTop: 2 }}>Every rep is a vote for who you're becoming.</div>
      </div>

      {tab === "today" && (
        <div style={{ padding: "0 16px 100px" }}>

          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 18px", background: "var(--color-background-secondary)", borderRadius: 16, marginBottom: 20 }}>
            <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
              <svg viewBox="0 0 52 52" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="26" cy="26" r="22" fill="none" stroke="var(--color-border-tertiary)" strokeWidth="4" />
                <circle cx="26" cy="26" r="22" fill="none" stroke="#1D9E75" strokeWidth="4" strokeDasharray={`${pct * 1.382} 138.2`} strokeLinecap="round" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500 }}>{pct}%</div>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{done} of {total} reps</div>
              <div style={{ fontSize: 13, color: "var(--color-text-tertiary)" }}>
                {done === total && total > 0 ? "All done. Perfect day." : done === 0 ? "Pick a rep. Any rep." : "Keep going. Broken days count."}
              </div>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>{habits.length}/{MAX_ACTIVE} active reps</div>
            </div>
          </div>

          {groupedHabits.map(group => (
            <div key={group.id} style={{ marginBottom: 16, padding: "14px 16px 12px", borderRadius: 16, background: group.bg, border: `0.5px solid ${group.color}22` }}>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{group.emoji}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: group.color }}>{group.label}</span>
                </div>
                {habits.length < MAX_ACTIVE && (
                  <button onClick={() => setShowAdd(showAdd === group.id ? null : group.id)}
                    style={{ fontSize: 18, width: 28, height: 28, borderRadius: 8, border: "none", background: "var(--color-background-primary)", color: group.color, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                )}
              </div>

              {group.habits.map(habit => {
                const val = hToday[habit.id];
                const reps = countReps(data.days, habit.id);
                const threshold = habit.threshold || 66;
                const repPct = Math.min(Math.round((reps / threshold) * 100), 100);
                const readyToGrad = reps >= threshold;
                return (
                  <div key={habit.id} style={{ marginBottom: 8, padding: "12px 14px", borderRadius: 12, background: "var(--color-background-primary)", border: "1.5px solid var(--color-border-primary)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{habit.text}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: readyToGrad ? "#1D9E75" : "var(--color-text-tertiary)", fontWeight: readyToGrad ? 500 : 400 }}>{reps}/{threshold}</span>
                        {readyToGrad && (
                          <button onClick={() => graduateHabit(habit)} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, border: "1px solid #1D9E75", background: "rgba(29,158,117,0.08)", color: "#1D9E75", cursor: "pointer", fontWeight: 500 }}>Graduate</button>
                        )}
                      </div>
                    </div>

                    <div style={{ height: 3, background: "var(--color-background-secondary)", borderRadius: 2, marginBottom: 10, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${repPct}%`, background: readyToGrad ? "#1D9E75" : group.color, borderRadius: 2, transition: "width 0.3s" }} />
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setHabit(habit.id, "done")} style={{
                        flex: 1, padding: "10px 8px", fontSize: 13, fontWeight: 500, borderRadius: 10, cursor: "pointer", transition: "all 0.15s", lineHeight: 1.3,
                        border: "1.5px solid #1D9E75",
                        background: val === "done" ? "#1D9E75" : "transparent",
                        color: val === "done" ? "#fff" : "#1D9E75",
                      }}>✓ {habit.ideal}</button>
                      <button onClick={() => setHabit(habit.id, "broken")} style={{
                        flex: 1, padding: "10px 8px", fontSize: 13, fontWeight: 500, borderRadius: 10, cursor: "pointer", transition: "all 0.15s", lineHeight: 1.3,
                        border: "1.5px solid #C08620",
                        background: val === "broken" ? "#C08620" : "transparent",
                        color: val === "broken" ? "#fff" : "#C08620",
                      }}>½ {habit.broken}</button>
                    </div>
                  </div>
                );
              })}

              {showAdd === group.id && (
                <div style={{ padding: "12px 14px", borderRadius: 12, background: "var(--color-background-primary)", border: "1px dashed var(--color-border-secondary)", marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: group.color }}>Add new rep to {group.label}</div>
                  <input placeholder="Habit name" value={newH.text} onChange={e => setNewH(p => ({ ...p, text: e.target.value }))}
                    style={{ width: "100%", padding: "8px 10px", fontSize: 13, borderRadius: 8, border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", marginBottom: 6, boxSizing: "border-box", fontFamily: "inherit" }} />
                  <input placeholder="Ideal version (e.g. Full gym session)" value={newH.ideal} onChange={e => setNewH(p => ({ ...p, ideal: e.target.value }))}
                    style={{ width: "100%", padding: "8px 10px", fontSize: 13, borderRadius: 8, border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", marginBottom: 6, boxSizing: "border-box", fontFamily: "inherit" }} />
                  <input placeholder="Broken day version (e.g. 10 push-ups)" value={newH.broken} onChange={e => setNewH(p => ({ ...p, broken: e.target.value }))}
                    style={{ width: "100%", padding: "8px 10px", fontSize: 13, borderRadius: 8, border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", marginBottom: 6, boxSizing: "border-box", fontFamily: "inherit" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>Graduate after</span>
                    <input type="number" value={newH.threshold} onChange={e => setNewH(p => ({ ...p, threshold: e.target.value }))}
                      style={{ width: 60, padding: "6px 8px", fontSize: 13, borderRadius: 8, border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", textAlign: "center", fontFamily: "inherit" }} />
                    <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>reps</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => addHabit(group.id)} style={{ flex: 1, padding: "8px", fontSize: 13, fontWeight: 500, borderRadius: 8, border: "none", background: group.color, color: "#fff", cursor: "pointer" }}>Add rep</button>
                    <button onClick={() => setShowAdd(null)} style={{ padding: "8px 16px", fontSize: 13, borderRadius: 8, border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              )}

              {group.grad.length > 0 && (
                <div style={{ marginTop: 4, padding: "0 2px" }}>
                  <div onClick={() => setShowGrad(!showGrad)} style={{ fontSize: 12, color: "var(--color-text-tertiary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 11 }}>{showGrad ? "▾" : "›"}</span>
                    {group.grad.length} graduated (automatic)
                  </div>
                  {showGrad && group.grad.map((g, i) => (
                    <div key={i} style={{ marginTop: 6, padding: "8px 12px", borderRadius: 10, background: "var(--color-background-primary)", border: "1px dashed var(--color-border-tertiary)", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, color: "#1D9E75" }}>✓</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "var(--color-text-tertiary)" }}>{g.text}</div>
                        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{g.note} · {g.reps} reps</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div style={{ marginTop: 8, padding: "18px 18px", borderRadius: 16, background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)" }}>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>🌙 Nightly reflex</div>
            {[
              { k: "win", label: "⚡ Win of the day", ph: "Best rep today..." },
              { k: "wrong", label: "❌ What went wrong", ph: "One thing, honestly..." },
              { k: "tmr", label: "🎯 Tomorrow's #1", ph: "The one task that moves the needle..." },
            ].map(f => (
              <div key={f.k} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 4 }}>{f.label}</div>
                <textarea value={rToday[f.k] || ""} onChange={e => setR(f.k, e.target.value)} placeholder={f.ph} rows={2}
                  style={{ width: "100%", padding: "10px 12px", fontSize: 14, borderRadius: 10, border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", lineHeight: 1.5 }} />
              </div>
            ))}
          </div>

          <div style={{ margin: "16px 0", padding: "12px 16px", borderRadius: 12, background: "var(--color-background-secondary)", display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ fontSize: 16, lineHeight: "24px" }}>⚡</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Now, not how</div>
              <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", lineHeight: 1.5, marginTop: 2 }}>Caught yourself designing instead of doing? Redirect now.</div>
            </div>
          </div>
        </div>
      )}

      {tab === "week" && (
        <div style={{ padding: "0 16px 100px" }}>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>This week</div>
          <div style={{ overflowX: "auto", paddingBottom: 4 }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(110px,1fr) repeat(7,32px)", gap: "6px 4px", alignItems: "center", minWidth: 360 }}>
              <div />
              {wd.map((d, i) => {
                const isT = dk(d) === today;
                return <div key={i} style={{ textAlign: "center", fontSize: 12, fontWeight: isT ? 500 : 400, color: isT ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>{WKDAYS[d.getDay()]}<br /><span style={{ fontSize: 11 }}>{d.getDate()}</span></div>;
              })}
              {habits.map(h => {
                const idObj = identities.find(id => id.id === h.identity);
                return (
                  <React.Fragment key={h.id}>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 6 }}>
                      {idObj?.emoji} {h.text}
                    </div>
                    {wd.map((d, i) => {
                      const key = dk(d), val = data.days[key]?.[h.id], past = key <= today;
                      return <div key={i} style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 22 }}>
                        {val === "done" ? <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#1D9E75", display: "block" }} />
                          : val === "broken" ? <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#C08620", display: "block" }} />
                            : past ? <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--color-border-tertiary)", opacity: 0.3, display: "block" }} />
                              : <span style={{ width: 12, height: 12, display: "block" }} />}
                      </div>;
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 14, fontSize: 12, color: "var(--color-text-tertiary)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: "#1D9E75", display: "inline-block" }} />Ideal</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: "#C08620", display: "inline-block" }} />Broken</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-border-tertiary)", opacity: 0.3, display: "inline-block" }} />Missed</span>
          </div>

          <div style={{ marginTop: 20, fontSize: 14, fontWeight: 500, marginBottom: 10 }}>Rep counter</div>
          {habits.map(h => {
            const reps = countReps(data.days, h.id);
            const threshold = h.threshold || 60;
            const repPct = Math.min(Math.round((reps / threshold) * 100), 100);
            const readyG = reps >= threshold;
            const idObj = identities.find(id => id.id === h.identity);
            return (
              <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{idObj?.emoji} {h.text}</div>
                  <div style={{ height: 4, background: "var(--color-background-secondary)", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${repPct}%`, background: readyG ? "#1D9E75" : (idObj?.color || "#888"), borderRadius: 2, transition: "width 0.3s" }} />
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: readyG ? "#1D9E75" : "var(--color-text-tertiary)", whiteSpace: "nowrap" }}>{reps}/{threshold}</span>
              </div>
            );
          })}

          <div style={{ marginTop: 20, padding: "16px 18px", background: "var(--color-background-secondary)", borderRadius: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 10 }}>Week stats</div>
            {(() => {
              let ideal = 0, broken = 0, missed = 0;
              wd.forEach(d => { const k = dk(d); if (k > today) return; habits.forEach(h => { const v = data.days[k]?.[h.id]; if (v === "done") ideal++; else if (v === "broken") broken++; else missed++ }) });
              const tot = ideal + broken + missed, lp = tot > 0 ? Math.round(((ideal + broken) / tot) * 100) : 0;
              return <div style={{ display: "flex", textAlign: "center" }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 24, fontWeight: 500, color: "#1D9E75" }}>{lp}%</div><div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>Landed</div></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 24, fontWeight: 500 }}>{ideal}</div><div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>Ideal</div></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 24, fontWeight: 500, color: "#C08620" }}>{broken}</div><div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>Broken</div></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 24, fontWeight: 500, color: "var(--color-text-tertiary)" }}>{missed}</div><div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>Missed</div></div>
              </div>;
            })()}
          </div>
        </div>
      )}

      {tab === "map" && (
        <div style={{ padding: "0 16px 100px" }}>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 2 }}>Identity map</div>
          <div style={{ fontSize: 13, color: "var(--color-text-tertiary)", marginBottom: 20 }}>Tap "Edit" to update when you hit a milestone.</div>

          {identities.map(id => {
            const m = mapData[id.id] || { now: "", next: "" };
            const idGrad = graduated.filter(g => g.identity === id.id);
            const isEditing = editMap === id.id;
            return (
              <div key={id.id} style={{ marginBottom: 12, padding: "16px 18px", borderRadius: 16, background: id.bg, border: `0.5px solid ${id.color}22` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{id.emoji}</span>
                    <span style={{ fontSize: 15, fontWeight: 500, color: id.color }}>{id.label}</span>
                  </div>
                  {!isEditing && id.id !== "nownothow" && (
                    <button onClick={() => { setEditMap(id.id); setMapDraft({ now: m.now, next: m.next }); }}
                      style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, border: `0.5px solid ${id.color}44`, background: "var(--color-background-primary)", color: id.color, cursor: "pointer" }}>Edit</button>
                  )}
                </div>

                {isEditing ? (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 500, color: "#1D9E75", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 }}>Where I am</div>
                    <textarea value={mapDraft.now} onChange={e => setMapDraft(p => ({ ...p, now: e.target.value }))} rows={2}
                      style={{ width: "100%", padding: "8px 10px", fontSize: 13, borderRadius: 8, border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", marginBottom: 8, fontFamily: "inherit", boxSizing: "border-box", resize: "vertical", lineHeight: 1.5 }} />
                    <div style={{ fontSize: 10, fontWeight: 500, color: "#C08620", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 }}>Next milestone</div>
                    <textarea value={mapDraft.next} onChange={e => setMapDraft(p => ({ ...p, next: e.target.value }))} rows={2}
                      style={{ width: "100%", padding: "8px 10px", fontSize: 13, borderRadius: 8, border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", marginBottom: 8, fontFamily: "inherit", boxSizing: "border-box", resize: "vertical", lineHeight: 1.5 }} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => saveMap(id.id)} style={{ flex: 1, padding: "8px", fontSize: 13, fontWeight: 500, borderRadius: 8, border: "none", background: id.color, color: "#fff", cursor: "pointer" }}>Save</button>
                      <button onClick={() => setEditMap(null)} style={{ padding: "8px 16px", fontSize: 13, borderRadius: 8, border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 500, color: "#1D9E75", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 }}>Where I am</div>
                        <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.6 }}>{m.now || "—"}</div>
                      </div>
                      <div style={{ width: 1, background: `${id.color}33`, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 500, color: "#C08620", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 }}>Next milestone</div>
                        <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.6 }}>{m.next || "—"}</div>
                      </div>
                    </div>
                    {idGrad.length > 0 && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `0.5px solid ${id.color}22` }}>
                        <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-tertiary)", marginBottom: 4 }}>Graduated</div>
                        {idGrad.map((g, i) => <div key={i} style={{ fontSize: 12, color: "var(--color-text-tertiary)", lineHeight: 1.5 }}>✓ {g.text} — {g.reps} reps</div>)}
                      </div>
                    )}
                    {id.id === "nownothow" && <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-tertiary)", fontStyle: "italic" }}>Principle — governs everything else.</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "review" && (
        <div style={{ padding: "0 16px 100px" }}>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 2 }}>Sunday review</div>
          <div style={{ fontSize: 13, color: "var(--color-text-tertiary)", marginBottom: 20 }}>20 min max. Be honest. Then rest.</div>
          {[
            { k: "r1", n: "1", label: "Top 3 wins this week", ph: "The reps that made a real difference..." },
            { k: "r2", n: "2", label: "What broke and why", ph: "The real reason behind it..." },
            { k: "r3", n: "3", label: "One thing to fix next week", ph: "Smallest change, biggest impact..." },
            { k: "r4", n: "4", label: "Second Brain distill (Discord inbox)", ph: "Moved X ideas, starred Y, discarded Z..." },
            { k: "r5", n: "5", label: "Next week's #1 priority", ph: "If I only do one thing next week..." },
          ].map(q => (
            <div key={q.k} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 5, display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--color-background-secondary)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--color-text-tertiary)", flexShrink: 0 }}>{q.n}</span>
                {q.label}
              </div>
              <textarea value={data.reflections[`sun-${today}`]?.[q.k] || ""} onChange={e => setSunR(q.k, e.target.value)} placeholder={q.ph} rows={3}
                style={{ width: "100%", padding: "10px 12px", fontSize: 14, borderRadius: 12, border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", lineHeight: 1.5 }} />
            </div>
          ))}
          <div style={{ padding: "14px 16px", background: "var(--color-background-secondary)", borderRadius: 14, fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Monthly check (1st Sunday)</div>
            Update Identity Map if milestone hit · Payday 40/50/10 check · Fund floors: Knowledge RM50, Self-Investment RM80, 试错 RM60 · Net worth snapshot
          </div>
        </div>
      )}

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--color-background-primary)", borderTop: "1px solid var(--color-border-tertiary)", display: "flex", justifyContent: "center", padding: "8px 0 14px", zIndex: 50 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, maxWidth: 90, padding: "4px 0", background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          }}>
            <span style={{ fontSize: 18, opacity: tab === t.key ? 1 : 0.3, transition: "opacity 0.15s" }}>{t.icon}</span>
            <span style={{ fontSize: 11, fontWeight: tab === t.key ? 500 : 400, color: tab === t.key ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
