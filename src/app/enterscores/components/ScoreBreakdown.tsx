//src/components/ScoreBreakdown.tsx

import { calculatePoints, calculateWeeklyCorrectScoreBonus } from '../../../utils/scoreCalculator';

type ScoreBreakdownProps = { 
    fixtures?: Array<{
        id: string;
        home_team: string;
        away_team: string;
        home_score: number | null;
        away_score: number | null;
    }>;
    predictions?: {
        [key: string]: {
            home: number;
            away: number;
        }
    };
    showWeeklyBonus?: boolean;
    prediction?: { home: number; away: number; }; 
    fixture?: { 
        id: string; 
        home_team: string; 
        away_team: string; 
        home_score: number; 
        away_score: number; 
    };
    uniqueCorrectScores?: UniqueScoreMap;
};

type UniqueScoreMap = {
    [fixtureId: string]: boolean;
};

export default function ScoreBreakdown(props: ScoreBreakdownProps) {
    if (props.prediction && props.fixture) {
        const { prediction, fixture, uniqueCorrectScores } = props;
        
        if (typeof fixture.home_score !== 'number' || typeof fixture.away_score !== 'number') {
            return null;
        }
    
        const basePoints = calculatePoints(
            { home_prediction: prediction.home, away_prediction: prediction.away },
            { home_score: fixture.home_score, away_score: fixture.away_score }
        );
        
        if (basePoints <= 0) return null;
    
        const isUniqueCorrectScore = basePoints === 3 && 
            uniqueCorrectScores && 
            uniqueCorrectScores[fixture.id];
        
        const uniqueBonus = isUniqueCorrectScore ? 2 : 0;
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
                    
                    {isUniqueCorrectScore && (
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Unique correct score bonus:</span>
                            <span className="text-emerald-600 dark:text-emerald-400">+2</span>
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
    
    const { fixtures, predictions, showWeeklyBonus } = props;
    if (!fixtures || !predictions) return null;

    let totalPoints = 0;
    let correctScoreCount = 0;
    
    const fixturePoints = fixtures
    .filter(f => f.home_score !== null && f.away_score !== null && predictions[f.id])
    .map(fixture => {
        const prediction = predictions[fixture.id];
        const points = calculatePoints(
            { home_prediction: prediction.home, away_prediction: prediction.away },
            { home_score: fixture.home_score!, away_score: fixture.away_score! }
        );
        
        const isUnique = points === 3 && 
        props.uniqueCorrectScores && 
        props.uniqueCorrectScores[fixture.id];
    
        const uniqueBonus = isUnique ? 2 : 0;
        const totalFixturePoints = points + uniqueBonus;
        
        if (points >= 3) correctScoreCount++;
        totalPoints += totalFixturePoints;
        
        return { 
            fixture, 
            prediction, 
            basePoints: points,
            isUniqueCorrect: isUnique,
            uniqueBonus,
            totalPoints: totalFixturePoints 
        };
    })
    .filter(item => item.basePoints > 0);
    
    const weeklyBonus = showWeeklyBonus ? calculateWeeklyCorrectScoreBonus(correctScoreCount) : 0;
    const grandTotal = totalPoints + weeklyBonus;
    
    return (
        <div className="text-sm space-y-4">
            {fixturePoints.map(({ fixture, basePoints, isUniqueCorrect, uniqueBonus, totalPoints: fixtureTotal }) => (
                <div key={fixture.id} className="grid gap-1.5 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                        {fixture.home_team} vs {fixture.away_team}
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Base points:</span>
                        <span className="text-gray-900 dark:text-gray-100">{basePoints}</span>
                    </div>
                    
                    {isUniqueCorrect && (
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Unique correct score bonus:</span>
                            <span className="text-emerald-600 dark:text-emerald-400">+2</span>
                        </div>
                    )}
                    
                    {(isUniqueCorrect) && (
                        <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                            <span className="font-medium text-gray-600 dark:text-gray-400">Fixture total:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{fixtureTotal}</span>
                        </div>
                    )}
                </div>
            ))}
            
            {/* Summary section for all fixtures */}
            <div className="grid gap-1.5 pt-2">
                <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Base and unique points total:</span>
                    <span className="text-gray-900 dark:text-gray-100">{totalPoints}</span>
                </div>
                
                {showWeeklyBonus && weeklyBonus > 0 && (
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                            Weekly bonus ({correctScoreCount} correct scores):
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400">+{weeklyBonus}</span>
                    </div>
                )}
                
                <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Grand Total:</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">{grandTotal}</span>
                </div>
            </div>
        </div>
    );
}