//src/app/enterscores/components/PredictionsDisplay.tsx

import ScoreBreakdown from './ScoreBreakdown';

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
    allPredictions?: Array<{
        fixture_id: string;
        home_prediction: number;
        away_prediction: number;
    }>;
    canEdit?: boolean;
    onEdit?: () => void;
    onBack: () => void;
};

export default function PredictionsDisplay({ 
    fixtures, 
    predictions, 
    gameWeekStatus,
    allPredictions,
    canEdit,
    onEdit,
    onBack 
}: PredictionDisplayProps) {
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
                    <div className="flex flex-col space-y-4">
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
                        
                        {gameWeekStatus === 'past' && 
                            predictions[fixture.id] && 
                            typeof fixture.home_score === 'number' && 
                            typeof fixture.away_score === 'number' && (
                                <div className="flex justify-end">
                                    <div className="w-64 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 transition-all duration-300 hover:shadow-md">
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
                        )}
                    </div>
                </div>
            ))}
            
            {canEdit && (
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