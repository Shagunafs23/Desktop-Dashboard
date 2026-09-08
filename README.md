# Jarvis

Desk assistant dashboard: a glass card with the Jarvis orb, chat, Outlook mail and schedule,
water reminders, a shared reminders list, and a notification centre.

The brain is the Claude Code CLI (`claude -p`), so it runs on your Claude subscription with no
API key. Sonnet is the default model; switch to Opus or Haiku from the header.

## Run

```
npm start
```

Then open http://localhost:5210. This starts two things:

- `server.mjs` on port 5211: spawns `claude`, runs the Outlook script, reads and writes reminders
- Vite on port 5210: the React page, proxying `/api` to the server

Requirements: Node, Classic Outlook installed and signed in, and the `claude` CLI logged in.

## How it fits together

- `~/.claude/skills/jarvis/outlook_brief.ps1` is the read-only Outlook reader (COM). `-Json` for the page,
  plain text for the `/jarvis` skill inside Claude Code. It never sends, marks, or deletes anything.
- `~/.claude/skills/jarvis/reminders.md` is shared between this page and the `/jarvis` skill.
- Every chat message is sent with a fresh context block (Outlook briefing plus open reminders),
  so Jarvis answers mail and schedule questions without needing tool permissions.
- When Jarvis wants to set a reminder it writes a line `REMIND YYYY-MM-DD HH:mm | text`;
  the server stores it and strips the line from the reply.
- The page itself handles the water timer, meeting alerts (15 minutes before), due reminders,
  browser notifications, and spoken replies (Web Speech API, toggle in the header).

## Background video

`public/mountain.mp4` plays muted on loop behind the card (copied from `Downloads\moutain.mp4`).
Replace that file to change the scene. If it is missing, the page falls back to a gradient.

## Tiles

Jarvis chat, Calendar (month grid with Outlook event dots, click a day), Outlook mail, Schedule (48 h),
Now playing (paste any YouTube link), Water, Outlook tasks, Reminders, Notification centre.

## Model choice

The header dropdown sends `--model sonnet|opus|haiku` to the CLI per message. Conversation memory
uses the CLI session id, so switching model mid-chat keeps the thread.
