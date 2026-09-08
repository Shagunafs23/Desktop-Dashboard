// Jarvis backend: gives the orb page a brain via the Claude Code CLI (your subscription, no API key),
// plus read-only Outlook and a shared reminders file. Runs on http://localhost:5211
import express from "express";
import { spawn, execFile } from "node:child_process";
import { readFile, appendFile, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// Tiny .env loader (no dependency): KEY=value lines next to this file.
try {
  for (const line of (await readFile(new URL("./.env", import.meta.url), "utf8")).split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !line.trim().startsWith("#") && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch { /* no .env */ }

const HOME = os.homedir();
const SKILL_DIR = path.join(HOME, ".claude", "skills", "jarvis");
const OUTLOOK_PS1 = path.join(SKILL_DIR, "outlook_brief.ps1");
const REMINDERS = path.join(SKILL_DIR, "reminders.md");
const CLAUDE = process.env.CLAUDE_BIN || path.join(HOME, ".local", "bin", "claude.exe");
const PORT = 5211;
const MODELS = new Set(["sonnet", "opus", "haiku"]);

const app = express();
app.use(express.json({ limit: "200kb" }));

// ---------- Outlook (read-only, cached briefly so chat turns stay fast) ----------
function runOutlook(hours, json) {
  return new Promise((resolve, reject) => {
    const args = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", OUTLOOK_PS1, "-Hours", String(hours), "-MaxMail", "10"];
    if (json) args.push("-Json");
    execFile("powershell", args, { windowsHide: true, timeout: 60000, maxBuffer: 4e6 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr.trim() || err.message));
      resolve(stdout);
    });
  });
}
let textCache = { at: 0, text: "" };
async function outlookText() {
  if (Date.now() - textCache.at < 120e3) return textCache.text;
  try { textCache = { at: Date.now(), text: (await runOutlook(24, false)).trim() }; }
  catch (e) { textCache = { at: Date.now(), text: "Outlook unavailable: " + e.message }; }
  return textCache.text;
}

// ---------- Gmail (IMAP with an app password; read-only, never marks anything seen) ----------
import { ImapFlow } from "imapflow";
const GMAIL = { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD };
let gmailCache = { at: 0, data: null, pending: null };
async function fetchGmail() {
  const client = new ImapFlow({ host: "imap.gmail.com", port: 993, secure: true, auth: { user: GMAIL.user, pass: GMAIL.pass }, logger: false });
  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const uids = await client.search({ seen: false }, { uid: true });
      const latest = uids.slice(-10).reverse();
      const items = [];
      for await (const msg of client.fetch(latest, { uid: true, envelope: true }, { uid: true })) {
        const from = msg.envelope.from?.[0];
        items.push({ id: msg.uid, from: from?.name || from?.address || "Unknown", address: from?.address || "", subject: msg.envelope.subject || "(no subject)", date: msg.envelope.date });
      }
      items.sort((a, b) => new Date(b.date) - new Date(a.date));
      return { configured: true, account: GMAIL.user, unread: uids.length, items, at: new Date().toISOString() };
    } finally { lock.release(); }
  } finally { await client.logout().catch(() => {}); }
}
async function gmail() {
  if (!GMAIL.user || !GMAIL.pass) return { configured: false };
  if (Date.now() - gmailCache.at < 60e3 && gmailCache.data) return gmailCache.data;
  if (!gmailCache.pending) {
    gmailCache.pending = fetchGmail().then((d) => { gmailCache = { at: Date.now(), data: d, pending: null }; return d; })
      .catch((e) => { gmailCache.pending = null; throw e; });
  }
  return gmailCache.pending;
}
app.get("/api/gmail", async (_req, res) => {
  try { res.json(await gmail()); }
  catch (e) { res.status(500).json({ configured: true, error: e.message }); }
});

// ---------- Dribbble: popular web-design shots, scraped from the public listing page ----------
let dribbbleCache = { at: 0, items: [] };
app.get("/api/dribbble", async (_req, res) => {
  if (Date.now() - dribbbleCache.at < 30 * 60e3 && dribbbleCache.items.length) return res.json(dribbbleCache.items);
  try {
    const html = await fetch("https://dribbble.com/shots/popular/web-design", { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Jarvis-dashboard" } }).then((r) => r.text());
    const items = [];
    for (const block of html.split('class="shot-thumbnail').slice(1, 30)) {
      const href = /href="(\/shots\/[^"?]+)/.exec(block)?.[1];
      const img = /(?:data-src|src)="(https:\/\/cdn\.dribbble\.com\/userupload\/[^"?]+)/.exec(block)?.[1];
      const title = /class="shot-title"[^>]*>\s*([^<]+?)\s*</.exec(block)?.[1] || /alt="([^"]+)"/.exec(block)?.[1] || "Dribbble shot";
      if (href && img) items.push({ title: title.slice(0, 70), url: "https://dribbble.com" + href, image: img + "?resize=800x600&vertical=center" });
    }
    if (items.length >= 4) dribbbleCache = { at: Date.now(), items };
    res.json(items);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ---------- Stocks: Indian indices + a few large caps via Yahoo Finance chart endpoint ----------
const STOCKS = [["^NSEI", "Nifty 50"], ["^BSESN", "Sensex"], ["^NSEBANK", "Bank Nifty"], ["RELIANCE.NS", "Reliance"], ["TCS.NS", "TCS"], ["INFY.NS", "Infosys"], ["HDFCBANK.NS", "HDFC Bank"]];
let stocksCache = { at: 0, items: [] };
async function quote([symbol, name]) {
  const u = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=15m`;
  const j = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } }).then((r) => r.json());
  const r = j.chart?.result?.[0]; if (!r) throw new Error(j.chart?.error?.description || "no data");
  const m = r.meta, price = m.regularMarketPrice, prev = m.chartPreviousClose ?? m.previousClose;
  const spark = (r.indicators?.quote?.[0]?.close || []).filter((v) => v != null);
  return { symbol, name, price, prev, change: price - prev, pct: prev ? (price - prev) / prev * 100 : 0, spark, at: m.regularMarketTime };
}
app.get("/api/stocks", async (_req, res) => {
  if (Date.now() - stocksCache.at < 60e3 && stocksCache.items.length) return res.json(stocksCache.items);
  const results = await Promise.allSettled(STOCKS.map(quote));
  const items = results.filter((x) => x.status === "fulfilled").map((x) => x.value);
  if (items.length) { stocksCache = { at: Date.now(), items }; return res.json(items); }
  res.status(502).json({ error: results[0]?.reason?.message || "stocks unavailable" });
});

// ---------- App launcher for the dock (allowlist only) ----------
const APPS = {
  outlook: "C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE",
  chrome: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  code: path.join(HOME, "AppData", "Local", "Programs", "Microsoft VS Code", "Code.exe"),
  explorer: "explorer.exe",
  notepad: "notepad.exe",
  terminal: "cmd.exe",
};
app.post("/api/open", (req, res) => {
  const target = APPS[req.body?.app];
  if (!target) return res.status(400).json({ error: "unknown app" });
  try {
    spawn("cmd.exe", ["/c", "start", "", target], { detached: true, stdio: "ignore", windowsHide: true }).unref();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- Reminders (shared with the /jarvis skill) ----------
const LINE = /^- (\[x\] )?(\d{4}-\d{2}-\d{2} \d{2}:\d{2}) \| (.*)$/;
const remindersRaw = () => readFile(REMINDERS, "utf8").catch(() => "");
async function readReminders() {
  return (await remindersRaw()).split(/\r?\n/).map((line, index) => {
    const m = LINE.exec(line);
    return m && { index, done: !!m[1], when: m[2], text: m[3] };
  }).filter(Boolean);
}
const addReminder = (when, text) => appendFile(REMINDERS, `- ${when} | ${text.trim().replace(/\r?\n/g, " ")}\n`);

// ---------- Claude via the CLI ----------
function systemPrompt() {
  const now = new Date().toLocaleString("en-AU", { dateStyle: "full", timeStyle: "short" });
  return `You are Shagun's AI, Shagun's personal desk assistant, speaking through a small web panel. If asked your name, it is Shagun's AI.
Personality: warm, witty, quick, genuinely curious about Shagun's day. Think a sharp friend with good timing, not a corporate bot. Light humour is welcome; sarcasm stays gentle. You notice things (time of day, the weather, what is on the calendar, a long stretch without a break) and mention them naturally.
Engage: end most replies with a short follow-up question or a small offer (a fun fact, a joke, a two-minute stretch, a quick plan for the next hour) so the conversation keeps moving. Vary your openers; never start two replies the same way.
Entertain on request: jokes, riddles (give the answer only when asked), trivia, would-you-rather, short stories, quick word games, movie or music picks. Keep them tight and punchy.
Idle check-ins: when a message is marked as an idle check-in, say one short, delightful thing (a witty observation, a fun fact, a nudge about the next break or meeting) in under 35 words, and optionally ask one quick question.
Address Shagun by name now and then, never "sir". No em dashes. Plain text, no markdown headings, tables or bullet symbols. Under 120 words unless detail is asked for; jokes and check-ins much shorter.
Right now it is ${now}.
Every message arrives with a fresh read-only context block: the Outlook briefing (unread mail, flagged mail, calendar for the next 24 hours, open tasks), the Gmail inbox (unread count and latest unread), and the reminders file. Answer mail, schedule, task and reminder questions from that block. Do not claim to have checked anything else.
To set a reminder, put this on its own line in your reply (24-hour local time): REMIND YYYY-MM-DD HH:mm | text
The panel stores it and removes the line, so just confirm it in plain words as well.
For research, use WebSearch and end with the source URLs, one per line. When asked to build something, propose the smallest first step.
You cannot send mail or messages and must never ask for credentials.`;
}

async function contextBlock() {
  const open = (await readReminders()).filter((r) => !r.done).map((r) => `- ${r.when} | ${r.text}`);
  let gm = "(Gmail not configured)";
  try {
    const g = await gmail();
    if (g.configured) gm = `UNREAD: ${g.unread}\n` + (g.items.map((m) => `- [${new Date(m.date).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}] ${m.from} :: ${m.subject}`).join("\n") || "(none)");
  } catch (e) { gm = "Gmail unavailable: " + e.message; }
  return `[Context gathered ${new Date().toLocaleTimeString("en-AU")}, read-only]\nOUTLOOK BRIEFING\n${await outlookText()}\nGMAIL INBOX\n${gm}\nREMINDERS (open)\n${open.join("\n") || "(none)"}\n[End of context]`;
}

function runClaude({ message, model, sessionId }) {
  return new Promise((resolve, reject) => {
    const args = [
      "-p", "--model", model, "--output-format", "json", "--max-turns", "6",
      "--append-system-prompt", systemPrompt(),
      "--allowedTools", "Read", "WebSearch", "WebFetch",
    ];
    if (sessionId) args.push("--resume", sessionId);
    const child = spawn(CLAUDE, args, { windowsHide: true, cwd: SKILL_DIR });
    let out = "", err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", reject);
    child.on("close", (code) => {
      try {
        const json = JSON.parse(out.slice(out.indexOf("{")));
        if (json.is_error) return reject(new Error(json.result || "Claude returned an error"));
        resolve({ reply: json.result ?? "", sessionId: json.session_id, cost: json.total_cost_usd });
      } catch {
        reject(new Error(`claude exited ${code}: ${err.trim() || out.slice(0, 300)}`));
      }
    });
    child.stdin.end(message);
  });
}

const REMIND = /^\s*REMIND (\d{4}-\d{2}-\d{2} \d{2}:\d{2}) \| (.+?)\s*$/gm;

app.post("/api/chat", async (req, res) => {
  const { message, model = "sonnet", sessionId } = req.body ?? {};
  if (!message?.trim()) return res.status(400).json({ error: "message required" });
  if (!MODELS.has(model)) return res.status(400).json({ error: "model must be sonnet, opus or haiku" });
  try {
    const full = `${await contextBlock()}\n\nShagun says: ${message.trim()}`;
    const r = await runClaude({ message: full, model, sessionId });
    let added = 0;
    for (const m of r.reply.matchAll(REMIND)) { await addReminder(m[1], m[2]); added++; }
    r.reply = r.reply.replace(REMIND, "").replace(/\s*—\s*/g, " - ").replace(/\n{3,}/g, "\n\n").trim();
    res.json({ ...r, added });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/outlook", async (req, res) => {
  const hours = Math.min(Math.max(parseInt(req.query.hours) || 24, 1), 720);
  try { res.json(JSON.parse(await runOutlook(hours, true))); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/reminders", async (_req, res) => res.json(await readReminders()));

app.post("/api/reminders", async (req, res) => {
  const { when, text } = req.body ?? {};
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(when || "") || !text?.trim()) return res.status(400).json({ error: "need when (YYYY-MM-DD HH:mm) and text" });
  await addReminder(when, text);
  res.json(await readReminders());
});

app.post("/api/reminders/toggle", async (req, res) => {
  const lines = (await remindersRaw()).split(/\r?\n/);
  const i = req.body?.index;
  if (!LINE.test(lines[i] ?? "")) return res.status(400).json({ error: "no such reminder" });
  lines[i] = lines[i].startsWith("- [x] ") ? "- " + lines[i].slice(6) : "- [x] " + lines[i].slice(2);
  await writeFile(REMINDERS, lines.join("\n"));
  res.json(await readReminders());
});

app.listen(PORT, () => console.log(`Jarvis API on http://localhost:${PORT} (claude: ${CLAUDE})`));
