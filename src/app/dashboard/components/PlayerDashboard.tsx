"use client";

import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../../../../supabaseClient';
import Awards from '../tiles/Awards';
import GeorgeCup from '../tiles/GeorgeCup';
import LaveryCup from '../tiles/LaveryCup';
import LeagueTable from '../tiles/LeagueTable';
import LeagueTablePage from '../tiles/LeagueTablePage';
import ManagerOfTheMonth from '../tiles/ManagerOfTheMonth';
import ManagerOfTheMonthPage from '../tiles/ManagerOfTheMonthPage';
import type { ManagerMonthStandings } from '../tiles/managerMonthData';
import Messages from '../tiles/Messages';
import type { Season } from './ChooseSeason';
import StatusBar from './StatusBar';

// The player view's content, shared by the player and host landing pages. Add new player widgets here.
type PlayerDashboardProps = {
  topSlot?: ReactNode;
  isHost?: boolean;
};

export default function PlayerDashboard({ topSlot, isHost = false }: PlayerDashboardProps) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonsLoading, setSeasonsLoading] = useState(true);
  const [showLeagueTable, setShowLeagueTable] = useState(false);
  const [managerMonthPage, setManagerMonthPage] = useState<{
    months: ManagerMonthStandings[];
    initialMonthId: string;
    currentUserId: string | null;
  } | null>(null);
  const [statusFullPage, setStatusFullPage] = useState(false);

  useEffect(() => {
    let active = true;

    const loadSeasons = async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('id, name')
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching seasons:', error);
      if (!active) return;

      setSeasons(data ?? []);
      setSeasonsLoading(false);
    };

    void loadSeasons();

    return () => {
      active = false;
    };
  }, []);

  const latestSeason = seasons[0] ?? null;

  if (showLeagueTable) {
    return (
      <LeagueTablePage
        seasons={seasons}
        initialSeasonId={latestSeason?.id ?? null}
        onBack={() => setShowLeagueTable(false)}
      />
    );
  }

  if (managerMonthPage && latestSeason) {
    return (
      <ManagerOfTheMonthPage
        seasons={seasons}
        initialSeasonId={latestSeason.id}
        months={managerMonthPage.months}
        initialMonthId={managerMonthPage.initialMonthId}
        currentUserId={managerMonthPage.currentUserId}
        onBack={() => setManagerMonthPage(null)}
      />
    );
  }

  return (
    <>
      {!statusFullPage && topSlot}

      <StatusBar onFullPageChange={setStatusFullPage} />

      {!statusFullPage && (
        <>
          {/* Desktop height is clamped to the viewport so the whole dashboard fits between header and footer. */}
          <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
            <div className="lg:h-[806px] lg:self-start">
              <LeagueTable
                season={latestSeason}
                seasonLoading={seasonsLoading}
                onOpen={() => setShowLeagueTable(true)}
              />
            </div>

            <div className="grid gap-3 lg:grid-rows-[110px_repeat(3,minmax(220px,1fr))]">
              <Awards />
              <GeorgeCup />
              <LaveryCup />
              <ManagerOfTheMonth
                season={latestSeason}
                seasonLoading={seasonsLoading}
                onOpen={(months, monthId, currentUserId) =>
                  setManagerMonthPage({ months, initialMonthId: monthId, currentUserId })
                }
              />
            </div>
          </div>

          <Messages isHost={isHost} />
        </>
      )}
    </>
  );
}
