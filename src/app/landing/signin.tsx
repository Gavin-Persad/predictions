"use client";

import { FormEvent, useState } from 'react';
import { supabase } from '../../../supabaseClient';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [club, setClub] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (isLogin) {
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
    <main className="relative min-h-screen overflow-hidden bg-[#0B0F14] text-[#E8EDF2]">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-x-0 top-1/2 h-px bg-[#151D27]" />
        <div className="absolute left-1/2 top-1/2 h-[min(80vw,640px)] w-[min(80vw,640px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#151D27]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-[420px] rounded-[14px] border border-[#243040] bg-[#141B24] p-7 shadow-[0_0_0_1px_rgba(36,48,64,0.7)]">
          <div className="mb-6 flex items-center gap-3">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-[#B6F23C]"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7.5l3.5 2.5-1.3 4h-4.4l-1.3-4z" />
              <path d="M12 3v4.5M15.5 10l4.2-1.3M14.2 14l2.6 3.6M9.8 14l-2.6 3.6M8.5 10L4.3 8.7" />
            </svg>
            <span className="text-sm font-medium text-[#E8EDF2]">The Barman</span>
          </div>

          <h1 className="mb-1 text-3xl font-semibold tracking-[-0.02em] text-[#E8EDF2]">
            {isLogin ? 'Log in' : 'Create an account'}
          </h1>
          <p className="mb-6 text-sm text-[#8A97A6]">
            {isLogin
              ? 'Enter your predictions before the weekly deadline.'
              : 'Join the competition. The host will add you to the season.'}
          </p>

          {message && (
            <p
              role="alert"
              className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
                messageType === 'success'
                  ? 'border-[#1F5236] bg-[#14301F] text-[#4ADE80]'
                  : 'border-[#5A2A2E] bg-[#2A1517] text-[#FF7B7B]'
              }`}
            >
              {message}
            </p>
          )}

          <form onSubmit={handleAuth} noValidate>
            <div className="mb-4">
              <label htmlFor="email" className="mb-2 block text-xs text-[#8A97A6]">
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
                className="w-full rounded-lg border border-[#3A4A5E] bg-[#0F151C] px-3 py-3 text-[15px] text-[#E8EDF2] placeholder:text-[#4A5766] focus:border-transparent focus:outline-2 focus:outline-[#B6F23C]"
              />
            </div>

            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <label htmlFor="password" className="block text-xs text-[#8A97A6]">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-[#8A97A6] transition hover:text-[#B6F23C]"
                  onClick={() => setMessage('Password reset is coming soon.')}
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                minLength={6}
                maxLength={18}
                required
                className="w-full rounded-lg border border-[#3A4A5E] bg-[#0F151C] px-3 py-3 text-[15px] text-[#E8EDF2] placeholder:text-[#4A5766] focus:border-transparent focus:outline-2 focus:outline-[#B6F23C]"
              />
              <p className="mt-2 text-[11px] text-[#8A97A6]">6 to 18 characters.</p>
            </div>

            {!isLogin && (
              <>
                <div className="mb-4">
                  <label htmlFor="username" className="mb-2 block text-xs text-[#8A97A6]">
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
                    className="w-full rounded-lg border border-[#3A4A5E] bg-[#0F151C] px-3 py-3 text-[15px] text-[#E8EDF2] placeholder:text-[#4A5766] focus:border-transparent focus:outline-2 focus:outline-[#B6F23C]"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="club" className="mb-2 block text-xs text-[#8A97A6]">
                    Club
                  </label>
                  <input
                    id="club"
                    type="text"
                    value={club}
                    onChange={(event) => setClub(event.target.value)}
                    placeholder="The team you support"
                    required
                    className="w-full rounded-lg border border-[#3A4A5E] bg-[#0F151C] px-3 py-3 text-[15px] text-[#E8EDF2] placeholder:text-[#4A5766] focus:border-transparent focus:outline-2 focus:outline-[#B6F23C]"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg bg-[#B6F23C] px-4 py-3 font-semibold text-[#0B0F14] transition hover:bg-[#C6F75F] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Please wait...' : isLogin ? 'Log in' : 'Create account'}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#243040] pt-4 text-sm text-[#8A97A6]">
            <span>{isLogin ? 'Not registered yet?' : 'Already registered?'}</span>
            <button
              type="button"
              onClick={() => {
                setIsLogin((current) => !current);
                setMessage('');
                setMessageType('');
              }}
              className="rounded-lg border border-[#3A4A5E] bg-transparent px-3 py-2 font-medium text-[#E8EDF2] transition hover:border-[#B6F23C] hover:text-[#B6F23C]"
            >
              {isLogin ? 'Create an account' : 'Back to log in'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
