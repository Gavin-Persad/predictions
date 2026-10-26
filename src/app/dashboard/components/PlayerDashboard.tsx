"use client";

import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../../../../supabaseClient';
import Awards from '../tiles/Awards';
import GeorgeCup from '../tiles/GeorgeCup';
import LaveryCup from '../tiles/LaveryCup';
import LeagueTable from '../tiles/LeagueTable';
import LeagueTablePage from '../tiles/LeagueTablePage';
import ManagerOfTheMonth from '../tiles/ManagerOfTheMonth';
import Messages from '../tiles/Messages';
import type { Season } from './ChooseSeason';
import StatusBar from './StatusBar';

// The player view's content, shared by the player and host landing pages. Add new player widgets here.
type PlayerDashboardProps = {
  topSlot?: ReactNode;
};

export default function PlayerDashboard({ topSlot }: PlayerDashboardProps) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonsLoading, setSeasonsLoading] = useState(true);
  const [showLeagueTable, setShowLeagueTable] = useState(false);
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

  return (
    <>
      {!statusFullPage && topSlot}

      <StatusBar onFullPageChange={setStatusFullPage} />

      {!statusFullPage && (
        <>
          {/* Desktop height is clamped to the viewport so the whole dashboard fits between header and footer. */}
          <div className="grid gap-3 lg:h-[clamp(420px,calc(100vh-480px),600px)] lg:grid-cols-2">
            <LeagueTable
              season={latestSeason}
              seasonLoading={seasonsLoading}
              onOpen={() => setShowLeagueTable(true)}
            />

            <div className="grid gap-3 lg:min-h-0 lg:grid-rows-[1fr_2fr_2fr_2fr]">
              <Awards />
              <GeorgeCup />
              <LaveryCup />
              <ManagerOfTheMonth />
            </div>
          </div>

          <Messages />
        </>
      )}
    </>
  );
}
