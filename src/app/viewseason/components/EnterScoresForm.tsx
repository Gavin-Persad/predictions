//src/app/viewseason/components/EnterScoresForm.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../../../supabaseClient';
import { 
    calculatePoints, 
    calculateUniqueScoreBonus, 
    calculateWeeklyCorrectScoreBonus 
} from '../../../utils/scoreCalculator';

type EnterScoresFormProps = {
    gameWeekId: string;
    onClose: () => void;
    onSave: () => void;
};

type Fixture = {
    id: string;
    game_week_id: string;
    fixture_number: number;
    home_team: string;
    away_team: string;
    home_score: number | null;
    away_score: number | null;
};

const ConfirmScoresModal = ({ fixtures, onConfirm, onCancel }: { 
    fixtures: Fixture[], 
    onConfirm: () => void, 
    onCancel: () => void 
}) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                    Confirm Scores
                </h2>
                <div className="space-y-4 mb-6">
                    {fixtures.map(fixture => (
                        <div 
                            key={fixture.id}
                            className="grid grid-cols-3 gap-4 items-center text-gray-900 dark:text-gray-100"
                        >
                            <div className="text-right">{fixture.home_team}</div>
                            <div className="text-center font-bold">
                                {fixture.home_score} - {fixture.away_score}
                            </div>
                            <div className="text-left">{fixture.away_team}</div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition duration-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
                    >
                        Update League
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function EnterScoresForm({ gameWeekId, onClose, onSave }: EnterScoresFormProps) {
    const [fixtures, setFixtures] = useState<Fixture[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        const fetchFixtures = async () => {
            const { data, error } = await supabase
                .from('fixtures')
                .select('*')
                .eq('game_week_id', gameWeekId)
                .order('fixture_number');

            if (error) {
                setMessage('Error fetching fixtures');
                console.error(error);
            } else {
                setFixtures(data);
            }
            setLoading(false);
        };

        fetchFixtures();
    }, [gameWeekId]);

    const handleSaveScores = async () => {
        setLoading(true);
        try {
            // 1. Get season_id for this game week
            const { data: gameWeekData, error: gameWeekError } = await supabase
                .from('game_weeks')
                .select('season_id')
                .eq('id', gameWeekId)
                .single();

            if (gameWeekError || !gameWeekData?.season_id) {
                throw new Error('Failed to fetch game week data');
            }

            // 2. Update fixtures
            const { error: fixturesError } = await supabase
                .from('fixtures')
                .upsert(fixtures);

            if (fixturesError) throw fixturesError;

            // 3. Get predictions
            const { data: predictions, error: predictionsError } = await supabase
                .from('predictions')
                .select('*')
                .in('fixture_id', fixtures.map(f => f.id));

            if (predictionsError || !predictions) throw predictionsError;

            // 4. Calculate scores with bonuses
            const playerScores: Record<string, { correct_scores: number, points: number }> = {};

            // First pass - calculate base points and track correct scores
            predictions.forEach(prediction => {
                const fixture = fixtures.find(f => f.id === prediction.fixture_id);
                if (!fixture || fixture.home_score === null || fixture.away_score === null) return;

                // Initialize player scores
                if (!playerScores[prediction.user_id]) {
                    playerScores[prediction.user_id] = { correct_scores: 0, points: 0 };
                }

                // Calculate base points
                const basePoints = calculatePoints(
                    { 
                        home_prediction: prediction.home_prediction, 
                        away_prediction: prediction.away_prediction 
                    },
                    { 
                        home_score: fixture.home_score, 
                        away_score: fixture.away_score 
                    }
                );

                // Calculate unique score bonus
                const uniqueBonus = calculateUniqueScoreBonus(
                    prediction,
                    {
                        id: fixture.id,
                        home_score: fixture.home_score,
                        away_score: fixture.away_score
                    },
                    predictions
                );

                // Update points and correct scores
                playerScores[prediction.user_id].points += basePoints + uniqueBonus;
                if (basePoints >= 3) {
                    playerScores[prediction.user_id].correct_scores++;
                }
            });

            // Add weekly bonus for multiple correct scores
            Object.values(playerScores).forEach(score => {
                const weeklyBonus = calculateWeeklyCorrectScoreBonus(score.correct_scores);
                score.points += weeklyBonus;
            });

            // 5. Update game week scores
            const gameWeekScores = Object.entries(playerScores).map(([player_id, scores]) => ({
                game_week_id: gameWeekId,
                player_id,
                correct_scores: scores.correct_scores,
                points: scores.points
            }));

            const { error: gameWeekScoresError } = await supabase
                .from('game_week_scores')
                .upsert(gameWeekScores, {
                    onConflict: 'game_week_id,player_id',
                    ignoreDuplicates: false
                });

            if (gameWeekScoresError) throw gameWeekScoresError;

            // 6. Update season scores
            const seasonScores = Object.entries(playerScores).map(([player_id, scores]) => ({
                season_id: gameWeekData.season_id,
                player_id,
                correct_scores: scores.correct_scores,
                points: scores.points
            }));

            const { error: seasonUpdateError } = await supabase
                .from('season_scores')
                .upsert(seasonScores, {
                    onConflict: 'season_id,player_id',
                    ignoreDuplicates: false
                });

            if (seasonUpdateError) throw seasonUpdateError;

            setMessage('Scores updated successfully');
            setShowConfirmModal(false);
            onSave();
        } catch (error) {
            console.error('Error:', error);
            setMessage('Error updating scores');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
    
        if (fixtures.some(f => 
            (f.home_score === null && f.away_score !== null) || 
            (f.home_score !== null && f.away_score === null)
        )) {
            setMessage('Both scores must be entered for each fixture');
            return;
        }
    
        setShowConfirmModal(true);
    };

    const handleScoreChange = (fixtureId: string, field: 'home_score' | 'away_score', value: string) => {
        const score = value === '' ? null : parseInt(value);
        setFixtures(fixtures.map(fixture => 
            fixture.id === fixtureId 
                ? { ...fixture, [field]: score }
                : fixture
        ));
    };
    

    if (loading) return <div>Loading...</div>;

    return (
        <div className="w-full max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Enter Match Scores</h2>
            <button
                onClick={onClose}
                className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
                Back
            </button>

            {message && (
                <p className={`mb-4 ${
                    message.includes('Error') ? 'text-red-500' : 'text-green-500'
                }`}>
                    {message}
                </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {fixtures.map(fixture => (
                    <div key={fixture.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center text-gray-900 dark:text-white p-2">
                        <div className="text-center sm:text-right text-sm sm:text-base">
                            {fixture.home_team}
                        </div>
                        <div className="flex justify-center space-x-2">
                            <input
                                type="number"
                                min="0"
                                value={fixture.home_score ?? ''}
                                onChange={(e) => handleScoreChange(fixture.id, 'home_score', e.target.value)}
                                className="w-12 p-1 text-center border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                            />
                            <span>-</span>
                            <input
                                type="number"
                                min="0"
                                value={fixture.away_score ?? ''}
                                onChange={(e) => handleScoreChange(fixture.id, 'away_score', e.target.value)}
                                className="w-12 p-1 text-center border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                            />
                        </div>
                        <div className="text-center sm:text-left text-sm sm:text-base">
                            {fixture.away_team}
                        </div>
                    </div>
                ))}
                <div className="flex justify-end space-x-4 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition duration-300"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
                    >
                        Save Scores
                    </button>
                </div>
            </form>

            {showConfirmModal && (
                <ConfirmScoresModal
                    fixtures={fixtures}
                    onConfirm={handleSaveScores}
                    onCancel={() => setShowConfirmModal(false)}
                />
            )}
        </div>
    );
}