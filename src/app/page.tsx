// src/app/page.tsx

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient';
import DarkModeToggle from '../components/DarkModeToggle';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      setMessageType('error');
    } else {
      const user = data.user;
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_host')
          .eq('id', user.id)
          .single();
        if (profileError) {
          setMessage('Error fetching user profile');
          setMessageType('error');
        } else {
          setMessage(`Logged in successfully! Hello, ${profile.is_host ? 'Skipper!!!' : 'Football Fan!!!'}`);
          setMessageType('success');
          setTimeout(() => {
            router.push('/dashboard');
          }, 2500);
        }
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage('Not signed up correctly');
      setMessageType('error');
    } else {
      const user = data.user;
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: user.id, is_host: false }]);
        if (profileError) {
          setMessage('Error setting user profile');
          setMessageType('error');
        } else {
          setMessage('Please check your email for a confirmation email.');
          setMessageType('success');
        }
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>
      <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">{isLogin ? 'Login' : 'Sign Up'}</h1>
        <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-200"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </div>
        {message && (
          <p
            className={`mt-4 text-center px-4 py-2 rounded ${
              messageType === 'success'
                ? 'bg-green-100 text-green-800 border border-green-400 animate-bounce'
                : 'bg-red-100 text-red-800 border border-red-400'
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}