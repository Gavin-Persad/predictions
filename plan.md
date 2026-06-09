# Project Plan

## In Action

- Lavery Cup: selection issues when players change picks (ensure single source of truth and no duplicate rows).

## Pending

- Auth: Forgot password flow.
- Notifications: email alerts for predictions open/close.
- Dashboard routing and tiles: ensure deep links pass season context (league, George Cup, Lavery Cup, Enter Scores).
- Message panel: dashboard auto-refresh after add/edit/delete.
- Profile settings: restore “Delete account” and verify delete flows (season/game week/cup clean-up).
- Time logic: unify all game lists to use time (not date) via shared utils.
- Clean-up: deletion flows (season, game week) ensure related tables are properly cleared.

- add some data projects to the app (league progression and personal tables)
- admin view of how many players have entered and enter their scores for them
- add new table to DB "Teams" make team selection when creating game weeks dropdown options, when a new team is added it adds to the table, when we click the drop down we get all previous options to use.


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
- View Awards: Show manager of the month table
- URGENT, update scores not correctly updating season score, game weeks seems fine but not season scores. Check why this is and fix.
- add manager of the month section to /rules
- Change teams for lavery cup selection
- change 0-0 for no entries to 88-88.
- Change unique score bonus to unique result bonus
- add henderson cup to rules (for now best non prize winning player across all comps)
- make awards pages able to have split winners - broke, needs to add notes back to special awards, needs to have motm in order
- style repairs needed for dark mode edit awards winners
- george cup first round if not power of 2 draws next rounds fixtures with passing players.
- add to view manager of the month a list of the game weeks included that month
