export type DatabasePlayer = {
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