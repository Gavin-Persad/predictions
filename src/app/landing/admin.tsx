//src/app/landing/admin.tsx

"use client";

import { useRef } from 'react';
import DashboardShell from '../headerandfooter';
import AdminBar from '../admin/components/AdminBar';
import PlayerDashboard, { type PlayerDashboardHandle } from '../dashboard/components/PlayerDashboard';

export default function AdminPage() {
  const playerDashboardRef = useRef<PlayerDashboardHandle | null>(null);

  return (
    <DashboardShell
      title="Admin"
      onHome={() => playerDashboardRef.current?.resetToHome()}
    >
      <PlayerDashboard ref={playerDashboardRef} isHost topSlot={<AdminBar />} />
    </DashboardShell>
  );
}
