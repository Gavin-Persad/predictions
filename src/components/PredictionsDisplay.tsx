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
};

export default function PredictionsDisplay({ 
    fixtures, 
    predictions, 
    canEdit,
    onEdit 
}: PredictionDisplayProps) {
    return (
        <div className="space-y-4">
            {fixtures.map((fixture) => (
                <div key={fixture.id} className="grid grid-cols-3 gap-4 items-center">
                    <div className="text-right">{fixture.home_team}</div>
                    <div className="flex justify-center space-x-2">
                        <span>{predictions[fixture.id]?.home ?? '*'}</span>
                        <span>-</span>
                        <span>{predictions[fixture.id]?.away ?? '*'}</span>
                    </div>
                    <div className="text-left">{fixture.away_team}</div>
                </div>
            ))}
            {canEdit && (
                <div className="flex justify-end">
                    <button
                        onClick={onEdit}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        Edit Predictions
                    </button>
                </div>
            )}
        </div>
    );
}