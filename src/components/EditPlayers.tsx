// src/components/EditPlayers.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { DatabasePlayer, UserProfile } from '../types/players';


type EditPlayersProps = {
    seasonId: string;
    onClose: () => void;
};

export default function EditPlayers({ seasonId, onClose }: EditPlayersProps) {
    const [activePlayers, setActivePlayers] = useState<UserProfile[]>([]);
    const [inactivePlayers, setInactivePlayers] = useState<UserProfile[]>([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
      const fetchPlayers = async () => {
          const { data: allPlayersData, error: allPlayersError } = await supabase
              .from('profiles')
              .select('id, username');
  
          if (allPlayersError) {
              setMessage('Error fetching players');
              return;
          }
  
          const typedData = allPlayersData as DatabasePlayer[];
  
          const { data: activePlayersData, error: activePlayersError } = await supabase
              .from('season_players')
              .select('player_id, profiles!inner(username)')
              .eq('season_id', seasonId);
  
          if (activePlayersError) {
              setMessage('Error fetching active players');
              return;
          }
  
          const activePlayerIds = activePlayersData?.map(p => p.player_id) || [];
          const activePlayers = typedData.filter(p => activePlayerIds.includes(p.id));
          const inactivePlayers = typedData.filter(p => !activePlayerIds.includes(p.id));
  
          setActivePlayers(activePlayers);
          setInactivePlayers(inactivePlayers);
      };
  
      fetchPlayers();
  }, [seasonId]);

  const handlePlayerClick = (player: UserProfile, isActive: boolean) => {
    if (isActive) {
      setActivePlayers(activePlayers.filter(p => p.id !== player.id));
      setInactivePlayers([...inactivePlayers, player]);
    } else {
      setInactivePlayers(inactivePlayers.filter(p => p.id !== player.id));
      setActivePlayers([...activePlayers, player]);
    }
  };

  const handleSaveChanges = async () => {
    const { error: deleteError } = await supabase
      .from('season_players')
      .delete()
      .eq('season_id', seasonId);
    if (deleteError) {
      setMessage('Error updating players');
      return;
    }

    const { error: insertError } = await supabase
      .from('season_players')
      .insert(activePlayers.map(player => ({ season_id: seasonId, player_id: player.id })));
    if (insertError) {
      setMessage('Error updating players');
      return;
    }

    setMessage('Players updated successfully');
    onClose();
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Edit Players</h1>
      {message && <p className="mb-4 text-red-500 dark:text-red-400">{message}</p>}
      <div className="flex space-x-4">
        <div className="w-1/2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Not Taking Part</h3>
          <ul className="mt-2 space-y-2">
            {inactivePlayers.map(player => (
              <li key={player.id} className="cursor-pointer" onClick={() => handlePlayerClick(player, false)}>
                <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded shadow hover:bg-gray-300 dark:hover:bg-gray-600">
                  {player.username}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-1/2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Taking Part</h3>
          <ul className="mt-2 space-y-2">
            {activePlayers.map(player => (
              <li key={player.id} className="cursor-pointer" onClick={() => handlePlayerClick(player, true)}>
                <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded shadow hover:bg-gray-300 dark:hover:bg-gray-600">
                  {player.username}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition duration-300"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveChanges}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}