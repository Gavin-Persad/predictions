//src/app/landing/dashboard.tsx

"use client";

import DashboardShell from '../headerandfooter';
import PlayerDashboard from '../dashboard/components/PlayerDashboard';

export default function DashboardPage() {
  return (
    <DashboardShell title="Dashboard">
      <PlayerDashboard />
    </DashboardShell>
  );
}

