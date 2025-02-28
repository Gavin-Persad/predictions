// src/app/viewseason/components/GeorgeCup/hooks/useWinnerDetermination.ts

import { useState, useCallback } from 'react';
import { supabase } from '../../../../../../supabaseClient';

export const useWinnerDetermination = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const determineWinner = useCallback(async (
        fixtureId: string,
        player1Id: string,
        player2Id: string,
        gameWeekId: string,
        seasonId: string
    ): Promise<string | null> => {
        setLoading(true);
        setError(null);

        try {
            // 1. Check current game week scores
            const { data: currentScores } = await supabase
                .from('game_week_scores')
                .select('player_id, points, correct_scores')
                .eq('game_week_id', gameWeekId)
                .in('player_id', [player1Id, player2Id]);

            if (!currentScores || currentScores.length < 2) {
                throw new Error('Could not fetch current game week scores');
            }

            const player1Score = currentScores.find(s => s.player_id === player1Id);
            const player2Score = currentScores.find(s => s.player_id === player2Id);

            // Compare current game week scores
            if (player1Score?.points !== player2Score?.points) {
                const winnerId = player1Score!.points > player2Score!.points ? player1Id : player2Id;
                await updateWinner(fixtureId, winnerId);
                return winnerId;
            }

            if (player1Score?.correct_scores !== player2Score?.correct_scores) {
                const winnerId = player1Score!.correct_scores > player2Score!.correct_scores ? player1Id : player2Id;
                await updateWinner(fixtureId, winnerId);
                return winnerId;
            }

            // 2. Check previous game weeks
            const { data: prevGameWeeks } = await supabase
                .from('game_weeks')
                .select('id')
                .eq('season_id', seasonId)
                .lt('live_end', new Date().toISOString())
                .order('live_end', { ascending: false });

            for (const gw of (prevGameWeeks || [])) {
                if (gw.id === gameWeekId) continue;

                const { data: scores } = await supabase
                    .from('game_week_scores')
                    .select('player_id, points, correct_scores')
                    .eq('game_week_id', gw.id)
                    .in('player_id', [player1Id, player2Id]);

                if (!scores || scores.length < 2) continue;

                const p1Score = scores.find(s => s.player_id === player1Id);
                const p2Score = scores.find(s => s.player_id === player2Id);

                if (p1Score?.points !== p2Score?.points) {
                    const winnerId = p1Score!.points > p2Score!.points ? player1Id : player2Id;
                    await updateWinner(fixtureId, winnerId);
                    return winnerId;
                }

                if (p1Score?.correct_scores !== p2Score?.correct_scores) {
                    const winnerId = p1Score!.correct_scores > p2Score!.correct_scores ? player1Id : player2Id;
                    await updateWinner(fixtureId, winnerId);
                    return winnerId;
                }
            }

            // 3. If still tied, random selection
            const winnerId = Math.random() < 0.5 ? player1Id : player2Id;
            await updateWinner(fixtureId, winnerId);
            return winnerId;

        } catch (err) {
            setError('Error determining winner');
            console.error(err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateWinner = async (fixtureId: string, winnerId: string) => {
        const { error: updateError } = await supabase
            .from('george_cup_fixtures')
            .update({ winner_id: winnerId })
            .eq('id', fixtureId);

        if (updateError) throw updateError;
    };

    return { determineWinner, loading, error };
};