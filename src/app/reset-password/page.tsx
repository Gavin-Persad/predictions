"use client";

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../supabaseClient';

export default function ResetPasswordPage() {
	const router = useRouter();
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [message, setMessage] = useState('');
	const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [hasSession, setHasSession] = useState<boolean | null>(null);

	useEffect(() => {
		const checkSession = async () => {
			const { data } = await supabase.auth.getSession();
			setHasSession(Boolean(data.session));
		};

		void checkSession();
	}, []);

	const handleReset = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (password !== confirmPassword) {
			setMessage('Passwords do not match.');
			setMessageType('error');
			return;
		}

		setIsSubmitting(true);
		const { error } = await supabase.auth.updateUser({ password });

		if (error) {
			setMessage(error.message);
			setMessageType('error');
			setIsSubmitting(false);
			return;
		}

		setMessage('Password updated successfully.');
		setMessageType('success');
		setIsSubmitting(false);

		setTimeout(() => router.push('/'), 1000);
	};

	if (hasSession === null) {
		return <main className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-700">Loading...</main>;
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-gray-100 p-6 dark:bg-gray-900">
			<div className="w-full max-w-md rounded bg-white p-8 shadow-md dark:bg-gray-800">
				<h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">Reset password</h1>
				<p className="mb-6 text-sm text-gray-600 dark:text-gray-400">Choose a new password for your account.</p>

				{!hasSession ? (
					<>
						<p className="mb-4 text-sm text-red-500">This reset link is invalid or has expired.</p>
						<button
							type="button"
							onClick={() => router.push('/')}
							className="w-full rounded bg-blue-600 py-2 text-white transition hover:bg-blue-700"
						>
							Back to login
						</button>
					</>
				) : (
					<>
						{message && (
							<p className={`mb-4 text-sm ${messageType === 'error' ? 'text-red-500' : 'text-green-600'}`} role="alert">
								{message}
							</p>
						)}
						<form onSubmit={handleReset}>
							<label className="mb-2 block text-sm text-gray-700 dark:text-gray-300" htmlFor="password">
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
								className="mb-4 w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							/>

							<label className="mb-2 block text-sm text-gray-700 dark:text-gray-300" htmlFor="confirmPassword">
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
								className="mb-6 w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							/>

							<button
								type="submit"
								disabled={isSubmitting}
								className="w-full rounded bg-blue-600 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isSubmitting ? 'Updating password...' : 'Update password'}
							</button>
						</form>
					</>
				)}
			</div>
		</main>
	);
}
