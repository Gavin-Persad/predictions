export type Fixture = {
  id: string;
  fixture_number: number;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
};

export type Predictions = Record<string, { home: number; away: number }>;

export type SubmitPayload = {
  scores: Predictions;
  laveryCup?: {
    team1: string;
    team2: string;
    roundId: string;
  };
};
