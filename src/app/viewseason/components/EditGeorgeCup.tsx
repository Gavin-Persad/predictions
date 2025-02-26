//src/app/viewseason/components/EditGeorgeCup.tsx

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../supabaseClient';

type Player = {
    id: string;
    username: string;
    number?: number;
};

type SetupFixture = {
    index: number;
    id?: string;
    player1: Player | null;
    player2: Player | null;
    winner_id?: string | null;
};

type ProcessedFixture = {
    fixture_number: number;
    player1_name: string;
    player2_name: string | null;
    game_week: number;
};

type RoundInfo = {
    name: string;
    expectedFixtures: number;
    isAvailable: boolean;
};

type SupabaseWinnerResponse = {
    winner_id: string;
    winner: {
        id: string;
        username: string;
    };
};

type SupabaseFixtureResponse = {
    id: string;
    fixture_number: number;
    winner_id: string | null;
    player1: {
        id: string;
        username: string;
    } | null;
    player2: {
        id: string;
        username: string;
    } | null;
};

type Props = {
    seasonId: string;
    onClose: () => void;
};

export default function EditGeorgeCup({ seasonId, onClose }: Props) {
    const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
    const [setupFixtures, setSetupFixtures] = useState<SetupFixture[]>([]);
    const [gameWeeks, setGameWeeks] = useState<Array<{ id: string, week_number: number }>>([]);
    const [selectedGameWeek, setSelectedGameWeek] = useState<string>('');
    const [currentRound, setCurrentRound] = useState(1);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [nextEmptySpot, setNextEmptySpot] = useState<{fixtureIndex: number, isPlayer1: boolean} | null>(null);
    const [roundsInfo, setRoundsInfo] = useState<Record<number, RoundInfo>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [roundFixtures, setRoundFixtures] = useState<{[key: number]: SetupFixture[]}>({});
    const [isRoundConfirmed, setIsRoundConfirmed] = useState<{[key: number]: boolean}>({});
    const [isEditing, setIsEditing] = useState(false);

    const updateNextEmptySpot = useCallback((fixtures: SetupFixture[]) => {
        const nextSpot = fixtures.reduce<{fixtureIndex: number, isPlayer1: boolean} | null>((acc, fixture, index) => {
            if (acc) return acc;
            if (!fixture.player1) return { fixtureIndex: index, isPlayer1: true };
            if (!fixture.player2) return { fixtureIndex: index, isPlayer1: false };
            return null;
        }, null);
        setNextEmptySpot(nextSpot);
    }, []);

    const getRoundName = useCallback((round: number, totalPlayers: number) => {
        const totalRounds = Math.ceil(Math.log2(totalPlayers));
        
        if (round === totalRounds) return 'Final';
        if (round === totalRounds - 1) return 'Semi Finals';
        if (round === totalRounds - 2) return 'Quarter Finals';
        return `Round ${round}`;
    }, []);

    const initializeFixtures = useCallback((numFixtures: number) => {
        const fixtures = Array.from({ length: numFixtures }, (_, index) => ({
            index,
            player1: null,
            player2: null
        }));
        setSetupFixtures(fixtures);
        updateNextEmptySpot(fixtures);
    }, [updateNextEmptySpot]);

    const calculateRoundStructure = useCallback((playerCount: number) => {
        let remaining = playerCount;
        let round = 1;
        const rounds: Record<number, RoundInfo> = {};
    
        while (remaining > 1) {
            const nextRoundPlayers = Math.pow(2, Math.floor(Math.log2(remaining)));
            const currentFixtures = Math.ceil(remaining / 2);
    
            rounds[round] = {
                name: getRoundName(round, playerCount),
                expectedFixtures: currentFixtures,
                isAvailable: round === 1
            };
    
            remaining = nextRoundPlayers / 2;
            round++;
        }
        setRoundsInfo(rounds); 
    }, [getRoundName]);

    const fetchGameWeeks = useCallback(async () => {
        const { data, error } = await supabase
            .from('game_weeks')
            .select('id, week_number')
            .eq('season_id', seasonId)
            .order('week_number');
    
        if (!error && data) {
            setGameWeeks(data);
        }
    }, [seasonId]);

    const fetchRoundWinners = useCallback(async (roundNumber: number) => {
        const { data: roundData, error: roundError } = await supabase
            .from('george_cup_rounds')
            .select('id')
            .eq('round_number', roundNumber)
            .eq('season_id', seasonId)
            .single();
    
        if (roundError || !roundData) return;
    
        const { data, error } = await supabase
            .from('george_cup_fixtures')
            .select(`
                winner_id,
                winner:profiles!inner(
                    id,
                    username
                )
            `)
            .eq('round_id', roundData.id)
            .not('winner_id', 'is', null);
    
        if (!error && data) {
            const typedData = data as unknown as SupabaseWinnerResponse[];
            
            const winners = typedData.map(item => ({
                id: item.winner.id,
                username: item.winner.username,
                number: undefined
            }));
    
            if (winners.length > 0) {
                setAvailablePlayers(winners);
                initializeFixtures(Math.ceil(winners.length / 2));
                setRoundsInfo(prev => ({
                    ...prev,
                    [currentRound]: {
                        ...prev[currentRound],
                        isAvailable: true
                    }
                }));
            } else {
                setAvailablePlayers([]);
                setRoundsInfo(prev => ({
                    ...prev,
                    [currentRound]: {
                        ...prev[currentRound],
                        isAvailable: false
                    }
                }));
            }
        }
    }, [seasonId, currentRound, initializeFixtures]);

    const fetchRoundFixtures = useCallback(async (roundNumber: number) => {
        const { data: roundData, error: roundError } = await supabase
            .from('george_cup_rounds')
            .select('id, game_week_id')
            .eq('round_number', roundNumber)
            .eq('season_id', seasonId)
            .single();
    
        if (roundError || !roundData) return null;
    
        const { data, error } = await supabase
            .from('george_cup_fixtures')
            .select(`
                id,
                fixture_number,
                winner_id,
                player1:profiles!player1_id(id, username),
                player2:profiles!player2_id(id, username)
            `)
            .eq('round_id', roundData.id)
            .order('fixture_number');
    
        if (!error && data) {
            const typedData = data as unknown as SupabaseFixtureResponse[];
            
            const fixtures = typedData.map(f => ({
                index: f.fixture_number - 1,
                id: f.id,
                player1: f.player1 ? { 
                    id: f.player1.id, 
                    username: f.player1.username 
                } : null,
                player2: f.player2 ? { 
                    id: f.player2.id, 
                    username: f.player2.username 
                } : null,
                winner_id: f.winner_id
            }));
    
            setSetupFixtures(fixtures);
            setRoundFixtures(prev => ({
                ...prev,
                [roundNumber]: fixtures
            }));
            
            setIsRoundConfirmed(prev => ({
                ...prev,
                [roundNumber]: true
            }));
    
            if (roundData.game_week_id) {
                setSelectedGameWeek(roundData.game_week_id);
            }
    
            return fixtures;
        }
    
        return null;
    }, [seasonId]);

    const fetchPlayers = useCallback(async () => {
        if (currentRound === 1) {
            const { data, error } = await supabase
                .from('season_players')
                .select(`
                    profiles (
                        id,
                        username
                    )
                `)
                .eq('season_id', seasonId);
    
            if (!error && data) {
                const players = data.map((item: any) => ({
                    id: item.profiles.id,
                    username: item.profiles.username,
                    number: undefined
                }));
    
                setAvailablePlayers(players);
                calculateRoundStructure(players.length); 
                initializeFixtures(Math.ceil(players.length / 2));
            }
        } else {
            await fetchRoundWinners(currentRound - 1);
        }
    }, [currentRound, seasonId, fetchRoundWinners, calculateRoundStructure, initializeFixtures]);


    const checkPreviousRoundStatus = useCallback(async (roundNumber: number) => {
        if (roundNumber === 1) return true;
    
        const { data: roundData, error: roundError } = await supabase
            .from('george_cup_rounds')
            .select('id')
            .eq('round_number', roundNumber - 1)
            .eq('season_id', seasonId)
            .single();
    
        if (roundError || !roundData) return false;
    
        const { data, error } = await supabase
            .from('george_cup_fixtures')
            .select('winner_id')
            .eq('round_id', roundData.id);
    
        if (!error && data) {
            return data.length > 0 && data.every(fixture => fixture.winner_id);
        }
        return false;
    }, [seasonId]);




    useEffect(() => {
        fetchGameWeeks();
    }, [fetchGameWeeks]);
    
    useEffect(() => {
        const loadRoundData = async () => {
            setSetupFixtures([]); 
            setAvailablePlayers([]); 
            
            const existingFixtures = await fetchRoundFixtures(currentRound);
            
            if (!existingFixtures) {
                if (currentRound === 1) {
                    await fetchPlayers();
                } else {
                    const previousRoundComplete = await checkPreviousRoundStatus(currentRound - 1);
                    if (previousRoundComplete) {
                        await fetchRoundWinners(currentRound - 1);
                    }
                }
            }
        };
    
        loadRoundData();
    }, [currentRound, fetchRoundFixtures, fetchPlayers, checkPreviousRoundStatus, fetchRoundWinners]);
 
    const getProcessedFixtures = (): ProcessedFixture[] => {
        const gameWeek = gameWeeks.find(gw => gw.id === selectedGameWeek);
        
        return setupFixtures.map((fixture, index) => ({
            fixture_number: index + 1,
            player1_name: fixture.player1?.username || 'Unknown',
            player2_name: fixture.player2?.username || null,
            game_week: gameWeek?.week_number || 0
        }));
    };

    const totalRounds = Object.keys(roundsInfo).length;

    const isByeMatch = (fixture: SetupFixture) => fixture.player1 && !fixture.player2;

    const canEditFixtures = (roundNumber: number) => {
        return isRoundConfirmed[roundNumber] && 
               roundFixtures[roundNumber]?.length > 0 &&
               !roundFixtures[roundNumber]?.some(f => f.winner_id) &&
               !isRoundConfirmed[roundNumber + 1];
    };

    const handleConfirmFixtures = async () => {
        setIsSaving(true);
        try {
            const { data: roundData, error: roundError } = await supabase
                .from('george_cup_rounds')
                .insert({
                    season_id: seasonId,
                    round_number: currentRound,
                    round_name: roundsInfo[currentRound].name,
                    total_fixtures: roundsInfo[currentRound].expectedFixtures,
                    is_available: true,
                    game_week_id: selectedGameWeek
                })
                .select()
                .single();
    
            if (roundError) throw roundError;
    
            const fixtures = getProcessedFixtures().map((fixture, index) => ({
                round_id: roundData.id,
                game_week_id: selectedGameWeek,
                player1_id: setupFixtures[index].player1?.id,
                player2_id: setupFixtures[index].player2?.id,
                fixture_number: fixture.fixture_number,
                created_at: new Date().toISOString()
            }));
    
            const { error } = await supabase
                .from('george_cup_fixtures')
                .insert(fixtures);
    
            if (error) throw error;
    
            if (currentRound < totalRounds) {
                setRoundsInfo(prev => ({
                    ...prev,
                    [currentRound + 1]: {
                        ...prev[currentRound + 1],
                        isAvailable: true
                    }
                }));
            }
    
            setShowConfirmation(false);
            onClose();
        } catch (error) {
            console.error('Error saving fixtures:', error);
        } finally {
            setIsSaving(false);
        }

        if (!roundsInfo[currentRound]) {
            console.error('Round info not found');
            return;
        }
    };

    const updateFixtures = async (fixtures: SetupFixture[]) => {
        try {
            const { error } = await supabase
                .from('george_cup_fixtures')
                .upsert(
                    fixtures.map((f, index) => ({
                        round_id: roundFixtures[currentRound][index].id,
                        player1_id: f.player1?.id,
                        player2_id: f.player2?.id,
                        fixture_number: index + 1
                    }))
                );
    
            if (error) throw error;
            
            await fetchRoundFixtures(currentRound);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating fixtures:', error);
        }
    };

    const handlePlayerClick = (player: Player) => {
        if (!nextEmptySpot) return;

        const updatedFixtures = [...setupFixtures];
        const { fixtureIndex, isPlayer1 } = nextEmptySpot;

        if (isPlayer1) {
            updatedFixtures[fixtureIndex].player1 = player;
        } else {
            updatedFixtures[fixtureIndex].player2 = player;
        }

        setSetupFixtures(updatedFixtures);
        setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
        updateNextEmptySpot(updatedFixtures);
    };

    const handleRemovePlayer = (fixtureIndex: number, isPlayer1: boolean) => {
        const updatedFixtures = [...setupFixtures];
        const player = isPlayer1 ? updatedFixtures[fixtureIndex].player1 : updatedFixtures[fixtureIndex].player2;

        if (player) {
            if (isPlayer1) {
                updatedFixtures[fixtureIndex].player1 = null;
            } else {
                updatedFixtures[fixtureIndex].player2 = null;
            }
            setSetupFixtures(updatedFixtures);
            setAvailablePlayers(prev => [...prev, player]);
            updateNextEmptySpot(updatedFixtures);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                <button
                    onClick={() => setCurrentRound(prev => prev - 1)}
                    disabled={currentRound === 1}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 
                            disabled:opacity-50 disabled:cursor-not-allowed
                            text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                    ←
                </button>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    George Cup - {roundsInfo[currentRound]?.name || `Round ${currentRound}`}
                </h2>
                <button
                    onClick={() => setCurrentRound(prev => prev + 1)}
                    disabled={currentRound === totalRounds}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 
                            disabled:opacity-50 disabled:cursor-not-allowed
                            text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                    →
                </button>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    {currentRound > 1 && !roundsInfo[currentRound]?.isAvailable 
                        ? "Waiting for previous round's results"
                        : `${roundsInfo[currentRound]?.expectedFixtures || 0} fixtures needed`}
                </div>
            </div>
            <div className="flex gap-6">
            {/* Left column - Available players */}
            <div className="w-1/3">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 dark:text-white">Available Players</h3>
                    <div className="space-y-2">
                        {availablePlayers.map(player => (
                            <button
                                key={player.id}
                                onClick={() => handlePlayerClick(player)}
                                className="w-full p-3 text-left bg-white dark:bg-gray-700 
                                         hover:bg-gray-50 dark:hover:bg-gray-600 
                                         rounded-md border dark:border-gray-600 
                                         transition duration-150 ease-in-out
                                         dark:text-white"
                            >
                                {player.username}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right column - Fixtures setup */}
            <div className="w-2/3">
                {/* Game Week selector */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2 dark:text-white">Game Week</label>
                    <select
                    value={selectedGameWeek}
                    onChange={(e) => setSelectedGameWeek(e.target.value)}
                    disabled={isRoundConfirmed[currentRound]}
                    className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 
                            dark:border-gray-600 dark:text-white
                            disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <option value="">Select game week...</option>
                    {gameWeeks.map(gw => (
                        <option key={gw.id} value={gw.id}>Week {gw.week_number}</option>
                    ))}
                </select>
                </div>

                {/* Fixtures header with edit button */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold dark:text-white">Round Fixtures</h3>
                    {canEditFixtures(currentRound) && (
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 
                                     hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                        >
                            {isEditing ? 'Cancel Edit' : 'Edit Fixtures'}
                        </button>
                    )}
                </div>

                {/* Fixtures list */}
                <div className="space-y-4">
                    {setupFixtures.map((fixture, index) => (
                        <div key={index} 
                            className="p-4 border rounded-lg dark:border-gray-600 
                                     bg-white dark:bg-gray-800">
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                Fixture {index + 1}
                            </div>
                            <div className="grid grid-cols-3 gap-4 items-center">
                                <div 
                                    onClick={() => {
                                        if (isEditing || !isRoundConfirmed[currentRound]) {
                                            fixture.player1 && handleRemovePlayer(index, true);
                                        }
                                    }}
                                    className={`p-3 rounded border ${
                                        isRoundConfirmed[currentRound] && !isEditing
                                            ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                                            : isByeMatch(fixture)
                                                ? 'bg-gray-200 dark:bg-gray-600'
                                                : nextEmptySpot?.fixtureIndex === index && nextEmptySpot?.isPlayer1
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                                                    : 'border-gray-200 bg-gray-50 dark:bg-gray-700'
                                    } dark:border-gray-600 dark:text-white ${
                                        (isEditing || !isRoundConfirmed[currentRound]) && fixture.player1 
                                            ? 'cursor-pointer hover:bg-red-50 dark:hover:bg-red-900'
                                            : ''
                                    }`}
                                >
                                    {fixture.player1?.username || 'Empty'}
                                </div>
                                <div className="text-center font-bold text-gray-400">VS</div>
                                <div 
                                    onClick={() => {
                                        if (isEditing || !isRoundConfirmed[currentRound]) {
                                            fixture.player2 && handleRemovePlayer(index, false);
                                        }
                                    }}
                                    className={`p-3 rounded border ${
                                        isRoundConfirmed[currentRound] && !isEditing
                                            ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                                            : nextEmptySpot?.fixtureIndex === index && !nextEmptySpot?.isPlayer1
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                                                : 'border-gray-200 bg-gray-50 dark:bg-gray-700'
                                    } dark:border-gray-600 dark:text-white ${
                                        (isEditing || !isRoundConfirmed[currentRound]) && fixture.player2
                                            ? 'cursor-pointer hover:bg-red-50 dark:hover:bg-red-900'
                                            : ''
                                    }`}
                                >
                                    {fixture.player2?.username || (fixture.player1 ? 'BYE' : 'Empty')}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action buttons */}
                <div className="mt-6 flex justify-end gap-3">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 
                                         hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => updateFixtures(setupFixtures)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Save Changes
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 
                                         hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setShowConfirmation(true)}
                                disabled={!setupFixtures.every(f => f.player1) || !selectedGameWeek}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md 
                                         hover:bg-blue-700 disabled:bg-gray-300 
                                         disabled:cursor-not-allowed"
                            >
                                Confirm Fixtures
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>

            {showConfirmation && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4">
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                            Confirm Round {currentRound} Fixtures
                        </h3>
                        
                        <div className="space-y-4 mb-6">
                            {getProcessedFixtures().map((fixture, index) => (
                                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {fixture.player1_name}
                                            </span>
                                        </div>
                                        <div className="px-4 text-sm text-gray-500 dark:text-gray-400">
                                            vs
                                        </div>
                                        <div className="flex-1 text-right">
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {fixture.player2_name || 'BYE'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                        Game Week {fixture.game_week}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 
                                        dark:hover:bg-gray-700 rounded-md"
                            >
                                Edit Fixtures
                            </button>
                            <button
                                onClick={handleConfirmFixtures}
                                disabled={isSaving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                                        disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Saving...' : 'Confirm All'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
    </div>
)};
