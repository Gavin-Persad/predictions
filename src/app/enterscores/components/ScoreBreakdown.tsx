//src/components/ScoreBreakdown.tsx

import { calculatePoints } from '../../../utils/scoreCalculator';

type ScoreBreakdownProps = { 
    prediction: { home: number; away: number; }; 
    fixture: { 
        id: string; 
        home_team: string; 
        away_team: string; 
        home_score: number; 
        away_score: number; 
    };
    allPredictions?: Array<{ 
        fixture_id: string; 
        home_prediction: number; 
        away_prediction: number; 
    }>;
};

export default function ScoreBreakdown({ prediction, fixture, allPredictions }: ScoreBreakdownProps) {
    if (typeof fixture.home_score !== 'number' || typeof fixture.away_score !== 'number') {
        return null;
    }

    const basePoints = calculatePoints(
        { home_prediction: prediction.home, away_prediction: prediction.away },
        { home_score: fixture.home_score, away_score: fixture.away_score }
    );

    const isUnique = allPredictions?.filter(p => 
        p.fixture_id === fixture.id && 
        p.home_prediction === prediction.home && 
        p.away_prediction === prediction.away
    ).length === 1;

    const uniqueBonus = isUnique && basePoints >= 3 ? 2 : 0;
    const totalPoints = basePoints + uniqueBonus;

    return (
        <div className="text-sm space-y-2">
            <div className="font-semibold text-gray-900 dark:text-gray-100">
                Points Breakdown
            </div>
            <div className="grid gap-1.5">
                <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Base points:</span>
                    <span className="text-gray-900 dark:text-gray-100">{basePoints}</span>
                </div>
                {uniqueBonus > 0 && (
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Unique score bonus:</span>
                        <span className="text-emerald-600 dark:text-emerald-400">+{uniqueBonus}</span>
                    </div>
                )}
                <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Total:</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">{totalPoints}</span>
                </div>
            </div>
        </div>
    );
}