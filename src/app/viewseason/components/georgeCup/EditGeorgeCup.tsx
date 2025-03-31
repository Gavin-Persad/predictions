//src/app/viewseason/components/GeorgeCup/EditGeorgeCup.tsx

"use client";
import React from "react";
import { useState } from "react";

const Layout = {
    container: "flex flex-row space-x-4 overflow-x-auto p-4",
    column: "min-w-[250px] flex-shrink-0",
    roundTitle: "text-lg font-bold mb-2 text-gray-900 dark:text-gray-100",
    gameWeekSelect: "w-full mb-4",
    fixtureBox: "border rounded p-3 mb-2",
    pastRound: "bg-gray-100 dark:bg-gray-700/50",
    activeRound: "bg-white dark:bg-gray-800",
    playerBox: {
        base: "flex justify-between items-center p-2 rounded",
        winner: "bg-green-100 dark:bg-green-900",
        loser: "bg-red-100 dark:bg-red-900",
        bye: "bg-gray-50 dark:bg-gray-800/50 italic"
    }
};

interface Props {
    seasonId: string;
    onClose: () => void;
}

type RoundState = {
    id: string;
    round_number: number;
    round_name: string;
    game_week_id: string | null;
    is_complete: boolean;
    fixtures: FixtureState[];
};

type FixtureState = {
    id: string;
    player1_id: string | null;
    player2_id: string | null;
    winner_id: string | null;
    player1_score?: number;
    player2_score?: number;
};


export default function EditGeorgeCup({ seasonId, onClose }: Props) {
    const [rounds, setRounds] = useState<RoundState[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [gameWeeks, setGameWeeks] = useState<GameWeek[]>([]);
    const [showDrawModal, setShowDrawModal] = useState(false);


    const calculateRequiredRounds = (playerCount: number) => {
        return Math.ceil(Math.log2(playerCount));
    };
    
    const calculateByesNeeded = (playerCount: number) => {
        const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(playerCount)));
        return nextPowerOfTwo - playerCount;
    };
    
    const distributeByes = (players: Player[], byesNeeded: number) => {
        // Logic to distribute byes across early rounds
    };
    
    const handleGameWeekSelect = (roundId: string, gameWeekId: string) => {
        // Show draw confirmation modal
    };
    
    const performDraw = (roundId: string) => {
        // Perform random draw and lock in fixtures
    };


    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    George Cup
                </h2>
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                >
                    Back
                </button>
            </div>
        </div>
    );
}