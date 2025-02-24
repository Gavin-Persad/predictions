//src/app/viewseason/components/EditGeorgeCup.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../../../../supabaseClient';

type Player = {
    id: string;
    username: string;
    number?: number;
};

type Fixture = {
    id: string;
    player1_id: string;
    player2_id: string | null;
    game_week_id: string;
    round_id: string;
    fixture_number: number;
};

type FixtureDisplay = {
    fixture_number: number;
    player1_name: string;
    player2_name?: string;
    game_week: number;
};

type RoundStatus = {
    round_number: number;
    total_fixtures: number;
    completed_fixtures: number;
};

type WinnerData = {
    winner_id: string;
    winner: {
        id: string;
        username: string;
    };
};

type Props = {
    seasonId: string;
    onClose: () => void;
};

export default function EditGeorgeCup({ seasonId, onClose }: Props) {
    const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
    const [selectedPlayer1, setSelectedPlayer1] = useState<Player | null>(null);
    const [selectedPlayer2, setSelectedPlayer2] = useState<Player | null>(null);
    const [currentFixture, setCurrentFixture] = useState(1);
    const [totalFixtures, setTotalFixtures] = useState(0);
    const [fixtures, setFixtures] = useState<Fixture[]>([]);
    const [gameWeeks, setGameWeeks] = useState<Array<{ id: string, week_number: number }>>([]);
    const [selectedGameWeek, setSelectedGameWeek] = useState<string>('');
    const [currentRound, setCurrentRound] = useState(1);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [roundFixtures, setRoundFixtures] = useState<Fixture[]>([]);
    const [isLastRound, setIsLastRound] = useState(false);
    const [processedFixtures, setProcessedFixtures] = useState<FixtureDisplay[]>([]);
    const [roundStatuses, setRoundStatuses] = useState<RoundStatus[]>([]);
    const [winners, setWinners] = useState<Player[]>([]);


    useEffect(() => {
        fetchPlayers();
        fetchGameWeeks();
    }, [seasonId]);

    useEffect(() => {
        fetchRoundFixtures();
    }, [currentRound, seasonId]);

    useEffect(() => {
        fetchRoundStatuses();
    }, [seasonId]);

    useEffect(() => {
        if (currentRound > 1) {
            fetchPreviousRoundWinners();
        }
    }, [currentRound]);

    const fetchRoundFixtures = async () => {
        const { data, error } = await supabase
            .from('george_cup_fixtures')
            .select('*')
            .eq('round_id', currentRound.toString())
            .order('fixture_number');

        if (!error && data) {
            setRoundFixtures(data as Fixture[]);
            setIsLastRound(data.length <= 1);
        }
    };

    const fetchGameWeeks = async () => {
        const { data, error } = await supabase
            .from('game_weeks')
            .select('id, week_number')
            .eq('season_id', seasonId)
            .order('week_number');

        if (!error && data) {
            setGameWeeks(data);
        }
    };

    const fetchPlayers = async () => {
        try {
            const { data, error } = await supabase
                .from('season_players')
                .select(`
                    profiles (
                        id,
                        username
                    )
                `)
                .eq('season_id', seasonId);
    
            if (error) {
                console.error('Error fetching players:', error);
                return;
            }
    
            const formattedPlayers = data.map((item: any) => ({
                id: item.profiles.id,
                username: item.profiles.username,
                number: undefined 
            }));
    
            setAvailablePlayers(formattedPlayers);
            const numPlayers = formattedPlayers.length;
            const numFixtures = Math.ceil(numPlayers / 2);
            setTotalFixtures(numFixtures);
        } catch (error) {
            console.error('Error in fetchPlayers:', error);
        }
    };

    const fetchRoundStatuses = async () => {
        const { data, error } = await supabase
            .from('george_cup_fixtures')
            .select('round_id, winner_id')
            .order('round_id');
    
        if (!error && data) {
            const statuses = data.reduce((acc: RoundStatus[], fixture) => {
                const roundNum = parseInt(fixture.round_id);
                const existing = acc.find(s => s.round_number === roundNum);
                
                if (existing) {
                    existing.total_fixtures++;
                    if (fixture.winner_id) existing.completed_fixtures++;
                } else {
                    acc.push({
                        round_number: roundNum,
                        total_fixtures: 1,
                        completed_fixtures: fixture.winner_id ? 1 : 0
                    });
                }
                return acc;
            }, []);
            
            setRoundStatuses(statuses);
        }
    };

    const fetchPreviousRoundWinners = async () => {
        if (currentRound === 1) {
            await fetchPlayers();
            return;
        }
    
        type SupabaseResponse = {
            winner_id: string;
            winner: {
                id: string;
                username: string;
            };
        };
    
        const { data, error } = await supabase
            .from('george_cup_fixtures')
            .select(`
                winner_id,
                winner:profiles!inner(
                    id,
                    username
                )
            `)
            .eq('round_id', (currentRound - 1).toString());
    
        if (!error && data) {
            const typedData = data as unknown as SupabaseResponse[];
            
            const winners = typedData
                .filter(d => d.winner_id)
                .map(d => ({
                    id: d.winner.id,
                    username: d.winner.username,
                    number: undefined
                } as Player));
    
            setAvailablePlayers(winners);
            setTotalFixtures(Math.ceil(winners.length / 2));
        }
    };

    const handlePlayerClick = (player: Player) => {
        if (!selectedPlayer1) {
            setSelectedPlayer1(player);
            setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
        } else if (!selectedPlayer2) {
            setSelectedPlayer2(player);
            setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
        }
    };

    const processFixturesForDisplay = async () => {
        const displayFixtures: FixtureDisplay[] = await Promise.all(
            fixtures.map(async (fixture) => {
                const player1 = availablePlayers.find(p => p.id === fixture.player1_id);
                const player2 = fixture.player2_id 
                    ? availablePlayers.find(p => p.id === fixture.player2_id)
                    : undefined;
                
                const gameWeek = gameWeeks.find(gw => gw.id === fixture.game_week_id);
                
                return {
                    fixture_number: fixture.fixture_number,
                    player1_name: player1?.username || 'Unknown',
                    player2_name: player2?.username,
                    game_week: gameWeek?.week_number || 0
                };
            })
        );
        setProcessedFixtures(displayFixtures);
    };

    const handleConfirmFixture = async () => {
        if (!selectedPlayer1 || !selectedGameWeek) return;

        const fixture = {
            player1_id: selectedPlayer1.id,
            player2_id: selectedPlayer2?.id || null,
            game_week_id: selectedGameWeek,
            round_id: currentRound.toString(),
            fixture_number: currentFixture
        };

        const { error } = await supabase
            .from('george_cup_fixtures')
            .insert([fixture]);

            if (!error) {
                setFixtures(prev => [...prev, fixture as Fixture]);
                setSelectedPlayer1(null);
                setSelectedPlayer2(null);
                
                if (currentFixture >= totalFixtures) {
                    await processFixturesForDisplay();
                    setShowConfirmation(true);
                } else {
                    setCurrentFixture(prev => prev + 1);
                }
            }
        };


    const handlePreviousRound = () => {
        if (currentRound > 1) {
            setCurrentRound(prev => prev - 1);
            setCurrentFixture(1);
        }
    };

    const handleNextRound = () => {
        setCurrentRound(prev => prev + 1);
        setCurrentFixture(1);
    };

    return (
        <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
            <div className="flex items-center gap-4">
                {roundStatuses.map((status) => (
                    <button
                        key={status.round_number}
                        onClick={() => setCurrentRound(status.round_number)}
                        className={`px-3 py-1 rounded ${
                            currentRound === status.round_number
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                        Round {status.round_number}
                        {status.completed_fixtures > 0 && (
                            <span className="ml-2 text-xs">
                                ({status.completed_fixtures}/{status.total_fixtures})
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePreviousRound}
                        disabled={currentRound === 1}
                        className="p-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                    >
                        ←
                    </button>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200">
                        George Cup - {currentRound === 1 ? 'First Round' : 
                                    currentRound === 2 ? 'Second Round' : 
                                    isLastRound ? 'Final' : `Round ${currentRound}`}
                    </h2>
                    <button
                        onClick={handleNextRound}
                        disabled={!roundFixtures.length || currentFixture <= totalFixtures}
                        className="p-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                    >
                        →
                    </button>
                </div>
                <div className="text-sm font-medium bg-blue-50 px-3 py-1 rounded">
                    Fixture {currentFixture} of {totalFixtures}
                </div>
            </div>

            {/* Main content */}
            <div className="flex gap-6">
                {/* Left column - Available players */}
                <div className="w-1/3">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Available Players</h3>
                        <div className="space-y-2">
                            {availablePlayers.map(player => (
                                <button
                                    key={player.id}
                                    onClick={() => handlePlayerClick(player)}
                                    className="w-full p-3 text-left bg-white hover:bg-gray-50 
                                             rounded-md border transition duration-150 ease-in-out"
                                >
                                    {player.number && `(${player.number}) `}{player.username}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right column - Fixture setup */}
                <div className="w-2/3">
                    <div className="bg-white p-6 rounded-lg border">
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2">Select Game Week</label>
                            <select
                                value={selectedGameWeek}
                                onChange={(e) => setSelectedGameWeek(e.target.value)}
                                className="w-full p-2 border rounded-md bg-white"
                            >
                                <option value="">Choose a game week...</option>
                                {gameWeeks.map(gw => (
                                    <option key={gw.id} value={gw.id}>
                                        Week {gw.week_number}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 border rounded-md bg-gray-50">
                                {selectedPlayer1 ? (
                                    <div className="font-medium">{selectedPlayer1.username}</div>
                                ) : (
                                    <div className="text-gray-400">Select First Player</div>
                                )}
                            </div>
                            <div className="text-center font-bold text-gray-400">VS</div>
                            <div className="p-4 border rounded-md bg-gray-50">
                                {selectedPlayer2 ? (
                                    <div className="font-medium">{selectedPlayer2.username}</div>
                                ) : (
                                    <div className="text-gray-400">Select Second Player or Leave Empty for Bye</div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmFixture}
                                disabled={!selectedPlayer1 || !selectedGameWeek}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md
                                         hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Confirm Fixture
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showConfirmation && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4">
                    <h3 className="text-xl font-bold mb-4">Confirm Round {currentRound} Fixtures</h3>
                    
                    <div className="space-y-4 mb-6">
                        {processedFixtures.map((fixture, index) => (
                            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <span className="font-medium">{fixture.player1_name}</span>
                                    </div>
                                    <div className="px-4 text-sm text-gray-500 dark:text-gray-400">
                                        vs
                                    </div>
                                    <div className="flex-1 text-right">
                                        <span className="font-medium">
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
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                            Edit Fixtures
                        </button>
                        <button
                            onClick={() => {
                                setShowConfirmation(false);
                                onClose();
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Confirm All
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
)};