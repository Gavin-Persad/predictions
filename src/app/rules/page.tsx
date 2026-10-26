//src/app/rules/page.tsx

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../supabaseClient';
import DashboardShell from '../headerandfooter';

export default function Rules() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/');
        return;
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <DashboardShell title="Game Rules">
        <div className="mx-auto rounded border border-[var(--color-border)] bg-[var(--color-panel)] px-6 py-4 text-sm text-[var(--color-muted)]">
          Loading...
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Game Rules">
      <div className="mx-auto w-full max-w-5xl rounded-[14px] border border-[var(--color-border)] bg-[var(--color-panel)] p-7 shadow-[0_0_0_1px_rgba(36,48,64,0.7)] md:p-10">
          <h1 className="mb-8 text-center text-3xl font-semibold tracking-[-0.02em] text-[var(--color-text)] md:text-4xl">
            Game Rules
          </h1>

          <section className="mb-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-field)] p-6">
            <h2 className="mb-4 border-b border-[var(--color-border)] pb-2 text-2xl font-semibold text-[var(--color-text)]">
              Introduction
            </h2>
            <p className="text-[var(--color-text)]/90">
              Each game week consists of 10 fixtures. You must log in and enter your predictions before 11PM on the day before the first game of the game week. Once all matches are completed, the host will update the scores and alert everyone. You can then log in to see the updated scores, league standings, cups, and awards.
            </p>
          </section>

          <section className="mb-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-field)] p-6">
            <h2 className="mb-4 border-b border-[var(--color-border)] pb-2 text-2xl font-semibold text-[var(--color-text)]">
              League Predictions
            </h2>

            <div className="space-y-4">
              <p className="text-[var(--color-text)]/90">
                League predictions is the main competition where players predict scores for each fixture every week.
              </p>

              <h3 className="mt-4 text-xl font-semibold text-[var(--color-text)]">Points Scoring</h3>

              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                <ul className="ml-5 list-disc space-y-2 text-[var(--color-text)]/90">
                  <li><strong>Exact Score:</strong>
                    <ul className="ml-5 mt-1 list-circle">
                      <li>3 points - When you correctly predict the exact score with 3 or fewer total goals</li>
                      <li>4 points - When you correctly predict the exact score with 4 total goals</li>
                      <li>5 points - When you correctly predict the exact score with 5 total goals</li>
                      <li>6+ points - And so on (points equal the total goals in the match)</li>
                    </ul>
                  </li>
                  <li><strong>Correct Result:</strong> 1 point - When you predict the correct outcome (home win, away win, or draw) but not the exact score</li>
                  <li><strong>Unique Correct Result:</strong> 2 bonus points - When you&apos;re the only player to predict the result of a game. Win, Loss or Draw</li>
                  <li><strong>Weekly Bonuses:</strong>
                    <ul className="ml-5 mt-1 list-circle">
                      <li>4 correct scores in one week: +1 point</li>
                      <li>5 correct scores in one week: +2 points</li>
                      <li>6 or more correct scores in one week: +3 points</li>
                    </ul>
                  </li>
                  <li><strong>Incorrect:</strong> 0 points - When your prediction is completely wrong</li>
                </ul>
              </div>

              <h3 className="mt-4 text-xl font-semibold text-[var(--color-text)]">League Table</h3>
              <p className="text-[var(--color-text)]/90">
                Players are ranked in the league table based on their total points accumulated over the season. In case of a tie, the following tiebreakers apply:
              </p>
              <ul className="ml-5 list-disc space-y-1 text-[var(--color-text)]/90">
                <li>Most correct scores predicted</li>
                <li>If still tied, the winner is decided by a coin toss (automated by the app)</li>
              </ul>
            </div>
          </section>

          <section className="mb-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-field)] p-6">
            <h2 className="mb-4 border-b border-[var(--color-border)] pb-2 text-2xl font-semibold text-[var(--color-text)]">
              Manager of the Month
            </h2>

            <div className="space-y-4">
              <p className="text-[var(--color-text)]/90">
                Manager of the Month is awarded based on all game weeks that fall within the calendar month. If the 1st of the month falls on a weekend, that weekend is treated as the start of the month for the purposes of this award.
              </p>

              <p className="text-[var(--color-text)]/90">
                Players are judged by total points accumulated across the included game weeks. The player with the most points wins Manager of the Month.
              </p>

              <p className="text-[var(--color-text)]/90">Tiebreakers:</p>
              <ul className="ml-5 list-disc space-y-1 text-[var(--color-text)]/90">
                <li>Most correct scores predicted across those weeks</li>
                <li>If still tied, the winner is decided by a coin toss (automated by the app)</li>
              </ul>
            </div>
          </section>

          <section className="mb-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-field)] p-6">
            <h2 className="mb-4 border-b border-[var(--color-border)] pb-2 text-2xl font-semibold text-[var(--color-text)]">
              George Cup
            </h2>

            <div className="space-y-4">
              <p className="text-[var(--color-text)]/90">
                The George Cup is a knockout tournament where players compete head-to-head based on their weekly predictions.
              </p>

              <h3 className="mt-4 text-xl font-semibold text-[var(--color-text)]">Format</h3>
              <p className="text-[var(--color-text)]/90">
                Players are randomly drawn against each other in knockout rounds. For each round:
              </p>

              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                <ul className="ml-5 list-disc space-y-2 text-[var(--color-text)]/90">
                  <li>Each player makes their regular weekly predictions</li>
                  <li>The player with the higher points total for that week advances to the next round</li>
                  <li>In case of a tie, the player with more correct scores predicted advances</li>
                  <li>If still tied, a coin flip determines the winner (automated)</li>
                  <li>Winners automatically advance to the next round after scores are entered</li>
                  <li>Byes are automatically assigned when necessary to make the brackets work</li>
                </ul>
              </div>

              <p className="mt-3 text-[var(--color-text)]/90">
                The tournament continues with rounds of 32, 16, quarter-finals, semi-finals, and the final, depending on the number of participants. Players are drawn against each other randomly in the first round, with byes automatically allocated to complete the bracket. In subsequent rounds, winners from the previous round face each other according to the tournament bracket.
              </p>
            </div>
          </section>

          <section className="mb-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-field)] p-6">
            <h2 className="mb-4 border-b border-[var(--color-border)] pb-2 text-2xl font-semibold text-[var(--color-text)]">
              Lavery Cup
            </h2>

            <div className="space-y-4">
              <p className="text-[var(--color-text)]/90">
                The Lavery Cup is a tournament where players select teams they think will win their matches each round.
              </p>

              <h3 className="mt-4 text-xl font-semibold text-[var(--color-text)]">Format</h3>

              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                <ul className="ml-5 list-disc space-y-2 text-[var(--color-text)]/90">
                  <li>Each round, players select two teams they believe will win their matches</li>
                  <li>Players can only use each team once during the entire tournament</li>
                  <li>Both teams must win in 90 minutes for the player to advance to the next round</li>
                  <li>If a player&apos;s selected team loses or draws, they are eliminated</li>
                  <li>If all players are eliminated in a round, the tournament is reset</li>
                  <li>The last player remaining after all rounds is the winner</li>
                  <li>If predictions window is missed and no selections are made, the players is eliminated</li>
                  <li>If a player selects a team that is not playing in the current game week, this counts as an incorrect guess and will result in elimination</li>
                </ul>
              </div>

              <p className="mt-3 text-[var(--color-text)]/90">
                If all players are eliminated in a round, the cup is reset and we start again from the beginning.
                <br />
                Should the season conclude without a Lavery Cup winner, the prize fund will roll over to the following season&apos;s competition.
              </p>
            </div>
          </section>

          <section className="mb-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-field)] p-6">
            <h2 className="mb-4 border-b border-[var(--color-border)] pb-2 text-2xl font-semibold text-[var(--color-text)]">
              Henderson Cup
            </h2>

            <div className="space-y-4">
              <p className="text-[var(--color-text)]/90">
                The Henderson Cup is a judged award, selected by the host together with a panel of judges. It recognises the best player of the season who has not won the League, the George Cup, or the Lavery Cup.
              </p>

              <h3 className="mt-4 text-xl font-semibold text-[var(--color-text)]">Eligibility</h3>
              <p className="text-[var(--color-text)]/90">
                Candidates must not have won the League title or either cup (George or Lavery). Players who finished in prize positions in the league, or who have won Special Awards or Manager of the Month, remain eligible — the Henderson Cup is explicitly for a standout performer who did not take a title.
              </p>

              <h3 className="mt-4 text-xl font-semibold text-[var(--color-text)]">Judging Criteria</h3>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                <ul className="ml-5 list-disc space-y-2 text-[var(--color-text)]/90">
                  <li>Competitiveness across all competitions</li>
                  <li>Consistency and season-long form</li>
                  <li>Total correct scores and overall accuracy</li>
                  <li>Boldness of predictions (risk-taking that paid off)</li>
                  <li>Any other factors the judges consider persuasive</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-field)] p-6">
            <h2 className="mb-4 border-b border-[var(--color-border)] pb-2 text-2xl font-semibold text-[var(--color-text)]">
              Special Awards
            </h2>

            <div className="space-y-4">
              <h3 className="mt-4 text-xl font-semibold text-[var(--color-text)]">Highest Correct Score</h3>
              <p className="text-[var(--color-text)]/90">
                Awarded for the single highest-goal game correctly predicted by a player. The total is the sum of goals in that correctly predicted fixture (for example, a correct 4-2 prediction counts as a 6-goal correct game).
                If multiple players achieve the same highest correct-goal total, the prize for this award is shared.
              </p>

              <h3 className="mt-4 text-xl font-semibold text-[var(--color-text)]">Highest Scoring Game Week</h3>
              <p className="text-[var(--color-text)]/90">
                Awarded to the player with the highest scoring game week across the entire season (ranked by points for that week). If players tie on points, the number of correct scores for that week is used as a tiebreaker. If the tie remains, the prize is shared among the tied players.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-field)] p-6">
            <h2 className="mb-4 border-b border-[var(--color-border)] pb-2 text-2xl font-semibold text-[var(--color-text)]">
              General Rules
            </h2>

            <div className="space-y-4">
              <h3 className="mt-4 text-xl font-semibold text-[var(--color-text)]">Deadlines</h3>
              <p className="text-[var(--color-text)]/90">
                All predictions must be submitted before the deadline for each gameweek:
              </p>
              <ul className="ml-5 list-disc text-[var(--color-text)]/90">
                <li>Predictions close at 11pm the day before the first match of the gameweek</li>
                <li>Late predictions will not be counted</li>
                <li>If the prediction window is missed with no scores entered, the player receives zero points.”</li>
              </ul>

              <h3 className="mt-4 text-xl font-semibold text-[var(--color-text)]">Match Results</h3>
              <p className="text-[var(--color-text)]/90">
                All game scores will be taken from the results at 90 minutes (plus stoppage time):
              </p>
              <ul className="ml-5 list-disc text-[var(--color-text)]/90">
                <li>Extra time and penalties are not counted in the final score</li>
                <li>Only the regulation time result is used for predictions and scoring</li>
              </ul>

              <h3 className="mt-4 text-xl font-semibold text-[var(--color-text)]">Fair Play</h3>
              <p className="text-[var(--color-text)]/90">
                Players are expected to make their own predictions independently. Any form of collusion or manipulation will result in disqualification.
              </p>

              <h3 className="mt-4 text-xl font-semibold text-[var(--color-text)]">Host Decisions</h3>
              <p className="text-[var(--color-text)]/90">
                The host has final say on all rule interpretations and dispute resolutions. Important announcements will be posted in the Messages section on the dashboard.
              </p>
            </div>
          </section>
      </div>
    </DashboardShell>
  );
}