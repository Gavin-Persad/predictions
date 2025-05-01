//src/utils/gameWeekStatus.tsx

import { supabase } from '../../supabaseClient';

export type GameWeekStatus = 
  | 'upcoming' 
  | 'predictions'
  | 'live'
  | 'awaiting_scores'
  | 'completed';

export async function determineGameWeekStatus(gameWeek: {
  predictions_open: string;
  predictions_close: string;
  live_start: string;
  live_end: string;
  id: string;
}): Promise<GameWeekStatus> {
  const now = new Date();
  const predOpen = new Date(gameWeek.predictions_open);
  const predClose = new Date(gameWeek.predictions_close);
  const liveStart = new Date(gameWeek.live_start);
  const liveEnd = new Date(gameWeek.live_end);


  if (now < predOpen) {
    return 'upcoming';
  } else if (now >= predOpen && now < predClose) {
    return 'predictions';
  } else if (now >= liveStart && now <= liveEnd) {
    return 'live';
  } else if (now > liveEnd) {

    const { count, error } = await supabase
      .from('game_week_scores')
      .select('*', { count: 'exact', head: true })
      .eq('game_week_id', gameWeek.id);
    
    if (error) {
      console.error('Error checking game week scores:', error);
      return 'awaiting_scores';
    }
    
    return count && count > 0 ? 'completed' : 'awaiting_scores';
  }
  
  return 'upcoming';
}

export function getStatusLabel(status: GameWeekStatus): string {
  switch (status) {
    case 'upcoming': return 'Upcoming';
    case 'predictions': return 'Predictions Open';
    case 'live': return 'Games live';
    case 'awaiting_scores': return 'Awaiting correct scores';
    case 'completed': return 'Game week complete';
    default: return 'Unknown';
  }
}

export function getStatusColor(status: GameWeekStatus): string {
  switch (status) {
    case 'upcoming': return 'text-blue-600 dark:text-blue-400';
    case 'predictions': return 'text-green-600 dark:text-green-400';
    case 'live': return 'text-amber-600 dark:text-amber-400';
    case 'awaiting_scores': return 'text-purple-600 dark:text-purple-400';
    case 'completed': return 'text-gray-600 dark:text-gray-400';
    default: return 'text-gray-600 dark:text-gray-400';
  }
}