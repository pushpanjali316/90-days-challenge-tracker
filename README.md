# 90 Days Challenge Tracker

A mobile-first, installable web app for a 90-day DSA and web dev challenge. Plain JavaScript, no framework, no build step. Works offline and syncs across devices with Supabase.

**Live:** https://pushpanjali316.github.io/90-days-challenge-tracker/ (or your Netlify address)

## Features
- Today: daily goal, DSA problems, optional web dev topics, revision due, weekly review (Sundays), notes, rest days
- DSA checklist: 4 patterns, search and filters, notes, time and difficulty log, edit, add your own, continue where I left off
- Spaced revision: solved problems return after 1, 3, 7, 14 and 30 days (Easy, Hard, Forgot)
- Stats: streaks, heatmap, progress by pattern and difficulty
- Mock interview (2 random unsolved problems, 45 minutes), progress image, CSV export, themes, Lite mode
- Sync: email and password login, per-problem merging, undo, version history (last 10 saved versions)

## How it works
- `app.js` keeps one state object (`db`) and rebuilds the screen from it (`render()`).
- `sync.js` is local-first: it saves to the browser first, then merges with the cloud copy. Each day, task and problem has its own timestamp, deletions leave markers, and a reset or restore uses an `epoch` so it replaces everything.
- `checklist.js` holds the starting problem list. Your ticks and edits are saved separately.

## Files
`index.html`, `style.css`, `app.js`, `sync.js`, `checklist.js`, `config.js`, `sw.js`, `manifest.webmanifest`, `tests/merge.test.js`, `history.sql`

## Set up your own Supabase
1. Create a project and run the table SQL for `tracker_data` (user_id, data jsonb, updated_at) with Row Level Security.
2. Run `history.sql` for version history.
3. Put your project URL and publishable key in `config.js`.
4. In Authentication, add your site address to the Site URL and Redirect URLs. Turn off new sign-ups once your account exists.

## Tests
`node tests/merge.test.js`
