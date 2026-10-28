import { supabase } from '../../../../supabaseClient';

export type ManagerMonth = {
  id: string;
  month_label: string;
  month_start: string;
};

export type ManagerMonthScore = {
  player_id: string;
  username: string;
  correct_scores: number;
  points: number;
  position: number;
};

export type IncludedGameWeek = {
  id: string;
  week_number: number;
};

export type ManagerMonthStandings = {
  month: ManagerMonth;
  includedWeeks: IncludedGameWeek[];
  scores: ManagerMonthScore[];
};

type AssignmentRow = {
  manager_month_id: string;
  game_week_id: string;
};

type GameWeekRow = {
  id: string;
  week_number: number;
};

type GameWeekScoreRow = {
  game_week_id: string;
  player_id: string;
  correct_scores: number | null;
  points: number | null;
};

const PAGE_SIZE = 1000;

// Supabase caps a single response (1000 rows by default), and a full season of scores exceeds that.
async function fetchAllGameWeekScores(gameWeekIds: string[]): Promise<GameWeekScoreRow[]> {
  const rows: GameWeekScoreRow[] = [];

  for (let from = 0; ; ) {
    const { data, error } = await supabase
      .from('game_week_scores')
      .select('game_week_id, player_id, correct_scores, points')
      .in('game_week_id', gameWeekIds)
      .order('game_week_id')
      .order('player_id')
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    rows.push(...(data as GameWeekScoreRow[]));
    from += data.length;
  }

  return rows;
}

export async function loadManagerMonthStandings(seasonId: string): Promise<ManagerMonthStandings[]> {
  const { data: monthsData, error: monthsError } = await supabase
    .from('manager_months')
    .select('id, month_label, month_start')
    .eq('season_id', seasonId)
    .order('month_start', { ascending: false });

  if (monthsError) throw monthsError;

  const months = (monthsData ?? []) as ManagerMonth[];
  if (months.length === 0) return [];

  const [{ data: seasonPlayers, error: playersError }, { data: assignments, error: assignmentsError }] =
    await Promise.all([
      supabase.from('season_players').select('player_id').eq('season_id', seasonId),
      supabase
        .from('manager_month_game_weeks')
        .select('manager_month_id, game_week_id')
        .in('manager_month_id', months.map((month) => month.id)),
    ]);

  if (playersError) throw playersError;
  if (assignmentsError) throw assignmentsError;

  const validPlayerIds = new Set((seasonPlayers ?? []).map((player) => player.player_id));
  const assignmentRows = (assignments ?? []) as AssignmentRow[];
  const gameWeekIds = [...new Set(assignmentRows.map((row) => row.game_week_id).filter(Boolean))];

  if (gameWeekIds.length === 0) {
    return months.map((month) => ({ month, includedWeeks: [], scores: [] }));
  }

  const [{ data: gameWeeks, error: gameWeeksError }, scoreRows] = await Promise.all([
    supabase.from('game_weeks').select('id, week_number').in('id', gameWeekIds).order('week_number'),
    fetchAllGameWeekScores(gameWeekIds),
  ]);

  if (gameWeeksError) throw gameWeeksError;

  const weeksById = new Map((gameWeeks as GameWeekRow[] | null ?? []).map((week) => [week.id, week]));
  const scoresByWeek = new Map<string, GameWeekScoreRow[]>();
  scoreRows.forEach((row) => {
    if (!scoresByWeek.has(row.game_week_id)) scoresByWeek.set(row.game_week_id, []);
    scoresByWeek.get(row.game_week_id)!.push(row);
  });

  const monthWeekAssignments = new Map<string, string[]>();
  assignmentRows.forEach((row) => {
    if (!monthWeekAssignments.has(row.manager_month_id)) monthWeekAssignments.set(row.manager_month_id, []);
    monthWeekAssignments.get(row.manager_month_id)!.push(row.game_week_id);
  });

  const monthTotals = new Map<string, Map<string, { correct_scores: number; points: number }>>();
  months.forEach((month) => {
    const totals = new Map<string, { correct_scores: number; points: number }>();

    (monthWeekAssignments.get(month.id) ?? []).forEach((weekId) => {
      (scoresByWeek.get(weekId) ?? []).forEach((row) => {
        if (!validPlayerIds.has(row.player_id)) return;

        const total = totals.get(row.player_id) ?? { correct_scores: 0, points: 0 };
        total.correct_scores += row.correct_scores ?? 0;
        total.points += row.points ?? 0;
        totals.set(row.player_id, total);
      });
    });

    monthTotals.set(month.id, totals);
  });

  const playerIds = [...new Set([...monthTotals.values()].flatMap((totals) => [...totals.keys()]))];
  const usernameById = new Map<string, string>();

  if (playerIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', playerIds);

    if (profilesError) throw profilesError;
    (profiles ?? []).forEach((profile) => usernameById.set(profile.id, profile.username ?? profile.id));
  }

  return months.map((month) => {
    const includedWeeks = (monthWeekAssignments.get(month.id) ?? [])
      .map((id) => weeksById.get(id))
      .filter((week): week is GameWeekRow => Boolean(week))
      .sort((a, b) => a.week_number - b.week_number)
      .map(({ id, week_number }) => ({ id, week_number }));

    const scores = [...(monthTotals.get(month.id)?.entries() ?? [])]
      .map(([player_id, total]) => ({
        player_id,
        username: usernameById.get(player_id) ?? player_id,
        correct_scores: total.correct_scores,
        points: total.points,
      }))
      .sort((a, b) => b.points - a.points || b.correct_scores - a.correct_scores || a.username.localeCompare(b.username))
      .map((row, index) => ({ ...row, position: index + 1 }));

    return { month, includedWeeks, scores };
  });
}
