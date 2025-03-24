//src/app/viewseason/components/ScoresModal.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../../../supabaseClient';
import { Player } from '../../../types/players';

type ScoresModalProps = {
    gameWeekId: string;
    seasonId: string;
    onClose: () => void;
};

type Fixture = {
    id: string;
    fixture_number: number;
    home_team: string;
    away_team: string;
    home_score: number;
    away_score: number;
};

type Prediction = {
    id: string;
    user_id: string;
    fixture_id: string;
    home_prediction: number;
    away_prediction: number;
    created_at: string;
    updated_at: string;
};

type PlayerResponse = {
    profiles: {
        id: string;
        username: string;
    };
};

export default function ScoresModal({ gameWeekId, seasonId, onClose }: ScoresModalProps) {
    const [fixtures, setFixtures] = useState<Fixture[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<string>('');
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [selectedFixture, setSelectedFixture] = useState<string | null>(null);
    const [selectedCell, setSelectedCell] = useState<{playerId: string | null, fixtureId: string | null}>({
        playerId: null,
        fixtureId: null
    });
    const [canViewScores, setCanViewScores] = useState(false);
    const [showColorKey, setShowColorKey] = useState(false);

    const ColorKeyModal = ({ isOpen }: { isOpen: boolean }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed bottom-20 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl z-50 w-64
                transition-opacity duration-200 ease-in-out">
                <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">Score Colors</h3>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <div className="w-6 h-6 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded mr-2"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">Incorrect Prediction</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-6 h-6 bg-amber-200 dark:bg-amber-900 rounded mr-2"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">Correct Result</span>
                        </div>
                        <div className="flex items-center">
                        <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-700 rounded mr-2"></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">Correct Score (0-3 goals)</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded mr-2"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">Correct Score (4 goals)</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded mr-2"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">Correct Score (5 goals)</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded mr-2"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">Correct Score (6+ goals)</span>
                        </div>
                        <div className="flex items-center">
                        <div className="w-6 h-6 rounded mr-2 flex items-center justify-center relative">
                            <span className="absolute text-black rounded-full w-4 h-4"></span>
                            <span className="relative text-yellow-400">★</span>
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">Unique Correct Score</span>
                    </div>
                </div>
            </div>
        );
    };  

    const getPredictionColorClass = (prediction: Prediction, fixture: Fixture): string => {
        if (!fixture.home_score || !fixture.away_score) return '';

        // Calculate if prediction matches result
    const actualResult = fixture.home_score > fixture.away_score ? 'H' : 
        fixture.home_score < fixture.away_score ? 'A' : 'D';
    const predictedResult = prediction.home_prediction > prediction.away_prediction ? 'H' :
        prediction.home_prediction < prediction.away_prediction ? 'A' : 'D';

    // Check for exact score match
    if (prediction.home_prediction === fixture.home_score && 
    prediction.away_prediction === fixture.away_score) {
    const totalGoals = fixture.home_score + fixture.away_score;
    if (totalGoals >= 6) return 'bg-red-100 dark:bg-red-900';
    if (totalGoals === 5) return 'bg-purple-100 dark:bg-purple-900';
    if (totalGoals === 4) return 'bg-green-100 dark:bg-green-900';
    return 'bg-yellow-100 dark:bg-yellow-700';
    }

// Check for correct result but wrong score
if (actualResult === predictedResult) {
return 'bg-amber-200 dark:bg-amber-900';
}

// Incorrect prediction
return '';
};

const isUniqueCorrectScore = (prediction: Prediction, fixture: Fixture): boolean => {
    // First check if it's a correct score
    if (prediction.home_prediction !== fixture.home_score || 
        prediction.away_prediction !== fixture.away_score) {
        return false;
    }

    // Then check if it's unique
    const correctPredictions = predictions.filter(p => 
        p.fixture_id === fixture.id &&
        p.home_prediction === fixture.home_score &&
        p.away_prediction === fixture.away_score
    );

    return correctPredictions.length === 1;
};

useEffect(() => {
    const fetchData = async () => {
        try {
            // First fetch game week data to check times
            const { data: gameWeekData, error: gameWeekError } = await supabase
                .from('game_weeks')
                .select('predictions_close')
                .eq('id', gameWeekId)
                .single();

            if (gameWeekError) throw gameWeekError;

            const now = new Date();
            const predictionsClose = new Date(gameWeekData.predictions_close);
            
            // Only allow viewing scores after predictions close
            if (now <= predictionsClose) {
                setMessage("Scores will be visible after predictions close");
                setLoading(false);
                return;
            }

            setCanViewScores(true);

            // Fetch fixtures data
            const { data: fixturesData, error: fixturesError } = await supabase
                .from('fixtures')
                .select('*')
                .eq('game_week_id', gameWeekId);

            if (fixturesError) throw fixturesError;

            // Fetch players data
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

            const formattedPlayers = (playersData as unknown as PlayerResponse[]).map(p => ({
                id: p.profiles.id,
                username: p.profiles.username
            }));

            // Fetch predictions data
            const { data: predictionsData, error: predictionsError } = await supabase
                .from('predictions')
                .select('*')
                .in('fixture_id', fixturesData?.map(f => f.id) || []);

            if (predictionsError) throw predictionsError;

            setFixtures(fixturesData || []);
            setPlayers(formattedPlayers);
            setPredictions(predictionsData || []);
            setLoading(false);
        } catch (error) {
            console.error('Error:', error);
            setMessage('Error fetching data');
            setLoading(false);
        }
    };

    fetchData();
}, [gameWeekId, seasonId]);
    
    const handlePlayerClick = (playerId: string) => {
        setSelectedPlayer(current => current === playerId ? null : playerId);
        setSelectedCell({ playerId: null, fixtureId: null });
        setSelectedFixture(null);
    };
    
    const handleFixtureClick = (fixtureId: string) => {
        setSelectedFixture(current => current === fixtureId ? null : fixtureId);
        setSelectedCell({ playerId: null, fixtureId: null });
        setSelectedPlayer(null);
    };
    
    const handleCellClick = (playerId: string, fixtureId: string) => {
        if (selectedCell.playerId === playerId && selectedCell.fixtureId === fixtureId) {
            setSelectedCell({ playerId: null, fixtureId: null });
            setSelectedPlayer(null);
            setSelectedFixture(null);
        } else {
            setSelectedCell({ playerId, fixtureId });
            setSelectedPlayer(playerId);
            setSelectedFixture(fixtureId);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-6xl w-full">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Game Week Scores</h2>
                
                {loading ? (
                    <p className="text-gray-900 dark:text-gray-100">Loading...</p>
                ) : canViewScores ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="px-4 py-2 text-left border-b dark:border-gray-700"> </th>
                                    {fixtures.map(fixture => (
                                        <th 
                                            key={fixture.id} 
                                            onClick={() => handleFixtureClick(fixture.id)}
                                            className={`px-4 py-2 text-center border-b cursor-pointer transition-colors
                                                ${selectedFixture === fixture.id ? 
                                                    'bg-blue-100 dark:bg-blue-900 dark:text-gray-100' : 
                                                    'dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'}
                                                border-gray-700`}
                                        >
                                            {fixture.home_team}<br/>vs<br/>{fixture.away_team}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-gray-200 dark:bg-gray-700">
                                    <td className="px-4 py-2 font-medium border-b dark:text-gray-100 border-gray-700">
                                        Correct Scores
                                    </td>
                                    {fixtures.map(fixture => (
                                        <td 
                                            key={fixture.id}
                                            className={`px-4 py-2 text-center border-b dark:text-gray-100 border-gray-700
                                                ${selectedFixture === fixture.id ? 
                                                    'bg-blue-100 dark:bg-blue-900' : ''}`}
                                        >
                                            {fixture.home_score !== null && fixture.away_score !== null
                                                ? `${fixture.home_score}-${fixture.away_score}`
                                                : '-'
                                            }
                                        </td>
                                    ))}
                                </tr>
                                {players.map(player => (
                                    <tr key={player.id}>
                                        <td 
                                            onClick={() => handlePlayerClick(player.id)}
                                            className={`px-4 py-2 font-medium border-b cursor-pointer transition-colors
                                                ${selectedPlayer === player.id ? 
                                                    'bg-blue-100 dark:bg-blue-900 dark:text-gray-100' : 
                                                    'dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'}
                                                border-gray-700`}
                                        >
                                            {player.username}
                                        </td>
                                        {fixtures.map(fixture => {
                                            const prediction = predictions.find(
                                                p => p.user_id === player.id && p.fixture_id === fixture.id
                                            );
                                            return (
                                                <td 
                                                    key={fixture.id}
                                                    onClick={() => prediction && handleCellClick(player.id, fixture.id)}
                                                    className={`px-4 py-2 text-center border-b transition-colors border-gray-700 relative
                                                        ${(selectedPlayer === player.id || 
                                                        selectedFixture === fixture.id ||
                                                        (selectedCell.playerId === player.id && selectedCell.fixtureId === fixture.id)) 
                                                        ? 'bg-blue-100 dark:bg-blue-900 dark:text-gray-100' 
                                                        : `${prediction ? getPredictionColorClass(prediction, fixture) : ''} 
                                                        dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700`}
                                                        ${prediction ? 'cursor-pointer' : ''}`}
                                                >
                                                {prediction ? `${prediction.home_prediction}-${prediction.away_prediction}` : '-'}
                                                    {prediction && isUniqueCorrectScore(prediction, fixture) && (
                                                        <span className="absolute top-1 right-1 z-10">
                                                            <span className="text-yellow-400 text-xs">★</span>
                                                        </span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                            </table>
                </div>
            ) : (
                <p className="text-center text-gray-900 dark:text-gray-100">
                    Scores will be visible after predictions close
                </p>
            )}
            <button
                onClick={() => setShowColorKey(!showColorKey)}
                className="fixed bottom-4 right-4 p-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 shadow-lg"
                title="Toggle color key"
            >
                🎨
            </button>

            <ColorKeyModal isOpen={showColorKey} />

            <button
                onClick={onClose}
                className="mt-6 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
                Close
            </button>
        </div>
    </div>
);
}