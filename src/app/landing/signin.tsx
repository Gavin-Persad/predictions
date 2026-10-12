//src/app/landing/signin.tsx

"use client";

import { FormEvent, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import PitchBackground from '../stylecomponents/background';
import Logo from '../stylecomponents/logo';
import { colors } from '../stylecomponents/colors';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [club, setClub] = useState('');
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const resetPasswordRedirectTo = `${window.location.origin}/landing/reset-password`;

    if (view === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        setMessageType('error');
        setIsSubmitting(false);
        return;
      }

      setMessage('Logged in. Taking you to your dashboard.');
      setMessageType('success');
      setIsSubmitting(false);
      return;
    }

    if (view === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetPasswordRedirectTo,
      });

      if (error) {
        setMessage(error.message);
        setMessageType('error');
        setIsSubmitting(false);
        return;
      }

      setMessage('Password reset email sent. Check your inbox for the link.');
      setMessageType('success');
      setIsSubmitting(false);
      return;
    }

    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setMessageType('error');
      setIsSubmitting(false);
      return;
    }

    if (user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: user.id, username, club, is_host: false });

      if (profileError) {
        setMessage('Error creating user profile');
        setMessageType('error');
        setIsSubmitting(false);
        return;
      }

      setMessage('Account created. Check your email to confirm it, then log in.');
      setMessageType('success');
      setIsSubmitting(false);
      return;
    }

    setMessage('Error creating user profile');
    setMessageType('error');
    setIsSubmitting(false);
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
        ['--color-lime-hover' as never]: colors.limeHover,
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
            <span className="text-sm font-medium text-[var(--color-text)]">The George Predictions League</span>
          </div>

          <h1 className="mb-1 text-3xl font-semibold tracking-[-0.02em] text-[var(--color-text)]">
            {view === 'login' ? 'Log in' : view === 'signup' ? 'Create an account' : 'Reset password'}
          </h1>
          <p className="mb-6 text-sm text-[var(--color-muted)]">
            {view === 'login'
              ? 'Enter your predictions before the weekly deadline.'
              : view === 'signup'
                ? 'Join the competition.'
                : 'Enter your email and we will send you a reset link.'}
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

          <form onSubmit={handleAuth} noValidate>
            <div className="mb-4">
              <label htmlFor="email" className="mb-2 block text-xs text-[var(--color-muted)]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full rounded-lg border px-3 py-3 text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-placeholder)] focus:border-transparent focus:outline-2 focus:outline-[var(--color-lime)]"
                style={{
                  backgroundColor: colors.field,
                  borderColor: colors.borderStrong,
                }}
              />
            </div>

            {view !== 'forgot' && (
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label htmlFor="password" className="block text-xs text-[var(--color-muted)]">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs text-[var(--color-muted)] transition hover:text-[var(--color-lime)]"
                    onClick={() => {
                      setView('forgot');
                      setMessage('');
                      setMessageType('');
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                  minLength={6}
                  maxLength={18}
                  required
                  className="w-full rounded-lg border px-3 py-3 text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-placeholder)] focus:border-transparent focus:outline-2 focus:outline-[var(--color-lime)]"
                  style={{
                    backgroundColor: colors.field,
                    borderColor: colors.borderStrong,
                  }}
                />
                <p className="mt-2 text-[11px] text-[var(--color-muted)]">6 to 18 characters.</p>
              </div>
            )}

            {view === 'signup' && (
              <>
                <div className="mb-4">
                  <label htmlFor="username" className="mb-2 block text-xs text-[var(--color-muted)]">
                    Display name
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Shown on the league table"
                    autoComplete="nickname"
                    required
                    className="w-full rounded-lg border px-3 py-3 text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-placeholder)] focus:border-transparent focus:outline-2 focus:outline-[var(--color-lime)]"
                    style={{
                      backgroundColor: colors.field,
                      borderColor: colors.borderStrong,
                    }}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="club" className="mb-2 block text-xs text-[var(--color-muted)]">
                    Club
                  </label>
                  <input
                    id="club"
                    type="text"
                    value={club}
                    onChange={(event) => setClub(event.target.value)}
                    placeholder="The team you support"
                    required
                    className="w-full rounded-lg border px-3 py-3 text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-placeholder)] focus:border-transparent focus:outline-2 focus:outline-[var(--color-lime)]"
                    style={{
                      backgroundColor: colors.field,
                      borderColor: colors.borderStrong,
                    }}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg px-4 py-3 font-semibold text-[var(--color-background)] transition disabled:cursor-not-allowed disabled:opacity-70"
              style={{ backgroundColor: colors.lime }}
            >
              {isSubmitting
                ? 'Please wait...'
                : view === 'login'
                  ? 'Log in'
                  : view === 'signup'
                    ? 'Create account'
                    : 'Send reset link'}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-muted)]">
            <span>
              {view === 'login'
                ? 'Not registered yet?'
                : view === 'signup'
                  ? 'Already registered?'
                  : 'Remembered your password?'}
            </span>
            <button
              type="button"
              onClick={() => {
                setView((current) => (current === 'login' ? 'signup' : 'login'));
                setMessage('');
                setMessageType('');
              }}
              className="rounded-lg border px-3 py-2 font-medium text-[var(--color-text)] transition hover:border-[var(--color-lime)] hover:text-[var(--color-lime)]"
              style={{ borderColor: colors.borderStrong }}
            >
              {view === 'login' ? 'Create an account' : view === 'signup' ? 'Back to log in' : 'Back to log in'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
