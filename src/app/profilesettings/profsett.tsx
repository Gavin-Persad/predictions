"use client";

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '../headerandfooter';
import { colors } from '../stylecomponents/colors';
import { supabase } from '../../../supabaseClient';

type UserProfile = {
  id: string;
  username: string;
  club: string;
  is_host: boolean;
};

type ProfileSettingsViewProps = {
  embedded?: boolean;
};

export default function ProfileSettingsView({ embedded = false }: ProfileSettingsViewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState('');
  const [club, setClub] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordMessageType, setPasswordMessageType] = useState<'success' | 'error' | ''>('');
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/');
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setMessage('Error fetching user');
        setMessageType('error');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, club, is_host')
        .eq('id', user.id)
        .single();

      if (profileError) {
        setMessage('Error fetching user profile');
        setMessageType('error');
      } else {
        setProfile(profileData);
        setUsername(profileData.username || '');
        setClub(profileData.club || '');
      }
    };

    void checkAuthAndFetchProfile();
  }, [router]);

  const handleUpdateProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile) return;

    const { error } = await supabase
      .from('profiles')
      .update({ username, club })
      .eq('id', profile.id);

    if (error) {
      setMessage('Error updating profile');
      setMessageType('error');
      return;
    }

    setMessage('Profile updated successfully');
    setMessageType('success');
  };

  const handlePasswordReset = async () => {
    if (!newPassword || !confirmPassword) {
      setPasswordMessage('Please enter and confirm your new password.');
      setPasswordMessageType('error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage('Passwords do not match.');
      setPasswordMessageType('error');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordMessage(error.message || 'Error updating password');
      setPasswordMessageType('error');
      return;
    }

    setPasswordMessage('Password updated successfully.');
    setPasswordMessageType('success');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setShowPasswordModal(false), 700);
  };

  const content = (
    <div className="mx-auto w-full max-w-[860px]">
      <div
        className="rounded-[18px] border p-5 md:p-7"
        style={{
          backgroundColor: colors.field,
          borderColor: colors.border,
        }}
      >
        {message && (
          <p
            className={`mb-5 rounded-lg border px-3 py-2 text-sm ${
              messageType === 'success'
                ? 'border-[var(--color-success-border)] bg-[var(--color-success-background)] text-[var(--color-success-text)]'
                : 'border-[var(--color-error-border)] bg-[var(--color-error-background)] text-[var(--color-error-text)]'
            }`}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div>
            <label htmlFor="username" className="mb-2 block text-sm font-medium text-[var(--color-text)]">
              Display name
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-lg border px-3 py-3 text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-placeholder)] focus:border-transparent focus:outline-2 focus:outline-[var(--color-lime)]"
              style={{
                backgroundColor: colors.background,
                borderColor: colors.borderStrong,
              }}
            />
          </div>

          <div>
            <label htmlFor="club" className="mb-2 block text-sm font-medium text-[var(--color-text)]">
              Favourite club
            </label>
            <input
              id="club"
              type="text"
              value={club}
              onChange={(event) => setClub(event.target.value)}
              className="w-full rounded-lg border px-3 py-3 text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-placeholder)] focus:border-transparent focus:outline-2 focus:outline-[var(--color-lime)]"
              style={{
                backgroundColor: colors.background,
                borderColor: colors.borderStrong,
              }}
            />
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              className="rounded-lg px-4 py-3 text-sm font-semibold text-[#0B0F14] transition-opacity hover:opacity-95"
              style={{ backgroundColor: colors.lime }}
            >
              Update profile
            </button>

            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="rounded-lg border px-4 py-3 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-lime)] hover:text-[var(--color-lime)]"
              style={{ borderColor: colors.borderStrong, backgroundColor: colors.background }}
            >
              Reset password
            </button>
          </div>
        </form>

        <div
          className="mt-8 rounded-[14px] border border-dashed p-4"
          style={{
            borderColor: colors.borderStrong,
            backgroundColor: colors.background,
          }}
        >
          <p className="text-center text-sm text-[var(--color-muted)]">
            To delete your account, please contact{' '}
            <a href="mailto:gavinapersad@gmail.com" className="font-medium text-[var(--color-text)] underline">
              gavinapersad@gmail.com
            </a>{' '}
            with your request.
          </p>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div
            className="w-full max-w-md rounded-[18px] border p-5 shadow-2xl"
            style={{
              backgroundColor: colors.panel,
              borderColor: colors.border,
            }}
          >
            <h3 className="mb-3 text-xl font-semibold text-[var(--color-text)]">Reset password</h3>

            {passwordMessage && (
              <p
                className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
                  passwordMessageType === 'success'
                    ? 'border-[var(--color-success-border)] bg-[var(--color-success-background)] text-[var(--color-success-text)]'
                    : 'border-[var(--color-error-border)] bg-[var(--color-error-background)] text-[var(--color-error-text)]'
                }`}
              >
                {passwordMessage}
              </p>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="mb-2 block text-sm text-[var(--color-muted)]">
                  New password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-lg border px-3 py-3 text-[15px] text-[var(--color-text)] focus:border-transparent focus:outline-2 focus:outline-[var(--color-lime)]"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.borderStrong,
                  }}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm text-[var(--color-muted)]">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-lg border px-3 py-3 text-[15px] text-[var(--color-text)] focus:border-transparent focus:outline-2 focus:outline-[var(--color-lime)]"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.borderStrong,
                  }}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordMessage('');
                  setPasswordMessageType('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="rounded-lg border px-3 py-2 text-sm font-medium text-[var(--color-text)]"
                style={{ borderColor: colors.borderStrong }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePasswordReset}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#0B0F14]"
                style={{ backgroundColor: colors.lime }}
              >
                Update password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return embedded ? content : <DashboardShell title="Profile settings">{content}</DashboardShell>;
}

