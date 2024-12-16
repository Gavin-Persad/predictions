// src/app/admin/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';

type UserProfile = {
  id: string;
  username: string;
  is_host: boolean;
};

export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, is_host');
      if (error) {
        setMessage('Error fetching users');
      } else {
        setUsers(data as UserProfile[]);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Page</h1>
      {message && <p className="mb-4 text-red-500">{message}</p>}
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2">Username</th>
            <th className="py-2">Host</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td className="py-2">{user.username}</td>
              <td className="py-2">{user.is_host ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}