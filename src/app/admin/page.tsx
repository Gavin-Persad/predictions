//app/admin/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { useRouter } from 'next/navigation';
import DashboardShell, { AppHeader } from '../headerandfooter';
import { colors } from '../stylecomponents/colors';

type UserProfile = {
  id: string;
  username: string;
  is_host: boolean;
};

export default function AdminPage() {
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkHostAccess = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, is_host')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.is_host) {
        router.push('/');
        return;
      }

      setCurrentProfile(profile);
      setLoading(false);
    };

    void checkHostAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: colors.background }}>
        <p className="text-sm text-[var(--color-muted)]">Loading...</p>
      </div>
    );
  }

  if (!currentProfile?.is_host) {
    return null;
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden text-[var(--color-text)]"
      style={{
        backgroundColor: colors.background,
        ['--color-text' as never]: colors.text,
        ['--color-muted' as never]: colors.muted,
        ['--color-lime' as never]: colors.lime,
        ['--color-pitch-line' as never]: colors.pitchLine,
        ['--color-field' as never]: colors.field,
        ['--color-border' as never]: colors.border,
        ['--color-border-strong' as never]: colors.borderStrong,
        ['--color-panel' as never]: colors.panel,
        ['--color-background' as never]: colors.background,
        ['--color-lime-hover' as never]: colors.limeHover,
        ['--color-placeholder' as never]: colors.placeholder,
        ['--color-success-background' as never]: colors.successBackground,
        ['--color-success-border' as never]: colors.successBorder,
        ['--color-success-text' as never]: colors.successText,
        ['--color-error-background' as never]: colors.errorBackground,
        ['--color-error-border' as never]: colors.errorBorder,
        ['--color-error-text' as never]: colors.errorText,
      }}
    >
      <div className="relative z-10 mx-auto max-w-[1280px] px-4 py-5 md:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <AppHeader
            profileName={currentProfile?.username}
            seasonName="Admin View"
          />
        </div>

        <div
          className="w-full rounded-[18px] border p-4 md:p-5"
          style={{ backgroundColor: colors.panel, borderColor: colors.border }}
        >
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
              Admin content
            </p>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="rounded-full border px-3 py-1.5 text-sm font-medium text-[var(--color-text)]"
              style={{ borderColor: colors.borderStrong, backgroundColor: colors.field }}
            >
              ← Return to player view
            </button>
          </div>

          <div
            className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed text-sm text-[var(--color-muted)]"
            style={{ backgroundColor: colors.field, borderColor: colors.borderStrong }}
          >
            Admin page content - Coming soon
          </div>
        </div>
      </div>
    </main>
  );
}