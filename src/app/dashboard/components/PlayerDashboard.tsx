"use client";

import React, { useEffect, useState, type ReactNode, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '../../../../supabaseClient';
import Awards from '../tiles/Awards';
import AwardsPage from '../tiles/AwardsPage';
import GeorgeCup from '../tiles/GeorgeCup';
import GeorgeCupPage from '../tiles/GeorgeCupPage';
import LaveryCup from '../tiles/LaveryCup';
import LaveryCupPage from '../tiles/LaveryCupPage';
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

export type PlayerDashboardHandle = {
  resetToHome: () => void;
};

const PlayerDashboard = forwardRef<PlayerDashboardHandle, PlayerDashboardProps>(
  ({ topSlot, isHost = false }, ref) => {
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [seasonsLoading, setSeasonsLoading] = useState(true);
    const [showLeagueTable, setShowLeagueTable] = useState(false);
    const [showAwardsPage, setShowAwardsPage] = useState(false);
    const [showGeorgeCupPage, setShowGeorgeCupPage] = useState(false);
    const [showLaveryCupPage, setShowLaveryCupPage] = useState(false);
    const [managerMonthPage, setManagerMonthPage] = useState<{
      months: ManagerMonthStandings[];
      initialMonthId: string;
      currentUserId: string | null;
    } | null>(null);
    const [statusFullPage, setStatusFullPage] = useState(false);
    const statusBarRef = React.useRef<React.ComponentRef<typeof StatusBar>>(null);

    useImperativeHandle(ref, () => ({
      resetToHome: () => {
        setShowLeagueTable(false);
        setShowAwardsPage(false);
        setShowGeorgeCupPage(false);
        setShowLaveryCupPage(false);
        setManagerMonthPage(null);
        setStatusFullPage(false);
        statusBarRef.current?.resetPanel();
      },
    }));

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

    if (showAwardsPage && latestSeason) {
      return (
        <AwardsPage
          seasons={seasons}
          initialSeasonId={latestSeason.id}
          onBack={() => setShowAwardsPage(false)}
        />
      );
    }

    if (showGeorgeCupPage && latestSeason) {
      return (
        <GeorgeCupPage
          seasons={seasons}
          initialSeasonId={latestSeason.id}
          onBack={() => setShowGeorgeCupPage(false)}
        />
      );
    }

    if (showLaveryCupPage && latestSeason) {
      return (
        <LaveryCupPage
          seasons={seasons}
          initialSeasonId={latestSeason.id}
          onBack={() => setShowLaveryCupPage(false)}
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

        <StatusBar ref={statusBarRef} onFullPageChange={setStatusFullPage} />

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
                <Awards onOpen={() => setShowAwardsPage(true)} />
                <GeorgeCup
                  season={latestSeason}
                  seasonLoading={seasonsLoading}
                  onOpen={() => setShowGeorgeCupPage(true)}
                />
                <LaveryCup
                  season={latestSeason}
                  seasonLoading={seasonsLoading}
                  onOpen={() => setShowLaveryCupPage(true)}
                />
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
);

PlayerDashboard.displayName = 'PlayerDashboard';

export default PlayerDashboard;
