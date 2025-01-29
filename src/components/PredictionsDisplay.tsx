//src/components/PredictionsDisplay.tsx

"use client";

type PredictionDisplayProps = {
    fixtures: Array<{
        id: string;
        home_team: string;
        away_team: string;
        fixture_number: number;
    }>;
    predictions: {
        [key: string]: {
            home: number;
            away: number;
        };
    };
    canEdit?: boolean;
    onEdit?: () => void;
    onBack: () => void;
};

export default function PredictionsDisplay({ 
    fixtures, 
    predictions, 
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
            {fixtures.map((fixture) => (
                <div key={fixture.id} className="grid grid-cols-3 gap-4 items-center">
                    <div className="text-right text-gray-900 dark:text-gray-100">{fixture.home_team}</div>
                    <div className="text-center text-gray-900 dark:text-gray-100">
                        {predictions[fixture.id] ? (
                            `${predictions[fixture.id].home} - ${predictions[fixture.id].away}`
                        ) : (
                            'No prediction'
                        )}
                    </div>
                    <div className="text-left text-gray-900 dark:text-gray-100">{fixture.away_team}</div>
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