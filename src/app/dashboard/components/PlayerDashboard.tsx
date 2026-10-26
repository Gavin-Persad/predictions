"use client";

import Awards from '../tiles/Awards';
import GeorgeCup from '../tiles/GeorgeCup';
import LaveryCup from '../tiles/LaveryCup';
import LeagueTable from '../tiles/LeagueTable';
import ManagerOfTheMonth from '../tiles/ManagerOfTheMonth';
import Messages from '../tiles/Messages';
import StatusBar from './StatusBar';

// The player view's content, shared by the player and host landing pages. Add new player widgets here.
export default function PlayerDashboard() {
  return (
    <>
      <StatusBar />

      {/* Desktop height is clamped to the viewport so the whole dashboard fits between header and footer. */}
      <div className="grid gap-3 lg:h-[clamp(420px,calc(100vh-480px),600px)] lg:grid-cols-2">
        <LeagueTable />

        <div className="grid gap-3 lg:min-h-0 lg:grid-rows-[1fr_2fr_2fr_2fr]">
          <Awards />
          <GeorgeCup />
          <LaveryCup />
          <ManagerOfTheMonth />
        </div>
      </div>

      <Messages />
    </>
  );
}
