# Streak — Habit tracking with a Persian contribution calendar

Free, static, responsive RTL habit tracking app. Create positive (reading, exercise) and negative (smoking) habits, customize daily targets, edit any previous day, and see a separate Solar Hijri / Jalali calendar for every habit.

## Free local run on macOS

```bash
git clone https://github.com/AminKhorasani/Streak.git
cd Streak
python3 -m http.server 5173 --bind 127.0.0.1
```

Visit http://localhost:5173 (Ctrl+C to stop). Choose any available port, e.g. 8080, if 5173 is busy. No node_modules, build, API, database, or paid hosting is required.

## Free GitHub Pages hosting

Repository Settings -> Pages -> Build and deployment -> Deploy from a branch -> select main / (root) -> Save.

Once GitHub finishes the publish step, open https://aminkhorasani.github.io/Streak/ . The app works even with the Mac switched off. Source files use relative URLs so the same code runs locally and on Pages.

## Tests

Requires Node.js 20+:

```bash
node --test core.test.mjs
```

## Privacy and behavior

Entries are stored ONLY in the current browser's localStorage under `streak-persian-v1`. There is NO automatic device sync. GitHub hosts app code, not personal logs. Export JSON backups via the app's Settings section regularly. Imports replace current data after confirmation.

- Four green shades for positive logged activity; four red shades for negative logged activity.
- A logged zero for negative habits is shown in muted green and counts as success when the maximum target is zero.
- A missing log is gray and NEVER counts as a successful no-smoking day.
- A logged zero for positive habits is distinct from missing, and does not meet a positive daily goal.
- Intensity uses max positive logged value in that habit's history (rather than its goal), quantized to 1–4.
- Success targets: positive >= target with strictly positive value; negative <= target.
- Streaks use goal-successful consecutive days ending today or yesterday when today is not yet recorded.
- Date boundaries are device-local; Persian year/week alignment uses Intl's Persian calendar and Saturday-first rows.
- Future dates cannot be logged. Habits can be edited and deleted. JSON backup validation rejects invalid dates and values.

The app is single-user and local-first. No login, automated reminders, hosted database, or multi-device sync in this MVP. Google Fonts load online when available, with local font fallback.
