// src/app/dashboard/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';

type UserProfile = {
  id: string;
  username: string;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        setMessage('Error fetching session');
        return;
      }

      const user = session.user;
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('id', user.id)
          .single();
        if (profileError) {
          setMessage('Error fetching user profile');
        } else {
          setProfile(profile);
        }
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      {message && <p className="mb-4 text-red-500">{message}</p>}
      {profile ? (
        <div>
          <p><strong>ID:</strong> {profile.id}</p>
          <p><strong>Username:</strong> {profile.username}</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}