//src/app/landing/dashboard.tsx

"use client";

import DashboardShell from '../headerandfooter';
import StatusBar from '../dashboard/components/StatusBar';

export default function DashboardPage() {
  return (
    <DashboardShell title="Dashboard">
      <StatusBar />
    </DashboardShell>
  );
}

