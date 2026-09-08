import { useCallback, useState } from "react";

export async function api(path, body) {
  const r = await fetch(path, body && {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || r.statusText);
  return j;
}

export function speak(text, enabled) {
  if (!enabled || !("speechSynthesis" in window) || !text) return;
  const u = new SpeechSynthesisUtterance(text.replace(/https?:\/\/\S+/g, "").slice(0, 600));
  const voices = speechSynthesis.getVoices();
  u.voice = voices.find((v) => /en-GB/i.test(v.lang) && /Ryan|George|Daniel|Male/i.test(v.name))
    || voices.find((v) => /en-GB/i.test(v.lang)) || null;
  u.rate = 1.02; u.pitch = 0.95;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

export function notify(title, body) {
  try {
    if ("Notification" in window && Notification.permission === "granted") new Notification(title, { body });
  } catch { /* ignore */ }
}

export function askNotifyPermission() {
  try { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission(); } catch { /* ignore */ }
}

export function useStored(key, initial) {
  const [value, setValue] = useState(() => {
    try { const raw = localStorage.getItem(key); return raw === null ? initial : JSON.parse(raw); } catch { return initial; }
  });
  const set = useCallback((v) => {
    setValue((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [key]);
  return [value, set];
}

export const fmtTime = (iso) => new Date(iso).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
export const fmtDay = (iso) => new Date(iso).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function localStamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
