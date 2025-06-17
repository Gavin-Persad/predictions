// src/app/viewseason/components/georgeCup/EditGeorgeCup.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { GeorgeCupService, RoundState, FixtureState } from './GeorgeCupService';
import { Player } from '../../../../types/players';
import { supabase } from '../../../../../supabaseClient';
import DrawConfirmationModal from './components/DrawModal';
import { Spinner } from '../../../../components/ui/Spinner';

// Define styles object for component
const Layout = {
  container: "relative flex overflow-x-auto space-x-4 p-4",
  playerColumn: "min-w-[180px] flex-shrink-0",
  playersList: "space-y-2",
  playerItem: "p-2 border rounded text-gray-900 dark:text-gray-100",
  playerEliminated: "line-through text-gray-400 dark:text-gray-500",
  column: "min-w-[250px] flex-shrink-0 border rounded-lg p-4 space-y-4",
  columnTitle: "text-lg font-bold text-center mb-4 text-gray-900 dark:text-gray-100",
  activeRound: "bg-gray-100 dark:bg-gray-800",
  pastRound: "bg-gray-50 dark:bg-gray-900/50",
  gameWeekSelector: "mb-4",
  fixtureBox: "border rounded p-2 mb-2",
  scrollContainer: "max-h-[500px] overflow-y-auto pr-2",
  playerBox: {
    base: "flex justify-between items-center p-2 rounded mb-1 text-gray-900 dark:text-gray-100",
    winner: "bg-green-100 dark:bg-green-900 font-bold",
    loser: "bg-red-50 dark:bg-red-900 text-gray-500 dark:text-gray-300",
    bye: "bg-gray-100 dark:bg-gray-700 italic text-gray-500 dark:text-gray-400",
    score: "text-sm font-mono ml-auto pl-2 flex-shrink-0",
    playerName: "truncate flex-grow"
  },
  buttonBar: "flex space-x-2 mt-4",
  button: {
    primary: "bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600",
    secondary: "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
  }
};

type Props = {
  seasonId: string;
  onClose: () => void;
};

export default function EditGeorgeCup({ seasonId, onClose }: Props): JSX.Element {
  // State
  const [rounds, setRounds] = useState<RoundState[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameWeeks, setGameWeeks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fixtureScores, setFixtureScores] = useState<Record<string, any>>({});
  const [coinFlipResults, setCoinFlipResults] = useState<any[]>([]);
  
  // Modal state
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [selectedGameWeekId, setSelectedGameWeekId] = useState<string | null>(null);

  // Initialize tournament data
  useEffect(() => {
    async function initializeTournament() {
      try {
        setLoading(true);
        setError(null);
        
        // Get tournament data
        const { rounds: initialRounds, players: initialPlayers } = 
          await GeorgeCupService.initializeTournament(seasonId);
        
        setRounds(initialRounds);
        setPlayers(initialPlayers);
        
        // Get game weeks for this season
        const { data: gameWeeksData, error: gameWeeksError } = await supabase
          .from('game_weeks')
          .select('*')
          .eq('season_id', seasonId)
          .order('week_number', { ascending: true });
          
        if (gameWeeksError) throw gameWeeksError;
        setGameWeeks(gameWeeksData || []);
        
        // Fetch scores for rounds with game weeks
        const gameWeekIds = initialRounds
          .filter(r => r.game_week_id)
          .map(r => r.game_week_id as string);
          
        if (gameWeekIds.length > 0) {
          const scores = await GeorgeCupService.fetchScores(gameWeekIds);
          setFixtureScores(scores);
        }
      } catch (error) {
        console.error('Error initializing tournament:', error);
        setError('Failed to load tournament data');
      } finally {
        setLoading(false);
      }
    }
    
    initializeTournament();
}, [seasonId]);

  // Handle game week selection
  const handleConfirmDraw = useCallback(async () => {
  if (!selectedRoundId || !selectedGameWeekId) return;
  
  try {
    setProcessingAction(true);
    
    // Find round info
    const selectedRound = rounds.find(r => r.id === selectedRoundId);
    if (!selectedRound) throw new Error('Round not found');
    
    // IMPORTANT: Find the previous round ID for rounds after round 1
    let previousRoundId: string | undefined;
    if (selectedRound.round_number > 1) {
      const previousRound = rounds.find(r => r.round_number === selectedRound.round_number - 1);
      
      // Ensure previous round exists and is complete
      if (!previousRound) {
        throw new Error('Previous round not found');
      }
      
      if (!previousRound.is_complete) {
        setError('Previous round must be complete before drawing this round');
        return;
      }
      
      previousRoundId = previousRound.id;
    }

    // Draw the round with the previousRoundId parameter
    const updatedRound = await GeorgeCupService.drawRound(
      selectedRoundId,
      selectedGameWeekId,
      players,
      selectedRound.round_number,
      previousRoundId
    );
    
    // Update rounds state with new round
    setRounds(prevRounds => 
      prevRounds.map(r => r.id === selectedRoundId ? updatedRound : r)
    );
    
    setSelectedRoundId(null);
    setSelectedGameWeekId(null);
    
  } catch (error) {
    console.error('Error drawing round:', error);
    setError('Failed to draw round');
  } finally {
    setProcessingAction(false);
    setShowDrawModal(false);
  }
}, [selectedRoundId, selectedGameWeekId, rounds, players]);

  // Handle cancel
  const handleCancelDraw = useCallback(() => {
    setShowDrawModal(false);
    setSelectedRoundId(null);
    setSelectedGameWeekId(null);
  }, []);

  // Determine winners for a round
    const handleDetermineWinners = useCallback(async (roundId: string) => {
        try {
            setProcessingAction(true);
            
            const { fixtures, roundComplete } = await GeorgeCupService.determineWinners(
            roundId, 
            coinFlipResults
            );
            
            // CHANGE: Always update the database to mark the round as complete
            // when the user clicks "Determine Winners"
            await supabase
            .from('george_cup_rounds')
            .update({ 
                is_complete: true,  // Always true
                status: 'completed' 
            })
            .eq('id', roundId);
            
            // Update rounds with winners in local state
            setRounds(prevRounds => 
            prevRounds.map(r => 
                r.id === roundId 
                ? { 
                    ...r, 
                    fixtures, 
                    is_complete: true,  // Always true
                    status: 'completed' 
                    } 
                : r
            )
            );
            
        } catch (error) {
            console.error('Error determining winners:', error);
            setError('Failed to determine winners');
        } finally {
            setProcessingAction(false);
        }
        }, [coinFlipResults]);

    // Render helper for fixture
    const renderFixture = useCallback((fixture: FixtureState) => {
    const scores = fixtureScores[fixture.id] || {};
    
    // Skip rendering completely if both players are BYE
    if (!fixture.player1_id && !fixture.player2_id) {
        return null;
    }
    
    return (
        <div key={fixture.id} className={Layout.fixtureBox}>
        {/* Player 1 */}
        <div className={`${Layout.playerBox.base} ${
            fixture.winner_id === fixture.player1_id ? Layout.playerBox.winner :
            fixture.winner_id && fixture.player1_id && fixture.winner_id !== fixture.player1_id ? Layout.playerBox.loser :
            !fixture.player1_id ? Layout.playerBox.bye : ''
        }`}>
            <div className={Layout.playerBox.playerName}>
                {fixture.player1_id 
                ? players.find(p => p.id === fixture.player1_id)?.username || 'Unknown' 
                : 'BYE'}
            </div>
            {scores.player1_score !== undefined && (
                <span className={Layout.playerBox.score}>
                {scores.player1_score}
                {scores.player1_correct_scores !== undefined && ` (${scores.player1_correct_scores})`}
                </span>
            )}
        </div>
        
        {/* Player 2 */}
        <div className={`${Layout.playerBox.base} ${
            fixture.winner_id === fixture.player2_id ? Layout.playerBox.winner :
            fixture.winner_id && fixture.player2_id && fixture.winner_id !== fixture.player2_id ? Layout.playerBox.loser :
            !fixture.player2_id ? Layout.playerBox.bye : ''
        }`}>
        <div className={Layout.playerBox.playerName}>
            {fixture.player2_id 
            ? players.find(p => p.id === fixture.player2_id)?.username || 'Unknown' 
            : 'BYE'}
        </div>
          {scores.player2_score !== undefined && (
            <span className={Layout.playerBox.score}>
              {scores.player2_score}
              {scores.player2_correct_scores !== undefined && ` (${scores.player2_correct_scores})`}
            </span>
          )}
        </div>
        </div>
    );
    }, [fixtureScores, players]);

    // Get list of eliminated players
    const eliminatedPlayers = useCallback(() => {
    if (!rounds.length) return new Set<string>();
    
    // Find all active players (players who are in any active round or are winners)
    const activePlayers = new Set<string>();
    
    // First, add all players who have won at least one match
    rounds.forEach(round => {
        round.fixtures?.forEach(fixture => {
        if (fixture.winner_id) {
            activePlayers.add(fixture.winner_id);
        }
        });
    });
    
    // Next, add players in the latest active round (one that's not complete)
    const activeRound = [...rounds].sort((a, b) => b.round_number - a.round_number)
        .find(r => !r.is_complete && r.game_week_id);
        
    if (activeRound) {
        activeRound.fixtures?.forEach(fixture => {
        if (fixture.player1_id) activePlayers.add(fixture.player1_id);
        if (fixture.player2_id) activePlayers.add(fixture.player2_id);
        });
    }
    
    // Any player not in the active set is eliminated
    const eliminated = new Set<string>();
    players.forEach(player => {
        if (!activePlayers.has(player.id)) {
        eliminated.add(player.id);
        }
    });
    
    return eliminated;
    }, [rounds, players]);

    const eliminatedSet = eliminatedPlayers();

    const handleGameWeekSelect = useCallback((roundId: string, gameWeekId: string) => {
        setSelectedRoundId(roundId);
        setSelectedGameWeekId(gameWeekId);
        setShowDrawModal(true);
        }, []);

  // Main render
  if (loading) {
    return <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>;
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        <p>{error}</p>
        <button 
          onClick={onClose}
          className={Layout.button.secondary}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
    <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Edit George Cup</h2>
    <button 
        onClick={onClose}
        className={Layout.button.secondary}
    >
        Back
    </button>
    </div>
      {processingAction && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow">
            <Spinner size="lg" />
            <p className="mt-2">Processing...</p>
          </div>
        </div>
      )}

      <div className={Layout.container}>
        {/* Players column */}
        <div className={Layout.playerColumn}>
        <h3 className={Layout.columnTitle}>Players</h3>
        <div className={`${Layout.scrollContainer} ${Layout.playersList}`}>
            {players.map(player => (
            <div 
                key={player.id} 
                className={`${Layout.playerItem} ${eliminatedSet.has(player.id) ? Layout.playerEliminated : ''}`}
            >
                {player.username}
            </div>
            ))}
        </div>
        </div>

        {/* Round columns */}
        {rounds.map(round => (
          <div 
            key={round.id} 
            className={`${Layout.column} ${
              round.is_complete ? Layout.pastRound : Layout.activeRound
            }`}
          >
            <h3 className={Layout.columnTitle}>
            {round.round_name}
            {round.game_week_id && (
                <div className="text-sm text-gray-500 mt-1">
                Game Week: {gameWeeks.find(gw => gw.id === round.game_week_id)?.week_number || '?'}
                </div>
            )}
            </h3>
            
            {!round.game_week_id && (
              <div className={Layout.gameWeekSelector}>
                <select 
                  className="w-full p-2 border rounded"
                  onChange={(e) => handleGameWeekSelect(round.id, e.target.value)}
                  value=""
                  disabled={processingAction}
                >
                  <option value="">Select Game Week</option>
                  {gameWeeks.map(gw => (
                    <option key={gw.id} value={gw.id}>
                      Game Week {gw.week_number}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className={Layout.scrollContainer}>
              <div className="space-y-2">
                {round.fixtures?.length > 0 ? (
                  round.fixtures.map(fixture => renderFixture(fixture))
                ) : (
                  Array(round.total_fixtures).fill(null).map((_, index) => (
                    <div key={index} className={Layout.fixtureBox}>
                      <div className="text-center text-gray-400 py-4">
                        {round.game_week_id ? 'Drawing fixtures...' : 'Select game week to draw'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {round.game_week_id && !round.is_complete && round.fixtures?.length > 0 && (
              <button
                className={Layout.button.primary}
                onClick={() => handleDetermineWinners(round.id)}
                disabled={processingAction}
              >
                Determine Winners
              </button>
            )}
          </div>
        ))}
      </div>
    
      {showDrawModal && selectedRoundId && selectedGameWeekId && (
        <DrawConfirmationModal
          roundName={rounds.find(r => r.id === selectedRoundId)?.round_name || ''}
          gameWeekNumber={gameWeeks.find(gw => gw.id === selectedGameWeekId)?.week_number || 0}
          onConfirm={handleConfirmDraw}
          onCancel={handleCancelDraw}
        />
      )}
    </div>
  );
}