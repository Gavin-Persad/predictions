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
  sequence?: number | null;
};

type LeagueRow = { tempId: string; awardId?: string; position: number; prize?: number; winner_id?: string | null; active: boolean };
type CupRow = { tempId: string; awardId?: string; cupName: string; sub_type: "winner" | "runner_up"; prize?: number; winner_id?: string | null; active: boolean };
type MotmRow = { tempId: string; awardId?: string; monthLabel: string; prize?: number; winner_id?: string | null; active: boolean };
type SpecialRow = { tempId: string; awardId?: string; title: string; prize?: number; winners?: string[]; active: boolean; note?: string };

interface Props { seasonId: string; onClose: () => void }

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
  

  const uuid = () => crypto.randomUUID();

  const fetchPlayers = useCallback(async () => {
    const { data, error } = await supabase
      .from("season_players")
      .select(`profiles ( id, username )`)
      .eq("season_id", seasonId);
    if (error) return;
    const list: Player[] = (data || []).map((row: any) => ({ id: row.profiles.id, username: row.profiles.username }));
    list.sort((a, b) => a.username.localeCompare(b.username));
    setPlayers(list);
  }, [seasonId]);

  const fetchExistingAwards = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("season_awards")
        .select("*")
        .eq("season_id", seasonId)
        .order("category")
        .order("position");
      if (error) return;
      const awards = (data || []) as ExistingAward[];

      // build maps for notes and winners (many-to-many)
      const awardIds = awards.map(a => a.id);
      const notesMap: Record<string, string> = {};
      const winnersMap: Record<string, string[]> = {};

      if (awardIds.length) {
        const { data: notesData } = await supabase
          .from("special_award_notes")
          .select("award_id, note")
          .in("award_id", awardIds);
        if (notesData) notesData.forEach((n: any) => (notesMap[n.award_id] = n.note));

        try {
          const { data: winnersData, error: wErr } = await supabase
            .from("season_award_winners")
            .select("award_id, winner_id")
            .in("award_id", awardIds);
          if (!wErr && winnersData) winnersData.forEach((w: any) => { winnersMap[w.award_id] = winnersMap[w.award_id] || []; if (w.winner_id) winnersMap[w.award_id].push(w.winner_id); });
        } catch (e: any) {
          if (e && e.code !== '42P01') console.warn('Error fetching season_award_winners', e);
        }
      }

      // League
      const league = awards.filter(a => a.category === "league_position");
      if (league.length) {
        const maxPos = Math.max(...league.map(l => l.position || 0));
        setLeagueCount(maxPos);
        setLeagueRows(league.sort((a,b)=> (a.position||0)-(b.position||0)).map(a => ({ tempId: uuid(), awardId: a.id, position: a.position || 0, prize: a.prize || undefined, winner_id: (winnersMap[a.id] && winnersMap[a.id].length) ? winnersMap[a.id][0] : a.winner_id, active: a.active })));
      }

      // Cups
      const cups = awards.filter(a => a.category === "cup");
      const groupedCups = cups.reduce<Record<string, ExistingAward[]>>((acc, c) => { const key = c.group_key || ""; acc[key] = acc[key] || []; acc[key].push(c); return acc; }, {});
      const cupRowsMapped: CupRow[] = [];
      Object.entries(groupedCups).forEach(([cupName, rows]) => rows.forEach(r => cupRowsMapped.push({ tempId: uuid(), awardId: r.id, cupName, sub_type: (r.sub_type as "winner" | "runner_up") || "winner", prize: r.prize || undefined, winner_id: (winnersMap[r.id] && winnersMap[r.id].length) ? winnersMap[r.id][0] : r.winner_id, active: r.active })));
      setCupRows(cupRowsMapped);

      // MOTM - preserve sequence order
      const motm = awards.filter(a => a.category === "motm").sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
      setMotmRows(motm.map(m => ({ tempId: uuid(), awardId: m.id, monthLabel: m.group_key || "", prize: m.prize || undefined, winner_id: (winnersMap[m.id] && winnersMap[m.id].length) ? winnersMap[m.id][0] : m.winner_id, active: m.active })));

      // Special
      const specials = awards.filter(a => a.category === "special");
      setSpecialRows(specials.map(s => ({ tempId: uuid(), awardId: s.id, title: s.group_key || "", prize: s.prize || undefined, winners: winnersMap[s.id] || (s.winner_id ? [s.winner_id] : []), active: s.active, note: notesMap[s.id] || "" })));

      // Ensure players list contains any referenced winners
        try {
          const allWinnerIds = new Set<string>();
          Object.values(winnersMap).forEach(arr => arr.forEach(id => id && allWinnerIds.add(id)));
          if (allWinnerIds.size) {
            const { data: extraProfiles, error: profErr } = await supabase.from('profiles').select('id, username').in('id', Array.from(allWinnerIds));
            if (!profErr && extraProfiles && extraProfiles.length) {
              setPlayers(prev => { const map = new Map(prev.map(p => [p.id, p])); extraProfiles.forEach((p:any)=> map.set(p.id, { id: p.id, username: p.username })); const list = Array.from(map.values()); list.sort((a,b)=>a.username.localeCompare(b.username)); return list; });
            }
          }
        } catch (e) {
          console.warn('Could not fetch extra winner profiles', e);
        }

    } finally {
      setLoading(false);
    }
  }, [seasonId]);

  useEffect(() => { (async () => { setLoading(true); await Promise.all([fetchPlayers(), fetchExistingAwards()]); setLoading(false); })(); }, [fetchPlayers, fetchExistingAwards]);

  useEffect(() => {
    setLeagueRows(prev => {
      const mapByPos = new Map(prev.map(r => [r.position, r]));
      const newRows: LeagueRow[] = [];
      for (let p = 1; p <= leagueCount; p++) {
        if (mapByPos.has(p)) newRows.push(mapByPos.get(p)!); else newRows.push({ tempId: uuid(), position: p, active: true });
      }
      const removed = prev.filter(r => r.position > leagueCount && r.awardId).map(r => r.awardId!);
      if (removed.length) setRemovedAwardIds(ids => [...ids, ...removed]);
      return newRows.sort((a,b)=>a.position-b.position);
    });
  }, [leagueCount]);

  // Ensure players list contains any winner ids currently set in the UI (covers post-save state)
  useEffect(() => {
    (async () => {
      try {
        const winnerIds = new Set<string>();
        specialRows.forEach(r => (r.winners || []).forEach(id => id && winnerIds.add(id)));
        leagueRows.forEach(r => r.winner_id && winnerIds.add(r.winner_id));
        cupRows.forEach(r => r.winner_id && winnerIds.add(r.winner_id));
        motmRows.forEach(r => r.winner_id && winnerIds.add(r.winner_id));

        const missing = Array.from(winnerIds).filter(id => !players.find(p => p.id === id));
        if (missing.length) {
          const { data: extraProfiles, error: profErr } = await supabase.from('profiles').select('id, username').in('id', missing);
          if (!profErr && extraProfiles && extraProfiles.length) {
            setPlayers(prev => {
              const map = new Map(prev.map(p => [p.id, p]));
              extraProfiles.forEach((p:any) => map.set(p.id, { id: p.id, username: p.username }));
              const list = Array.from(map.values());
              list.sort((a,b)=>a.username.localeCompare(b.username));
              return list;
            });
          }
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [specialRows, leagueRows, cupRows, motmRows, players]);

  // Actions
  const addCup = (name: string, includeRunnerUp: boolean) => { const base: CupRow[] = [{ tempId: uuid(), cupName: name, sub_type: 'winner', active: true }]; if (includeRunnerUp) base.push({ tempId: uuid(), cupName: name, sub_type: 'runner_up', active: true }); setCupRows(prev => [...prev, ...base]); };
  const removeCupGroup = (cupName: string) => setCupRows(prev => { const toRemove = prev.filter(c => c.cupName === cupName && c.awardId).map(c => c.awardId!); if (toRemove.length) setRemovedAwardIds(r => [...r, ...toRemove]); return prev.filter(c => c.cupName !== cupName); });
  const addMotmMonths = (count: number, startingLabel?: string) => { const rows: MotmRow[] = []; for (let i=0;i<count;i++) rows.push({ tempId: uuid(), monthLabel: startingLabel? `${startingLabel} ${i+1}` : "", active: true }); setMotmRows(prev => [...prev, ...rows]); };
  const removeMotm = (tempId: string) => setMotmRows(prev => { const target = prev.find(r => r.tempId===tempId); if (target?.awardId) setRemovedAwardIds(r=>[...r, target.awardId!]); return prev.filter(r=>r.tempId !== tempId); });
  const addSpecial = () => setSpecialRows(prev => [...prev, { tempId: uuid(), title: "", note: "", active: true }]);
  const removeSpecial = (tempId: string) => setSpecialRows(prev => { const target = prev.find(r=>r.tempId===tempId); if (target?.awardId) setRemovedAwardIds(r=>[...r, target.awardId!]); return prev.filter(r=>r.tempId !== tempId); });
  const toggleRowActive = <T extends { active: boolean; tempId: string }>(setList: React.Dispatch<React.SetStateAction<T[]>>, tempId: string) => { setList(prev => prev.map(r => r.tempId === tempId ? { ...r, active: !r.active } : r)); };

  const saveAll = async () => {
    setSaving(true); setMessage("");
    try {
      const payload: any[] = [];
      leagueRows.forEach(r => { if (!r.position) return; payload.push({ id: r.awardId, season_id: seasonId, category: 'league_position', sub_type: null, group_key: 'league', position: r.position, active: r.active, prize: r.prize ?? null }); });
      cupRows.forEach(r => payload.push({ id: r.awardId, season_id: seasonId, category: 'cup', sub_type: r.sub_type, group_key: r.cupName.trim(), position: null, active: r.active, prize: r.prize ?? null }));
      motmRows.forEach((r, idx) => { if (!r.monthLabel.trim()) return; payload.push({ id: r.awardId, season_id: seasonId, category: 'motm', sub_type: null, group_key: r.monthLabel.trim(), position: null, active: r.active, prize: r.prize ?? null, sequence: idx + 1 }); });
      specialRows.forEach(r => { if (!r.title.trim()) return; payload.push({ id: r.awardId, season_id: seasonId, category: 'special', sub_type: null, group_key: r.title.trim(), position: null, active: r.active, prize: r.prize ?? null }); });

      if (payload.length === 0) { setMessage('Nothing to save (add rows or set league places).'); setSaving(false); return; }

      const toInsert = payload.filter(p => !p.id);
      const toUpdate = payload.filter(p => p.id);
      const toInsertWithIds = toInsert.map(r => ({ ...r, id: crypto.randomUUID() }));

      // Validate existing award IDs belong to the season being edited
      const existingAwardIds = toUpdate.map((p: any) => p.id).filter(Boolean);
      if (existingAwardIds.length) {
        const { data: existingAwards, error: existingErr } = await supabase
          .from('season_awards')
          .select('id, season_id')
          .in('id', existingAwardIds);
        if (existingErr) throw new Error(existingErr.message);
        const bad = (existingAwards || []).filter((a: any) => a.season_id !== seasonId).map((a: any) => a.id);
        if (bad.length) {
          setMessage(`Aborting save: award(s) belong to a different season: ${bad.join(', ')}`);
          setSaving(false);
          return;
        }
      }

      if (toInsertWithIds.length) {
        const { data: insData, error: insErr } = await supabase.from('season_awards').insert(toInsertWithIds).select('id, category, group_key');
        if (insErr) throw new Error(insErr.message);
        // Ensure inserted rows are available for mapping by group_key
      }
      if (toUpdate.length) { for (const row of toUpdate) { const { id, ...rest } = row; const { error: updErr } = await supabase.from('season_awards').update(rest).eq('id', id); if (updErr) throw new Error(updErr.message); } }

      if (removedAwardIds.length) { await supabase.from('special_award_notes').delete().in('award_id', removedAwardIds); const { error: delErr } = await supabase.from('season_awards').delete().in('id', removedAwardIds); if (delErr) throw new Error(delErr.message); }

      // Special award notes
      const specialAwardsWithNotes = specialRows.filter(r => r.note && r.note.trim() !== "");
      if (specialAwardsWithNotes.length) {
        const awardIds = specialAwardsWithNotes.filter(r => r.awardId).map(r => r.awardId!);
        if (awardIds.length) await supabase.from('special_award_notes').delete().in('award_id', awardIds);
        const finalAwardIds: string[] = [];
        for (const row of specialAwardsWithNotes) {
          if (row.awardId) finalAwardIds.push(row.awardId); else {
            const match = toInsertWithIds.find(p => p.category === 'special' && p.group_key === row.title.trim()); if (match) finalAwardIds.push(match.id);
          }
        }
        const notesToInsert = specialAwardsWithNotes.map((row, idx) => ({ award_id: finalAwardIds[idx], note: row.note! })).filter(n => n.award_id);
        if (notesToInsert.length) { const { error: notesErr } = await supabase.from('special_award_notes').insert(notesToInsert); if (notesErr) throw new Error(notesErr.message); }
      }

      // Save winners to season_award_winners for all award types (league, cup, motm, special)
      const rowsWithWinners: Array<{ awardId?: string; category: string; key?: string | number; winners: string[] }> = [];
      // leagueRows: key = position
      leagueRows.forEach(r => { if (r.awardId || r.winner_id) rowsWithWinners.push({ awardId: r.awardId, category: 'league_position', key: r.position, winners: r.winner_id ? [r.winner_id] : [] }); });
      // cupRows: key = cupName + sub_type (group_key used for award insertion uses cupName)
      cupRows.forEach(r => { if (r.awardId || r.winner_id) rowsWithWinners.push({ awardId: r.awardId, category: 'cup', key: r.cupName, winners: r.winner_id ? [r.winner_id] : [] }); });
      // motmRows: key = monthLabel
      motmRows.forEach(r => { if (r.awardId || r.winner_id) rowsWithWinners.push({ awardId: r.awardId, category: 'motm', key: r.monthLabel, winners: r.winner_id ? [r.winner_id] : [] }); });
      // specialRows: key = title
      specialRows.forEach(r => { if (r.title && (r.awardId || (r.winners && r.winners.length))) rowsWithWinners.push({ awardId: r.awardId, category: 'special', key: r.title.trim(), winners: (r.winners || []).filter(Boolean) }); });

      if (rowsWithWinners.length) {
        // Build a map for any newly inserted awards in this run
        const newlyInsertedMap: Record<string, string> = {};
        const newInserts = toInsertWithIds || [];
        if (newInserts.length) {
          newInserts.forEach((p: any) => { if (p.category && p.id && p.group_key !== undefined) newlyInsertedMap[`${p.category}::${String(p.group_key)}`] = p.id; if (p.category === 'league_position' && p.position) newlyInsertedMap[`${p.category}::${String(p.position)}`] = p.id; });
        }

        const resolveAwardId = (entry: { awardId?: string; category: string; key?: string | number }) => {
          if (entry.awardId) return entry.awardId;
          const key = entry.key;
          if (key === undefined || key === null) return undefined;
          const lookup = `${entry.category}::${String(key)}`;
          if (newlyInsertedMap[lookup]) return newlyInsertedMap[lookup];
          // fallback: try to find in toInsertWithIds by matching category and group_key/position
          const match = (toInsertWithIds || []).find((p: any) => p.category === entry.category && ((p.group_key && String(p.group_key) === String(key)) || (p.position && String(p.position) === String(key))));
          return match ? match.id : undefined;
        };

        const awardIdsToClear = new Set<string>();
        const winnersToInsert: any[] = [];
        for (const row of rowsWithWinners) {
          const aid = resolveAwardId(row as any);
          if (!aid) continue;
          awardIdsToClear.add(aid);
          row.winners.forEach(wid => { if (wid) winnersToInsert.push({ award_id: aid, winner_id: wid }); });
        }

        if (awardIdsToClear.size) {
          const aids = Array.from(awardIdsToClear);
          try {
            const { error: delWErr } = await supabase.from('season_award_winners').delete().in('award_id', aids);
            if (delWErr && delWErr.code !== '42P01') throw new Error(delWErr.message);
          } catch (e: any) { if (e && e.code !== '42P01') throw e; }
        }

        if (winnersToInsert.length) {
          try {
            const { data: winData, error: winInsErr } = await supabase.from('season_award_winners').insert(winnersToInsert).select('id, award_id, winner_id');
            if (winInsErr && winInsErr.code !== '42P01') throw new Error(winInsErr.message);
            setMessage(m => `${m} Winners inserted: ${winData ? winData.length : 0}`);
          } catch (e: any) {
            if (e && e.code !== '42P01') throw e;
          }
        } else {
          setMessage(m => `${m} No winners to insert.`);
        }
      }

      setMessage(`Saved (${toInsert.length} new / ${toUpdate.length} updated / ${removedAwardIds.length} removed)`);
      await fetchExistingAwards();
      setRemovedAwardIds([]);

    } catch (e:any) {
      setMessage(`Error saving: ${e.message || 'Unknown error'}`);
    } finally { setSaving(false); }
  };

  const playerSelect = (value: string | null | undefined, setter: (val: string | undefined) => void) => (
    <select value={value ?? ""} onChange={e => setter(e.target.value || undefined)} className="p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
      <option value="">-- Winner --</option>
      {players.map(p => <option key={p.id} value={p.id}>{p.username}</option>)}
    </select>
  );

  if (loading) return (<div><h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Edit Award Winners</h2><p className="text-gray-700 dark:text-gray-300">Loading...</p><button onClick={onClose}>Back</button></div>);

  return (
    <div className="space-y-8 text-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Edit Award Winners</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={saveAll} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded">{saving ? 'Saving...' : 'Save'}</button>
          <button onClick={onClose} className="px-4 py-2 bg-gray-800 text-white rounded">Back</button>
        </div>
      </div>
      
      {message && <div className="text-sm text-blue-600">{message}</div>}

      {/* League */}
      <section className="bg-white dark:bg-gray-800 p-4 rounded shadow space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">League Table Prizes</h3>
          <input type="number" min={0} value={leagueCount} onChange={e => setLeagueCount(Math.max(0, parseInt(e.target.value || '0', 10)))} className="w-24 p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" placeholder="# places" />
        </div>
        <div className="space-y-2">
          {leagueRows.map(row => (
            <div key={row.tempId} className={`flex items-center gap-3 p-2 rounded border ${!row.active ? 'opacity-50' : ''}`}>
              <input type="checkbox" checked={row.active} onChange={() => setLeagueRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, active: !r.active } : r ))} />
              <div className="w-16 font-semibold">{row.position}</div>
              <input type="number" value={row.prize ?? ''} onChange={e => setLeagueRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, prize: e.target.value ? Number(e.target.value) : undefined } : r ))} placeholder="Prize" className="w-24 p-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
              {playerSelect(row.winner_id, val => setLeagueRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, winner_id: val } : r )))}
            </div>
          ))}
        </div>
      </section>

      {/* Cups */}
      <section className="bg-white dark:bg-gray-800 p-4 rounded shadow space-y-4">
        <div className="flex justify-between items-center"><h3 className="text-lg font-semibold">Cup Competitions</h3></div>
        <div className="space-y-4">
          {Array.from(new Set(cupRows.map(c => c.cupName))).map(cupName => {
            const rows = cupRows.filter(r => r.cupName === cupName);
              return (
              <div key={cupName} className="border rounded p-3 bg-white dark:bg-gray-800">
                <div className="flex justify-between items-center mb-2"><div className="font-semibold">{cupName}</div></div>
                <div className="space-y-2">
                  {rows.map(row => (
                    <div key={row.tempId} className={`flex items-center gap-3 p-2 rounded border ${!row.active ? 'opacity-50' : ''}`}>
                      <input type="checkbox" checked={row.active} onChange={() => setCupRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, active: !r.active } : r ))} />
                      <div className="w-24 text-sm capitalize">{row.sub_type.replace('_',' ')}</div>
                      <input type="number" value={row.prize ?? ''} onChange={e => setCupRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, prize: e.target.value ? Number(e.target.value) : undefined } : r ))} placeholder="Prize" className="w-24 p-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
                      {playerSelect(row.winner_id, val => setCupRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, winner_id: val } : r )))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MOTM */}
      <section className="bg-white dark:bg-gray-800 p-4 rounded shadow space-y-4">
        <div className="flex justify-between items-center"><h3 className="text-lg font-semibold">Manager of the Month</h3></div>
        <div className="space-y-2">
          {motmRows.map(row => (
            <div key={row.tempId} className={`flex items-center gap-3 p-2 rounded border ${!row.active ? 'opacity-50' : ''}`}>
              <input type="checkbox" checked={row.active} onChange={() => setMotmRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, active: !r.active } : r ))} />
              <input type="text" value={row.monthLabel} onChange={e => setMotmRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, monthLabel: e.target.value } : r ))} className="flex-grow p-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
              <input type="number" value={row.prize ?? ''} onChange={e => setMotmRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, prize: e.target.value ? Number(e.target.value) : undefined } : r ))} placeholder="Prize" className="w-24 p-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
              {playerSelect(row.winner_id, val => setMotmRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, winner_id: val } : r )))}
              <button onClick={() => removeMotm(row.tempId)} className="text-xs px-2 py-1 bg-red-600 text-white rounded">X</button>
            </div>
          ))}
        </div>
      </section>

      {/* Special */}
      <section className="bg-white dark:bg-gray-800 p-4 rounded shadow space-y-4">
        <div className="flex justify-between items-center"><h3 className="text-lg font-semibold">Special Awards</h3><button onClick={addSpecial} className="px-3 py-1 bg-blue-600 text-white rounded">Add Special</button></div>
        <div className="space-y-2">
          {specialRows.map(row => (
            <div key={row.tempId} className={`p-2 rounded border ${!row.active ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3">
                <input type="checkbox" checked={row.active} onChange={() => setSpecialRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, active: !r.active } : r ))} />
                <input type="text" value={row.title} onChange={e => setSpecialRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, title: e.target.value } : r ))} placeholder="Title" className="flex-grow p-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
                <input type="number" value={row.prize ?? ''} onChange={e => setSpecialRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, prize: e.target.value ? Number(e.target.value) : undefined } : r ))} placeholder="Prize" className="w-24 p-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
                <div className="flex items-center gap-2">
                  {(row.winners || []).map((wId, wi) => (
                    <div key={wi} className="flex items-center gap-2">
                      {playerSelect(wId, val => setSpecialRows(prev => prev.map(r => { if (r.tempId !== row.tempId) return r; const winners = (r.winners||[]).slice(); winners[wi] = val || undefined as any; return { ...r, winners }; })))}
                      <button type="button" onClick={() => setSpecialRows(prev => prev.map(r => { if (r.tempId !== row.tempId) return r; const winners = (r.winners||[]).slice(); winners.splice(wi,1); return { ...r, winners }; }))} className="text-xs px-2 py-1 bg-red-600 text-white rounded">−</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setSpecialRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, winners: [...(r.winners||[]), ""] } : r ))} className="text-xs px-2 py-1 bg-blue-600 text-white rounded">+</button>
                </div>
                <button onClick={() => removeSpecial(row.tempId)} className="text-xs px-2 py-1 bg-red-600 text-white rounded">X</button>
              </div>
              <div className="mt-2">
                <textarea value={row.note ?? ''} onChange={e => setSpecialRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, note: e.target.value } : r ))} placeholder="Note" className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
