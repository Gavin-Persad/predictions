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


export const calculateUniqueScoreBonus = (
    prediction: Prediction,
    fixture: Fixture,
    allPredictions: Prediction[]
): number => {
    // Check if this prediction is correct
    if (prediction.home_prediction !== fixture.home_score || 
        prediction.away_prediction !== fixture.away_score) {
        return 0;
    }

    // Count how many players got this score correct
    const correctPredictions = allPredictions.filter(p => 
        p.fixture_id === fixture.id &&
        p.home_prediction === fixture.home_score &&
        p.away_prediction === fixture.away_score
    );

    // Award bonus if unique
    return correctPredictions.length === 1 ? 2 : 0;
};

export const calculateWeeklyCorrectScoreBonus = (correctScores: number): number => {
    if (correctScores >= 6) return 3;
    if (correctScores >= 5) return 2;
    if (correctScores >= 4) return 1;
    return 0;
};

