//src/utils/calculatePoints.ts

type Prediction = {
    user_id: string;
    fixture_id: string;
    home_prediction: number;
    away_prediction: number;
};

type Fixture = {
    id: string;
    home_score: number;
    away_score: number;
};

export const calculatePoints = (
    prediction: { home_prediction: number, away_prediction: number },
    actual: { home_score: number, away_score: number }
): number => {

    // Incorrect result
    if ((prediction.home_prediction > prediction.away_prediction && actual.home_score < actual.away_score) ||
        (prediction.home_prediction < prediction.away_prediction && actual.home_score > actual.away_score) ||
        (prediction.home_prediction === prediction.away_prediction && actual.home_score !== actual.away_score) ||
        (prediction.home_prediction !== prediction.away_prediction && actual.home_score === actual.away_score)) {
        return 0;
    }

    // Exact score match
    if (prediction.home_prediction === actual.home_score && 
        prediction.away_prediction === actual.away_score) {
        
        const totalGoals = actual.home_score + actual.away_score;
        
        if (totalGoals <= 3) return 3;
        return totalGoals;
    }

    // Correct result but wrong score
    return 1;
};


export const calculateUniqueResultBonus = (
    prediction: Prediction,
    fixture: Fixture,
    allPredictions: Prediction[]
): number => {
    // Determine actual outcome: 'H' (home), 'A' (away), 'D' (draw)
    const actualOutcome = fixture.home_score > fixture.away_score ? 'H' :
        fixture.home_score < fixture.away_score ? 'A' : 'D';

    // Determine this prediction's outcome
    const predOutcome = prediction.home_prediction > prediction.away_prediction ? 'H' :
        prediction.home_prediction < prediction.away_prediction ? 'A' : 'D';

    // Only award bonus to players who correctly predicted the outcome
    if (predOutcome !== actualOutcome) return 0;

    // Count how many players predicted the same outcome for this fixture
    const sameOutcomeCount = allPredictions.filter(p =>
        p.fixture_id === fixture.id &&
        (p.home_prediction > p.away_prediction ? 'H' : p.home_prediction < p.away_prediction ? 'A' : 'D') === actualOutcome
    ).length;

    // Award bonus if this player was unique in predicting the correct outcome
    return sameOutcomeCount === 1 ? 2 : 0;
};

// Backwards-compatible export: keep old name pointing to new function
export const calculateUniqueScoreBonus = calculateUniqueResultBonus;

export const calculateWeeklyCorrectScoreBonus = (correctScores: number): number => {
    if (correctScores >= 6) return 3;
    if (correctScores >= 5) return 2;
    if (correctScores >= 4) return 1;
    return 0;
};

