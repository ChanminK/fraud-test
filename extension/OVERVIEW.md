# FRAUD-TEST

This repo is a test harness around Visual Studio activity tracking (via the
WakaTime-based extension) and a separate hardware/device logger. The goal is
to make it easy to compare:

- What the **device** thinks happened, and  
- What **Visual Studio** / the extension think happened,

using a single shared, line-by-line comparable heartbeats file.

---

## Directory layout

```text
FRAUD-TEST/
├─ .gitignore
├─ OVERVIEW.md              <- this file
├─ Logger.cs                <- logger used by the VS/WakaTime side
├─ Logs/                    <- runtime log files (gitignored)
│  └─ .gitignore
└─ Data/
   ├─ .gitkeep              <- keeps Data/ in git even when empty
   ├─ output/
   │  ├─ .gitkeep
   │  └─ heartbeats.ndjson  <- final combined heartbeats file (gitignored)
   └─ samples/
      ├─ .gitkeep
      ├─ device-heartbeats.ndjson  <- example device-side data
      └─ vs-heartbeats.ndjson      <- example VS-side data
