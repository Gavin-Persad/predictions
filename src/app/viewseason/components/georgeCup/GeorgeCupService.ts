// src/app/viewseason/components/georgeCup/GeorgeCupService.ts

import { supabase } from "../../../../../supabaseClient";
import * as TournamentLogic from "./TournamentLogic";
import { Player } from "../../../../types/players";

export type RoundState = {
  id: string;
  round_number: number;
  round_name: string;
  game_week_id: string | null;
  is_complete: boolean;
  total_fixtures: number;
  status: 'not_started' | 'active' | 'ready_for_scoring' | 'completed';
  fixtures: FixtureState[];
};

export type FixtureState = {
  id: string;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  fixture_number: number;
};

export class GeorgeCupService {
    static async initializeTournament(seasonId: string): Promise<{ 
        rounds: RoundState[],
        players: Player[] 
    }> {
        // Fetch players for this season
        const { data: playersData, error: playersError } = await supabase
        .from('season_players')
        .select(`
            profiles (
            id,
            username
            )
        `)
        .eq('season_id', seasonId);
        
        if (playersError) throw playersError;
        
        const players = (playersData as any).map((p: any) => ({
        id: p.profiles.id,
        username: p.profiles.username
        }));

        // Check for existing rounds
        const { data: existingRounds, error: checkError } = await supabase
        .from('george_cup_rounds')
        .select(`
            *,
            george_cup_fixtures!george_cup_fixtures_round_id_fkey (
            id,
            round_id,
            fixture_number,
            player1_id,
            player2_id,
            winner_id
            )
        `)
        .eq('season_id', seasonId)
        .order('round_number', { ascending: true });

        if (checkError) throw checkError;
        
        // If rounds don't exist, create them
        if (!existingRounds || existingRounds.length === 0) {
        return await this.createRoundsIfNeeded(seasonId, players);
        }
        
        // Format existing rounds
        const rounds = existingRounds.map(round => ({
        ...round,
        fixtures: round.george_cup_fixtures || []
        })) as RoundState[];
        
        return { rounds, players };
    }

    static async createRoundsIfNeeded(seasonId: string, players: Player[]): Promise<{
        rounds: RoundState[],
        players: Player[]
        }> {
        // Calculate required rounds based on player count
        const requiredRounds = TournamentLogic.calculateRequiredRounds(players.length);
        const rounds: RoundState[] = [];
        
        // Define round names based on tournament size
        const roundNames = this.getRoundNames(requiredRounds);
        
        // Insert rounds into database
        for (let i = 1; i <= requiredRounds; i++) {
            const totalFixtures = Math.ceil(players.length / Math.pow(2, i));
            
            const { data, error } = await supabase
            .from('george_cup_rounds')
            .insert({
                id: crypto.randomUUID(),
                season_id: seasonId,
                round_number: i,
                round_name: roundNames[i - 1],
                total_fixtures: totalFixtures,
                is_complete: false,
                status: i === 1 ? 'not_started' : 'not_started',
                created_at: new Date().toISOString()
            })
            .select()
            .single();
            
            if (error) throw error;
            
            // Add empty fixtures list for now
            rounds.push({
            ...data,
            fixtures: []
            });
        }
        
        return { rounds, players };
        }

        // Helper method to get round names based on number of rounds
        private static getRoundNames(totalRounds: number): string[] {
        // Always have semifinals, final
        const names = ['Final', 'Semi Finals'];
        
        // Add quarter finals for larger tournaments
        if (totalRounds >= 3) names.push('Quarter Finals');
        
        // Add round of 16, 32, etc. for even larger tournaments
        for (let i = 4; i <= totalRounds; i++) {
            const roundSize = Math.pow(2, i);
            names.push(`Round of ${roundSize}`);
        }
        
        // Reverse the order so Round 1 is first
        return names.reverse().slice(0, totalRounds);
        }

    static getRoundNames(totalRounds: number): string[] {
        if (totalRounds <= 1) return ["Final"];
        if (totalRounds === 2) return ["Semi-final", "Final"];
        if (totalRounds === 3) return ["Quarter-finals", "Semi-final", "Final"];
        if (totalRounds === 4) return ["Round of 16", "Quarter-finals", "Semi-final", "Final"];
        if (totalRounds === 5) return ["Round of 32", "Round of 16", "Quarter-finals", "Semi-final", "Final"];
        
        // For very large tournaments
        const names = [];
        for (let i = 1; i <= totalRounds - 4; i++) {
            names.push(`Round ${i}`);
        }
        names.push("Round of 16", "Quarter-finals", "Semi-final", "Final");
        return names;
        }

    static async drawRound(
        roundId: string, 
        gameWeekId: string, 
        players: Player[], 
        roundNumber: number, 
        previousRoundId?: string
        ): Promise<RoundState> {
        try {
            // 1. Update round with game week and change status
            const { data: updatedRound, error: updateError } = await supabase
            .from('george_cup_rounds')
            .update({ 
                game_week_id: gameWeekId, 
                status: 'active' 
            })
            .eq('id', roundId)
            .select()
            .single();
            
            if (updateError) throw updateError;
            
            // 2. Handle different fixture creation based on round number
            let fixtures = [];
            
            if (roundNumber === 1) {
            // First round - create fixtures based on players with appropriate BYEs
            const byesNeeded = TournamentLogic.calculateByesNeeded(players.length);
            const slots = TournamentLogic.distributeByes(players, byesNeeded);
            
            // Create fixtures from slots
            fixtures = [];
            for (let i = 0; i < slots.length; i += 2) {
                const player1 = slots[i];
                const player2 = slots[i + 1];
                
                fixtures.push({
                id: crypto.randomUUID(),
                round_id: roundId,
                fixture_number: (i / 2) + 1,
                player1_id: player1 === 'BYE' ? null : player1.id,
                player2_id: player2 === 'BYE' ? null : player2.id,
                winner_id: null,
                created_at: new Date().toISOString()
                });
            }
            } else if (previousRoundId) {
            // For later rounds, create empty fixtures
            const { data: roundData } = await supabase
                .from('george_cup_rounds')
                .select('total_fixtures')
                .eq('id', roundId)
                .single();
                
            if (!roundData) throw new Error('Round not found');
            
            fixtures = Array(roundData.total_fixtures).fill(null).map((_, index) => ({
                id: crypto.randomUUID(),
                round_id: roundId,
                fixture_number: index + 1,
                player1_id: null,
                player2_id: null,
                winner_id: null,
                created_at: new Date().toISOString()
            }));
            }
            
            // 3. Insert fixtures
            if (fixtures.length > 0) {
            const { error: fixturesError } = await supabase
                .from('george_cup_fixtures')
                .insert(fixtures);
                
            if (fixturesError) throw fixturesError;
            }
            
            // 4. Fetch the round with its newly created fixtures
            const { data: completeRound, error: fetchError } = await supabase
            .from('george_cup_rounds')
            .select(`
                *,
                george_cup_fixtures!george_cup_fixtures_round_id_fkey (
                id,
                round_id,
                fixture_number,
                player1_id,
                player2_id,
                winner_id
                )
            `)
            .eq('id', roundId)
            .single();
            
            if (fetchError) throw fetchError;
            
            return {
            ...completeRound,
            fixtures: completeRound.george_cup_fixtures || []
            };
        } catch (error) {
            console.error('Error in drawRound:', error);
            throw error;
        }
    }

    static async fetchScores(gameWeekIds: string[]): Promise<Record<string, {
        player1_score?: number,
        player1_correct_scores?: number,
        player2_score?: number,
        player2_correct_scores?: number
        }>> {
        // Filter out null or undefined game week IDs
        const validGameWeekIds = gameWeekIds.filter(id => id);
        
        if (validGameWeekIds.length === 0) {
            return {}; // No scores to fetch
        }
        
        // Get all fixtures for these rounds
        const { data: fixtures, error: fixturesError } = await supabase
            .from('george_cup_rounds')
            .select(`
            id,
            game_week_id,
            george_cup_fixtures!george_cup_fixtures_round_id_fkey (
                id,
                player1_id,
                player2_id
            )
            `)
            .in('game_week_id', validGameWeekIds);
            
        if (fixturesError) throw fixturesError;
        
        // Get all scores for these game weeks
        const { data: gameWeekScores, error: scoresError } = await supabase
            .from('game_week_scores')
            .select('player_id, game_week_id, points, correct_scores')
            .in('game_week_id', validGameWeekIds);
            
        if (scoresError) throw scoresError;
        
        // Build a lookup for scores by game_week_id and player_id
        const scoresByPlayer: Record<string, Record<string, { points: number, correct_scores: number }>> = {};
        
        gameWeekScores?.forEach(score => {
            if (!scoresByPlayer[score.game_week_id]) {
            scoresByPlayer[score.game_week_id] = {};
            }
            scoresByPlayer[score.game_week_id][score.player_id] = {
            points: score.points,
            correct_scores: score.correct_scores
            };
        });
        
        // Map fixture IDs to their scores
        const fixtureScores: Record<string, any> = {};
        
        fixtures?.forEach(round => {
            const gameWeekId = round.game_week_id;
            const gameWeekPlayerScores = scoresByPlayer[gameWeekId] || {};
            
            round.george_cup_fixtures?.forEach(fixture => {
            const player1Score = gameWeekPlayerScores[fixture.player1_id];
            const player2Score = gameWeekPlayerScores[fixture.player2_id];
            
            fixtureScores[fixture.id] = {
                player1_score: player1Score?.points,
                player1_correct_scores: player1Score?.correct_scores,
                player2_score: player2Score?.points,
                player2_correct_scores: player2Score?.correct_scores
            };
            });
        });
        
        return fixtureScores;
    }

    static async determineWinners(roundId: string, coinFlipResults: any[] = []): Promise<{
        fixtures: FixtureState[],
        roundComplete: boolean
        }> {
        try {
            // 1. Get the round with its fixtures
            const { data: round, error: roundError } = await supabase
            .from('george_cup_rounds')
            .select(`
                *,
                george_cup_fixtures!george_cup_fixtures_round_id_fkey (
                id,
                player1_id,
                player2_id,
                winner_id,
                fixture_number
                )
            `)
            .eq('id', roundId)
            .single();
            
            if (roundError) throw roundError;
            
            // 2. Get the game week scores for this round
            if (!round.game_week_id) {
            throw new Error('This round has not been assigned a game week');
            }
            
            const { data: scores, error: scoresError } = await supabase
            .from('game_week_scores')
            .select('player_id, points, correct_scores')
            .eq('game_week_id', round.game_week_id);
            
            if (scoresError) throw scoresError;
            
            // Create a lookup for scores by player ID
            const scoresByPlayer: Record<string, { points: number, correct_scores: number }> = {};
            scores?.forEach(s => {
            scoresByPlayer[s.player_id] = {
                points: s.points,
                correct_scores: s.correct_scores
            };
            });
            
            // 3. Determine winners for each fixture
            const updatedFixtures = [];
            let allFixturesHaveWinners = true;
            
            for (const fixture of round.george_cup_fixtures || []) {
            // Skip if winner already determined
            if (fixture.winner_id) {
                updatedFixtures.push(fixture);
                continue;
            }
            
            // Handle BYE cases
            if (!fixture.player1_id && fixture.player2_id) {
                await this.updateFixtureWinner(fixture.id, fixture.player2_id);
                updatedFixtures.push({ ...fixture, winner_id: fixture.player2_id });
                continue;
            }
            
            if (fixture.player1_id && !fixture.player2_id) {
                await this.updateFixtureWinner(fixture.id, fixture.player1_id);
                updatedFixtures.push({ ...fixture, winner_id: fixture.player1_id });
                continue;
            }
            
            if (!fixture.player1_id && !fixture.player2_id) {
                allFixturesHaveWinners = false;
                updatedFixtures.push(fixture);
                continue;
            }
            
            // Get scores for both players
            const player1Score = scoresByPlayer[fixture.player1_id!];
            const player2Score = scoresByPlayer[fixture.player2_id!];
            
            // If either player doesn't have scores yet, skip
            if (!player1Score || !player2Score) {
                allFixturesHaveWinners = false;
                updatedFixtures.push(fixture);
                continue;
            }
            
            // Compare scores
            let winnerId: string | null = null;
            
            if (player1Score.points > player2Score.points) {
                winnerId = fixture.player1_id;
            } else if (player2Score.points > player1Score.points) {
                winnerId = fixture.player2_id;
            } else if (player1Score.correct_scores > player2Score.correct_scores) {
                winnerId = fixture.player1_id;
            } else if (player2Score.correct_scores > player1Score.correct_scores) {
                winnerId = fixture.player2_id;
            } else {
                // It's a tie - use coin flip or create one
                const existingFlip = coinFlipResults.find(r => r.fixture_id === fixture.id);
                
                if (existingFlip) {
                winnerId = existingFlip.winner_id;
                } else {
                // Random coin flip
                winnerId = Math.random() < 0.5 ? fixture.player1_id : fixture.player2_id;
                coinFlipResults.push({ fixture_id: fixture.id, winner_id: winnerId });
                }
            }
            
            // Update winner in database
            await this.updateFixtureWinner(fixture.id, winnerId);
            updatedFixtures.push({ ...fixture, winner_id: winnerId });
            }
            
            // 4. If all fixtures have winners, mark round as complete
            if (allFixturesHaveWinners && updatedFixtures.length > 0) {
            await supabase
                .from('george_cup_rounds')
                .update({ 
                is_complete: true,
                status: 'completed' 
                })
                .eq('id', roundId);
            }
            
            return {
            fixtures: updatedFixtures,
            roundComplete: allFixturesHaveWinners
            };
        } catch (error) {
            console.error('Error determining winners:', error);
            throw error;
        }
    }

    // Helper method to update fixture winner
    private static async updateFixtureWinner(fixtureId: string, winnerId: string | null): Promise<void> {
    await supabase
        .from('george_cup_fixtures')
        .update({ winner_id: winnerId })
        .eq('id', fixtureId);
    }

    static async progressWinners(fromRoundId: string, toRoundId: string): Promise<RoundState> {
        try {
            // 1. Get the winners from the completed round
            const { data: fromRound, error: fromError } = await supabase
            .from('george_cup_rounds')
            .select(`
                *,
                george_cup_fixtures!george_cup_fixtures_round_id_fkey (
                id,
                player1_id,
                player2_id,
                winner_id,
                fixture_number
                )
            `)
            .eq('id', fromRoundId)
            .single();
            
            if (fromError) throw fromError;
            
            // Ensure the round is complete
            if (!fromRound.is_complete) {
            throw new Error('Cannot progress winners from an incomplete round');
            }
            
            // Get the target round
            const { data: toRound, error: toError } = await supabase
            .from('george_cup_rounds')
            .select(`
                *,
                george_cup_fixtures!george_cup_fixtures_round_id_fkey (
                id,
                fixture_number
                )
            `)
            .eq('id', toRoundId)
            .single();
            
            if (toError) throw toError;
            
            // 2. Extract winners from the completed round
            const winners = (fromRound.george_cup_fixtures || [])
            .filter(f => f.winner_id)
            .sort((a, b) => a.fixture_number - b.fixture_number)
            .map(f => f.winner_id)
            .filter((id): id is string => id !== null);
            
            // 3. Place winners in the next round's fixtures
            for (let i = 0; i < winners.length; i += 2) {
            const targetFixtureNumber = Math.floor(i/2) + 1;
            const { error: updateError } = await supabase
                .from('george_cup_fixtures')
                .update({
                player1_id: winners[i],
                player2_id: winners[i + 1] || null
                })
                .eq('round_id', toRoundId)
                .eq('fixture_number', targetFixtureNumber);
                
            if (updateError) throw updateError;
            }
            
            // 4. Fetch the updated target round
            const { data: updatedRound, error: fetchError } = await supabase
            .from('george_cup_rounds')
            .select(`
                *,
                george_cup_fixtures!george_cup_fixtures_round_id_fkey (
                id,
                round_id,
                fixture_number,
                player1_id,
                player2_id,
                winner_id
                )
            `)
            .eq('id', toRoundId)
            .single();
            
            if (fetchError) throw fetchError;
            
            return {
            ...updatedRound,
            fixtures: updatedRound.george_cup_fixtures || []
            };
        } catch (error) {
            console.error('Error progressing winners:', error);
            throw error;
        }
    }
}