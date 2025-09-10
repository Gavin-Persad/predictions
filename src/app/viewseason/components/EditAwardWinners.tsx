//src/app/viewseason/components/ViewAwardWinners.tsx

"use client";
import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../../../../supabaseClient";

type Player = { id: string; username: string };

type ExistingAward = {
  id: string;
  season_id: string;
  category: string;
  sub_type: string | null;
  group_key: string | null;
  position: number | null;
  active: boolean;
  prize: number | null;
  winner_id: string | null;
};

type LeagueRow = {
  tempId: string;
  awardId?: string;
  position: number;
  prize?: number;
  winner_id?: string | null;
  active: boolean;
};

type CupRow = {
  tempId: string;
  awardId?: string;
  cupName: string;
  sub_type: "winner" | "runner_up";
  prize?: number;
  winner_id?: string | null;
  active: boolean;
};

type MotmRow = {
  tempId: string;
  awardId?: string;
  monthLabel: string; // e.g. "September 2025/26"
  prize?: number;
  winner_id?: string | null;
  active: boolean;
};

type SpecialRow = {
  tempId: string;
  awardId?: string;
  title: string;
  prize?: number;
  winner_id?: string | null;
  active: boolean;
};

interface Props {
  seasonId: string;
  onClose: () => void;
}

export default function EditAwardWinners({ seasonId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [leagueCount, setLeagueCount] = useState<number>(0);
  const [leagueRows, setLeagueRows] = useState<LeagueRow[]>([]);
  const [cupRows, setCupRows] = useState<CupRow[]>([]);
  const [motmRows, setMotmRows] = useState<MotmRow[]>([]);
  const [specialRows, setSpecialRows] = useState<SpecialRow[]>([]);
  const [removedAwardIds, setRemovedAwardIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");

  // UTIL
  const uuid = () => crypto.randomUUID();

  const fetchPlayers = useCallback(async () => {
    const { data, error } = await supabase
      .from("season_players")
      .select(`
        profiles (
          id,
          username
        )
      `)
      .eq("season_id", seasonId);

    if (error) return;
    const list: Player[] = (data || []).map((row: any) => ({
      id: row.profiles.id,
      username: row.profiles.username,
    }));
    list.sort((a, b) => a.username.localeCompare(b.username));
    setPlayers(list);
  }, [seasonId]);

  const fetchExistingAwards = useCallback(async () => {
    const { data, error } = await supabase
      .from("season_awards")
      .select("*")
      .eq("season_id", seasonId)
      .order("category")
      .order("position");

    if (error) return;

    const awards = (data || []) as ExistingAward[];

    // League
    const league = awards.filter(a => a.category === "league_position");
    if (league.length) {
      const maxPos = Math.max(...league.map(l => l.position || 0));
      setLeagueCount(maxPos);
      setLeagueRows(
        league
          .sort((a, b) => (a.position || 0) - (b.position || 0))
          .map(a => ({
            tempId: uuid(),
            awardId: a.id,
            position: a.position || 0,
            prize: a.prize || undefined,
            winner_id: a.winner_id,
            active: a.active,
          }))
      );
    }

    // Cups
    const cups = awards.filter(a => a.category === "cup");
    const groupedCups = cups.reduce<Record<string, ExistingAward[]>>((acc, c) => {
      const key = c.group_key || "";
      acc[key] = acc[key] || [];
      acc[key].push(c);
      return acc;
    }, {});
    const cupRowsMapped: CupRow[] = [];
    Object.entries(groupedCups).forEach(([cupName, rows]) => {
      rows.forEach(r => {
        cupRowsMapped.push({
          tempId: uuid(),
            awardId: r.id,
            cupName,
            sub_type: (r.sub_type as "winner" | "runner_up") || "winner",
            prize: r.prize || undefined,
            winner_id: r.winner_id,
            active: r.active
        });
      });
    });
    setCupRows(cupRowsMapped);

    // MOTM
    const motm = awards.filter(a => a.category === "motm");
    setMotmRows(
      motm.map(m => ({
        tempId: uuid(),
        awardId: m.id,
        monthLabel: m.group_key || "",
        prize: m.prize || undefined,
        winner_id: m.winner_id,
        active: m.active
      }))
    );

    // Special
    const specials = awards.filter(a => a.category === "special");
    setSpecialRows(
      specials.map(s => ({
        tempId: uuid(),
        awardId: s.id,
        title: s.group_key || "",
        prize: s.prize || undefined,
        winner_id: s.winner_id,
        active: s.active
      }))
    );
  }, [seasonId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchPlayers(), fetchExistingAwards()]);
      setLoading(false);
    })();
  }, [fetchPlayers, fetchExistingAwards]);

  // League dynamic adjust
useEffect(() => {
  setLeagueRows(prev => {
    const mapByPos = new Map(prev.map(r => [r.position, r]));
    const newRows: LeagueRow[] = [];
    for (let p = 1; p <= leagueCount; p++) {
      if (mapByPos.has(p)) {
        newRows.push(mapByPos.get(p)!);
      } else {
        newRows.push({ tempId: uuid(), position: p, active: true });
      }
    }
    // Collect removed higher positions for deletion
    const removed = prev.filter(r => r.position > leagueCount && r.awardId).map(r => r.awardId!) ;
    if (removed.length) {
      setRemovedAwardIds(ids => [...ids, ...removed]);
    }
    return newRows.sort((a,b)=>a.position-b.position);
  });
}, [leagueCount]);

  // Actions
  const addCup = (name: string, includeRunnerUp: boolean) => {
    const base: CupRow[] = [{
      tempId: uuid(),
      cupName: name,
      sub_type: "winner",
      active: true
    }];
    if (includeRunnerUp) {
      base.push({
        tempId: uuid(),
        cupName: name,
        sub_type: "runner_up",
        active: true
      });
    }
    setCupRows(prev => [...prev, ...base]);
  };

  const removeCupGroup = (cupName: string) => {
    setCupRows(prev => {
      const toRemove = prev.filter(c => c.cupName === cupName && c.awardId).map(c => c.awardId!) ;
      if (toRemove.length) setRemovedAwardIds(r => [...r, ...toRemove]);
      return prev.filter(c => c.cupName !== cupName);
    });
  };

  const addMotmMonths = (count: number, startingLabel?: string) => {
    const rows: MotmRow[] = [];
    for (let i = 0; i < count; i++) {
      rows.push({
        tempId: uuid(),
        monthLabel: startingLabel ? `${startingLabel} ${i+1}` : "",
        active: true
      });
    }
    setMotmRows(prev => [...prev, ...rows]);
  };

  const removeMotm = (tempId: string) => {
    setMotmRows(prev => {
      const target = prev.find(r => r.tempId === tempId);
      if (target?.awardId) setRemovedAwardIds(r => [...r, target.awardId!]);
      return prev.filter(r => r.tempId !== tempId);
    });
  };

  const addSpecial = () => {
    setSpecialRows(prev => [...prev, {
      tempId: uuid(),
      title: "",
      active: true
    }]);
  };

  const removeSpecial = (tempId: string) => {
    setSpecialRows(prev => {
      const target = prev.find(r => r.tempId === tempId);
      if (target?.awardId) setRemovedAwardIds(r => [...r, target.awardId!]);
      return prev.filter(r => r.tempId !== tempId);
    });
  };

    const toggleRowActive = <T extends { active: boolean; tempId: string }>(
    setList: React.Dispatch<React.SetStateAction<T[]>>,
    tempId: string
    ) => {
    setList(prev =>
        prev.map(r =>
        r.tempId === tempId ? { ...r, active: !r.active } : r
        )
    );
    };


  const saveAll = async () => {
    setSaving(true);
    setMessage("");
    try {
      const payload: any[] = [];

      leagueRows.forEach(r => {
        if (!r.position) return;
        payload.push({
          id: r.awardId,
          season_id: seasonId,
          category: "league_position",
          sub_type: null,
          group_key: "league",
          position: r.position,
          active: r.active,
          prize: r.prize ?? null,
          winner_id: r.winner_id || null
        });
      });

      cupRows.forEach(r => {
        payload.push({
          id: r.awardId,
          season_id: seasonId,
          category: "cup",
          sub_type: r.sub_type,
          group_key: r.cupName.trim(),
          position: null,
          active: r.active,
          prize: r.prize ?? null,
          winner_id: r.winner_id || null
        });
      });

      motmRows.forEach(r => {
        if (!r.monthLabel.trim()) return;
        payload.push({
          id: r.awardId,
          season_id: seasonId,
          category: "motm",
          sub_type: null,
          group_key: r.monthLabel.trim(),
          position: null,
          active: r.active,
          prize: r.prize ?? null,
          winner_id: r.winner_id || null
        });
      });

      specialRows.forEach(r => {
        if (!r.title.trim()) return;
        payload.push({
          id: r.awardId,
          season_id: seasonId,
          category: "special",
          sub_type: null,
          group_key: r.title.trim(),
          position: null,
          active: r.active,
          prize: r.prize ?? null,
          winner_id: r.winner_id || null
        });
      });

      console.log("Season awards payload:", payload);

      if (payload.length === 0) {
        setMessage("Nothing to save (add rows or set league places).");
        setSaving(false);
        return;
      }

      const toInsert = payload.filter(p => !p.id);
      const toUpdate = payload.filter(p => p.id);

      // Ensure IDs for new rows (avoid null constraint error)
      const toInsertWithIds = toInsert.map(r => ({
        ...r,
        id: crypto.randomUUID()
      }));

      if (toInsertWithIds.length) {
        const { error: insErr } = await supabase
          .from("season_awards")
          .insert(toInsertWithIds);
        if (insErr) {
          console.error("Insert error:", insErr);
          throw new Error(insErr.message);
        }
      }

      if (toUpdate.length) {
        // Batch update individually (keep it simple)
        for (const row of toUpdate) {
          const { id, ...rest } = row;
            const { error: updErr } = await supabase
              .from("season_awards")
              .update(rest)
              .eq("id", id);
            if (updErr) {
              console.error("Update error on", id, updErr);
              throw new Error(updErr.message);
            }
        }
      }

      if (removedAwardIds.length) {
        const { error: delErr } = await supabase
          .from("season_awards")
          .delete()
          .in("id", removedAwardIds);
        if (delErr) {
          console.error("Delete error:", delErr);
          throw new Error(delErr.message);
        }
      }

      setMessage(`Saved (${toInsert.length} new / ${toUpdate.length} updated / ${removedAwardIds.length} removed)`);
      await fetchExistingAwards();
      setRemovedAwardIds([]);
    } catch (e: any) {
      setMessage(`Error saving: ${e.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };


  const playerSelect = (
    value: string | null | undefined,
    setter: (val: string | undefined) => void
  ) => (
    <select
      value={value ?? ""}          
      onChange={e => setter(e.target.value || undefined)}
      className="p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
    >
      <option value="">-- Winner --</option>
      {players.map(p => (
        <option key={p.id} value={p.id}>{p.username}</option>
      ))}
    </select>
  );

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Edit Award Winners
        </h2>
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-800 text-white rounded">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Edit Award Winners
        </h2>
        <div className="flex gap-2">
          <button
            onClick={saveAll}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            Back
          </button>
        </div>
      </div>
      {message && <div className="text-sm text-blue-600 dark:text-blue-400">{message}</div>}

      {/* League Table */}
      <section className="bg-white dark:bg-gray-800 p-4 rounded shadow space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">League Table Prizes</h3>
          <input
            type="number"
            min={0}
            value={leagueCount}
            onChange={e => setLeagueCount(Math.max(0, parseInt(e.target.value || "0", 10)))}
            className="w-24 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            placeholder="# places"
          />
        </div>
        <div className="space-y-2">
          {leagueRows.map(row => {
            const disabled = !row.active;
            return (
              <div
                key={row.tempId}
                className={`flex items-center gap-3 p-2 rounded border dark:text-gray-100 border-gray-600 ${
                  disabled ? "opacity-50" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={row.active}
                  onChange={() =>
                    setLeagueRows(prev =>
                      prev.map(r => r.tempId === row.tempId ? { ...r, active: !r.active } : r
                      )
                    )
                  }
                />
                <div className="w-16 font-semibold">{row.position}{row.position === 1 ? "st" : row.position === 2 ? "nd" : row.position === 3 ? "rd" : "th"}</div>
                <input
                  type="number"
                  disabled={disabled}
                  value={row.prize ?? ""}
                  onChange={e =>
                    setLeagueRows(prev =>
                      prev.map(r => r.tempId === row.tempId ? { ...r, prize: e.target.value ? Number(e.target.value) : undefined } : r
                      )
                    )
                  }
                  placeholder="Prize"
                  className="w-24 p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
                {playerSelect(row.winner_id, val =>
                  setLeagueRows(prev =>
                    prev.map(r => r.tempId === row.tempId ? { ...r, winner_id: val } : r
                    )
                  )
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Cups */}
      <section className="bg-white dark:bg-gray-800 p-4 rounded shadow space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cup Competitions</h3>
          <AddCupButton onAdd={addCup} />
        </div>
        {/* Group by cupName */}
        {Array.from(new Set(cupRows.map(c => c.cupName))).length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No cups added.</p>
        )}
        <div className="space-y-4">
          {Array.from(new Set(cupRows.map(c => c.cupName))).map(cupName => {
            const rows = cupRows.filter(r => r.cupName === cupName);
            return (
              <div key={cupName} className="border rounded p-3 dark:border-gray-600">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold text-gray-800 dark:text-gray-200">{cupName}</div>
                  <button
                    onClick={() => removeCupGroup(cupName)}
                    className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Remove Cup
                  </button>
                </div>
                <div className="space-y-2">
                  {rows.map(row => {
                    const disabled = !row.active;
                    return (
                      <div
                        key={row.tempId}
                        className={`flex items-center gap-3 p-2 rounded border dark:text-gray-100border-gray-600 ${
                          disabled ? "opacity-50" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={row.active}
                          onChange={() =>
                            setCupRows(prev =>
                              prev.map(r => r.tempId === row.tempId ? { ...r, active: !r.active } : r)
                            )
                          }
                        />
                        <div className="w-24 text-sm capitalize dark:text-gray-100">{row.sub_type.replace("_"," ")}</div>
                        <input
                          type="number"
                          disabled={disabled}
                          value={row.prize ?? ""}
                          onChange={e =>
                            setCupRows(prev =>
                              prev.map(r => r.tempId === row.tempId ? { ...r, prize: e.target.value ? Number(e.target.value) : undefined } : r
                              )
                            )
                          }
                          placeholder="Prize"
                          className="w-24 p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                        {playerSelect(row.winner_id, val =>
                          setCupRows(prev =>
                            prev.map(r => r.tempId === row.tempId ? { ...r, winner_id: val } : r
                            )
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Manager of the Month */}
      <section className="bg-white dark:bg-gray-800 p-4 rounded shadow space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Manager of the Month</h3>
          <AddMotmButton onAdd={addMotmMonths} />
        </div>
        {motmRows.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No months added.</p>
        )}
        <div className="space-y-2">
          {motmRows.map(row => {
            const disabled = !row.active;
            return (
              <div
                key={row.tempId}
                className={`flex items-center gap-3 p-2 rounded border dark:border-gray-600 ${
                  disabled ? "opacity-50" : ""
                }`}
              >
                <input
                type="checkbox"
                checked={row.active}
                onChange={() => toggleRowActive(setMotmRows, row.tempId)}
                />
                <input
                  type="text"
                  disabled={disabled}
                  value={row.monthLabel}
                  onChange={e =>
                    setMotmRows(prev =>
                      prev.map(r => r.tempId === row.tempId ? { ...r, monthLabel: e.target.value } : r
                      )
                    )
                  }
                  placeholder="Month Label"
                  className="flex-grow p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
                <input
                  type="number"
                  disabled={disabled}
                  value={row.prize ?? ""}
                  onChange={e =>
                    setMotmRows(prev =>
                      prev.map(r => r.tempId === row.tempId ? { ...r, prize: e.target.value ? Number(e.target.value) : undefined } : r
                      )
                    )
                  }
                  placeholder="Prize"
                  className="w-24 p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
                {playerSelect(row.winner_id, val =>
                  setMotmRows(prev =>
                    prev.map(r => r.tempId === row.tempId ? { ...r, winner_id: val } : r
                    )
                  )
                )}
                <button
                  onClick={() => removeMotm(row.tempId)}
                  className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  X
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Special Awards */}
      <section className="bg-white dark:bg-gray-800 p-4 rounded shadow space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Special Awards</h3>
          <button
            onClick={addSpecial}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Add Special
          </button>
        </div>
        {specialRows.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No special awards added.</p>
        )}
        <div className="space-y-2">
          {specialRows.map(row => {
            const disabled = !row.active;
            return (
              <div
                key={row.tempId}
                className={`flex items-center gap-3 p-2 rounded border dark:border-gray-600 ${
                  disabled ? "opacity-50" : ""
                }`}
              >
                <input
                type="checkbox"
                checked={row.active}
                onChange={() => toggleRowActive(setSpecialRows, row.tempId)}
                />
                <input
                  type="text"
                  disabled={disabled}
                  value={row.title}
                  onChange={e =>
                    setSpecialRows(prev =>
                      prev.map(r => r.tempId === row.tempId ? { ...r, title: e.target.value } : r
                      )
                    )
                  }
                  placeholder="Title"
                  className="flex-grow p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
                <input
                  type="number"
                  disabled={disabled}
                  value={row.prize ?? ""}
                  onChange={e =>
                    setSpecialRows(prev =>
                      prev.map(r => r.tempId === row.tempId ? { ...r, prize: e.target.value ? Number(e.target.value) : undefined } : r
                      )
                    )
                  }
                  placeholder="Prize"
                  className="w-24 p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
                {playerSelect(row.winner_id, val =>
                  setSpecialRows(prev =>
                    prev.map(r => r.tempId === row.tempId ? { ...r, winner_id: val } : r
                    )
                  )
                )}
                <button
                  onClick={() => removeSpecial(row.tempId)}
                  className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  X
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* Inline small helper components */

function AddCupButton({ onAdd }: { onAdd: (name: string, includeRunnerUp: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [cupName, setCupName] = useState("");
  const [runnerUp, setRunnerUp] = useState(true);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
      >
        Add Cup
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        className="p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        placeholder="Cup Name"
        value={cupName}
        onChange={e => setCupName(e.target.value)}
      />
      <label className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={runnerUp}
          onChange={() => setRunnerUp(r => !r)}
        />
        Runner Up
      </label>
      <button
        disabled={!cupName.trim()}
        onClick={() => {
          if (!cupName.trim()) return;
          onAdd(cupName.trim(), runnerUp);
          setCupName("");
          setRunnerUp(true);
          setOpen(false);
        }}
        className="px-2 py-1 bg-green-600 text-white rounded text-xs disabled:opacity-50"
      >
        Add
      </button>
      <button
        onClick={() => {
          setOpen(false);
          setCupName("");
        }}
        className="px-2 py-1 bg-gray-600 text-white rounded text-xs"
      >
        Cancel
      </button>
    </div>
  );
}

function AddMotmButton({ onAdd }: { onAdd: (count: number, startingLabel?: string) => void }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState<number>(1);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
      >
        Add Months
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={1}
        value={count}
        onChange={e => setCount(Math.max(1, parseInt(e.target.value || "1", 10)))}
        className="w-20 p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />
      <button
        onClick={() => {
          onAdd(count);
          setOpen(false);
          setCount(1);
        }}
        className="px-2 py-1 bg-green-600 text-white rounded text-xs"
      >
        Add
      </button>
      <button
        onClick={() => setOpen(false)}
        className="px-2 py-1 bg-gray-600 text-white rounded text-xs"
      >
        Cancel
      </button>
    </div>
  );
}