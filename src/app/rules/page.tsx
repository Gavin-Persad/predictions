//src/app/rules/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import DarkModeToggle from '../../components/darkModeToggle';
import { supabase } from '../../../supabaseClient';

export default function Rules() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Redirect to login page if not authenticated
        router.push('/');
      } else {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-grow flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
        {/* Top bar with dark mode toggle only */}
        <div className="w-full flex justify-end items-center p-4 bg-white dark:bg-gray-800 shadow-sm">
          <DarkModeToggle />
        </div>
        
        <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full">
          <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100 text-center">
            Game Rules
          </h1>
          
          {/* Introduction */}
          <section className="mb-10 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Introduction
            </h2>
            
            <p className="text-gray-700 dark:text-gray-300">
              Each game week consists of 10 fixtures. You must log in and enter your predictions before midnight on the day before the first game of the game week. Once all matches are completed, the host will update the scores and alert everyone. You can then log in to see the updated scores, league standings, cups, and awards.
            </p>
          </section>
          
          {/* League Predictions */}
          <section className="mb-10 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              League Predictions
            </h2>
            
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                League predictions is the main competition where players predict scores for each fixture every week.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mt-4">Points Scoring</h3>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <ul className="list-disc ml-5 space-y-2 text-gray-700 dark:text-gray-300">
                  <li><strong>Exact Score:</strong>
                    <ul className="list-circle ml-5 mt-1">
                      <li>3 points - When you correctly predict the exact score with 3 or fewer total goals</li>
                      <li>4 points - When you correctly predict the exact score with 4 total goals</li>
                      <li>5 points - When you correctly predict the exact score with 5 total goals</li>
                      <li>6+ points - And so on (points equal the total goals in the match)</li>
                    </ul>
                  </li>
                  <li><strong>Correct Result:</strong> 1 point - When you predict the correct outcome (home win, away win, or draw) but not the exact score</li>
                  <li><strong>Unique Correct Score:</strong> 2 bonus points - When you're the only player to predict the exact score</li>
                  <li><strong>Weekly Bonuses:</strong>
                    <ul className="list-circle ml-5 mt-1">
                      <li>4 correct scores in one week: +1 point</li>
                      <li>5 correct scores in one week: +2 points</li>
                      <li>6 or more correct scores in one week: +3 points</li>
                    </ul>
                  </li>
                  <li><strong>Incorrect:</strong> 0 points - When your prediction is completely wrong</li>
                </ul>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mt-4">League Table</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Players are ranked in the league table based on their total points accumulated over the season. In case of a tie, the following tiebreakers apply:
              </p>
              <ul className="list-disc ml-5 space-y-1 text-gray-700 dark:text-gray-300">
                <li>Most correct scores predicted</li>
                <li>Most correct results predicted</li>
                <li>Most unique correct scores predicted</li>
              </ul>
            </div>
          </section>
          
          {/* George Cup */}
          <section className="mb-10 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              George Cup
            </h2>
            
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                The George Cup is a knockout tournament where players compete head-to-head based on their weekly predictions.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mt-4">Format</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Players are randomly drawn against each other in knockout rounds. For each round:
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <ul className="list-disc ml-5 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Each player makes their regular weekly predictions</li>
                  <li>The player with the higher points total for that week advances to the next round</li>
                  <li>In case of a tie, the player with more correct scores predicted advances</li>
                  <li>If still tied, a coin flip determines the winner (automated)</li>
                  <li>Winners automatically advance to the next round after scores are entered</li>
                  <li>Byes are automatically assigned when necessary to make the brackets work</li>
                </ul>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mt-3">
                The tournament continues with rounds of 32, 16, quarter-finals, semi-finals, and the final, depending on the number of participants. Players are drawn against each other randomly in the first round, with byes automatically allocated to complete the bracket. In subsequent rounds, winners from the previous round face each other according to the tournament bracket.
              </p>
            </div>
          </section>
          
          {/* Lavery Cup */}
          <section className="mb-10 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Lavery Cup
            </h2>
            
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                The Lavery Cup is a tournament where players select teams they think will win their matches each round.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mt-4">Format</h3>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <ul className="list-disc ml-5 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Each round, players select two teams they believe will win their matches</li>
                  <li>Players can only use each team once during the entire tournament</li>
                  <li>Both teams must win in 90 minutes for the player to advance to the next round</li>
                  <li>If a player's selected team loses or draws, they are eliminated</li>
                  <li>If all players are eliminated in a round, the tournament is reset</li>
                  <li>The last player remaining after all rounds is the winner</li>
                  <li>If predictions window is missed and no selections are made, the players is eliminated</li>
                </ul>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mt-3">
                If all players are eliminated in a round, the cup is reset and we start again from the beginning.
              </p>
            </div>
          </section>
          
          {/* General Rules */}
          <section className="mb-10 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              General Rules
            </h2>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mt-4">Deadlines</h3>
              <p className="text-gray-700 dark:text-gray-300">
                All predictions must be submitted before the deadline for each gameweek:
              </p>
              <ul className="list-disc ml-5 text-gray-700 dark:text-gray-300">
                <li>Predictions close at midnight the day before the first match of the gameweek</li>
                <li>Late predictions will not be counted</li>
                <li>Default prediction is 0-0 if no prediction is made</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mt-4">Fair Play</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Players are expected to make their own predictions independently. Any form of collusion or manipulation will result in disqualification.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mt-4">Host Decisions</h3>
              <p className="text-gray-700 dark:text-gray-300">
                The host has final say on all rule interpretations and dispute resolutions. Important announcements will be posted in the Messages section on the dashboard.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}