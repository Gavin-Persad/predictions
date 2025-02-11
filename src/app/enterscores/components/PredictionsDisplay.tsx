//src/app/enterscores/components/PredictionsDisplay.tsx

import { useEffect, useState } from 'react';
import { supabase } from '../../../../supabaseClient';
import ScoreBreakdown from './ScoreBreakdown';
import { calculatePoints, calculateWeeklyCorrectScoreBonus } from '../../../utils/scoreCalculator';

type PredictionDisplayProps = {
    fixtures: Array<{
        id: string;
        home_team: string;
        away_team: string;
        fixture_number: number;
        home_score?: number | null;
        away_score?: number | null;
    }>;
    predictions: {
        [key: string]: {
            home: number;
            away: number;
            points?: number;
        };
    };
    gameWeekStatus: 'past' | 'live' | 'predictions' | 'upcoming';
    canEdit?: boolean;
    onEdit?: () => void;
    onBack: () => void;
};

export default function PredictionsDisplay({ 
    fixtures, 
    predictions, 
    gameWeekStatus,
    canEdit,
    onEdit,
    onBack 
}: PredictionDisplayProps) {
    const [allPredictions, setAllPredictions] = useState<Array<{
        fixture_id: string;
        home_prediction: number;
        away_prediction: number;
    }>>([]);
    const [loading, setLoading] = useState(true);
    const [totalPoints, setTotalPoints] = useState(0);
    const [correctScores, setCorrectScores] = useState(0);

    useEffect(() => {
        const fetchAllPredictions = async () => {
            if (!fixtures.length) return;
            
            setLoading(true);
            
            const { data, error } = await supabase
                .from('predictions')
                .select('fixture_id, home_prediction, away_prediction')
                .in('fixture_id', fixtures.map(f => f.id));
    
            if (error) {
                console.error('Error fetching predictions:', error);
                return;
            }
    
            if (data) {
                setAllPredictions(data);
            }
            setLoading(false);
        };
    
        if (gameWeekStatus === 'past') {
            fetchAllPredictions();
        }
    }, [fixtures, gameWeekStatus]);

    useEffect(() => {
        if (gameWeekStatus === 'past' && !loading) {
            let scoreCount = 0;
            let points = 0;

            fixtures.forEach(fixture => {
                if (predictions[fixture.id] && typeof fixture.home_score === 'number' && typeof fixture.away_score === 'number') {
                    const basePoints = calculatePoints(
                        { home_prediction: predictions[fixture.id].home, away_prediction: predictions[fixture.id].away },
                        { home_score: fixture.home_score, away_score: fixture.away_score }
                    );

                    if (predictions[fixture.id].home === fixture.home_score && 
                        predictions[fixture.id].away === fixture.away_score) {
                        scoreCount++;
                    }

                    const isUnique = allPredictions?.filter(p => 
                        p.fixture_id === fixture.id && 
                        p.home_prediction === predictions[fixture.id].home && 
                        p.away_prediction === predictions[fixture.id].away
                    ).length === 1;

                    points += basePoints + (isUnique && basePoints >= 3 ? 2 : 0);
                }
            });

            const weeklyBonus = calculateWeeklyCorrectScoreBonus(scoreCount);
            setCorrectScores(scoreCount);
            setTotalPoints(points + weeklyBonus);
        }
    }, [fixtures, predictions, allPredictions, gameWeekStatus, loading]);

    const renderScoreBreakdown = (fixture: typeof fixtures[0]) => {
        if (gameWeekStatus === 'past' && 
            predictions[fixture.id] && 
            typeof fixture.home_score === 'number' && 
            typeof fixture.away_score === 'number' && 
            !loading) {
            return (
                <div className="flex justify-end mt-2">
                    <div className="w-64 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <ScoreBreakdown
                            prediction={predictions[fixture.id]}
                            fixture={{
                                id: fixture.id,
                                home_team: fixture.home_team,
                                away_team: fixture.away_team,
                                home_score: fixture.home_score,
                                away_score: fixture.away_score
                            }}
                            allPredictions={allPredictions}
                        />
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-4">
            <button
                onClick={onBack}
                className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
                Back
            </button>
            
            {fixtures.map(fixture => (
                <div key={fixture.id} className="p-4 bg-white dark:bg-gray-800 rounded shadow">
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <div className="text-right text-gray-900 dark:text-gray-100">
                            {fixture.home_team}
                        </div>
                        <div className="text-center text-gray-900 dark:text-gray-100">
                            {predictions[fixture.id] ? (
                                `${predictions[fixture.id].home} - ${predictions[fixture.id].away}`
                            ) : (
                                'No prediction'
                            )}
                        </div>
                        <div className="text-left text-gray-900 dark:text-gray-100">
                            {fixture.away_team}
                        </div>
                    </div>
                    {renderScoreBreakdown(fixture)}
                </div>
            ))}
            
            {gameWeekStatus === 'past' && !loading && (
                <div className="flex justify-end mt-6">
                    <div className="w-64 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <div className="text-sm space-y-2">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                                Weekly Summary
                            </div>
                            <div className="grid gap-1.5">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Exact scores:</span>
                                    <span className="text-gray-900 dark:text-gray-100">{correctScores}</span>
                                </div>
                                {correctScores >= 4 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Weekly bonus:</span>
                                        <span className="text-emerald-600 dark:text-emerald-400">
                                            +{calculateWeeklyCorrectScoreBonus(correctScores)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                                    <span className="font-medium text-gray-900 dark:text-gray-100">Total points:</span>
                                    <span className="font-bold text-gray-900 dark:text-gray-100">{totalPoints}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {gameWeekStatus === 'predictions' && canEdit && (
                <button
                    onClick={onEdit}
                    className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Edit Predictions
                </button>
            )}
        </div>
    );
}