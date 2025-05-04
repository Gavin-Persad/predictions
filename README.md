# Football Predictions App

A web application built to digitise and automate a local football predictions competition that was previously managed manually. This project helps the competition organiser transition to retirement by automating the management of predictions, scoring, league tables, and cup competitions.

## Motivation

This project was initiated to help a valued member of our community who has been running a football predictions competition manually for many years. As they approach retirement, this application ensures the competition can continue with minimal manual intervention while adding new features and improvements.

## Technologies Used

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Authentication & Database)
- Dark Mode Support
- Responsive Design

## Getting Started

### Prerequisites

- Node.js 16.8 or later
- npm or yarn
- A Supabase account

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/predictions.git
   cd predictions
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up your environment variables:
   Create a `.env.local` file in the root directory with:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up Supabase tables: The application requires multiple tables (schema definitions below).

5. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
  app/ (Next.js app router pages)
    dashboard/
      components/
        CurrentGameWeekTile.tsx (Shows status of current game week)
        LeagueTableTile.tsx (Displays league standings summary)
        GeorgeCupTile.tsx (Shows George Cup status for current user)
        LaveryCupTile.tsx (Shows Lavery Cup status for current user)
        RulesTile.tsx (Displays rules summary)
        MessagesPanel.tsx (Shows announcements and messages)
      page.tsx (Main dashboard)
    enterscores/
      components/
        PredictionsDisplay.tsx (Shows submitted predictions)
        PredictionsForm.tsx (Form for entering match predictions)
      page.tsx (Predictions entry page)
    viewseason/
      components/
        georgeCup/
          EditGeorgeCup.tsx (Admin interface for managing the cup)
          viewGeorgeCup.tsx (Tournament bracket view)
          editGeorgeCupLayout.ts (Layout styling for edit view)
          viewGeorgeCupLayout.ts (Layout styling for tournament view)
        laveryCup/
          editLaveryCup.tsx (Admin interface for managing selections)
          viewLaveryCup.tsx (Team selections tournament view)
          viewLaveryCupLayout.ts (Layout styling for view)
        EnterScoresForm.tsx (Admin form for entering match results)
        EnterScoresGameWeekList.tsx (List of game weeks for score entry)
        GameWeekDetail.tsx (Detailed view of a game week)
        leagueTable.tsx (Complete league standings)
        ManagerOfTheWeekModal.tsx (Weekly top performers)
        ScoresModal.tsx (Detailed view of all predictions and scores)
        ViewGameWeeks.tsx (List view of all game weeks)
      page.tsx (Season management page)
    rules/
      page.tsx (Competition rules page)
  components/ (Shared components)
    Sidebar.tsx (Navigation sidebar)
    darkModeToggle.tsx (Theme switcher)
  types/ (TypeScript type definitions)
    players.ts (Player-related types)
    gameWeek.ts (Game week related types)
  utils/
    scoreCalculator.ts (Points calculation logic)
    gameWeekStatus.ts (Status determination for game weeks)
```

## Game Rules and Scoring

### Match Predictions

- Each game week consists of 10 fixtures
- Predictions must be submitted before midnight the day before the first game
- Late predictions or missed deadlines result in a default 0-0 prediction

### Points System

- **Exact Score Points:**
  - 3 points: Correct exact score with 3 or fewer total goals
  - 4 points: Correct exact score with 4 total goals
  - 5 points: Correct exact score with 5 total goals
  - 6+ points: Points equal to total goals in the match for higher-scoring games
- **Partial Points:**
  - 1 point: Correct result only (home win, away win, or draw)
  - 0 points: Completely incorrect prediction
- **Bonus Points:**
  - 2 bonus points: Unique correct score (being the only player to predict the exact score)
  - Weekly accuracy bonuses:
    - 4 correct scores in one week: +1 point
    - 5 correct scores in one week: +2 points
    - 6+ correct scores in one week: +3 points

### Cup Competitions

#### George Cup

- Knockout tournament with head-to-head matchups
- Players randomly drawn against each other in rounds
- Player with higher points total for that week advances
- Tiebreakers:
  - Most correct scores in the week
  - If still tied, automated coin flip decides winner
- Tournament progresses through rounds of 32, 16, quarter-finals, semi-finals, and final

#### Lavery Cup

- Team selection tournament format
- Each round, players select two teams they believe will win
- Players can only use each team once during the entire tournament
- Both selected teams must win in 90 minutes for the player to advance
- Players are eliminated if either team loses or draws
- Last player remaining after all rounds is the winner
- Tournament resets if all players are eliminated in a round

### League Table

- Players ranked by total points accumulated over the season
- Tiebreakers:
  - Most correct scores predicted

## Features

- 🔐 Secure authentication with Supabase
- 📅 Weekly fixture management with clear status indicators
- 🎯 Automated scoring system
- 📊 Dynamic league tables with proper tiebreakers
- 🏆 Weekly performance tracking
- 🏆 Cup competitions (George Cup and Lavery Cup)
- 📋 Manager of the Week recognition
- 📱 Player-specific content filtering
- 📢 Message board for announcements
- 🌓 Dark/Light mode support
- 📱 Responsive design
- 🔄 Real-time updates

## Game Week Status System

Game weeks progress through multiple states:

- **Upcoming**: Before predictions open
- **Predictions Open**: Players can enter predictions
- **Live**: Matches are being played
- **Ready for Scores**: Matches complete, awaiting host to enter scores
- **Scores Entered**: Completed with results and points calculated

## Access Roles

### Host

- Create/edit seasons
- Set up fixtures and game weeks
- Enter match scores
- Manage user access
- View all predictions
- Manage cup competitions

### Player

- Submit weekly predictions
- View personal scores
- Access league tables and cup standings
- Track performance

## Deployment

### Vercel Setup

```bash
npm run build
vercel deploy
```

#### Environment Variables

Add to Vercel project:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Database Schema

### profiles

```sql
CREATE TABLE profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  is_host boolean default false,
  club character varying
);
```

### seasons

```sql

CREATE TABLE seasons (
   id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
   name text,
   start_date date,
   end_date date,
   host_id uuid,
   created_at timestamp without time zone
);
```

### season_players

```sql
CREATE TABLE season_players (
  id uuid default uuid_generate_v4() primary key,
  season_id uuid references seasons on delete cascade,
  player_id uuid references profiles on delete cascade,
  created_at timestamp without time zone
);
```

### game_weeks

```sql
CREATE TABLE game_weeks (
  id uuid default uuid_generate_v4() primary key,
  season_id uuid references seasons on delete cascade,
  week_number integer,
  predictions_open timestamp with time zone,
  predictions_close timestamp with time zone,
  live_start timestamp with time zone,
  live_end timestamp with time zone,
  created_at timestamp with time zone
);
```

### fixtures

```sql
create table fixtures (
  id uuid default uuid_generate_v4() primary key,
  game_week_id uuid references game_weeks on delete cascade,
  fixture_number integer,
  home_team text,
  away_team text,
  home_score integer null,
  away_score integer null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

### predictions

```sql
create table predictions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles on delete cascade,
  fixture_id uuid references fixtures on delete cascade,
  home_prediction integer,
  away_prediction integer,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
```

### game_week_scores

```sql
create table game_week_scores (
  id uuid default uuid_generate_v4() primary key,
  game_week_id uuid references game_weeks on delete cascade,
  player_id uuid references profiles on delete cascade,
  correct_scores integer,
  points integer,
  weekly_bonus integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

### season_scores

```sql
create table season_scores (
  id uuid default uuid_generate_v4() primary key,
  season_id uuid references seasons on delete cascade,
  player_id uuid references profiles on delete cascade,
  correct_scores integer,
  points integer,
  manager_of_the_week integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

### george_cup_rounds

```sql
create table george_cup_rounds (
  id uuid default uuid_generate_v4() primary key,
  season_id uuid references seasons on delete cascade,
  game_week_id uuid references game_weeks on delete cascade,
  round_number integer,
  round_name text,
  total_fixtures integer,
  is_available boolean,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  is_complete boolean,
  round_end timestamp with time zone timestamptz
);
```

### george_cup_fixtures

```sql
create table george_cup_fixtures (
  id uuid default uuid_generate_v4() primary key,
  round_id uuid references george_cup_rounds on delete cascade,
  fixture_number integer,
  player1_id uuid references profiles on delete cascade,
  player2_id uuid references profiles on delete cascade,
  winner_id uuid references profiles null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

### lavery_cup_rounds

```sql
create table lavery_cup_rounds (
  id uuid default uuid_generate_v4() primary key,
  season_id uuid references seasons on delete cascade,
  round_number integer,
  round_name text,
  game_week_id uuid references game_weeks on delete cascade,
  is_complete boolean,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

### lavery_cup_selections

```sql
create table lavery_cup_selections (
  id uuid default uuid_generate_v4() primary key,
  round_id uuid references lavery_cup_rounds on delete cascade,
  player_id uuid references profiles on delete cascade,
  team1_name text,
  team2_name text,
  team1_won boolean null,
  team2_won boolean null,
  advanced boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

### player_used_teams

```sql
create table player_used_teams (
  id uuid default uuid_generate_v4() primary key,
  season_id uuid references seasons on delete cascade,
  player_id uuid references profiles on delete cascade,
  team_name text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

### messages

```sql
create table messages (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  author_id uuid references profiles on delete cascade
);
```

## Acknowledgments

Special thanks to:

- Steve O and Barry B for thorough testing and valuable feedback
- Chris G for years of dedication
- The prediction league community

## Future Development

Planned features:

- Email notifications for game week events
- Season progression charts
- Mobile app version
- Historical data migration tool
- Extended statistics dashboard
