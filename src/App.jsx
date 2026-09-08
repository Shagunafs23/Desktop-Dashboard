import { useCallback, useEffect, useRef, useState } from "react";
import { JarvisOrb } from "jarvis-ai-web-animation";
import { api, speak, notify, askNotifyPermission, useStored, fmtTime, greeting, localStamp } from "./lib";
import { DRIBBBLE_SEED } from "./dribbbleSeed";

const MODELS = ["sonnet", "opus", "haiku"];

// ---------- icons ----------
const Icon = ({ d, size = 18, sw = 1.8, className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d.split("|").map((p, i) => <path key={i} d={p} />)}
  </svg>
);
const I = {
  home: "M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z",
  mail: "M3 6h18v12H3z|M3 7l9 6 9-6",
  users: "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1|M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z|M21 19v-1a4 4 0 0 0-3-3.9|M15 4.1a3.5 3.5 0 0 1 0 6.8",
  cal: "M4 6h16v14H4z|M4 10h16|M8 3v4|M16 3v4",
  drop: "M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z",
  note: "M6 3h9l4 4v14H6z|M9 12h6|M9 16h6",
  grid: "M5 5h4v4H5z|M15 5h4v4h-4z|M5 15h4v4H5z|M15 15h4v4h-4z",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2|M10 21h4",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2|M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  mic: "M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z|M19 11a7 7 0 0 1-14 0|M12 18v3|M8 21h8",
  check: "M5 12l5 5L20 7",
  right: "M9 6l6 6-6 6",
  left: "M15 6l-6 6 6 6",
  arrow: "M5 12h14|M13 6l6 6-6 6",
  pin: "M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10z|M12 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  refresh: "M20 12a8 8 0 1 1-2.3-5.7|M20 4v5h-5",
  play: "M8 5v14l11-7z",
  up: "M12 19V5|M6 11l6-6 6 6",
  down: "M12 5v14|M6 13l6 6 6-6",
  wind: "M3 8h11a3 3 0 1 0-3-3|M3 12h15a3 3 0 1 1-3 3|M3 16h8a2 2 0 1 1-2 2",
  repo: "M4 4h13a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z|M4 18a2 2 0 0 1 2-2h13|M8 8h6",
  teams: "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1|M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z|M21 19v-1a4 4 0 0 0-3-3.9|M15 4.1a3.5 3.5 0 0 1 0 6.8",
};

// ---------- brand logos ----------
const Logo = {
  gmail: <svg viewBox="0 0 28 28" width="28" height="28"><rect width="28" height="28" rx="7" fill="#fff" /><path d="M5 9.5a1.5 1.5 0 0 1 2.4-1.2L14 13l6.6-4.7A1.5 1.5 0 0 1 23 9.5V19a1.5 1.5 0 0 1-1.5 1.5h-2V12l-5.5 4-5.5-4v8.5h-2A1.5 1.5 0 0 1 5 19z" fill="#ea4335" /><path d="M5 9.5A1.5 1.5 0 0 1 6.5 8h.1L8.5 9.4V20.5h-2A1.5 1.5 0 0 1 5 19z" fill="#4285f4" /><path d="M23 9.5A1.5 1.5 0 0 0 21.5 8h-.1L19.5 9.4v11.1h2A1.5 1.5 0 0 0 23 19z" fill="#34a853" /></svg>,
  outlook: <svg viewBox="0 0 28 28" width="28" height="28"><rect width="28" height="28" rx="7" fill="#0f6cbd" /><rect x="12" y="7" width="11" height="14" rx="1.5" fill="#fff" opacity="0.9" /><rect x="4" y="9" width="12" height="11" rx="2" fill="#1a7fd9" /><ellipse cx="10" cy="14.5" rx="3.2" ry="3.6" fill="none" stroke="#fff" strokeWidth="1.8" /></svg>,
  teams: <svg viewBox="0 0 28 28" width="28" height="28"><rect width="28" height="28" rx="7" fill="#4b53bc" /><rect x="5" y="9" width="13" height="12" rx="2.5" fill="#fff" opacity="0.95" /><text x="11.5" y="18.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#4b53bc" fontFamily="Inter, sans-serif">T</text><circle cx="21" cy="10" r="2.6" fill="#fff" opacity="0.85" /><path d="M17.5 13.5h6a1.5 1.5 0 0 1 1.5 1.5v4.5a3 3 0 0 1-3 3h-4.5z" fill="#fff" opacity="0.75" /></svg>,
  chrome: <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="#fff" /><path d="M12 2a10 10 0 0 1 8.7 5H12a5 5 0 0 0-4.3 2.5L4.6 5.3A10 10 0 0 1 12 2z" fill="#ea4335" /><path d="M4.6 5.3l3.6 6.2a5 5 0 0 0 4.3 5.5L10 21.8A10 10 0 0 1 4.6 5.3z" fill="#34a853" /><path d="M20.7 7A10 10 0 0 1 10 21.8l2.5-4.3A5 5 0 0 0 17 12v-.1L20.7 7z" fill="#fbbc05" /><circle cx="12" cy="12" r="3.6" fill="#4285f4" /></svg>,
  code: <svg viewBox="0 0 24 24" width="20" height="20"><path d="M17 3l4 2v14l-4 2-8-7.2L5 17l-2-1V8l2-1 4 3.2L17 3z" fill="#2fa3ef" /><path d="M17 7.2v9.6L11.5 12 17 7.2z" fill="#0b5ea8" /></svg>,
  explorer: <svg viewBox="0 0 24 24" width="20" height="20"><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v2H3V6z" fill="#f2c94c" /><rect x="3" y="9" width="18" height="10" rx="2" fill="#ffd966" /></svg>,
  terminal: <svg viewBox="0 0 24 24" width="20" height="20"><rect x="3" y="4" width="18" height="16" rx="3" fill="#1f2937" /><path d="M7 9l3 3-3 3M12 15h5" stroke="#9ae6b4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>,
  dribbble: <svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="11" fill="#ea4c89" /><path d="M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zm5.6 3.9a7.2 7.2 0 0 1 1.6 4.4c-.9-.2-2.3-.4-3.9-.2-.2-.5-.4-.9-.6-1.4 1.6-.7 2.5-1.8 2.9-2.8zM12 4.8c1.8 0 3.5.7 4.7 1.8-.4.9-1.2 1.9-2.6 2.5A38 38 0 0 0 11.5 5c.2-.2.3-.2.5-.2zm-1.9.3c.6.9 1.6 2.4 2.7 4.3-3 .8-5.7.8-7.3.7.5-2.3 2.2-4.2 4.6-5zM4.8 12v-.2c1.7 0 4.9 0 8.3-1 .2.4.4.8.6 1.2-3.7 1.1-5.7 4-6.5 5.4A7.2 7.2 0 0 1 4.8 12zm7.2 7.2c-1.6 0-3.1-.5-4.3-1.4.6-1.2 2.3-3.9 5.9-5.1.9 2.4 1.3 4.4 1.5 5.7-1 .5-2 .8-3.1.8zm4.4-1.6c-.2-1.2-.6-3-1.4-5.1 1.5-.2 2.8 0 3.6.2-.3 2-1.1 3.7-2.2 4.9z" fill="#fff" /></svg>,
  instagram: <svg viewBox="0 0 24 24" width="22" height="22"><defs><linearGradient id="igG" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#f9ce34" /><stop offset="0.5" stopColor="#ee2a7b" /><stop offset="1" stopColor="#6228d7" /></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="url(#igG)" /><circle cx="12" cy="12" r="4.5" fill="none" stroke="#fff" strokeWidth="1.8" /><circle cx="17.3" cy="6.7" r="1.2" fill="#fff" /></svg>,
  youtube: <svg viewBox="0 0 24 24" width="24" height="18"><rect x="0.5" y="2" width="23" height="20" rx="6" fill="#ff0000" /><path d="M9.5 7.5v9l7-4.5z" fill="#fff" /></svg>,
  github: <svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.2-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7c-.1-.3-.5-1.3.1-2.7 0 0 .8-.3 2.8 1a9.5 9.5 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .6 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.8-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2z" fill="#fff" /></svg>,
  claude: <svg viewBox="0 0 28 28" width="28" height="28"><rect width="28" height="28" rx="7" fill="#d97757" /><path d="M14 5.5l1.6 5.3 4.4-3.4-3.4 4.4 5.3 1.6-5.3 1.6 3.4 4.4-4.4-3.4L14 22.5l-1.6-5.3-4.4 3.4 3.4-4.4-5.3-1.6 5.3-1.6-3.4-4.4 4.4 3.4z" fill="#fff" /></svg>,
  markets: <svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 17l5-6 4 3 5-7 4 4" fill="none" stroke="#34d399" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M3 17l5-6 4 3 5-7 4 4V20H3z" fill="rgba(52,211,153,0.25)" /></svg>,
};

// Muted looping video that survives strict autoplay policies: sets muted on the element itself,
// retries play when data arrives or the tab becomes visible, and on the first click or key press.
function LoopVideo({ src, className, onFail }) {
  const ref = useRef();
  useEffect(() => {
    const v = ref.current; if (!v) return;
    v.muted = true; v.defaultMuted = true; v.playsInline = true; v.loop = true;
    let alive = true;
    const tryPlay = () => { if (!alive || !v.paused) return; v.play().catch(() => {}); };
    const events = ["loadeddata", "canplay", "canplaythrough"];
    events.forEach((e) => v.addEventListener(e, tryPlay));
    const wake = () => tryPlay();
    document.addEventListener("pointerdown", wake); document.addEventListener("keydown", wake); document.addEventListener("visibilitychange", wake);
    const id = setInterval(tryPlay, 3000);
    v.load(); tryPlay();
    return () => { alive = false; clearInterval(id); events.forEach((e) => v.removeEventListener(e, tryPlay));
      document.removeEventListener("pointerdown", wake); document.removeEventListener("keydown", wake); document.removeEventListener("visibilitychange", wake); };
  }, [src]);
  return <video ref={ref} className={className} src={src} autoPlay muted loop playsInline preload="auto" onError={onFail} aria-hidden="true" />;
}

// ---------- Weather (Open-Meteo, no key). Bangalore, India ----------
const CITY = { name: "Bangalore, India", lat: 12.9716, lon: 77.5946, tz: "Asia/Kolkata" };
const WMO = (c) => c === 0 ? ["Clear sky", "sun"] : c <= 2 ? ["Partly cloudy", "partly"] : c === 3 ? ["Overcast", "cloud"]
  : c <= 48 ? ["Foggy", "fog"] : c <= 57 ? ["Drizzle", "rain"] : c <= 67 ? ["Rain", "rain"] : c <= 77 ? ["Snow", "cloud"]
  : c <= 82 ? ["Showers", "rain"] : ["Thunderstorm", "storm"];
const AQI_LABEL = (v) => v <= 50 ? "Good" : v <= 100 ? "Moderate" : v <= 150 ? "Unhealthy for sensitive groups" : v <= 200 ? "Unhealthy" : v <= 300 ? "Very unhealthy" : "Hazardous";

function AnimatedWeather({ kind, small }) {
  const hasSun = kind === "sun" || kind === "partly";
  const hasCloud = kind !== "sun";
  return (
    <div className={"wxi " + kind + (small ? " small" : "")} aria-hidden="true">
      {hasSun && <div className="wxi-sun"><i /></div>}
      {hasCloud && <div className="wxi-cloud"><b /><b /><b /><s /></div>}
      {kind === "rain" && <div className="wxi-drops"><i /><i /><i /></div>}
      {kind === "storm" && <div className="wxi-bolt" />}
      {kind === "fog" && <div className="wxi-fog"><i /><i /></div>}
    </div>
  );
}

function useWeather() {
  const [w, setW] = useState(null);
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const q = `latitude=${CITY.lat}&longitude=${CITY.lon}&timezone=${encodeURIComponent(CITY.tz)}`;
        const [f, a] = await Promise.all([
          fetch(`https://api.open-meteo.com/v1/forecast?${q}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&forecast_days=1`).then((r) => r.json()),
          fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${q}&current=us_aqi,pm2_5`).then((r) => r.json()),
        ]);
        if (!alive) return;
        const [label, icon] = WMO(f.current.weather_code);
        setW({ temp: Math.round(f.current.temperature_2m), feels: Math.round(f.current.apparent_temperature), humidity: f.current.relative_humidity_2m,
          wind: Math.round(f.current.wind_speed_10m), hi: Math.round(f.daily.temperature_2m_max[0]), lo: Math.round(f.daily.temperature_2m_min[0]),
          label, icon, aqi: Math.round(a.current.us_aqi), pm25: Math.round(a.current.pm2_5) });
      } catch { if (alive) { setW((prev) => prev || { error: true }); setTimeout(() => alive && load(), 30e3); } }
    }
    load();
    const id = setInterval(load, 10 * 60e3);
    return () => { alive = false; clearInterval(id); };
  }, []);
  return w;
}

function WeatherCard({ w }) {
  return (
    <section id="tile-weather" className="card">
      <LoopVideo className="wxVideo" src="/rain.mp4" />
      <div className="wxTint" aria-hidden="true" />
      <div className="cardHead"><h2><Icon d={I.pin} size={16} />{CITY.name}</h2></div>
      {!w ? <p className="muted small">Checking</p> : w.error ? <p className="muted small">Weather unavailable</p> : (
        <>
          <div className="wx">
            <AnimatedWeather kind={w.icon} />
            <div>
              <p className="temp">{w.temp}°C</p>
              <p className="cond">{w.label}</p>
            </div>
          </div>
          <div className="wxMeta">
            <div className="hl"><span><Icon d={I.up} size={14} />H: {w.hi}°</span><span><Icon d={I.down} size={14} />L: {w.lo}°</span></div>
            <span><Icon d={I.drop} size={14} />{w.humidity}%&nbsp; Humidity</span>
            <span><Icon d={I.wind} size={14} />{w.wind} km/h&nbsp; Wind</span>
          </div>
          <span className="aqi">AQI {w.aqi} - {AQI_LABEL(w.aqi)}</span>
        </>)}
    </section>
  );
}

// ---------- Gold + USD/INR (gold-api.com, open.er-api.com) ----------
const OZ = 31.1035;
const rs = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
function useGold() {
  const [g, setG] = useState(null);
  const day = new Date().toDateString();
  const [open, setOpen] = useStored("jarvis.gold.open." + day, 0);
  const [fxOpen, setFxOpen] = useStored("jarvis.fx.open." + day, 0);
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const [x, fx] = await Promise.all([
          fetch("https://api.gold-api.com/price/XAU").then((r) => r.json()),
          fetch("https://open.er-api.com/v6/latest/USD").then((r) => r.json()),
        ]);
        if (!alive) return;
        const inr = fx.rates?.INR;
        const g24 = x.price / OZ * inr;
        setG({ usd: x.price, inr, g24, g22: g24 * 0.916 });
        setOpen((o) => o || g24);
        setFxOpen((o) => o || inr);
      } catch { if (alive) setG((p) => p || { error: true }); }
    }
    load();
    const id = setInterval(load, 5 * 60e3);
    return () => { alive = false; clearInterval(id); };
  }, [setOpen, setFxOpen]);
  const ok = g && !g.error;
  return { g, goldPct: ok && open ? (g.g24 - open) / open * 100 : 0, fxPct: ok && fxOpen ? (g.inr - fxOpen) / fxOpen * 100 : 0 };
}

// ---------- Stocks (backend proxies Yahoo Finance) ----------
function useStocks() {
  const [s, setS] = useState(null);
  useEffect(() => {
    let alive = true;
    const load = () => api("/api/stocks").then((d) => alive && setS(d)).catch((e) => alive && setS((p) => (Array.isArray(p) ? p : { error: e.message })));
    load(); const id = setInterval(load, 60e3);
    return () => { alive = false; clearInterval(id); };
  }, []);
  return s;
}
const fmtN = (n, d = 2) => n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
function Spark({ data, up }) {
  if (!data || data.length < 2) return <span />;
  const min = Math.min(...data), max = Math.max(...data), w = 44, h = 18;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * (h - 2) - 1}`).join(" ");
  return <svg className="spark" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true"><polyline points={pts} fill="none" stroke={up ? "#34d399" : "#f87171"} strokeWidth="1.5" strokeLinejoin="round" /></svg>;
}
function MarketsCard({ stocks }) {
  return (
    <section id="tile-stocks" className="card">
      <div className="cardHead"><span className="iconBox">{Logo.markets}</span><h2>Markets</h2><span className="status"><i />NSE · BSE</span></div>
      {!stocks ? <p className="muted small">Checking</p> : stocks.error ? <p className="muted small">Quotes unavailable: {stocks.error}</p> : (
        <div className="stockScroll"><ul className="stocks">
          {[...stocks, ...stocks].map((q, i) => {
            const up = q.change >= 0;
            return (
              <li key={q.symbol + i} className="row">
                <b>{q.name}</b>
                <Spark data={q.spark} up={up} />
                <span className="px">{fmtN(q.price, q.price > 1000 ? 0 : 2)}</span>
                <span className={"chg " + (up ? "up" : "down")}>{up ? "▲" : "▼"} {up ? "+" : "-"}{fmtN(Math.abs(q.pct))}%</span>
              </li>);
          })}
        </ul></div>)}
    </section>
  );
}

// ---------- Gmail (backend IMAP) ----------
function useGmail(announce) {
  const [g, setG] = useState(null);
  const seen = useRef(null);
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const d = await api("/api/gmail");
        if (!alive) return;
        setG(d);
        if (d.configured && !d.error) {
          if (seen.current !== null && d.unread > seen.current) {
            const newest = d.items[0];
            announce("New mail", newest ? `${newest.from}: ${newest.subject}` : `${d.unread - seen.current} new messages`);
          }
          seen.current = d.unread;
        }
      } catch (e) { if (alive) setG({ configured: true, error: e.message }); }
    }
    load();
    const id = setInterval(load, 60e3);
    return () => { alive = false; clearInterval(id); };
  }, [announce]);
  return g;
}

// ---------- Water timer ----------
function useWater(announce) {
  const [on, setOn] = useStored("jarvis.water.on", true);
  const [mins] = useStored("jarvis.water.mins", 45);
  const [nextAt, setNextAt] = useStored("jarvis.water.next", 0);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!on) return;
    if (!nextAt || nextAt < Date.now() - mins * 60e3) setNextAt(Date.now() + mins * 60e3);
    const id = setInterval(() => {
      tick((t) => t + 1);
      if (nextAt && Date.now() >= nextAt) { announce("Water break", "Drink a glass of water, Shagun."); setNextAt(Date.now() + mins * 60e3); }
    }, 5000);
    return () => clearInterval(id);
  }, [on, mins, nextAt, announce, setNextAt]);
  const toggle = () => { askNotifyPermission(); setOn(!on); setNextAt(!on ? Date.now() + mins * 60e3 : 0); };
  return { on, nextAt, mins, toggle, soon: on && nextAt && nextAt - Date.now() < 10 * 60e3 };
}

// ---------- Speech recognition (Web Speech API) ----------
function useSpeech(onText) {
  const [listening, setListening] = useState(false);
  const rec = useRef();
  const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const start = () => {
    if (!SR) return;
    if (listening) { rec.current?.stop(); return; }
    const r = new SR(); r.lang = "en-AU"; r.interimResults = false;
    r.onresult = (e) => { const t = e.results[0]?.[0]?.transcript; if (t) onText(t); };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r; r.start(); setListening(true);
  };
  return { listening, start, supported: !!SR };
}

// ---------- Day plan ----------
const DAY_PLAN = [["04:30", "Day starts"], ["06:20", "Break"], ["08:30", "Lunch"], ["11:10", "Snacks time"], ["12:30", "Logout, day over"]];
const PAUSES = new Set(["Break", "Lunch", "Snacks time"]);
const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const fmtLeft = (m) => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;

function DayPlanCard({ announce }) {
  const [now, setNow] = useState(new Date());
  const fired = useRef(new Set());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 15000); return () => clearInterval(id); }, []);
  const cur = now.getHours() * 60 + now.getMinutes();
  useEffect(() => {
    for (const [t, label] of DAY_PLAN) {
      const key = now.toDateString() + t;
      if (cur === toMin(t) && !fired.current.has(key)) {
        fired.current.add(key);
        announce(PAUSES.has(label) ? (label.endsWith("time") ? label : label + " time") : label, PAUSES.has(label) ? "Step away for a few minutes, Shagun." : `It is ${t}. ${label}.`);
      }
    }
  }, [cur, now, announce]);
  const nextIdx = DAY_PLAN.findIndex(([t]) => toMin(t) > cur);
  const next = DAY_PLAN[nextIdx];
  const left = next ? toMin(next[0]) - cur : 0;
  return (
    <section id="tile-plan" className="card">
      <div className="cardHead">
        <span className="iconBox"><Icon d={I.cal} /></span><h2>Day Plan</h2>
        <span className="pill dark"><Icon d={I.refresh} size={12} />{next ? `${next[1].replace(", day over", "")} in ${fmtLeft(left)}` : "Day over"}</span>
      </div>
      <ul className="rows plan">
        {DAY_PLAN.map(([t, label], n) => {
          const state = toMin(t) <= cur ? "done" : n === nextIdx ? "next" : "";
          return (
            <li key={t} className={"row " + state}>
              <b>{t}</b><span>{label}</span>
              {state === "done" ? <Icon d={I.check} className="chk" /> : state === "next" ? <Icon d={I.right} /> : <span />}
            </li>);
        })}
      </ul>
    </section>
  );
}

// ---------- Reminders ----------
function RemindersCard({ reminders, setReminders, outlook, water }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [when, setWhen] = useState(() => localStamp(new Date(Date.now() + 3600e3)).replace(" ", "T"));
  async function add(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setReminders(await api("/api/reminders", { when: when.replace("T", " "), text }));
    setText("");
  }
  const t12 = (d) => new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const items = [];
  if (water.on && water.nextAt) items.push({ k: "water", icon: <Icon d={I.drop} />, title: "Drink water", sub: "Stay healthy & energized", time: t12(water.nextAt) });
  const today = new Date().toDateString();
  for (const a of (outlook?.calendar || []).filter((a) => new Date(a.start).toDateString() === today && new Date(a.end) > new Date()).slice(0, 2)) {
    items.push({ k: "cal" + a.start, icon: <Icon d={I.cal} />, title: a.subject, sub: a.location || "Outlook calendar", time: t12(a.start) });
  }
  const pending = reminders.filter((r) => !r.done).sort((a, b) => a.when.localeCompare(b.when));
  for (const r of pending) items.push({ k: "rem" + r.index, icon: <Icon d={I.bell} />, title: r.text, sub: "Reminder · " + r.when.slice(5, 10), time: t12(r.when.replace(" ", "T")), index: r.index });
  const shown = open ? items : items.slice(0, 2);
  return (
    <section id="tile-list" className="card">
      <div className="cardHead"><span className="iconBox"><Icon d={I.bell} /></span><h2>Reminders</h2><span className="count">{items.length}</span></div>
      <ul className="rows">
        {shown.length === 0 && <li className="muted small">Nothing pending.</li>}
        {shown.map((it) => (
          <li key={it.k} className="row">
            <span className="rIcon">{it.icon}</span>
            <span className="rText"><b>{it.title}</b><span>{it.sub}</span></span>
            <span className="rTime">{it.time}</span>
            {it.index != null
              ? <button className="radio" title="Mark done" onClick={async () => setReminders(await api("/api/reminders/toggle", { index: it.index }))} />
              : <span className="radio" />}
          </li>))}
      </ul>
      {open && (
        <form className="addForm" onSubmit={add}>
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          <div className="line">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Remind me to" />
            <button className="btnAccent" disabled={!text.trim()}>Add</button>
          </div>
        </form>)}
      <button className="viewAll" onClick={() => setOpen(!open)}>{open ? "Show less" : "View all reminders"}<Icon d={I.arrow} size={14} /></button>
    </section>
  );
}

// ---------- Quote of the day (rotates daily, no network) ----------
const QUOTES = [
  ["The secret of getting ahead is getting started.", "Mark Twain"],
  ["Simplicity is the ultimate sophistication.", "Leonardo da Vinci"],
  ["Well done is better than well said.", "Benjamin Franklin"],
  ["Focus on being productive instead of busy.", "Tim Ferriss"],
  ["Design is not just what it looks like. Design is how it works.", "Steve Jobs"],
  ["What you do today can improve all your tomorrows.", "Ralph Marston"],
  ["Small daily improvements are the key to staggering long-term results.", "Robin Sharma"],
  ["Make each day your masterpiece.", "John Wooden"],
  ["Action is the foundational key to all success.", "Pablo Picasso"],
  ["Done is better than perfect.", "Sheryl Sandberg"],
  ["Creativity is intelligence having fun.", "Albert Einstein"],
  ["The best way to predict the future is to create it.", "Peter Drucker"],
  ["Quality is not an act, it is a habit.", "Aristotle"],
  ["Either you run the day or the day runs you.", "Jim Rohn"],
  ["Great things are done by a series of small things brought together.", "Vincent van Gogh"],
  ["Stay hungry, stay foolish.", "Steve Jobs"],
  ["It always seems impossible until it is done.", "Nelson Mandela"],
  ["Do what you can, with what you have, where you are.", "Theodore Roosevelt"],
  ["Discipline is choosing between what you want now and what you want most.", "Abraham Lincoln"],
  ["Every great design begins with an even better story.", "Lorinda Mamo"],
  ["Start where you are. Use what you have. Do what you can.", "Arthur Ashe"],
  ["A goal without a plan is just a wish.", "Antoine de Saint-Exupery"],
  ["Energy and persistence conquer all things.", "Benjamin Franklin"],
  ["Whether you think you can or you think you can't, you're right.", "Henry Ford"],
];
function QuoteCard() {
  const d = new Date(); const day = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
  const [text, author] = QUOTES[day % QUOTES.length];
  return (
    <section id="tile-quote" className="card">
      <div className="cardHead"><span className="iconBox"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M7.5 6C5 6 3 8 3 10.5V18h7v-7H6.5c0-1.4 1-2.5 2.5-2.5V6H7.5zm10 0C15 6 13 8 13 10.5V18h7v-7h-3.5c0-1.4 1-2.5 2.5-2.5V6h-1.5z" /></svg></span><h2>Quote of the day</h2></div>
      <p className="quote">"{text}"</p>
      <p className="quoteBy">{author}</p>
    </section>
  );
}

// ---------- Dribbble ----------
function DribbbleCard() {
  const [shots, setShots] = useState(DRIBBBLE_SEED);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => { api("/api/dribbble").then((list) => { if (Array.isArray(list) && list.length >= 4) setShots(list); }).catch(() => {}); }, []);
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setI((n) => (n + 1) % shots.length), 5000);
    return () => clearInterval(id);
  }, [paused, shots.length]);
  const shot = shots[i];
  return (
    <section id="tile-dribbble" className="card">
      <div className="cardHead"><span className="iconBox">{Logo.dribbble}</span><h2>Dribbble</h2>
        <a className="linkBtn" href="https://dribbble.com/shots/popular/web-design" target="_blank" rel="noopener noreferrer">View more <Icon d={I.arrow} /></a></div>
      <a className="shotStage" href={shot.url} target="_blank" rel="noopener noreferrer" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} title={shot.title}>
        {shots.map((s, n) => <img key={s.url} src={s.image} alt="" loading={Math.abs(n - i) <= 1 ? "eager" : "lazy"} className={n === i ? "on" : ""} />)}
        <span className="shotCap"><span>{shot.title}</span><i><Icon d={I.right} /></i></span>
      </a>
      <div className="shotDots" aria-hidden="true">
        {shots.slice(0, 5).map((s, n) => <i key={s.url} className={n === i % 5 ? "on" : ""} onClick={() => setI(n)} />)}
      </div>
    </section>
  );
}

// ---------- Calendar ----------
function CalendarCard({ outlook }) {
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [picked, setPicked] = useState(today.toDateString());
  const first = new Date(view.y, view.m, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const byDay = {};
  for (const a of outlook?.calendar || []) { const k = new Date(a.start).toDateString(); (byDay[k] ||= []).push(a); }
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => new Date(view.y, view.m, i + 1))];
  const shift = (d) => setView(({ y, m }) => { const n = new Date(y, m + d, 1); return { y: n.getFullYear(), m: n.getMonth() }; });
  const ev = byDay[picked] || [];
  return (
    <section id="tile-cal" className="card">
      <div className="cardHead"><span className="iconBox"><Icon d={I.cal} /></span><h2>Calendar</h2></div>
      <div className="calNav">
        <b>{first.toLocaleDateString("en-AU", { month: "long", year: "numeric" })}</b>
        <div className="arrows">
          <button onClick={() => shift(-1)} aria-label="Previous month"><Icon d={I.left} /></button>
          <button onClick={() => shift(1)} aria-label="Next month"><Icon d={I.right} /></button>
        </div>
      </div>
      <div className="calGrid">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <span key={d} className="dow">{d}</span>)}
        {cells.map((d, i) => d ? (
          <button key={i}
            className={"day" + (d.toDateString() === today.toDateString() ? " today" : "") + (d.toDateString() === picked ? " picked" : "") + (byDay[d.toDateString()] ? " has" : "")}
            onClick={() => setPicked(d.toDateString())}>{d.getDate()}</button>
        ) : <span key={i} />)}
      </div>
      {ev.length > 0 && <div className="dayEvents">{ev.slice(0, 3).map((a, i) => <span key={i}><b>{fmtTime(a.start)}</b> {a.subject}</span>)}</div>}
    </section>
  );
}

// ---------- GitHub: profile link ----------
const GH_URL = "https://github.com/smishrashopamarketing2026-wq";
function GitHubLinkCard() {
  return (
    <a id="tile-github" className="card ghLink" href={GH_URL} target="_blank" rel="noopener noreferrer">
      <span className="iconBox">{Logo.github}</span>
      <span className="ghText"><b>GitHub</b><span>{GH_URL.replace("https://", "")}</span></span>
      <Icon d={I.arrow} size={18} />
    </a>
  );
}

// ---------- Magnific: quick link ----------
const MAGNIFIC = "https://www.magnific.com/";
function MagnificCard() {
  const logo = <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><defs><linearGradient id="mgG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff7ac6" /><stop offset="1" stopColor="#7c5cff" /></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="url(#mgG)" /><path d="M7 16.5V7.5l5 5 5-5v9" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  return (
    <section id="tile-magnific" className="card">
      <div className="cardHead"><span className="iconBox">{logo}</span><h2>Magnific</h2>
        <a className="linkBtn" href={MAGNIFIC} target="_blank" rel="noopener noreferrer">Open <Icon d={I.arrow} /></a></div>
      <a className="mgStage" href={MAGNIFIC} target="_blank" rel="noopener noreferrer">
        <b>Magnific</b><span>AI upscaler and enhancer</span>
      </a>
    </section>
  );
}

// ---------- Instagram: profile embed ----------
const INSTA = { handle: "webdesignssphere", url: "https://www.instagram.com/webdesignssphere/" };
function InstagramCard() {
  const box = useRef();
  const [dim, setDim] = useState({ scale: 1, h: 220 });
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => { const scale = Math.min(1, el.clientWidth / 360); setDim({ scale, h: Math.max(220, Math.round(el.clientHeight / scale)) }); });
    ro.observe(el); return () => ro.disconnect();
  }, []);
  return (
    <section id="tile-insta" className="card">
      <div className="cardHead"><span className="iconBox">{Logo.instagram}</span><h2>Instagram</h2>
        <a className="linkBtn" href={INSTA.url} target="_blank" rel="noopener noreferrer">View all <Icon d={I.arrow} /></a></div>
      <div className="igFrame" ref={box}>
        <iframe src={`https://www.instagram.com/${INSTA.handle}/embed/`} title={"Instagram " + INSTA.handle} loading="lazy" style={{ width: 360, height: dim.h, transform: `scale(${dim.scale})`, transformOrigin: "0 0" }} />
      </div>
    </section>
  );
}

// ---------- YouTube ----------
function parseYouTube(s) {
  const m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/) || s.match(/^([\w-]{11})$/);
  return m ? m[1] : null;
}
function YouTubeCard() {
  const DEFAULT_VIDEO = { id: "Ut5QB8G7Su0", title: "Latest News Today", sub: "" };
  const [current, setCurrent] = useState(DEFAULT_VIDEO);
  const [playing, setPlaying] = useState(false);
  const [url, setUrl] = useState("");
  const linkId = parseYouTube(url.trim());
  function go(e) { e.preventDefault(); if (linkId) { setCurrent({ id: linkId, title: "YouTube video", sub: url.trim() }); setPlaying(true); setUrl(""); } }
  return (
    <section id="tile-play" className="card">
      <div className="cardHead"><span className="iconBox">{Logo.youtube}</span><h2>YouTube</h2>
        <a className="linkBtn" href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer">View all <Icon d={I.arrow} /></a></div>
      <div className="ytBody">
        <div className="player">
          {playing
            ? <iframe src={`https://www.youtube.com/embed/${current.id}?rel=0&autoplay=1`} title={current.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            : <button className="thumbPlay" onClick={() => setPlaying(true)} aria-label="Play">
                <img src={`https://img.youtube.com/vi/${current.id}/hqdefault.jpg`} alt="" />
                <span className="playGlass"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6.5v11l9-5.5z" fill="currentColor" /></svg></span>
              </button>}
        </div>
        <div className="ytSide">
          <div className="ytMeta">
            <div className="txt"><b>{current.title}</b>{current.sub && <span>{current.sub}</span>}</div>
            {playing && <button className="pill" onClick={() => { setPlaying(false); setCurrent(DEFAULT_VIDEO); }}>stop</button>}
          </div>
          <form className="ytLink" onSubmit={go}>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a YouTube link" />
            <button disabled={!linkId}>Play</button>
          </form>
        </div>
      </div>
    </section>
  );
}

// ---------- Jarvis chat ----------
const QUICK = [
  ["Joke", "Tell me a quick joke."],
  ["Fun fact", "Give me one surprising fun fact."],
  ["Motivate me", "Give me a short, punchy motivational nudge for right now."],
  ["Riddle", "Give me a riddle. Do not reveal the answer until I ask."],
  ["My day", "What is on my day today? Keep it brief and add one tip."],
];
const IDLE_MIN = 25;
const NUDGE_PROMPT = "(Idle check-in: I have been quiet for a while. Say one short, delightful thing to me: a witty observation, a fun fact, or a nudge about my next break or meeting from the context. Under 35 words. Optionally end with one quick question.)";
const WELCOME = [
  "Your AI is online and caffeinated. Let's make today count.",
  "Systems are green. Say the word and I'm on it.",
  "I've had a look at your day. Ask me whenever you're ready.",
  "Good to see you. Tap the joke button if the day needs a boost.",
];
function JarvisCard({ mood, setMood, flash, model, voice, onReminders, brief, dictation }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState(null);
  const endRef = useRef();
  useEffect(() => { if (msgs.length) endRef.current?.scrollIntoView({ block: "end" }); }, [msgs]);

  const send = useCallback(async (text) => {
    text = text.trim();
    if (!text || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "you", text }]);
    setBusy(true); setMood("thinking");
    try {
      const r = await api("/api/chat", { message: text, model, sessionId: session });
      setSession(r.sessionId);
      setMsgs((m) => [...m, { role: "jarvis", text: r.reply }]);
      if (r.added) onReminders();
      flash("success");
      speak(r.reply, voice);
    } catch (err) {
      setMsgs((m) => [...m, { role: "jarvis", text: "Something went wrong: " + err.message, error: true }]);
      flash("alert");
    } finally { setBusy(false); }
  }, [busy, model, session, setMood, flash, onReminders, voice]);

  // Text dictated from the header or the input mic arrives here.
  const lastDict = useRef(0);
  useEffect(() => { if (dictation && dictation.id !== lastDict.current) { lastDict.current = dictation.id; send(dictation.text); } }, [dictation, send]);
  const mic = useSpeech((t) => send(t));

  // Engagement: Jarvis checks in on its own after a quiet stretch (tab visible, not mid-reply).
  const lastActive = useRef(Date.now());
  const lastNudge = useRef(Date.now());
  useEffect(() => {
    const touch = () => { lastActive.current = Date.now(); };
    document.addEventListener("pointerdown", touch); document.addEventListener("keydown", touch);
    const id = setInterval(() => {
      const quiet = Date.now() - lastActive.current, sinceNudge = Date.now() - lastNudge.current;
      if (document.hidden || busy || quiet < IDLE_MIN * 60e3 || sinceNudge < IDLE_MIN * 60e3) return;
      lastNudge.current = Date.now();
      setBusy(true); setMood("thinking");
      api("/api/chat", { message: NUDGE_PROMPT, model: "haiku", sessionId: session })
        .then((r) => { setSession(r.sessionId); setMsgs((m) => [...m, { role: "jarvis", text: r.reply }]); flash("success"); speak(r.reply, voice); })
        .catch(() => {})
        .finally(() => setBusy(false));
    }, 60e3);
    return () => { clearInterval(id); document.removeEventListener("pointerdown", touch); document.removeEventListener("keydown", touch); };
  }, [busy, session, voice, flash, setMood]);

  // Spoken welcome once per session, on the first click or key press (browsers block speech before that).
  useEffect(() => {
    if (!voice || sessionStorage.getItem("jarvis.welcomed")) return;
    const hello = () => { sessionStorage.setItem("jarvis.welcomed", "1"); speak(`${greeting()}, Shagun. ${WELCOME[Math.floor(Math.random() * WELCOME.length)]}`, true); off(); };
    const off = () => { document.removeEventListener("pointerdown", hello); document.removeEventListener("keydown", hello); };
    document.addEventListener("pointerdown", hello); document.addEventListener("keydown", hello);
    return off;
  }, [voice]);

  return (
    <section id="tile-chat" className="card">
      <div className="jHead">
        <div className="orbRing lg"><JarvisOrb size="avatar" state={mood} palette="cyan" breathing interactive={false} /></div>
        <div className="jName"><h2>Shagun's AI</h2><p>Your AI Assistant</p></div>
        <span className={"status " + (busy ? "busy" : "")}><i />{busy ? "Thinking" : "Online"}</span>
      </div>
      <div className="thread">
        <div className="msg jarvis">{greeting()}, Shagun,{"\n"}Hope you have a productive day!{"\n"}Here's your quick update for today:</div>
        <ul className="update">
          {brief.map((b, i) => <li key={i}><span className="chk"><Icon d={I.check} sw={2.6} /></span>{b}</li>)}
        </ul>
        {msgs.map((m, i) => <div key={i} className={"msg " + m.role + (m.error ? " err" : "")}>{m.text}</div>)}
        <div ref={endRef} />
      </div>
      <div className="quick" aria-label="Quick prompts">
        {QUICK.map(([label, text]) => <button key={label} type="button" onClick={() => send(text)} disabled={busy}>{label}</button>)}
      </div>
      <form className="askBar" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <button type="button" className={"micBtn " + (mic.listening ? "on" : "")} onClick={mic.start} title={mic.supported ? "Speak" : "Voice input not supported"} disabled={!mic.supported}><Icon d={I.mic} size={20} /></button>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={busy ? "Thinking..." : mic.listening ? "Listening..." : "Ask me anything..."} disabled={busy} />
        <button className="go" disabled={busy || !input.trim()} aria-label="Send"><Icon d={I.right} sw={2.2} /></button>
      </form>
    </section>
  );
}

// ---------- Rail (dock) ----------
const APPS = [
  { k: "chrome", label: "Chrome", icon: Logo.chrome },
  { k: "code", label: "VS Code", icon: Logo.code },
  { k: "explorer", label: "File Explorer", icon: Logo.explorer },
  { k: "terminal", label: "Command Prompt", icon: Logo.terminal },
];
function Rail({ active, jump, launch, busyApp, water }) {
  const [menu, setMenu] = useState(false);
  const nav = useRef();
  useEffect(() => { if (!menu) return; const h = () => setMenu(false); document.addEventListener("click", h); return () => document.removeEventListener("click", h); }, [menu]);
  // macOS-style dock magnification: icons near the cursor grow and push their neighbours apart.
  function magnify(e) {
    const btns = [...nav.current.querySelectorAll(".dockBtn")];
    const scales = btns.map((b) => { const r = b.getBoundingClientRect(); const d = Math.abs(e.clientY - (r.top + r.height / 2)); return 1 + 0.55 * Math.max(0, 1 - d / 120); });
    btns.forEach((b, i) => {
      const before = scales.slice(0, i).reduce((s, v) => s + (v - 1), 0), after = scales.slice(i + 1).reduce((s, v) => s + (v - 1), 0);
      b.style.transform = `translate(${(scales[i] - 1) * 16}px, ${(before - after) * 20}px) scale(${scales[i]})`;
      b.style.zIndex = scales[i] > 1.02 ? 2 : "";
    });
  }
  function relax() { nav.current.querySelectorAll(".dockBtn").forEach((b) => { b.style.transform = ""; b.style.zIndex = ""; }); }
  const btn = (k, title, icon, onClick, cls = "") => (
    <button title={title} className={"dockBtn " + cls + (active === k ? " on" : "") + (busyApp === k ? " busy" : "")} onClick={onClick}>{icon}</button>
  );
  return (
    <nav className="rail">
      <div className="railLogo"><JarvisOrb size="avatar" state="idle" palette="cyan" breathing interactive={false} /></div>
      <div className="dock" ref={nav} onMouseMove={magnify} onMouseLeave={relax}>
        {btn("chat", "Home", <Icon d={I.home} />, () => jump("chat"))}
        {btn("outlook", "Outlook", Logo.outlook, () => launch({ k: "outlook", label: "Outlook" }))}
        {btn("teams", "Microsoft Teams", Logo.teams, () => launch({ k: "teams", label: "Teams", url: "https://teams.microsoft.com/v2/" }))}
        {btn("gmail", "Gmail", Logo.gmail, () => launch({ k: "gmail", label: "Gmail", url: "https://mail.google.com/mail/u/0/#inbox" }))}
        {btn("claude", "Claude", Logo.claude, () => launch({ k: "claude", label: "Claude", url: "https://claude.ai/new" }))}
        {btn("cal", "Calendar", <Icon d={I.cal} />, () => jump("cal"))}
        <button title={water.on ? "Water reminders on" : "Water reminders off"} className={"dockBtn water" + (water.on ? " on" : "")} onClick={water.toggle}><Icon d={I.drop} /></button>
        {btn("notepad", "Notepad", <Icon d={I.note} />, () => launch({ k: "notepad", label: "Notepad" }))}
        <div className="railWrap">
          <button title="Apps" className={"dockBtn " + (menu ? "on" : "")} onClick={(e) => { e.stopPropagation(); setMenu(!menu); }}><Icon d={I.grid} /></button>
          {menu && (
            <div className="railMenu" onClick={(e) => e.stopPropagation()}>
              {APPS.map((ap) => <button key={ap.k} onClick={() => { launch(ap); setMenu(false); }}>{ap.icon}{ap.label}</button>)}
            </div>)}
        </div>
      </div>
      <div className="railFoot">
        <div className="mini"><JarvisOrb size="avatar" state="idle" palette="cyan" breathing interactive={false} /></div>
        <b>Shagun's AI</b>
      </div>
    </nav>
  );
}

// ---------- Header ----------
function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <p className="date">
      {now.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      <i>•</i>
      <span className="mono">{now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
    </p>
  );
}

function Header({ mood, voice, setVoice, model, setModel, refreshOutlook, refreshing, log, onDictation }) {
  const [pop, setPop] = useState("");
  useEffect(() => { if (!pop) return; const h = () => setPop(""); document.addEventListener("click", h); return () => document.removeEventListener("click", h); }, [pop]);
  const mic = useSpeech(onDictation);
  return (
    <header className="top">
      <div className="who">
        <div className="orbRing xl"><JarvisOrb size="avatar" state={mood} palette="cyan" breathing interactive={false} /></div>
        <div>
          <h1>{greeting()}, <b>Shagun</b></h1>
          <Clock />
        </div>
      </div>
      <div className="controls" onClick={(e) => e.stopPropagation()}>
        <div className={"listen " + (mic.listening ? "on" : "")}>
          <span className="bars" aria-hidden="true"><i /><i /><i /><i /><i /></span>
          <span>{mic.listening ? "Listening..." : mic.supported ? "Tap mic to talk" : "Voice input unavailable"}</span>
          <button className="mic" onClick={mic.start} disabled={!mic.supported} title="Talk to Jarvis"><Icon d={I.mic} size={18} /></button>
        </div>
        <button className={"round " + (pop === "gear" ? "on" : "")} title="Settings" onClick={() => setPop(pop === "gear" ? "" : "gear")}><Icon d={I.gear} size={20} sw={1.6} /></button>
        <button className={"round " + (pop === "bell" ? "on" : "")} title="Notifications" onClick={() => setPop(pop === "bell" ? "" : "bell")}><Icon d={I.bell} size={20} />{log.length > 0 && <span className="badge" />}</button>
        <button className="round avatarBtn" title="Shagun">S</button>
        {pop === "gear" && (
          <div className="pop">
            <h3>Settings</h3>
            <p className="label">Model</p>
            <div className="seg" role="radiogroup" aria-label="Model">{MODELS.map((m) => <button key={m} className={m === model ? "on" : ""} onClick={() => setModel(m)}>{m}</button>)}</div>
            <div className="optRow"><span>Spoken replies</span><button className={"switch " + (voice ? "on" : "")} onClick={() => setVoice(!voice)} aria-label="Toggle spoken replies"><i /></button></div>
            <div className="optRow"><span>Outlook data</span><button className="pill" onClick={refreshOutlook}><Icon d={I.refresh} size={13} className={refreshing ? "spin" : ""} />{refreshing ? "Refreshing" : "Refresh now"}</button></div>
          </div>)}
        {pop === "bell" && (
          <div className="pop">
            <h3>Notification centre</h3>
            {log.length === 0 ? <p className="small muted">Quiet so far.</p>
              : <ul>{log.map((n, i) => <li key={i}><b>{n.title}</b><em>{n.at.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</em><span>{n.body}</span></li>)}</ul>}
          </div>)}
      </div>
    </header>
  );
}

// ---------- Bottom status bar: marquee sliding left to right ----------
function Ticker({ weather, gold, stocks }) {
  const items = [];
  if (gold.g && !gold.g.error) items.push({ k: "fx", node: <>{weather && !weather.error ? <AnimatedWeather kind={weather.icon} small /> : null}$1 = <b>₹{gold.g.inr.toFixed(2)}</b><span className={gold.fxPct >= 0 ? "up" : "down"}>{gold.fxPct >= 0 ? "+" : ""}{gold.fxPct.toFixed(2)}%</span></> });
  if (weather && !weather.error) items.push({ k: "aqi", node: <>AQI <b>{weather.aqi}</b> {AQI_LABEL(weather.aqi)}</> });
  if (Array.isArray(stocks)) for (const q of stocks.slice(0, 3)) items.push({ k: q.symbol, node: <>{q.name} <b>{fmtN(q.price, 0)}</b><span className={q.change >= 0 ? "up" : "down"}>{q.change >= 0 ? "▲" : "▼"} {fmtN(Math.abs(q.pct))}%</span></> });
  items.push({ k: "focus", cls: "focus", node: <><Icon d={I.refresh} size={15} />Stay focused</> });
  if (gold.g && !gold.g.error) items.push({ k: "gold", node: <>Gold 24K <b>{rs(gold.g.g24)} /g</b><span className={gold.goldPct >= 0 ? "up" : "down"}>{gold.goldPct >= 0 ? "▲" : "▼"} {Math.abs(gold.goldPct).toFixed(2)}%</span></> });
  const track = [0, 1].map((copy) => items.map((it) => <span key={it.k + copy} className={"tItem " + (it.cls || "")}>{it.node}</span>));
  return <footer className="ticker" aria-label="live bar"><div className="tItems">{track}</div></footer>;
}

// Video backdrop (public/house.mp4). Falls back to the gradient scene if the file is missing.
function Backdrop() {
  const [ok, setOk] = useState(true);
  return (
    <div className="backdrop" aria-hidden="true">
      {ok && <LoopVideo src="/house.mp4" onFail={() => setOk(false)} />}
      <div className="tint" />
    </div>
  );
}

export default function App() {
  const [mood, setMood] = useState("idle");
  const moodTimer = useRef();
  const flash = useCallback((m, ms = 1800) => {
    setMood(m);
    clearTimeout(moodTimer.current);
    moodTimer.current = setTimeout(() => setMood("idle"), ms);
  }, []);

  const [voice, setVoice] = useStored("jarvis.voice", true);
  const [model, setModel] = useStored("jarvis.model", "sonnet");
  const [log, setLog] = useState([]);
  const announce = useCallback((title, body) => {
    setLog((l) => [{ at: new Date(), title, body }, ...l].slice(0, 20));
    notify(title, body);
    speak(`${title}. ${body}`, voice);
    flash("alert", 2500);
  }, [voice, flash]);

  // Outlook: 30 days for the calendar grid, refreshed every 5 minutes; alert 15 minutes before a meeting.
  const [outlook, setOutlook] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const refreshOutlook = useCallback(async () => {
    setRefreshing(true);
    try { setOutlook(await api("/api/outlook?hours=720")); } catch { /* shown as empty */ }
    finally { setRefreshing(false); }
  }, []);
  useEffect(() => { refreshOutlook(); const id = setInterval(refreshOutlook, 5 * 60e3); return () => clearInterval(id); }, [refreshOutlook]);
  const alerted = useRef(new Set());
  useEffect(() => {
    if (!outlook) return;
    for (const a of outlook.calendar || []) {
      const mins = (new Date(a.start) - Date.now()) / 60e3;
      const key = a.start + a.subject;
      if (mins > 0 && mins <= 15 && !alerted.current.has(key)) { alerted.current.add(key); announce("Meeting soon", `${a.subject} starts in ${Math.round(mins)} minutes.`); }
    }
  }, [outlook, announce]);

  // Reminders: shared file with the /jarvis skill; fire when due.
  const [reminders, setReminders] = useState([]);
  const loadReminders = useCallback(() => api("/api/reminders").then(setReminders).catch(() => {}), []);
  useEffect(() => { loadReminders(); const id = setInterval(loadReminders, 60e3); return () => clearInterval(id); }, [loadReminders]);
  useEffect(() => {
    const now = localStamp();
    for (const r of reminders) {
      if (!r.done && r.when <= now && !alerted.current.has("rem" + r.when + r.text)) { alerted.current.add("rem" + r.when + r.text); announce("Reminder", r.text); }
    }
  }, [reminders, announce]);

  const weather = useWeather();
  const gold = useGold();
  const stocks = useStocks();
  const gmail = useGmail(announce);
  const water = useWater(announce);

  // Jarvis's "quick update" list, built from live data.
  const mailCount = (gmail?.configured && !gmail.error ? gmail.unread : 0) + (outlook?.unreadCount || 0);
  const nextMeeting = (outlook?.calendar || []).find((a) => new Date(a.end) > new Date() && new Date(a.start).toDateString() === new Date().toDateString());
  const brief = [
    `${mailCount} new email${mailCount === 1 ? "" : "s"} (Outlook & Gmail)`,
    `${(outlook?.tasks || []).length} open Outlook task${(outlook?.tasks || []).length === 1 ? "" : "s"}`,
    nextMeeting ? `You have a meeting at ${new Date(nextMeeting.start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : "No more meetings today",
    water.on ? (water.soon ? "Time to drink water 💧" : `Next water break at ${new Date(water.nextAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} 💧`) : "Water reminders are off",
  ];

  const [active, setActive] = useState("chat");
  const [busyApp, setBusyApp] = useState("");
  async function launch(d) {
    if (d.url) { window.open(d.url, "_blank", "noopener"); return; }
    setBusyApp(d.k);
    try { await api("/api/open", { app: d.k }); } catch (e) { announce("Could not open " + d.label, e.message); }
    setTimeout(() => setBusyApp(""), 1200);
  }
  const jump = (k) => { setActive(k); document.getElementById("tile-" + k)?.scrollIntoView({ behavior: "smooth", block: "nearest" }); };
  const [dictation, setDictation] = useState(null);
  const onDictation = useCallback((text) => setDictation({ text, id: Date.now() }), []);

  return (
    <div className="scene">
      <Backdrop />
      <div className="shell">
        <Rail active={active} jump={jump} launch={launch} busyApp={busyApp} water={water} />
        <div className="content">
          <Header mood={mood} voice={voice} setVoice={setVoice} model={model} setModel={setModel} refreshOutlook={refreshOutlook} refreshing={refreshing} log={log} onDictation={onDictation} />
          <main className="grid">
            <div className="colLeft">
              <JarvisCard mood={mood} setMood={setMood} flash={flash} model={model} voice={voice} onReminders={loadReminders} brief={brief} dictation={dictation} />
              <div className="miniRow">
                <DribbbleCard />
                <InstagramCard />
                <MagnificCard />
              </div>
            </div>
            <div className="colRight">
              <div className="stackR">
                <RemindersCard reminders={reminders} setReminders={setReminders} outlook={outlook} water={water} />
                <QuoteCard />
              </div>
              <WeatherCard w={weather} />
              <DayPlanCard announce={announce} />
              <CalendarCard outlook={outlook} />
              <YouTubeCard />
              <div className="stackM">
                <MarketsCard stocks={stocks} />
                <GitHubLinkCard />
              </div>
            </div>
          </main>
          <Ticker weather={weather} gold={gold} stocks={stocks} />
        </div>
      </div>
    </div>
  );
}
