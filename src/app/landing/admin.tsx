//src/app/landing/admin.tsx

"use client";

import DashboardShell from '../headerandfooter';
import AdminBar from '../admin/components/AdminBar';
import PlayerDashboard from '../dashboard/components/PlayerDashboard';

export default function AdminPage() {
  return (
    <DashboardShell title="Admin">
      <PlayerDashboard topSlot={<AdminBar />} />
    </DashboardShell>
  );
}
