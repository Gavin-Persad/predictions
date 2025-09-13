//src/app/enterscores/components/PredictionsForm.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../../../supabaseClient';
import { useRouter } from 'next/navigation';


// All available teams (Premier League and Championship)
const FOOTBALL_TEAMS = {
  "Premier League": [
    "Arsenal", "Aston Villa", "Bournemouth", "Brentford", 
    "Brighton & Hove Albion", "Burnley", "Chelsea", "Crystal Palace", 
    "Everton", "Fulham","Leeds United","Liverpool", "Manchester City", "Manchester United", 
    "Newcastle United", "Nottingham Forest", "Sunderland",
    "Tottenham Hotspur", "West Ham United", "Wolverhampton Wanderers"
  ],
  "EFL Championship": [
    "Birmingham City", "Blackburn Rovers", "Bristol City", "Charlton Athletic", 
    "Coventry City", "Derby County", "Hull City", "Ipswich Town", "Leicester City",
    "Middlesbrough", "Millwall", "Norwich City", 
    "Oxford United", "Portsmouth", "Preston North End", 
    "Queens Park Rangers", "Sheffield United", "Sheffield Wednesday", "Southampton",
    "Stoke City", "Swansea City", "Watford", "West Bromwich Albion", "Wrexham"
  ]
};

type Fixture = {
    id: string;
    fixture_number: number;
    home_team: string;
    away_team: string;
};

type LaveryCupRound = {
    id: string;
    round_number: number;
    round_name: string;
    game_week_id: string;
    is_complete: boolean;
};

type PredictionsFormProps = {
    fixtures: Fixture[];
    onSubmit: (predictions: { 
        scores: { [key: string]: { home: number; away: number } },
        laveryCup?: {
            team1: string;
            team2: string;
            roundId: string;
        }
    }) => void;
    initialPredictions?: { [key: string]: { home: number; away: number } };
    onBack: () => void;
    gameWeekId: string;
    seasonId: string;
    playerId: string;
};

export default function PredictionsForm({ 
    fixtures, 
    onSubmit, 
    initialPredictions,
    onBack,
    gameWeekId,
    seasonId,
    playerId
}: PredictionsFormProps) {
    const [predictions, setPredictions] = useState<{
        [key: string]: { home: number; away: number }
    }>(initialPredictions || {});

    const [laveryCupRound, setLaveryCupRound] = useState<LaveryCupRound | null>(null);
    const [usedTeams, setUsedTeams] = useState<string[]>([]);
    const [laveryCupTeam1, setLaveryCupTeam1] = useState<string>('');
    const [laveryCupTeam2, setLaveryCupTeam2] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const router = useRouter();

    useEffect(() => {
        const checkAuthAndFetchData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                router.push('/');
                return;
            }
    
            try {
                setLoading(true);
                
                // Define the eligibility check function inside the effect
                const checkPlayerEligibility = async (roundData: LaveryCupRound): Promise<boolean> => {
                    // If it's the first round, everyone is eligible
                    if (roundData.round_number === 1) return true;
                    
                    // For rounds 2+, check if player advanced from previous round
                    try {
                        // Find the previous round
                        const { data: previousRounds } = await supabase
                            .from('lavery_cup_rounds')
                            .select('*')
                            .eq('season_id', seasonId)
                            .lt('round_number', roundData.round_number)
                            .order('round_number', { ascending: false })
                            .limit(1);
                        
                        if (!previousRounds || previousRounds.length === 0) return false;
                        
                        const previousRound = previousRounds[0];
                        
                        // Check if player advanced from the previous round
                        const { data: prevSelection } = await supabase
                            .from('lavery_cup_selections')
                            .select('advanced')
                            .eq('player_id', playerId)
                            .eq('round_id', previousRound.id)
                            .single();
                        
                        // If no selection found or not advanced, player is not eligible
                        if (!prevSelection || !prevSelection.advanced) {
                            return false;
                        }
                        
                        return true;
                    } catch (error) {
                        console.error('Error checking player eligibility:', error);
                        return false;
                    }
                };
                
                // Fetch Lavery Cup round data
                const { data: roundData, error: roundError } = await supabase
                    .from('lavery_cup_rounds')
                    .select('*')
                    .eq('game_week_id', gameWeekId)
                    .eq('season_id', seasonId)
                    .single();
                
                if (roundError && roundError.code !== 'PGRST116') {
                    console.error('Error fetching Lavery Cup round:', roundError);
                }
                
                if (roundData) {
                    // Use the local eligibility checking function
                    const isEligible = await checkPlayerEligibility(roundData);
                    
                    if (!isEligible) {
                        // Player is eliminated - don't show the Lavery Cup section
                        setLaveryCupRound(null);
                    } else {
                        // Player is eligible - show the Lavery Cup section
                        setLaveryCupRound(roundData);
                        
                        // Fetch used teams for this player
                        const { data: usedTeamsData, error: usedTeamsError } = await supabase
                            .from('player_used_teams')
                            .select('team_name')
                            .eq('player_id', playerId)
                            .eq('season_id', seasonId);
                        
                        if (usedTeamsError) {
                            console.error('Error fetching used teams:', usedTeamsError);
                        }
                        
                        if (usedTeamsData) {
                            setUsedTeams(usedTeamsData.map(item => item.team_name));
                        }
                        
                        // Check for existing selections
                        const { data: existingSelections, error: selectionsError } = await supabase
                            .from('lavery_cup_selections')
                            .select('team1_name, team2_name')
                            .eq('player_id', playerId)
                            .eq('round_id', roundData.id)
                            .single();
                        
                        if (selectionsError && selectionsError.code !== 'PGRST116') {
                            console.error('Error fetching existing selections:', selectionsError);
                        }
                        
                        if (existingSelections) {
                            setLaveryCupTeam1(existingSelections.team1_name);
                            setLaveryCupTeam2(existingSelections.team2_name);
                        }
                    }
                }
            } catch (error) {
                console.error('Error in checkAuthAndFetchData:', error);
            } finally {
                setLoading(false);
            }
        };
        
        checkAuthAndFetchData();
    }, [router, gameWeekId, seasonId, playerId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (laveryCupRound && (!laveryCupTeam1 || !laveryCupTeam2)) {
            alert('Please select two different teams for the Lavery Cup');
            return;
        }
        
        if (laveryCupRound) {
            onSubmit({
                scores: predictions,
                laveryCup: {
                    team1: laveryCupTeam1,
                    team2: laveryCupTeam2,
                    roundId: laveryCupRound.id
                }
            });
        } else {
            onSubmit({ scores: predictions });
        }
    };

    const allTeams = [...FOOTBALL_TEAMS["Premier League"], ...FOOTBALL_TEAMS["EFL Championship"]].sort();
    
    return (
        <div className="bg-gray-100 dark:bg-gray-900"> 
            <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md">
                <button
                    type="button"
                    onClick={onBack}
                    className="mb-8 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                >
                    Back
                </button>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Existing fixture predictions */}
                    {fixtures.map((fixture) => (
                        <div key={fixture.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center text-gray-900 dark:text-white p-2">
                            <div className="text-center sm:text-right text-sm sm:text-base">{fixture.home_team}</div>
                            <div className="flex justify-center space-x-2">
                                <input
                                    type="number"
                                    min="0"
                                    value={predictions[fixture.id]?.home ?? ''}
                                    onChange={(e) => setPredictions({
                                        ...predictions,
                                        [fixture.id]: {
                                            ...predictions[fixture.id],
                                            home: parseInt(e.target.value) || 0
                                        }
                                    })}
                                    className="w-12 p-1 text-center border rounded dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span>-</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={predictions[fixture.id]?.away ?? ''}
                                    onChange={(e) => setPredictions({
                                        ...predictions,
                                        [fixture.id]: {
                                            ...predictions[fixture.id],
                                            away: parseInt(e.target.value) || 0
                                        }
                                    })}
                                    className="w-12 p-1 text-center border rounded dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div className="text-center sm:text-left text-sm sm:text-base">{fixture.away_team}</div>
                        </div>
                    ))}
                    
                    {/* Lavery Cup selections (if applicable) */}
                    {laveryCupRound && (
                        <div className="mt-8 border-t pt-6 dark:border-gray-700">
                            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                                Lavery Cup Selections - {laveryCupRound.round_name}
                            </h3>
                            <p className="mb-4 text-gray-700 dark:text-gray-300">
                                Select two teams. If both teams win this game week, you&apos;ll advance to the next round.
                                You cannot select teams that you&apos;ve used in previous rounds.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Team 1 Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Team 1
                                    </label>
                                    <select
                                        value={laveryCupTeam1}
                                        onChange={(e) => setLaveryCupTeam1(e.target.value)}
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                        required={!!laveryCupRound}
                                    >
                                        <option value="">Select a team</option>
                                        {allTeams.map(team => (
                                            <option 
                                                key={team} 
                                                value={team}
                                                disabled={usedTeams.includes(team) || team === laveryCupTeam2}
                                                className={usedTeams.includes(team) ? "line-through text-gray-400" : ""}
                                            >
                                                {team} {usedTeams.includes(team) ? "(Used)" : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                {/* Team 2 Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Team 2
                                    </label>
                                    <select
                                        value={laveryCupTeam2}
                                        onChange={(e) => setLaveryCupTeam2(e.target.value)}
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                        required={!!laveryCupRound}
                                    >
                                        <option value="">Select a team</option>
                                        {allTeams.map(team => (
                                            <option 
                                                key={team} 
                                                value={team}
                                                disabled={usedTeams.includes(team) || team === laveryCupTeam1}
                                                className={usedTeams.includes(team) ? "line-through text-gray-400" : ""}
                                            >
                                                {team} {usedTeams.includes(team) ? "(Used)" : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-center mt-4">
                        <button 
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "Submit Predictions"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}