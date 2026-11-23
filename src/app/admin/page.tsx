//app/admin/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { useRouter } from 'next/navigation';
import ForScoresTile from './components/ForScoresTile';
import ReadyForScores from './components/ReadyForScores';

type UserProfile = {
  id: string;
  username: string;
  is_host: boolean;
};

export default function AdminPage() {
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [currentSeasonId, setCurrentSeasonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReadyForScores, setShowReadyForScores] = useState(false);
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

      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!seasonError && seasonData) {
        setCurrentSeasonId(seasonData.id);
      }

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

  if (showReadyForScores && currentSeasonId) {
    return (
      <ReadyForScores
        seasonId={currentSeasonId}
        onClose={() => setShowReadyForScores(false)}
      />
    );
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: '#0B0F14' }}
    >
      <div className="relative z-10 mx-auto max-w-[1280px] px-4 py-5 md:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-6 flex items-center justify-between">
          <div>
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
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-sm font-medium px-3 py-1.5 rounded-lg border"
            style={{ 
              color: '#B6F23C',
              borderColor: '#3A4A5E',
              backgroundColor: 'transparent'
            }}
          >
            Switch to player view
          </button>
        </div>

        {/* Ready for Scores Tile */}
        {currentSeasonId && (
          <ForScoresTile
            seasonId={currentSeasonId}
            onEnterScoresClick={() => setShowReadyForScores(true)}
          />
        )}
      </div>
    </main>
  );
}
