# Project Plan

## In Action
- Lavery Cup: selection issues when players change picks (ensure single source of truth and no duplicate rows).
- my predictions: Not showing unique bonuses to all players. (maybe only hosts see this)
- View Awards: Show manager of the month table

## Pending
- Auth: Forgot password flow.
- Notifications: email alerts for predictions open/close.
- Dashboard routing and tiles: ensure deep links pass season context (league, George Cup, Lavery Cup, Enter Scores).
- Message panel: dashboard auto-refresh after add/edit/delete.
- Profile settings: restore “Delete account” and verify delete flows (season/game week/cup clean-up).
- Time logic: unify all game lists to use time (not date) via shared utils.
- “Egg on your face” feature (players scoring below non-entrant).
- Clean-up: deletion flows (season, game week) ensure related tables are properly cleared.

## Completed (summary)
- Manual fixture entry and testing end-to-end.
- Edit/View Game Week components connected to Supabase.
- Enter scores workflow (forms, modals, scoring updates).
- League table and scoring aggregation (weekly and season).
- George Cup and Lavery Cup base flows (rounds, selections, progression, winners display).
- Dashboard tiles and pages (league, George Cup, Lavery Cup, Enter Scores, Rules, About, Messages).
- Numerous UI/UX fixes: responsive layout, spacing, readability, buttons/labels, dark-mode improvements.
- History and records: season winners, highest weekly/game scores, MOTW history, season winners page.
- George/Lavery Cups: stabilize UI after actions (avoid flicker/rerender loops when drawing rounds).
- George Cup: review/redo bye system (consistency and fairness).