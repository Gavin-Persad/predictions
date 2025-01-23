//src/types/gameWeek.ts

export type GameWeek = {
    id: string;
    season_id: string;
    week_number: number;
    title: string;
    predictions_open: string;
    predictions_close: string;
    live_start: string;
    live_end: string;
};

export type Fixture = {
    id: string;
    game_week_id: string;
    fixture_number: number;
    home_team: string;
    away_team: string;
    home_score: number;
    away_score: number;
};
