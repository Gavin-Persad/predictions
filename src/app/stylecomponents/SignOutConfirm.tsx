"use client";

import { supabase } from '../../../supabaseClient';
import { colors } from './colors';

type SignOutConfirmProps = {
  onCancel: () => void;
};

export default function SignOutConfirm({ onCancel }: SignOutConfirmProps) {
  const handleConfirm = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div
        className="w-full max-w-sm rounded-[16px] border p-5 shadow-2xl"
        style={{
          backgroundColor: colors.panel,
          borderColor: colors.border,
        }}
      >
        <h3 className="mb-3 text-lg font-semibold text-[var(--color-text)]">Sign out?</h3>
        <p className="mb-5 text-sm text-[var(--color-muted)]">
          Are you sure you want to sign out of your account?
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border px-3 py-2 text-sm font-medium text-[var(--color-text)]"
            style={{ borderColor: colors.borderStrong }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-lg px-3 py-2 text-sm font-medium text-[#0B0F14]"
            style={{ backgroundColor: colors.lime }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
