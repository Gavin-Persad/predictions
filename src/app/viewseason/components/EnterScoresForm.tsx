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

type LaveryCupRound = {
    id: string;
    round_number: number;
    round_name: string;
    game_week_id: string;
    is_complete: boolean;
  };
  
  type LaveryCupSelection = {
    id: string;
    round_id: string;
    player_id: string;
    team1_name: string;
    team2_name: string;
    team1_won: boolean | null;
    team2_won: boolean | null;
    advanced: boolean;
    player_username?: string;
  };

  const ConfirmScoresModal = ({ fixtures, onConfirm, onCancel, onNext, hasLaveryCup }: { 
    fixtures: Fixture[], 
    onConfirm: () => void, 
    onCancel: () => void,
    onNext?: () => void,
    hasLaveryCup?: boolean
}) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                    Confirm Scores
                </h2>
                <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto">
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
                    {hasLaveryCup && onNext ? (
                      <button
                          onClick={onNext}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
                      >
                          Next: Lavery Cup
                      </button>
                    ) : (
                      <button
                          onClick={onConfirm}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
                      >
                          Update League
                      </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const LaveryCupConfirmModal = ({ 
    selections, 
    onConfirm, 
    onCancel, 
    onBack,
    roundName
  }: { 
    selections: LaveryCupSelection[], 
    onConfirm: () => void, 
    onCancel: () => void,
    onBack: () => void,
    roundName: string
  }) => {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            Confirm Lavery Cup - {roundName}
          </h2>
          <div className="space-y-6 mb-6 max-h-[60vh] overflow-y-auto">
            {selections.map(selection => (
              <div 
                key={selection.id}
                className="p-4 border rounded-lg border-gray-200 dark:border-gray-700"
              >
                <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {selection.player_username}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded ${
                    selection.team1_won === null 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' 
                      : selection.team1_won 
                        ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200' 
                        : 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
                  }`}>
                    {selection.team1_name}
                  </div>
                  <div className={`p-2 rounded ${
                    selection.team2_won === null 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' 
                      : selection.team2_won 
                        ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200' 
                        : 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
                  }`}>
                    {selection.team2_name}
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  Status: {selection.team1_won && selection.team2_won ? 'Advanced' : 'Not Advanced'}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-4">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition duration-300"
            >
              Back to Scores
            </button>
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

  const LaveryCupSelectionForm = ({ 
    laveryCupSelections,
    onSelectionChange,
    onBack,
    onSubmit,
    roundName
  }: {
    laveryCupSelections: LaveryCupSelection[];
    onSelectionChange: (selectionId: string, field: 'team1_won' | 'team2_won', value: boolean) => void;
    onBack: () => void;
    onSubmit: () => void;
    roundName: string;
  }) => {
    // Group selections by player for better display
    const selectionsByPlayer = laveryCupSelections.reduce((acc: Record<string, LaveryCupSelection[]>, selection) => {
      const playerName = selection.player_username || 'Unknown Player';
      if (!acc[playerName]) {
        acc[playerName] = [];
      }
      acc[playerName].push(selection);
      return acc;
    }, {});
  
    return (
      <div className="w-full max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Lavery Cup Results - {roundName}
        </h2>
        <p className="mb-6 text-gray-700 dark:text-gray-300">
          Check the boxes for the teams that won their matches.
        </p>
        
        {Object.entries(selectionsByPlayer).map(([playerName, selections]) => (
          <div key={playerName} className="mb-8 border rounded-lg p-4 dark:border-gray-700">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">{playerName}</h3>
            
            {selections.map(selection => (
              <div key={selection.id} className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={`team1-${selection.id}`}
                      checked={selection.team1_won === true}
                      onChange={(e) => onSelectionChange(selection.id, 'team1_won', e.target.checked)}
                      className="h-5 w-5 text-blue-600"
                    />
                    <label htmlFor={`team1-${selection.id}`} className="text-gray-900 dark:text-gray-100">
                      {selection.team1_name}
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={`team2-${selection.id}`}
                      checked={selection.team2_won === true}
                      onChange={(e) => onSelectionChange(selection.id, 'team2_won', e.target.checked)}
                      className="h-5 w-5 text-blue-600"
                    />
                    <label htmlFor={`team2-${selection.id}`} className="text-gray-900 dark:text-gray-100">
                      {selection.team2_name}
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition duration-300"
          >
            Back to Scores
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
          >
            Save Results
          </button>
        </div>
      </div>
    );
  };


  export default function EnterScoresForm({ gameWeekId, onClose, onSave }: EnterScoresFormProps) {
    const [fixtures, setFixtures] = useState<Fixture[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showLaveryCupModal, setShowLaveryCupModal] = useState(false);
    const [laveryCupRound, setLaveryCupRound] = useState<LaveryCupRound | null>(null);
    const [laveryCupSelections, setLaveryCupSelections] = useState<LaveryCupSelection[]>([]);
    const [showScoresForm, setShowScoresForm] = useState(true);
    const [seasonId, setSeasonId] = useState<string | null>(null);

    // Fetch fixtures and check for Lavery Cup round
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get fixtures
                const { data: fixturesData, error: fixturesError } = await supabase
                    .from('fixtures')
                    .select('*')
                    .eq('game_week_id', gameWeekId)
                    .order('fixture_number');

                if (fixturesError) throw fixturesError;
                setFixtures(fixturesData || []);

                // Get game week info for season ID
                const { data: gameWeekData, error: gameWeekError } = await supabase
                    .from('game_weeks')
                    .select('season_id')
                    .eq('id', gameWeekId)
                    .single();

                if (gameWeekError) throw gameWeekError;
                setSeasonId(gameWeekData.season_id);

                // Check if there's a Lavery Cup round for this game week
                const { data: laveryCupData, error: laveryCupError } = await supabase
                    .from('lavery_cup_rounds')
                    .select('*')
                    .eq('game_week_id', gameWeekId)
                    .single();

                if (!laveryCupError && laveryCupData) {
                    setLaveryCupRound(laveryCupData);
                    
                    // Fetch Lavery Cup selections if there's a round
                    const { data: selectionsData, error: selectionsError } = await supabase
                        .from('lavery_cup_selections')
                        .select(`
                            *,
                            profiles!lavery_cup_selections_player_id_fkey (
                                username
                            )
                        `)
                        .eq('round_id', laveryCupData.id);

                    if (selectionsError) throw selectionsError;
                    
                    setLaveryCupSelections(
                        (selectionsData || []).map(selection => ({
                            ...selection,
                            player_username: selection.profiles?.username
                        }))
                    );
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setMessage('Error fetching data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [gameWeekId]);

    // Handle updating Lavery Cup selection results
    const handleLaveryCupSelectionChange = (
        selectionId: string, 
        field: 'team1_won' | 'team2_won', 
        value: boolean
    ) => {
        setLaveryCupSelections(prev => 
            prev.map(selection => 
                selection.id === selectionId
                    ? { ...selection, [field]: value }
                    : selection
            )
        );
    };

    // Save all data - both scores and Lavery Cup
    const handleSaveAll = async () => {
        setLoading(true);
        try {
            // First save the regular scores as before
            // 1. Get the season_id first, then use it to fetch players
            if (!seasonId) {
                throw new Error('Season ID not found');
            }
    
            // Get players
            const { data: playersData, error: playersError } = await supabase
                .from('season_players')
                .select(`
                    profiles (
                        id,
                        username
                    )
                `)
                .eq('season_id', seasonId);
    
            if (playersError) {
                throw new Error('Failed to fetch players');
            }
    
            // Get all player IDs once
            const allPlayers = (playersData as any[]).map(p => p.profiles.id);
    
            // 2. Update fixtures
            const { error: fixturesError } = await supabase
                .from('fixtures')
                .upsert(fixtures);
    
            if (fixturesError) throw fixturesError;
    
            // 3. Get existing predictions
            const { data: existingPredictions, error: predictionsError } = await supabase
                .from('predictions')
                .select('*')
                .in('fixture_id', fixtures.map(f => f.id));
    
            if (predictionsError) throw predictionsError;
    
            // 4. Create 0-0 predictions for missing players
            const defaultPredictions = [];
    
            for (const fixture of fixtures) {
                const playersWithPredictions = existingPredictions
                    ?.filter(p => p.fixture_id === fixture.id)
                    .map(p => p.user_id) || [];
                
                const playersWithoutPredictions = allPlayers
                    .filter(id => !playersWithPredictions.includes(id));
    
                defaultPredictions.push(...playersWithoutPredictions.map(playerId => ({
                    user_id: playerId,
                    fixture_id: fixture.id,
                    home_prediction: 0,
                    away_prediction: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })));
            }
    
            if (defaultPredictions.length > 0) {
                const { error: insertError } = await supabase
                    .from('predictions')
                    .insert(defaultPredictions);
    
                if (insertError) throw insertError;
            }
    
            // Combine existing and default predictions
            const allPredictions = [...(existingPredictions || []), ...defaultPredictions];
    
            // 5. Delete existing scores for this game week to prevent double counting
            const { error: deleteError } = await supabase
                .from('game_week_scores')
                .delete()
                .eq('game_week_id', gameWeekId);
    
            if (deleteError) throw deleteError;

            // 6. Calculate scores with bonuses
            const playerScores: Record<string, { correct_scores: number, points: number }> = {};

            // First pass - calculate base points and track correct scores
            allPredictions.forEach(prediction => {
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
                    allPredictions
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

            // 7. Update game week scores
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

            // 8. Recalculate ALL season scores from scratch
            // First, get all game weeks for this season
            const { data: seasonGameWeeks, error: gameWeeksError } = await supabase
            .from('game_weeks')
            .select('id')
            .eq('season_id', seasonId);

            if (gameWeeksError) throw gameWeeksError;

            // Fetch all game week scores for all weeks in the season
            const { data: allGameWeekScores, error: allScoresError } = await supabase
            .from('game_week_scores')
            .select('player_id, correct_scores, points')
            .in('game_week_id', seasonGameWeeks.map(gw => gw.id));

            if (allScoresError) throw allScoresError;

            // Sum up all scores by player
            const totalScoresByPlayer: Record<string, { correct_scores: number, points: number }> = {};

            allGameWeekScores.forEach(score => {
            if (!totalScoresByPlayer[score.player_id]) {
                totalScoresByPlayer[score.player_id] = { correct_scores: 0, points: 0 };
            }

            totalScoresByPlayer[score.player_id].correct_scores += score.correct_scores;
            totalScoresByPlayer[score.player_id].points += score.points;
            });

            // Create the updated season scores to save
            const seasonScores = Object.entries(totalScoresByPlayer).map(([player_id, scores]) => ({
            season_id: seasonId,
            player_id,
            correct_scores: scores.correct_scores,
            points: scores.points
            }));

            // Clear existing season scores first to avoid any staleness
            await supabase
            .from('season_scores')
            .delete()
            .eq('season_id', seasonId);

            // Then insert the freshly calculated totals
            const { error: seasonUpdateError } = await supabase
            .from('season_scores')
            .insert(seasonScores);

            if (seasonUpdateError) throw seasonUpdateError;
            
            // 9. If there's a Lavery Cup round, update those selections
            if (laveryCupRound && laveryCupSelections.length > 0) {
                // Calculate which players advance
                const updatedSelections = laveryCupSelections.map(selection => ({
                    ...selection,
                    team1_won: selection.team1_won === true,
                    team2_won: selection.team2_won === true,
                    advanced: selection.team1_won === true && selection.team2_won === true
                }));

                // Update each selection individually to avoid losing required fields
                for (const selection of updatedSelections) {
                    const { error: selectionError } = await supabase
                        .from('lavery_cup_selections')
                        .update({
                            team1_won: selection.team1_won,
                            team2_won: selection.team2_won,
                            advanced: selection.advanced
                        })
                        .eq('id', selection.id);
                    
                    if (selectionError) throw selectionError;
                }
                
                // Mark the round as complete
                const { error: roundUpdateError } = await supabase
                    .from('lavery_cup_rounds')
                    .update({ is_complete: true })
                    .eq('id', laveryCupRound.id);
                
                if (roundUpdateError) throw roundUpdateError;
            }

            setMessage('Scores updated successfully');
            setShowConfirmModal(false);
            setShowLaveryCupModal(false);
            onSave();
        } catch (error) {
            console.error('Error:', error);
            setMessage('Error updating scores');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitScores = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
    
        if (fixtures.some(f => 
            (f.home_score === null && f.away_score !== null) || 
            (f.home_score !== null && f.away_score === null)
        )) {
            setMessage('Both scores must be entered for each fixture');
            return;
        }
    
        // Always show confirmation modal first
        setShowConfirmModal(true);
    };

    const handleSubmitLaveryCup = () => {
        setShowLaveryCupModal(true);
    };

    const handleScoreChange = (fixtureId: string, field: 'home_score' | 'away_score', value: string) => {
        const score = value === '' ? null : parseInt(value);
        setFixtures(fixtures.map(fixture => 
            fixture.id === fixtureId 
                ? { ...fixture, [field]: score }
                : fixture
        ));
    };

    if (loading) return <div className="text-center py-8 text-gray-900 dark:text-gray-100">Loading...</div>;

    return (
        <div className="w-full">
            {showScoresForm ? (
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

                    <form onSubmit={handleSubmitScores} className="space-y-4">
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
                                {laveryCupRound && !laveryCupRound.is_complete ? "Next: Lavery Cup" : "Save Scores"}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <LaveryCupSelectionForm 
                    laveryCupSelections={laveryCupSelections}
                    onSelectionChange={handleLaveryCupSelectionChange}
                    onBack={() => setShowScoresForm(true)}
                    onSubmit={handleSubmitLaveryCup}
                    roundName={laveryCupRound?.round_name || 'Unknown Round'}
                />
            )}

            {showConfirmModal && (
                <ConfirmScoresModal
                    fixtures={fixtures}
                    onConfirm={() => {
                        if (!laveryCupRound || laveryCupRound.is_complete) {
                            handleSaveAll();
                        }
                    }}
                    onCancel={() => setShowConfirmModal(false)}
                    onNext={() => {
                        setShowConfirmModal(false);
                        setShowScoresForm(false);
                    }}
                    hasLaveryCup={!!laveryCupRound && !laveryCupRound.is_complete}
                />
            )}

            {showLaveryCupModal && (
                <LaveryCupConfirmModal
                    selections={laveryCupSelections}
                    onConfirm={handleSaveAll}
                    onCancel={() => setShowLaveryCupModal(false)}
                    onBack={() => {
                        setShowLaveryCupModal(false);
                        setShowConfirmModal(true);
                    }}
                    roundName={laveryCupRound?.round_name || 'Unknown Round'}
                />
            )}
        </div>
    );
}