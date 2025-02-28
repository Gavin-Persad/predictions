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
            // 1. Get current game week scores
            const { data: scores } = await supabase
                .from('game_week_scores')
                .select('player_id, points, correct_scores')
                .eq('game_week_id', gameWeekId)
                .in('player_id', [player1Id, player2Id]);


            // Ensure we have scores for both players
            if (!scores || scores.length < 2) {
                console.log('Missing scores for one or both players');
                return null;
            }

            const player1Score = scores.find(s => s.player_id === player1Id);
            const player2Score = scores.find(s => s.player_id === player2Id);

            // Ensure both scores exist
            if (!player1Score || !player2Score) {
                console.log('Missing score for player:', !player1Score ? player1Id : player2Id);
                return null;
            }

            // Compare points first
            if (player1Score.points !== player2Score.points) {
                const winnerId = player1Score.points > player2Score.points ? player1Id : player2Id;
                await updateWinner(fixtureId, winnerId);
                return winnerId;
            }

            // If points are equal, compare correct scores
            if (player1Score.correct_scores !== player2Score.correct_scores) {
                const winnerId = player1Score.correct_scores > player2Score.correct_scores ? player1Id : player2Id;
                await updateWinner(fixtureId, winnerId);
                return winnerId;
            }

            // If still tied, random selection
            const winnerId = Math.random() < 0.5 ? player1Id : player2Id;
            await updateWinner(fixtureId, winnerId);
            return winnerId;

        } catch (err) {
            console.error('Error determining winner:', err);
            setError('Error determining winner');
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