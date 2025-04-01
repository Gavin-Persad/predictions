//src/app/viewseason/components/GeorgeCup/EditGeorgeCup.tsx

"use client";
import React from "react";
import { useState, useEffect } from "react";
import { supabase } from "../../../../../supabaseClient";
import { Player } from '../../../../types/players';
import { GameWeek } from '../../../../types/gameWeek';


interface Props {
    seasonId: string;
    onClose: () => void;
}

type RoundState = {
    id: string;
    round_number: number;
    round_name: string;
    game_week_id: string | null;
    is_complete: boolean;
    total_fixtures: number;
    fixtures: FixtureState[];
};

type FixtureState = {
    id: string;
    player1_id: string | null;
    player2_id: string | null;
    winner_id: string | null;
    player1_score?: number;
    player2_score?: number;
};

type PlayerResponse = {
    profiles: {
        id: string;
        username: string;
    };
};

type DrawConfirmationModalProps = {
    onConfirm: () => void;
    onCancel: () => void;
    roundName: string;
    gameWeekNumber: number;
};

const isPlayer = (slot: Player | 'BYE'): slot is Player => {
    return slot !== 'BYE';
};

const DrawConfirmationModal = ({ onConfirm, onCancel, roundName, gameWeekNumber }: DrawConfirmationModalProps) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                    Confirm Draw
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                    Are you sure you want to draw fixtures for {roundName} using Game Week {gameWeekNumber}? 
                    This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Draw Fixtures
                    </button>
                </div>
            </div>
        </div>
    );
};


const Layout = {
    container: "flex flex-row space-x-4 overflow-x-auto p-4",
    column: "min-w-[250px] flex-shrink-0",
    roundTitle: "text-lg font-bold mb-2 text-gray-900 dark:text-gray-100",
    gameWeekSelect: "w-full mb-4",
    fixtureBox: "border rounded p-3 mb-2",
    pastRound: "bg-gray-100 dark:bg-gray-700/50",
    activeRound: "bg-white dark:bg-gray-800",
    playerBox: {
        base: "flex justify-between items-center p-2 rounded",
        winner: "bg-green-100 dark:bg-green-900",
        loser: "bg-red-100 dark:bg-red-900",
        bye: "bg-gray-50 dark:bg-gray-800/50 italic"
    }
};



export default function EditGeorgeCup({ seasonId, onClose }: Props) {
    const [rounds, setRounds] = useState<RoundState[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [gameWeeks, setGameWeeks] = useState<GameWeek[]>([]);
    const [showDrawModal, setShowDrawModal] = useState(false);
    const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
    const [selectedGameWeekId, setSelectedGameWeekId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                // Fetch players
                const { data: playersData, error: playersError } = await supabase
                    .from('season_players')
                    .select(`
                        profiles (
                            id,
                            username
                        )
                    `)
                    .eq('season_id', seasonId);
        
                if (playersError) throw playersError;
        
                // Set players state
                setPlayers((playersData as unknown as PlayerResponse[]).map(p => ({
                    id: p.profiles.id,
                    username: p.profiles.username
                })));
        
                // Fetch game weeks
                const { data: gameWeeksData, error: gameWeeksError } = await supabase
                    .from('game_weeks')
                    .select('*')
                    .eq('season_id', seasonId)
                    .order('live_start', { ascending: true });
        
                if (gameWeeksError) throw gameWeeksError;
        
                // Set game weeks state
                setGameWeeks(gameWeeksData || []);
        
                // Calculate required rounds and create if none exist
                const requiredRounds = calculateRequiredRounds(playersData.length);
        
                const { data: existingRounds, error: roundsError } = await supabase
                    .from('george_cup_rounds')
                    .select(`
                        *,
                        george_cup_fixtures!george_cup_fixtures_round_id_fkey (
                            id,
                            round_id,
                            player1_id,
                            player2_id,
                            winner_id
                        )
                    `)
                    .eq('season_id', seasonId)
                    .order('round_number', { ascending: true });
        
                if (roundsError) throw roundsError;
        
                if (!existingRounds || existingRounds.length === 0) {
                    // Create initial rounds
                    const initialRounds = Array.from({ length: requiredRounds }, (_, i) => {
                        const roundNumber = i + 1;
                        const totalFixtures = Math.pow(2, requiredRounds - roundNumber);
                        
                        return {
                            season_id: seasonId,
                            round_number: roundNumber,
                            round_name: i === requiredRounds - 1 ? 'Final' :
                                       i === requiredRounds - 2 ? 'Semi Finals' :
                                       i === requiredRounds - 3 ? 'Quarter Finals' :
                                       `Round ${roundNumber}`,
                            game_week_id: null,
                            is_complete: false,
                            total_fixtures: totalFixtures
                        };
                    });
        
                    const { data: createdRounds, error: createError } = await supabase
                    .from('george_cup_rounds')
                    .insert(initialRounds)
                    .select(`
                        *,
                        george_cup_fixtures!george_cup_fixtures_round_id_fkey (
                            id,
                            round_id,
                            player1_id,
                            player2_id,
                            winner_id
                        )
                    `);
            
                if (createError) throw createError;
                setRounds(createdRounds || []);
            } else {
                    setRounds(existingRounds);
                }
            } catch (error) {
                console.error('Error in fetchInitialData:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [seasonId]);


    const calculateRequiredRounds = (playerCount: number) => {
        return Math.ceil(Math.log2(playerCount));
    };
    
    const calculateByesNeeded = (playerCount: number) => {
        const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(playerCount)));
        return nextPowerOfTwo - playerCount;
    };
    
    const distributeByes = (players: Player[], byesNeeded: number) => {
        const totalPlayers = players.length;
        const requiredPlayers = Math.pow(2, Math.ceil(Math.log2(totalPlayers)));
        const firstRoundFixtures = requiredPlayers / 2;
        const firstRoundPlayers = firstRoundFixtures * 2;
        
        // Create array of all player slots
        let slots: (Player | 'BYE')[] = [...players];
        
        // Add BYE slots
        for (let i = 0; i < byesNeeded; i++) {
            slots.push('BYE');
        }
        
        // Shuffle array to randomize BYE positions
        for (let i = slots.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [slots[i], slots[j]] = [slots[j], slots[i]];
        }
        
        return slots;
    };
    
    const handleGameWeekSelect = (roundId: string, gameWeekId: string) => {
        setSelectedRoundId(roundId);
        setSelectedGameWeekId(gameWeekId);
        setShowDrawModal(true);
    };
    
    const handleConfirmDraw = async () => {
        if (!selectedRoundId || !selectedGameWeekId) return;
        
        await performDraw(selectedRoundId);
        setShowDrawModal(false);
        setSelectedRoundId(null);
        setSelectedGameWeekId(null);
    };

    const performDraw = async (roundId: string) => {
        try {
            const round = rounds.find(r => r.id === roundId);
            if (!round || !selectedGameWeekId) return;

            // For first round, pair up players and BYEs
            if (round.round_number === 1) {
                const byesNeeded = calculateByesNeeded(players.length);
                const slots = distributeByes(players, byesNeeded);

                // Create fixtures from slots with type checking
                const fixtures = [];
                for (let i = 0; i < slots.length; i += 2) {
                    const player1 = slots[i];
                    const player2 = slots[i + 1];
                    
                    fixtures.push({
                        round_id: roundId,
                        player1_id: isPlayer(player1) ? player1.id : null,
                        player2_id: isPlayer(player2) ? player2.id : null
                    });
                }
    
                // Insert fixtures into database
                const { error: fixturesError } = await supabase
                    .from('george_cup_fixtures')
                    .insert(fixtures);
    
                if (fixturesError) throw fixturesError;
            } else {
                // For subsequent rounds, create empty fixtures
                const previousRound = rounds.find(r => r.round_number === round.round_number - 1);
                if (!previousRound) throw new Error('Previous round not found');
    
                const numFixtures = Math.ceil(previousRound.fixtures.length / 2);
                const emptyFixtures = Array(numFixtures).fill(null).map(() => ({
                    round_id: roundId,
                    player1_id: null,
                    player2_id: null,
                    winner_id: null
                }));
    
                const { error: fixturesError } = await supabase
                    .from('george_cup_fixtures')
                    .insert(emptyFixtures);
    
                if (fixturesError) throw fixturesError;
            }
    
            // Update round with selected game week
            const { error: updateError } = await supabase
                .from('george_cup_rounds')
                .update({ 
                    game_week_id: selectedGameWeekId,
                    is_complete: false 
                })
                .eq('id', roundId);
    
            if (updateError) throw updateError;
    
            // Refresh data
            const { data: updatedRound, error: fetchError } = await supabase
                .from('george_cup_rounds')
                .select('*, george_cup_fixtures(*)')
                .eq('id', roundId)
                .single();
    
            if (fetchError) throw fetchError;
    
            setRounds(rounds.map(r => r.id === roundId ? updatedRound : r));
    
        } catch (error) {
            console.error('Error performing draw:', error);
        }
    };

    const checkGameWeekScores = async (roundId: string) => {
    try {
        const round = rounds.find(r => r.id === roundId);
        if (!round?.game_week_id) return;

        // Fetch scores for the game week
        const { data: scores, error: scoresError } = await supabase
            .from('game_week_scores')
            .select('*')
            .eq('game_week_id', round.game_week_id);

        if (scoresError) throw scoresError;

        // Update fixtures with winners based on scores
        const updatedFixtures = await Promise.all(round.fixtures.map(async fixture => {
            if (fixture.winner_id) return fixture; // Skip if winner already determined

            const player1Score = scores?.find(s => s.player_id === fixture.player1_id)?.points ?? 0;
            const player2Score = scores?.find(s => s.player_id === fixture.player2_id)?.points ?? 0;

            // Handle BYE cases
            if (!fixture.player1_id) return { ...fixture, winner_id: fixture.player2_id };
            if (!fixture.player2_id) return { ...fixture, winner_id: fixture.player1_id };

            // Determine winner based on points
            const winnerId = player1Score > player2Score ? fixture.player1_id :
                           player2Score > player1Score ? fixture.player2_id :
                           // Random winner for ties
                           Math.random() < 0.5 ? fixture.player1_id : fixture.player2_id;

            // Update fixture in database
            const { error: updateError } = await supabase
                .from('george_cup_fixtures')
                .update({ 
                    winner_id: winnerId,
                    player1_score: player1Score,
                    player2_score: player2Score
                })
                .eq('id', fixture.id);

            if (updateError) throw updateError;

            return {
                ...fixture,
                winner_id: winnerId,
                player1_score: player1Score,
                player2_score: player2Score
            };
        }));

        // Check if all fixtures have winners
        const allFixturesComplete = updatedFixtures.every(f => f.winner_id);
        if (allFixturesComplete) {
            // Mark round as complete
            await supabase
                .from('george_cup_rounds')
                .update({ is_complete: true })
                .eq('id', roundId);
        }

        // Update local state
        setRounds(rounds.map(r => 
            r.id === roundId 
                ? { ...r, fixtures: updatedFixtures, is_complete: allFixturesComplete }
                : r
        ));

    } catch (error) {
        console.error('Error checking scores:', error);
    }
};


    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    George Cup
                </h2>
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                >
                    Back
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center">
                    <p className="text-gray-900 dark:text-gray-100">Loading...</p>
                </div>
            ) : (
                <div className={Layout.container}>
                    {/* Players Column - existing code */}
                    <div className={Layout.column}>
                        <h3 className={Layout.roundTitle}>Players</h3>
                        <div className="space-y-2">
                            {players.map(player => (
                                <div key={player.id} className={Layout.playerBox.base}>
                                    {player.username}
                                </div>
                            ))}
                        </div>
                    </div>
    
                {/* Round Columns */}
                {rounds.map(round => (
                    <div key={round.id} className={`${Layout.column} ${
                        round.is_complete ? Layout.pastRound : Layout.activeRound
                    }`}>
                        <h3 className={Layout.roundTitle}>{round.round_name}</h3>
                        <select 
                            className={Layout.gameWeekSelect}
                            value={round.game_week_id || ''}
                            onChange={(e) => handleGameWeekSelect(round.id, e.target.value)}
                            disabled={round.is_complete}
                        >
                            <option value="">Select Game Week</option>
                            {gameWeeks.map(gw => (
                                <option key={gw.id} value={gw.id}>
                                    Game Week {gw.week_number}
                                </option>
                            ))}
                        </select>
                        
                        {/* Fixtures */}
                        <div className="space-y-2">
                            {round.fixtures?.map(fixture => (
                                <div key={fixture.id} className={Layout.fixtureBox}>
                                    <div className={`${Layout.playerBox.base} ${
                                        fixture.winner_id === fixture.player1_id ? Layout.playerBox.winner :
                                        fixture.winner_id && fixture.player1_id ? Layout.playerBox.loser :
                                        fixture.player1_id ? '' : Layout.playerBox.bye
                                    }`}>
                                        {fixture.player1_id ? 
                                            players.find(p => p.id === fixture.player1_id)?.username : 
                                            'BYE'
                                        }
                                        {fixture.player1_score !== undefined && 
                                            <span className="ml-2">{fixture.player1_score}</span>
                                        }
                                    </div>
                                    
                                    <div className="text-center text-sm text-gray-500 dark:text-gray-400 my-1">vs</div>
                                    
                                    <div className={`${Layout.playerBox.base} ${
                                        fixture.winner_id === fixture.player2_id ? Layout.playerBox.winner :
                                        fixture.winner_id && fixture.player2_id ? Layout.playerBox.loser :
                                        fixture.player2_id ? '' : Layout.playerBox.bye
                                    }`}>
                                        {fixture.player2_id ? 
                                            players.find(p => p.id === fixture.player2_id)?.username : 
                                            'BYE'
                                        }
                                        {fixture.player2_score !== undefined && 
                                            <span className="ml-2">{fixture.player2_score}</span>
                                        }
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
            ))}
            </div>
        )}

        {/* Draw Confirmation Modal - existing code */}
        {showDrawModal && selectedRoundId && selectedGameWeekId && (
            <DrawConfirmationModal
                roundName={rounds.find(r => r.id === selectedRoundId)?.round_name || ''}
                gameWeekNumber={gameWeeks.find(gw => gw.id === selectedGameWeekId)?.week_number || 0}
                onConfirm={handleConfirmDraw}
                onCancel={() => {
                    setShowDrawModal(false);
                    setSelectedRoundId(null);
                    setSelectedGameWeekId(null);
                }}
            />
        )}
    </div>
);
}