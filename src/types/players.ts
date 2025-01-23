//src/types/players.ts

export type DatabasePlayer = {
  id: string;
  username: string;
};

export type SeasonPlayer = {
  player_id: string;
  profiles: {
      username: string;
  };
};

export type Player = {
  id: string;
  username: string;
};

export type UserProfile = {
  id: string;
  username: string;
  is_host?: boolean;
};