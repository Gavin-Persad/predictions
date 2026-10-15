//src/app/headerandfooter.tsxs

"use client";

import Link from 'next/link';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient';
import ProfileSettingsView from './profilesettings/profsett';
import Logo from './stylecomponents/logo';
import { colors } from './stylecomponents/colors';
import PitchBackground from './stylecomponents/background';

type DashboardShellProps = {
  title?: string;
  children?: ReactNode;
  profileName?: string;
  seasonName?: string;
};

export function AppHeader({
  profileName,
  seasonName,
  onOpenProfileSettings,
}: {
  profileName?: string;
  seasonName?: string;
  onOpenProfileSettings?: () => void;
}) {
  return (
    <header
      className="mx-auto mb-4 flex w-full max-w-[1280px] items-center justify-between gap-4 px-4 py-4 md:px-6"
      style={{
        borderColor: 'transparent',
        backgroundColor: 'transparent',
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-3 text-[var(--color-text)] transition-opacity hover:opacity-90"
          aria-label="Back to home"
        >
          <Logo className="h-4 w-4 text-[var(--color-lime)]" />
          <span className="text-base font-semibold tracking-[-0.02em] text-[var(--color-text)] sm:text-lg">
            The George Predictions League
          </span>
        </Link>

        <button
          type="button"
          onClick={onOpenProfileSettings}
          className="rounded-full border px-2.5 py-1 text-xs font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-lime)] hover:text-[var(--color-lime)] sm:text-sm"
          style={{
            borderColor: colors.borderStrong,
            backgroundColor: colors.field,
          }}
        >
          {profileName || 'Profile'}
        </button>
      </div>

      <div className="text-right text-sm text-[var(--color-muted)] sm:text-base">
        <span className="hidden sm:inline">Current Season: </span>
        {seasonName || 'Current season'}
      </div>
    </header>
  );
}

export function AppFooter({ onOpenProfileSettings }: { onOpenProfileSettings?: () => void }) {
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/rules', label: 'Rules' },
    { href: '/about', label: 'About' },
    { label: 'Profile Settings', onClick: onOpenProfileSettings },
    { href: 'mailto:gavinapersad@gmail.com', label: 'Contact' },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <>
      <footer
        className="mx-auto mt-4 w-full max-w-[1280px] px-4 py-4 md:px-6"
        style={{
          borderColor: 'transparent',
          backgroundColor: 'transparent',
        }}
      >
        <nav
          aria-label="Footer navigation"
          className="flex flex-col items-center gap-2 text-sm sm:gap-3"
        >
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-[var(--color-muted)]">
            {navItems.map((item) => {
              const content = (
                <span className="transition-colors hover:text-[var(--color-lime)]">{item.label}</span>
              );

              if (item.onClick) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    className="inline-flex items-center justify-center text-[var(--color-muted)]"
                  >
                    {content}
                  </button>
                );
              }

              if (item.href?.startsWith('mailto:')) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="inline-flex items-center justify-center"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {content}
                  </a>
                );
              }

              return (
                <Link key={item.label} href={item.href || '/'} className="inline-flex items-center justify-center">
                  {content}
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => setShowSignOutConfirm(true)}
              className="inline-flex items-center justify-center text-[var(--color-muted)] transition-colors hover:text-[var(--color-lime)]"
            >
              Sign out
            </button>
          </div>
        </nav>
      </footer>

      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div
            className="w-full max-w-sm rounded-[16px] border p-5 shadow-2xl"
            style={{
              backgroundColor: colors.panel,
              borderColor: colors.border,
            }}
          >
            <h3 className="mb-3 text-lg font-semibold text-[var(--color-text)]">Sign out?</h3>
            <p className="mb-5 text-sm text-[var(--color-muted)]">
              Are you sure you want to sign out of your account?
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                className="rounded-lg border px-3 py-2 text-sm font-medium text-[var(--color-text)]"
                style={{ borderColor: colors.borderStrong }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={async () => {
                  setShowSignOutConfirm(false);
                  await handleSignOut();
                }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#0B0F14]"
                style={{ backgroundColor: colors.lime }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function DashboardShell({
  title,
  children,
  profileName: initialProfileName,
  seasonName: initialSeasonName,
}: DashboardShellProps) {
  const [profileName, setProfileName] = useState(initialProfileName || 'Player');
  const [seasonName, setSeasonName] = useState(initialSeasonName || 'Current season');
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardMeta = async () => {
      try {
        if (!initialProfileName) {
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user?.id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', session.user.id)
              .maybeSingle();

            if (isMounted && profile?.username) {
              setProfileName(profile.username);
            }
          }
        }

        if (!initialSeasonName) {
          const { data: season } = await supabase
            .from('seasons')
            .select('name')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (isMounted && season?.name) {
            setSeasonName(season.name);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard meta:', error);
      }
    };

    void fetchDashboardMeta();

    return () => {
      isMounted = false;
    };
  }, [initialProfileName, initialSeasonName]);

  const defaultContent = useMemo(
    () => (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-40 rounded-[12px] border border-dashed"
            style={{
              backgroundColor: colors.field,
              borderColor: colors.border,
            }}
          />
        ))}
      </div>
    ),
    []
  );

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
      }}
    >
      <PitchBackground className="pointer-events-none absolute inset-0 opacity-70" />

      <div className="relative z-10 mx-auto max-w-[1280px] px-4 py-5 md:px-6 lg:px-8">
        <AppHeader
          profileName={profileName}
          seasonName={seasonName}
          onOpenProfileSettings={() => setShowProfileSettings(true)}
        />

        <div
          className="overflow-hidden rounded-[18px] border shadow-[0_0_0_1px_rgba(36,48,64,0.7)]"
          style={{
            backgroundColor: colors.panel,
            borderColor: colors.border,
          }}
        >
          <div className="px-4 py-5 md:px-6 md:py-6">
            {title && (
              <div className="mb-5">
                <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--color-text)]">
                  {title}
                </h1>
              </div>
            )}

            <div className="space-y-4">{children ?? defaultContent}</div>
          </div>
        </div>

        <AppFooter onOpenProfileSettings={() => setShowProfileSettings(true)} />
      </div>

      {showProfileSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-8">
          <div className="w-full max-w-[940px]">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowProfileSettings(false)}
                className="rounded-full border px-3 py-1.5 text-sm font-medium text-[var(--color-text)]"
                style={{
                  borderColor: colors.borderStrong,
                  backgroundColor: colors.panel,
                }}
              >
                Close
              </button>
            </div>

            <ProfileSettingsView embedded />
          </div>
        </div>
      )}
    </main>
  );
}
