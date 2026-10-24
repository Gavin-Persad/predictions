import { supabase } from '../../supabaseClient';

type Round = {
  round_number: number;
};

// Round 1 is open to everyone; later rounds need the player to have advanced from the previous round.
export async function isPlayerEligibleForRound(
  round: Round,
  seasonId: string,
  playerId: string,
): Promise<boolean> {
  if (round.round_number === 1) return true;

  try {
    const { data: previousRounds } = await supabase
      .from('lavery_cup_rounds')
      .select('id')
      .eq('season_id', seasonId)
      .lt('round_number', round.round_number)
      .order('round_number', { ascending: false })
      .limit(1);

    if (!previousRounds || previousRounds.length === 0) return false;

    const { data: previousSelection } = await supabase
      .from('lavery_cup_selections')
      .select('advanced')
      .eq('player_id', playerId)
      .eq('round_id', previousRounds[0].id)
      .single();

    return Boolean(previousSelection?.advanced);
  } catch (error) {
    console.error('Error checking player eligibility:', error);
    return false;
  }
}
