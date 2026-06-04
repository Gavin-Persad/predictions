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
  winner_profile?: { username: string | null } | null;
  sequence?: number | null;
};

export default function ViewAwardWinners({ seasonId, onClose }: Props) {
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [winnersMap, setWinnersMap] = useState<Record<string, string[]>>({});

  useEffect(() => {
    (async () => {
      // Try to alias the winner relation (adjust the foreign key name if needed)
      let data: any = null;
      let error: any = null;
      try {
        const res = await supabase
          .from("season_awards")
          .select(`
            id,
            category,
            sub_type,
            group_key,
            position,
            prize,
            sequence,
            winner_profile:profiles ( username )
          `)
          .eq("season_id", seasonId)
          .eq("active", true)
          .order("category")
          .order("position")
          .order("sequence");
        data = res.data;
        error = res.error;
        // If PostgREST complains the relationship doesn't exist, fall back to a plain select
        if (error && (error.code === 'PGRST200' || (error.message && error.message.includes('Could not find a relationship')))) {
          const res2 = await supabase
            .from("season_awards")
            .select(`id, category, sub_type, group_key, position, prize, sequence`)
            .eq("season_id", seasonId)
            .eq("active", true)
            .order("category").order("position").order("sequence");
          data = res2.data; error = res2.error;
        }
      } catch (e) {
        error = e;
      }

      // If the query errored or returned no rows, retry without the active filter
      if ((error && !data) || (Array.isArray(data) && data.length === 0)) {
        try {
            const res2 = await supabase
              .from("season_awards")
              .select(`id, category, sub_type, group_key, position, prize, sequence`)
              .eq("season_id", seasonId)
              .order("category")
              .order("position")
              .order("sequence");
            data = res2.data;
            error = res2.error;
            if (error) console.warn('Retry fetch season_awards without active filter failed', error);
        } catch (e) {
          console.warn('Retry fetch season_awards failed', e);
        }
      }

      if (!error && data) {
        // Ensure winner_profile is a single object (sometimes Supabase can yield an array if relation not resolved)
        const normalized: Award[] = (data as any[]).map(row => {
          let winner_profile = row.winner_profile;
            if (Array.isArray(winner_profile)) {
              winner_profile = winner_profile[0] || null;
            }
          return {
            id: row.id,
            category: row.category,
            sub_type: row.sub_type,
            group_key: row.group_key,
            position: row.position,
            prize: row.prize,
            winner_profile,
            sequence: row.sequence
          } as Award;
        });
        setAwards(normalized);
      } else if (error) {
        console.warn('Error fetching season_awards:', error);
      }
      setLoading(false);
    })();
  }, [seasonId]);

  useEffect(() => {
    if (awards.length === 0) return;
    
    (async () => {
      const { data: notesData } = await supabase
        .from("special_award_notes")
        .select("award_id, note")
        .in("award_id", awards.map(a => a.id));

      if (notesData) {
        const newNotesMap: Record<string, string> = {};
        notesData.forEach((note: any) => {
          newNotesMap[note.award_id] = note.note;
        });
        setNotesMap(newNotesMap);
      }

      // Fetch winners for awards (many-to-many) with graceful fallback
      try {
        const { data: winnersData, error: wErr } = await supabase
          .from('season_award_winners')
          .select('award_id, winner_id, profiles ( username )')
          .in('award_id', awards.map(a => a.id));

        if (!wErr && winnersData) {
          const wMap: Record<string, string[]> = {};
          winnersData.forEach((w: any) => {
            const uname = w.profiles?.username || null;
            wMap[w.award_id] = wMap[w.award_id] || [];
            if (uname) wMap[w.award_id].push(uname);
          });
          setWinnersMap(wMap);
        }
        // If no many-to-many winners found, leave winnersMap empty and rely on winner_profile when present
      } catch (err: any) {
        if (err && err.code === '42P01') {
          console.warn('season_award_winners missing; falling back to legacy winner_id');
        } else {
          console.warn('Error fetching season_award_winners', err);
        }
      }
    })();
  }, [awards]);

  if (loading) {
    return (
      <div>
        <button
          onClick={onClose}
          className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
        >
          Back
        </button>
        <p className="text-gray-700 dark:text-gray-300">Loading...</p>
      </div>
    );
  }

  const league = awards.filter(a => a.category === "league_position");
  const cups = awards.filter(a => a.category === "cup");
  const motm = awards.filter(a => a.category === "motm").sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  const specials = awards.filter(a => a.category === "special");

  return (
    <div className="space-y-8">
      <button
        onClick={onClose}
        className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 "
      >
        Back
      </button>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Award Winners
      </h2>

      {league.length > 0 && (
        <section>
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
            League Table
          </h3>
          <div className="space-y-1 dark:text-gray-100">
            {league
              .sort((a, b) => (a.position || 0) - (b.position || 0))
              .map(r => (
                <div
                  key={r.id}
                  className="flex justify-between p-2 rounded bg-gray-100 dark:bg-gray-700 text-sm"
                >
                  <span>
                    {r.position}
                    {r.position === 1
                      ? "st"
                      : r.position === 2
                      ? "nd"
                      : r.position === 3
                      ? "rd"
                      : "th"}
                  </span>
                  <span>{(winnersMap[r.id] && winnersMap[r.id].length) ? winnersMap[r.id][0] : (r.winner_profile?.username || "—")}</span>
                  <span>
                    {r.prize != null ? `£${r.prize.toFixed(2)}` : "—"}
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}

      {cups.length > 0 && (
        <section>
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Cups
          </h3>
          {Array.from(new Set(cups.map(c => c.group_key || ""))).map(name => {
            const rows = cups.filter(c => c.group_key === name);
            return (
              <div key={name} className="mb-4 dark:text-gray-100">
                <div className="text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
                  {name}
                </div>
                <div className="space-y-1 ml-2">
                  {rows.map(r => (
                    <div
                      key={r.id}
                      className="flex justify-between p-2 rounded bg-gray-100 dark:bg-gray-700 text-sm"
                    >
                      <span className="capitalize">
                        {r.sub_type?.replace("_", " ")}
                      </span>
                      <span>{(winnersMap[r.id] && winnersMap[r.id].length) ? winnersMap[r.id][0] : (r.winner_profile?.username || "—")}</span>
                      <span>
                        {r.prize != null ? `£${r.prize.toFixed(2)}` : "—"}
                      </span>
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
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Manager of the Month
          </h3>
          <div className="space-y-1 dark:text-gray-100">
            {motm.map(m => (
              <div
                key={m.id}
                className="flex justify-between p-2 rounded bg-gray-100 dark:bg-gray-700 text-sm"
              >
                <span>{m.group_key}</span>
                <span>{(winnersMap[m.id] && winnersMap[m.id].length) ? winnersMap[m.id][0] : (m.winner_profile?.username || "—")}</span>
                <span>
                  {m.prize != null ? `£${m.prize.toFixed(2)}` : "—"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {specials.length > 0 && (
        <section>
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Special Awards
          </h3>
          <div className="space-y-2 dark:text-gray-100">
            {specials.map(s => (
                <div key={s.id}>
                    <div className="flex justify-between p-2 rounded bg-gray-100 dark:bg-gray-700 text-sm">
                      <span>{s.group_key}</span>
                      <span>{(winnersMap[s.id] && winnersMap[s.id].length) ? winnersMap[s.id].join(', ') : (s.winner_profile?.username || "—")}</span>
                      <span>{s.prize != null ? `£${s.prize.toFixed(2)}` : "—"}</span>
                    </div>
                    {notesMap[s.id] && (
                        <div className="px-2 py-1 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 rounded-b">
                            {notesMap[s.id]}
                        </div>
                    )}
                </div>
            ))}
          </div>
        </section>
      )}

      {awards.length === 0 && (
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          No awards configured yet.
        </p>
      )}
    </div>
  );
}