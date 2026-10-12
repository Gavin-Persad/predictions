"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../supabaseClient';
import PitchBackground from '../../stylecomponents/background';
import Logo from '../../stylecomponents/logo';
import { colors } from '../../stylecomponents/colors';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = async (event: FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
      setMessageType('error');
      setIsSubmitting(false);
      return;
    }

    setMessage('Password updated. You can now log in.');
    setMessageType('success');
    setIsSubmitting(false);

    setTimeout(() => {
      router.push('/');
    }, 1000);
  };

  return (
    <main
      className="relative min-h-screen overflow-hidden text-[var(--color-text)]"
      style={{
        backgroundColor: colors.background,
        ['--color-text' as never]: colors.text,
        ['--color-pitch-line' as never]: colors.pitchLine,
        ['--color-muted' as never]: colors.muted,
        ['--color-field' as never]: colors.field,
        ['--color-border' as never]: colors.border,
        ['--color-border-strong' as never]: colors.borderStrong,
        ['--color-lime' as never]: colors.lime,
        ['--color-background' as never]: colors.background,
        ['--color-placeholder' as never]: colors.placeholder,
        ['--color-success-background' as never]: colors.successBackground,
        ['--color-success-border' as never]: colors.successBorder,
        ['--color-success-text' as never]: colors.successText,
        ['--color-error-background' as never]: colors.errorBackground,
        ['--color-error-border' as never]: colors.errorBorder,
        ['--color-error-text' as never]: colors.errorText,
      }}
    >
      <PitchBackground className="pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div
          className="w-full max-w-[420px] rounded-[14px] border p-7 shadow-[0_0_0_1px_rgba(36,48,64,0.7)]"
          style={{
            backgroundColor: colors.panel,
            borderColor: colors.border,
          }}
        >
          <div className="mb-6 flex items-center gap-3">
            <Logo className="h-5 w-5 text-[var(--color-lime)]" />
            <span className="text-sm font-medium text-[var(--color-text)]">The Barman</span>
          </div>

          <h1 className="mb-1 text-3xl font-semibold tracking-[-0.02em] text-[var(--color-text)]">
            Reset password
          </h1>
          <p className="mb-6 text-sm text-[var(--color-muted)]">
            Choose a new password for your account.
          </p>

          {message && (
            <p
              role="alert"
              className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
                messageType === 'success'
                  ? 'border-[var(--color-success-border)] bg-[var(--color-success-background)] text-[var(--color-success-text)]'
                  : 'border-[var(--color-error-border)] bg-[var(--color-error-background)] text-[var(--color-error-text)]'
              }`}
            >
              {message}
            </p>
          )}

          <form onSubmit={handleReset} noValidate>
            <div className="mb-4">
              <label htmlFor="password" className="mb-2 block text-xs text-[var(--color-muted)]">
                New password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                maxLength={18}
                required
                className="w-full rounded-lg border px-3 py-3 text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-placeholder)] focus:border-transparent focus:outline-2 focus:outline-[var(--color-lime)]"
                style={{
                  backgroundColor: colors.field,
                  borderColor: colors.borderStrong,
                }}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="mb-2 block text-xs text-[var(--color-muted)]">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={6}
                maxLength={18}
                required
                className="w-full rounded-lg border px-3 py-3 text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-placeholder)] focus:border-transparent focus:outline-2 focus:outline-[var(--color-lime)]"
                style={{
                  backgroundColor: colors.field,
                  borderColor: colors.borderStrong,
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg px-4 py-3 font-semibold text-[var(--color-background)] transition disabled:cursor-not-allowed disabled:opacity-70"
              style={{ backgroundColor: colors.lime }}
            >
              {isSubmitting ? 'Please wait...' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
