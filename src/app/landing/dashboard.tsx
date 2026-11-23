//src/app/landing/dashboard.tsx

"use client";

import { useRef } from 'react';
import DashboardShell from '../headerandfooter';
import PlayerDashboard from '../dashboard/components/PlayerDashboard';

export default function DashboardPage() {
  const playerDashboardRef = useRef<{ resetToHome: () => void } | null>(null);

  return (
    <DashboardShell
      title="Dashboard"
      onHome={() => playerDashboardRef.current?.resetToHome()}
    >
      <PlayerDashboard ref={playerDashboardRef} />
    </DashboardShell>
  );
}

