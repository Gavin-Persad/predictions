//app/admin/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { useRouter } from 'next/navigation';

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
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#0B0F14' }}>
        <p className="text-sm" style={{ color: '#8A97A6' }}>Loading...</p>
      </div>
    );
  }

  if (!currentProfile?.is_host) {
    return null;
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: '#0B0F14' }}
    >
      <div className="relative z-10 mx-auto max-w-[1280px] px-4 py-5 md:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-6">
          <div
            className="mb-2 text-xs font-semibold uppercase tracking-widest"
            style={{ color: '#8A97A6', letterSpacing: '0.06em' }}
          >
            Admin home
          </div>
          <div className="text-lg font-semibold" style={{ color: '#E8EDF2' }}>
            {currentProfile?.username}
          </div>
        </div>

        {/* Content Section */}
        <div
          className="rounded-[14px] border p-4 md:p-5"
          style={{ 
            backgroundColor: '#141B24', 
            borderColor: '#243040'
          }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: '#8A97A6', letterSpacing: '0.06em' }}
            >
              Admin content
            </p>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-sm font-medium px-3 py-1.5 rounded-lg border"
              style={{ 
                color: '#0B0F14',
                backgroundColor: '#B6F23C',
                borderColor: '#B6F23C'
              }}
            >
              ← Back to home
            </button>
          </div>

          <div
            className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed text-sm"
            style={{ 
              backgroundColor: 'transparent',
              borderColor: '#3A4A5E',
              color: '#8A97A6'
            }}
          >
            Admin page content - Coming soon
          </div>
        </div>
      </div>
    </main>
  );
}
