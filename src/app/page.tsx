"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import SignInPage from './landing/signin';
import DashboardPage from './landing/dashboard';
import AdminPage from './landing/admin';

type ViewState = 'loading' | 'signin' | 'dashboard' | 'admin';

export default function Home() {
  const [view, setView] = useState<ViewState>('loading');

  useEffect(() => {
    let active = true;

    const resolveView = async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) => {
      if (!session) {
        if (active) setView('signin');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_host')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!active) return;

      if (error || !profile) {
        setView('dashboard');
        return;
      }

      setView(profile.is_host ? 'admin' : 'dashboard');
    };

    const initialise = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await resolveView(session);
    };

    initialise();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void resolveView(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (view === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B0F14] text-[#E8EDF2]">
        <div className="rounded border border-[#243040] bg-[#141B24] px-6 py-4 text-sm text-[#8A97A6]">
          Loading...
        </div>
      </main>
    );
  }

  if (view === 'signin') return <SignInPage />;
  if (view === 'admin') return <AdminPage />;

  return <DashboardPage />;
}