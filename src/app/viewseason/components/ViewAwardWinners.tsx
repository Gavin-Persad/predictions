//src/app/viewseason/components/ViewAwardWinners.tsx

"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../../../../supabaseClient";

interface Props {
  seasonId: string;
  onClose: () => void;
}

type Award = {
  id: string;
  category: string;
  sub_type: string | null;
  group_key: string | null;
  position: number | null;
  prize: number | null;
  winner_id: string | null;
  sequence?: number | null;
  created_at?: string | null;
  winner_profile?: { username: string | null } | null;
};

export default function ViewAwardWinners({ seasonId, onClose }: Props) {
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("season_awards")
        .select(`
          id,
          category,
          sub_type,
          group_key,
          position,
          prize,
          winner_id,
          sequence,
          created_at,
          winner_profile:profiles!season_awards_winner_id_fkey ( username )
        `)
        .eq("season_id", seasonId)
        .eq("active", true)
        .order("category", { ascending: true })
        .order("group_key", { ascending: true })
        .order("sequence", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        console.error("season_awards fetch error:", error);
        setAwards([]);
        setLoading(false);
        return;
      }

      if (data) {
        const normalized: Award[] = (data as any[]).map(row => {
          let winner_profile = row.winner_profile;
          if (Array.isArray(winner_profile)) winner_profile = winner_profile[0] || null;
          return {
            id: row.id,
            category: row.category,
            sub_type: row.sub_type,
            group_key: row.group_key,
            position: row.position,
            prize: row.prize === null ? null : Number(row.prize),
            winner_id: row.winner_id,
            sequence: row.sequence,
            created_at: row.created_at,
            winner_profile
          } as Award;
        });
        setAwards(normalized);
      }
      setLoading(false);
    })();
  }, [seasonId]);

  if (loading) {
    return (
      <div>
        <button onClick={onClose} className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700">
          Back
        </button>
        <p className="text-gray-700 dark:text-gray-300">Loading...</p>
      </div>
    );
  }

  const league = awards.filter(a => a.category === "league_position");
  const cups = awards.filter(a => a.category === "cup");
  const motm = awards
    .filter(a => a.category === "motm")
    .sort((a, b) => {
      const sa = (a.sequence ?? 9999) - (b.sequence ?? 9999);
      if (sa !== 0) return sa;
      // stable fallback by created_at then id
      const ca = a.created_at || "";
      const cb = b.created_at || "";
      if (ca !== cb) return ca < cb ? -1 : 1;
      return a.id.localeCompare(b.id);
    });
  const specials = awards.filter(a => a.category === "special");

  return (
    <div className="space-y-8">
      <button onClick={onClose} className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 ">
        Back
      </button>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Award Winners</h2>

      {league.length > 0 && (
        <section>
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">League Table</h3>
          <div className="space-y-1 dark:text-gray-100">
            {league
              .sort((a, b) => (a.position || 0) - (b.position || 0))
              .map(r => (
                <div key={r.id} className="flex justify-between p-2 rounded bg-gray-100 dark:bg-gray-700 text-sm">
                  <span>
                    {r.position}
                    {r.position === 1 ? "st" : r.position === 2 ? "nd" : r.position === 3 ? "rd" : "th"}
                  </span>
                  <span>{r.winner_profile?.username || "—"}</span>
                  <span>{r.prize != null ? `£${r.prize.toFixed(2)}` : "—"}</span>
                </div>
              ))}
          </div>
        </section>
      )}

      {cups.length > 0 && (
        <section>
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Cups</h3>
          {Array.from(new Set(cups.map(c => c.group_key || ""))).map(name => {
            const rows = cups.filter(c => c.group_key === name);
            return (
              <div key={name} className="mb-4 dark:text-gray-100">
                <div className="text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">{name}</div>
                <div className="space-y-1 ml-2">
                  {rows.map(r => (
                    <div key={r.id} className="flex justify-between p-2 rounded bg-gray-100 dark:bg-gray-700 text-sm">
                      <span className="capitalize">{r.sub_type?.replace("_", " ")}</span>
                      <span>{r.winner_profile?.username || "—"}</span>
                      <span>{r.prize != null ? `£${r.prize.toFixed(2)}` : "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {motm.length > 0 && (
        <section>
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Manager of the Month</h3>
          <div className="space-y-1 dark:text-gray-100">
            {motm.map(m => (
              <div key={m.id} className="flex justify-between p-2 rounded bg-gray-100 dark:bg-gray-700 text-sm">
                <span>{m.group_key}</span>
                <span>{m.winner_profile?.username || "—"}</span>
                <span>{m.prize != null ? `£${m.prize.toFixed(2)}` : "—"}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {specials.length > 0 && (
        <section>
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Special Awards</h3>
          <div className="space-y-1 dark:text-gray-100">
            {specials.map(s => (
              <div key={s.id} className="flex justify-between p-2 rounded bg-gray-100 dark:bg-gray-700 text-sm">
                <span>{s.group_key}</span>
                <span>{s.winner_profile?.username || "—"}</span>
                <span>{s.prize != null ? `£${s.prize.toFixed(2)}` : "—"}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {awards.length === 0 && (
        <p className="text-gray-600 dark:text-gray-400 text-sm">No awards configured yet.</p>
      )}
    </div>
  );
}