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
  round_id: string;
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

        // IMPORTANT: Always call createRoundsIfNeeded which will handle checking
        // whether rounds exist and only create what's needed
        return await this.createRoundsIfNeeded(seasonId, players);
    }

  static async createRoundsIfNeeded(seasonId: string, players: Player[]): Promise<{
    rounds: RoundState[],
    players: Player[]
  }> {
    try {
      const n = players.length;
      if (n <= 1) {
        // Ensure at least one round exists for 0/1 players (no fixtures)
        const existingSingle = await supabase
          .from('george_cup_rounds')
          .select('*')
          .eq('season_id', seasonId)
          .order('round_number', { ascending: true });

        if (existingSingle.error) throw existingSingle.error;
        if (existingSingle.data && existingSingle.data.length > 0) {
          return {
            rounds: (existingSingle.data || []).map(r => ({ ...r, fixtures: r.george_cup_fixtures || [] })) as RoundState[],
            players
          };
        }

        const id = crypto.randomUUID();
        const { error: insertErr } = await supabase
          .from('george_cup_rounds')
          .insert([{
            id,
            season_id: seasonId,
            round_number: 1,
            round_name: 'Round 1',
            total_fixtures: 0,
            is_complete: false,
            status: 'not_started',
            created_at: new Date().toISOString()
          }]);
        if (insertErr) throw insertErr;

        const { data: created } = await supabase
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

        return {
          rounds: (created || []).map(round => ({ ...round, fixtures: round.george_cup_fixtures || [] })) as RoundState[],
          players
        };
      }

      // required rounds = ceil(log2(n))
      const requiredRounds = Math.ceil(Math.log2(n));

      // Fetch existing rounds with fixtures
      const { data: existingRounds, error: fetchError } = await supabase
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

      if (fetchError) throw fetchError;

      if (existingRounds && existingRounds.length >= requiredRounds) {
        return {
          rounds: (existingRounds || []).map(round => ({ ...round, fixtures: round.george_cup_fixtures || [] })) as RoundState[],
          players
        };
      }

      // Round names helper
      const roundNames = this.getRoundNames(requiredRounds);

      // Compute highest power of two <= n
      const highestPow2 = Math.pow(2, Math.floor(Math.log2(n)));
      const needsPrelim = n > highestPow2;
      const prelimMatches = needsPrelim ? (n - highestPow2) : 0; // p0

      // Track existing round numbers to avoid duplicate inserts
      const existingRoundNumbers = new Set((existingRounds || []).map((r: any) => r.round_number));

      const roundsToCreate: any[] = [];

      if (needsPrelim) {
        // Create a Preliminary round as round_number = 1 (if missing)
        if (!existingRoundNumbers.has(1)) {
          roundsToCreate.push({
            id: crypto.randomUUID(),
            season_id: seasonId,
            round_number: 1,
            round_name: 'Preliminary',
            total_fixtures: Math.max(0, prelimMatches),
            is_complete: false,
            status: 'not_started',
            created_at: new Date().toISOString()
          });
        }
        // Subsequent rounds: r = 2..requiredRounds
        // For round r, total fixtures = highestPow2 / 2^(r-1)
        for (let r = 2; r <= requiredRounds; r++) {
          if (existingRoundNumbers.has(r)) continue;
          const totalFixtures = Math.max(1, Math.floor(highestPow2 / Math.pow(2, r - 1)));
          const nameIndex = r - 1; // use roundNames where possible
          roundsToCreate.push({
            id: crypto.randomUUID(),
            season_id: seasonId,
            round_number: r,
            round_name: roundNames[nameIndex] || `Round ${r}`,
            total_fixtures: totalFixtures,
            is_complete: false,
            status: 'not_started',
            created_at: new Date().toISOString()
          });
        }
      } else {
        // Perfect power-of-two: rounds 1..requiredRounds, each with n / 2^r fixtures
        for (let r = 1; r <= requiredRounds; r++) {
          if (existingRoundNumbers.has(r)) continue;
          const totalFixtures = Math.max(1, Math.floor(n / Math.pow(2, r)));
          const nameIndex = r - 1;
          roundsToCreate.push({
            id: crypto.randomUUID(),
            season_id: seasonId,
            round_number: r,
            round_name: roundNames[nameIndex] || `Round ${r}`,
            total_fixtures: totalFixtures,
            is_complete: false,
            status: 'not_started',
            created_at: new Date().toISOString()
          });
        }
      }

      // Insert new rounds if any
      if (roundsToCreate.length > 0) {
        const { error: insertError } = await supabase
          .from('george_cup_rounds')
          .insert(roundsToCreate);
        if (insertError) throw insertError;
      }

      // Cleanup duplicates and fetch cleaned rounds
      await this.cleanupDuplicateRounds(seasonId);

      const { data: cleanedRounds, error: cleanedError } = await supabase
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

      if (cleanedError) throw cleanedError;

      return {
        rounds: (cleanedRounds || []).map(round => ({ ...round, fixtures: round.george_cup_fixtures || [] })) as RoundState[],
        players
      };
    } catch (error) {
      console.error('Error in createRoundsIfNeeded:', error);
      throw error;
    }
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
        // Atomically claim the round (only proceed if not started)
        const { data: claimedRound, error: claimError } = await supabase
            .from('george_cup_rounds')
            .update({ game_week_id: gameWeekId, status: 'active' })
            .eq('id', roundId)
            .eq('status', 'not_started')
            .select()
            .single();

        if (claimError) throw claimError;
        if (!claimedRound) {
            // Round already started/completed — return current state to caller for UI handling
            const { data: existing, error: exErr } = await supabase
            .from('george_cup_rounds')
            .select(`
                *,
                george_cup_fixtures!george_cup_fixtures_round_id_fkey (
                id, round_id, fixture_number, player1_id, player2_id, winner_id
                )
            `)
            .eq('id', roundId)
            .single();
            if (exErr) throw exErr;
            return { ...existing, fixtures: existing.george_cup_fixtures || [] } as RoundState;
        }

        const shuffle = <T,>(arr: T[]) => {
            for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        };

        // Helper to ensure next round exists, create if missing
        const ensureNextRound = async (seasonId: string, nextRoundNumber: number, defaultFixtures: number, defaultName?: string) => {
            const { data: next, error: nextErr } = await supabase
            .from('george_cup_rounds')
            .select('*')
            .eq('season_id', seasonId)
            .eq('round_number', nextRoundNumber)
            .limit(1)
            .single();
            if (!next && (nextErr && nextErr.code === 'PGRST116')) {
            // not found -> create
            const { error: insErr } = await supabase.from('george_cup_rounds').insert([{
                id: crypto.randomUUID(),
                season_id: seasonId,
                round_number: nextRoundNumber,
                round_name: defaultName || `Round ${nextRoundNumber}`,
                total_fixtures: defaultFixtures,
                is_complete: false,
                status: 'not_started',
                created_at: new Date().toISOString()
            }]);
            if (insErr) throw insErr;
            const { data: created, error: createdErr } = await supabase
                .from('george_cup_rounds')
                .select('*')
                .eq('season_id', seasonId)
                .eq('round_number', nextRoundNumber)
                .limit(1)
                .single();
            if (createdErr) throw createdErr;
            return created;
            }
            if (nextErr) throw nextErr;
            return next;
        };

        // MAIN: handle round 1 (possibly preliminary) or later rounds
        if (roundNumber === 1) {
            const n = players.length;
            const highestPow2 = Math.pow(2, Math.floor(Math.log2(Math.max(1, n))));
            const prelimMatches = Math.max(0, n - highestPow2);

            const shuffledPlayers = [...players];
            shuffle(shuffledPlayers);

            if (prelimMatches > 0) {
            // PRELIM: select 2*p players for prelim fixtures
            const prelimPlayerCount = 2 * prelimMatches;
            const prelimPlayers = shuffledPlayers.slice(0, prelimPlayerCount);
            const remainingPlayers = shuffledPlayers.slice(prelimPlayerCount);

            // Insert prelim fixtures
            const prelimFixtures = [];
            for (let i = 0; i < prelimPlayers.length; i += 2) {
                prelimFixtures.push({
                id: crypto.randomUUID(),
                round_id: roundId,
                fixture_number: Math.floor(i / 2) + 1,
                player1_id: prelimPlayers[i].id,
                player2_id: prelimPlayers[i + 1].id,
                winner_id: null,
                created_at: new Date().toISOString()
                });
            }
            if (prelimFixtures.length > 0) {
                const { error: pfErr } = await supabase.from('george_cup_fixtures').insert(prelimFixtures);
                if (pfErr) throw pfErr;
            }

            // Ensure next round exists and populate byes into empty slots
            const nextRound = await ensureNextRound(claimedRound.season_id, 2, highestPow2 / 2, 'Round 2');

            const nextFixturesCount = nextRound.total_fixtures || Math.floor(highestPow2 / 2);
            const nextSlotsLength = nextFixturesCount * 2;

            // Build slot array and assign remaining players randomly
            const nextSlots: (string | null)[] = new Array(nextSlotsLength).fill(null);
            shuffle(remainingPlayers);
            for (let i = 0; i < remainingPlayers.length && i < nextSlotsLength; i++) {
                nextSlots[i] = remainingPlayers[i].id;
            }

            // Fetch existing next-round fixtures (ordered)
            const { data: existingNextFixtures, error: existingNextFixturesErr } = await supabase
                .from('george_cup_fixtures')
                .select('*')
                .eq('round_id', nextRound.id)
                .order('fixture_number', { ascending: true });

            if (existingNextFixturesErr) throw existingNextFixturesErr;

            if (!existingNextFixtures || existingNextFixtures.length === 0) {
                // Create fixtures for next round from slots
                const nextFixturesToInsert: any[] = [];
                for (let i = 0; i < nextSlots.length; i += 2) {
                nextFixturesToInsert.push({
                    id: crypto.randomUUID(),
                    round_id: nextRound.id,
                    fixture_number: Math.floor(i / 2) + 1,
                    player1_id: nextSlots[i],
                    player2_id: nextSlots[i + 1] || null,
                    winner_id: null,
                    created_at: new Date().toISOString()
                });
                }
                if (nextFixturesToInsert.length > 0) {
                const { error: nfErr } = await supabase.from('george_cup_fixtures').insert(nextFixturesToInsert);
                if (nfErr) throw nfErr;
                }
            } else {
                // Update only empty slots
                for (let i = 0; i < existingNextFixtures.length; i++) {
                const ef = existingNextFixtures[i];
                const slotIndex = i * 2;
                const p1 = nextSlots[slotIndex] ?? null;
                const p2 = nextSlots[slotIndex + 1] ?? null;
                const updates: any = {};
                if (!ef.player1_id && p1) updates.player1_id = p1;
                if (!ef.player2_id && p2) updates.player2_id = p2;
                if (Object.keys(updates).length > 0) {
                    const { error: upErr } = await supabase.from('george_cup_fixtures').update(updates).eq('id', ef.id);
                    if (upErr) throw upErr;
                }
                }
            }
            } else {
            // No prelim: pair all players directly into round 1 fixtures
            const shuffled = [...players];
            shuffle(shuffled);
            const insertFixtures: any[] = [];
            for (let i = 0; i < shuffled.length; i += 2) {
                insertFixtures.push({
                id: crypto.randomUUID(),
                round_id: roundId,
                fixture_number: Math.floor(i / 2) + 1,
                player1_id: shuffled[i].id,
                player2_id: (i + 1 < shuffled.length) ? shuffled[i + 1].id : null,
                winner_id: null,
                created_at: new Date().toISOString()
                });
            }
            if (insertFixtures.length > 0) {
                const { error: insErr } = await supabase.from('george_cup_fixtures').insert(insertFixtures);
                if (insErr) throw insErr;
            }
            }
        } else if (previousRoundId) {
            // Later rounds: take winners from previous round (must have been decided)
            const { data: previousRound, error: prevError } = await supabase
            .from('george_cup_rounds')
            .select(`
                id,
                george_cup_fixtures!george_cup_fixtures_round_id_fkey (
                id, fixture_number, player1_id, player2_id, winner_id
                )
            `)
            .eq('id', previousRoundId)
            .single();
            if (prevError) throw prevError;

            const prevFixtures = (previousRound.george_cup_fixtures || []).slice()
            .sort((a: any, b: any) => (a.fixture_number || 0) - (b.fixture_number || 0));

            const winners = prevFixtures.map((f: any) => f.winner_id).filter((id: string | null): id is string => !!id);

            if (winners.length === 0) {
            throw new Error('No winners available from previous round to draw this round.');
            }

            shuffle(winners);

            // Insert fixtures for this round based on winners
            const nextFixturesToInsert: any[] = [];
            for (let i = 0; i < winners.length; i += 2) {
            nextFixturesToInsert.push({
                id: crypto.randomUUID(),
                round_id: roundId,
                fixture_number: Math.floor(i / 2) + 1,
                player1_id: winners[i] || null,
                player2_id: (i + 1 < winners.length) ? winners[i + 1] : null,
                winner_id: null,
                created_at: new Date().toISOString()
            });
            }
            if (nextFixturesToInsert.length > 0) {
            const { error: fixturesError } = await supabase.from('george_cup_fixtures').insert(nextFixturesToInsert);
            if (fixturesError) throw fixturesError;
            }
        }

        // Return the round with its fixtures
        const { data: completeRound, error: fetchError } = await supabase
            .from('george_cup_rounds')
            .select(`
            *,
            george_cup_fixtures!george_cup_fixtures_round_id_fkey (
                id, round_id, fixture_number, player1_id, player2_id, winner_id
            )
            `)
            .eq('id', roundId)
            .single();
        if (fetchError) throw fetchError;

        return { ...completeRound, fixtures: completeRound.george_cup_fixtures || [] } as RoundState;
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
        roundComplete: boolean,
        coinFlipResults: any[]
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
          roundComplete: allFixturesHaveWinners,
          coinFlipResults
        };
      } catch (error) {
        console.error('Error determining winners:', error);
        throw error;
      }
    }
    // Helper method to update fixture winner
    private static async updateFixtureWinner(fixtureId: string, winnerId: string | null): Promise<void> {
    // Get fixture first to validate
        if (winnerId) {
            const { data: fixture } = await supabase
                .from('george_cup_fixtures')
                .select('player1_id, player2_id')
                .eq('id', fixtureId)
                .single();
                
            // Ensure winner is actually in this fixture
            if (fixture && winnerId !== fixture.player1_id && winnerId !== fixture.player2_id) {
                console.error('Invalid winner: player is not in this fixture');
                return;
            }
        }

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
            .filter((f: FixtureState) => f.winner_id)
            .sort((a: FixtureState, b: FixtureState) => a.fixture_number - b.fixture_number)
            .map((f: FixtureState) => f.winner_id)
            .filter((id: string | null): id is string => id !== null);
        
        // ADD THIS: Shuffle the winners array to randomize matchups
        const shuffledWinners = [...winners];
        for (let i = shuffledWinners.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledWinners[i], shuffledWinners[j]] = [shuffledWinners[j], shuffledWinners[i]]; // Swap elements
        }
        
        // 3. Place winners in the next round's fixtures (use shuffledWinners instead of winners)
        for (let i = 0; i < shuffledWinners.length; i += 2) {
            const targetFixtureNumber = Math.floor(i/2) + 1;
            const { error: updateError } = await supabase
                .from('george_cup_fixtures')
                .update({
                    player1_id: shuffledWinners[i],
                    player2_id: shuffledWinners[i + 1] || null,
                    winner_id: null
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

    static async cleanupDuplicateRounds(seasonId: string): Promise<void> {
        try {
            // 1. Get all rounds for this season, ordered by created_at (oldest first)
            const { data: allRounds, error } = await supabase
            .from('george_cup_rounds')
            .select('id, round_number, created_at')
            .eq('season_id', seasonId)
            .order('created_at', { ascending: true });
            
            if (error) throw error;
            if (!allRounds || allRounds.length === 0) return;
            
            // 2. Group rounds by round_number to find duplicates
            const roundGroups: Record<number, string[]> = {};
            
            allRounds.forEach(round => {
            if (!roundGroups[round.round_number]) {
                roundGroups[round.round_number] = [];
            }
            roundGroups[round.round_number].push(round.id);
            });
            
            // 3. Identify duplicate IDs to delete (keep the first/oldest one in each group)
            const idsToDelete: string[] = [];
            
            Object.values(roundGroups).forEach(ids => {
            if (ids.length > 1) {
                // Keep the first one (oldest by created_at), delete the rest
                idsToDelete.push(...ids.slice(1));
            }
            });
            
            // 4. Delete the duplicates if any were found
            if (idsToDelete.length > 0) {
            
            // Delete the duplicates
            const { error: deleteError } = await supabase
                .from('george_cup_rounds')
                .delete()
                .in('id', idsToDelete);
                
            if (deleteError) throw deleteError;
            }
        } catch (error) {
            console.error('Error cleaning up duplicate rounds:', error);
            // We don't want to throw errors from cleanup - just log them
        }
    }
}