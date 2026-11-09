import { supabase } from '../../../../supabaseClient';

export type AwardWinner = {
  id: string;
  category: string;
  sub_type: string | null;
  group_key: string | null;
  position: number | null;
  prize: number | null;
  sequence: number | null;
  winner_name: string | null;
  winner_names: string[];
  note: string | null;
};

type AwardRow = {
  id: string;
  category: string;
  sub_type: string | null;
  group_key: string | null;
  position: number | null;
  prize: number | null;
  sequence: number | null;
  winner_profile?: { username: string | null } | { username: string | null }[] | null;
};

export async function loadAwardWinners(seasonId: string): Promise<AwardWinner[]> {
  let awardRows: AwardRow[] | null = null;
  let awardError: { code?: string; message?: string } | null = null;

  const relationResult = await supabase
    .from('season_awards')
    .select('id, category, sub_type, group_key, position, prize, sequence, winner_profile:profiles (username)')
    .eq('season_id', seasonId)
    .eq('active', true)
    .order('category')
    .order('position')
    .order('sequence');

  awardRows = relationResult.data as AwardRow[] | null;
  awardError = relationResult.error;

  if (awardError && (awardError.code === 'PGRST200' || awardError.message?.includes('Could not find a relationship'))) {
    const plainResult = await supabase
      .from('season_awards')
      .select('id, category, sub_type, group_key, position, prize, sequence')
      .eq('season_id', seasonId)
      .eq('active', true)
      .order('category')
      .order('position')
      .order('sequence');

    awardRows = plainResult.data as AwardRow[] | null;
    awardError = plainResult.error;
  }

  if ((awardError && !awardRows) || awardRows?.length === 0) {
    const fallbackResult = await supabase
      .from('season_awards')
      .select('id, category, sub_type, group_key, position, prize, sequence')
      .eq('season_id', seasonId)
      .order('category')
      .order('position')
      .order('sequence');

    awardRows = fallbackResult.data as AwardRow[] | null;
    awardError = fallbackResult.error;
  }

  if (awardError) throw awardError;

  const rows = (awardRows ?? []).map((row) => {
    const profile = Array.isArray(row.winner_profile) ? row.winner_profile[0] : row.winner_profile;

    return {
      id: row.id,
      category: row.category,
      sub_type: row.sub_type,
      group_key: row.group_key,
      position: row.position,
      prize: row.prize,
      sequence: row.sequence,
      winner_name: profile?.username ?? null,
      winner_names: [] as string[],
      note: null as string | null,
    };
  });

  if (rows.length === 0) return rows;

  const awardIds = rows.map((row) => row.id);
  const [winnerResult, noteResult] = await Promise.all([
    supabase
      .from('season_award_winners')
      .select('award_id, profiles (username)')
      .in('award_id', awardIds),
    supabase.from('special_award_notes').select('award_id, note').in('award_id', awardIds),
  ]);

  if (!winnerResult.error && winnerResult.data) {
    const winnersByAward = new Map<string, string[]>();
    winnerResult.data.forEach((winner) => {
      const profile = Array.isArray(winner.profiles) ? winner.profiles[0] : winner.profiles;
      if (!profile?.username) return;
      const names = winnersByAward.get(winner.award_id) ?? [];
      names.push(profile.username);
      winnersByAward.set(winner.award_id, names);
    });
    rows.forEach((row) => {
      row.winner_names = winnersByAward.get(row.id) ?? [];
    });
  } else if (winnerResult.error && winnerResult.error.code !== '42P01') {
    console.warn('Error fetching award winners:', winnerResult.error);
  }

  if (!noteResult.error && noteResult.data) {
    const noteByAward = new Map(noteResult.data.map((note) => [note.award_id, note.note]));
    rows.forEach((row) => {
      row.note = noteByAward.get(row.id) ?? null;
    });
  } else if (noteResult.error && noteResult.error.code !== '42P01') {
    console.warn('Error fetching award notes:', noteResult.error);
  }

  return rows;
}
