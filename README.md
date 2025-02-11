# Football Predictions App

A web application built to digitise and automate a local football predictions competition that was previously managed manually. This project aims to help the competition organiser transition to retirement by automating the management of predictions, scoring, and league tables.

## Motivation

This project was initiated to help a valued member of our community who has been running a football predictions competition manually for many years. As they approach retirement, this application will ensure the competition can continue with minimal manual intervention.

## Technologies Used

- Next.js 13+ (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Authentication & Database)
- Dark Mode Support

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

3. Set up your environment variables: Create a .env.local file in the root directory with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase tables: The application requires the following tables:

- profiles (user profiles)
- seasons (competition seasons)
- game_weeks (weekly fixtures)
- fixtures (individual matches)
- predictions (user predictions)
- game_week_scores (weekly scores)
- season_scores (season totals)
- Schema definitions are below.

5.  Run the development server:

```bash
npm run dev
```

## Project Structure

## Project Structure

- src/
  - app/ (Next.js app router pages)
    - components/ (Shared components across pages)
    - dashboard/
      - components/ (Dashboard-specific components)
    - enterscores/
      - components/ (Score entry and management)
    - viewseason/
      - components/ (Season viewing and statistics)
    - createseason/
      - components/ (Season creation and setup)
  - types/
    - TypeScript type definitions and interfaces
  - utils/
    - scoreCalculator.ts (Points calculation logic)
    - dateUtils.ts (Date formatting and manipulation)

Key components:

- Dashboard: Main user interface and navigation
- Enter Scores: Match result entry and scoring
- View Season: League tables and statistics
- Create Season: Season and fixture management

## Game Rules and Scoring

### Match Predictions

- Players predict scores for all fixtures in a game week
- Predictions must be submitted before the first kickoff
- No changes allowed after deadline

### Points System

- **3 points**: Exact score prediction
- **1 point**: Correct result (win/draw/loss)
- **2 bonus points**: Unique correct score prediction
- **Weekly Bonuses**:
  - 4 correct scores: +1 point
  - 5 correct scores: +2 points
  - 6+ correct scores: +3 points

## Features

- 🔐 Secure authentication with Supabase
- 📅 Weekly fixture management
- 🎯 Automated scoring system
- 📊 Dynamic league tables
- 🏆 Weekly performance tracking
- 🌓 Dark/Light mode support
- 📱 Responsive design
- 🔄 Real-time updates

## Access Roles

### Host

- Create/edit seasons
- Set up fixtures
- Enter match scores
- Manage users
- View all predictions

### Player

- Submit weekly predictions
- View personal scores
- Access league tables
- Track performance

## Deployment

1. **Vercel Setup**

```bash
npm run build
vercel deploy
```

2. Environment Variables Add to Vercel project:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Database Setup
1. Create new Supabase project
1. Get project credentials from Settings > API
1. Set up required tables:

#### Tables Required

- `profiles`: User information
- `seasons`: Competition seasons
- `game_weeks`: Weekly fixtures
- `fixtures`: Individual matches
- `predictions`: User predictions
- `game_week_scores`: Weekly scores
- `season_scores`: Season totals

## Table Structures

### profiles

```sql
create table profiles (
  id uuid references auth.users on delete cascade,
  username text unique,
  full_name text,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

### seasons

```bash
create table seasons (
  id uuid default uuid_generate_v4() primary key,
  name text,
  start_date date,
  end_date date,
  is_active boolean default true
);
```

### game_weeks

```bash
create table game_weeks (
  id uuid default uuid_generate_v4() primary key,
  season_id uuid references seasons,
  week_number integer,
  deadline timestamp with time zone,
  status text default 'upcoming'
);
```

### fixtures

```bash
create table fixtures (
  id uuid default uuid_generate_v4() primary key,
  game_week_id uuid references game_weeks,
  home_team text,
  away_team text,
  home_score integer,
  away_score integer,
  kick_off timestamp with time zone
);
```

### predictions

```bash
create table predictions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles,
  fixture_id uuid references fixtures,
  home_prediction integer,
  away_prediction integer,
  points integer default 0
);
```

### Row Level Security (RLS)

Enable RLS on all tables and add policies:

```bash
-- Example RLS policy for predictions
create policy "Users can view their own predictions"
  on predictions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own predictions"
  on predictions for insert
  with check (auth.uid() = user_id);
```

## Acknowledgments

Special thanks to:

- Steve O for thorough testing and valuable feedback
- Chris G for years of dedication
- The prediction league community

## Future Development

Planned features:

- API integration for fixture imports
- Enhanced statistics dashboard
- Mobile app version
- Historical data migration tool
- Cup competition support
