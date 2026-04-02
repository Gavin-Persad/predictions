"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../../../components/Sidebar';
import DarkModeToggle from '../../../../components/darkModeToggle';
import { supabase } from '../../../../../supabaseClient';

type Props = {
  seasonId: string;
  onClose: () => void;
};

type ManagerMonth = {
  id: string;
  month_start: string; // ISO date
  month_label: string;
};

type GameWeek = {
  id: string;
  week_number: number;
  live_start?: string;
};

export default function EditManagerOfTheMonth({ seasonId, onClose }: Props) {
  const [season, setSeason] = useState<{ id: string; start_date: string; end_date: string } | null>(null);
  const [months, setMonths] = useState<Array<{ key: string; start: string; label: string }>>([]);
  const [checkedMonths, setCheckedMonths] = useState<Record<string, boolean>>({});
  const [managerMonths, setManagerMonths] = useState<ManagerMonth[]>([]);
  const [gameWeeks, setGameWeeks] = useState<GameWeek[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({}); // manager_month_id -> [game_week_id]
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [customMonth, setCustomMonth] = useState<string>('');
  const [customYear, setCustomYear] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // fetch season details
        const { data: seasonData, error: seasonError } = await supabase
          .from('seasons')
          .select('id, start_date, end_date')
          .eq('id', seasonId)
          .single();

        if (seasonError || !seasonData) {
          setMessage('Error loading season');
          setLoading(false);
          return;
        }

        setSeason(seasonData);

        // compute months between start and end
        const start = new Date(seasonData.start_date);
        const end = new Date(seasonData.end_date);
        const computedMonths: Array<{ key: string; start: string; label: string }> = [];
        const cur = new Date(start.getFullYear(), start.getMonth(), 1);
        while (cur <= end) {
          const y = cur.getFullYear();
          const m = cur.getMonth() + 1;
          const key = `${y}-${String(m).padStart(2, '0')}`; // YYYY-MM
          const label = cur.toLocaleString(undefined, { month: 'long', year: 'numeric' });
          computedMonths.push({ key, start: new Date(y, cur.getMonth(), 1).toISOString().slice(0, 10), label });
          cur.setMonth(cur.getMonth() + 1);
        }

        setMonths(computedMonths);
        setCheckedMonths(Object.fromEntries(computedMonths.map(m => [m.key, true])));

        // fetch existing manager_months for this season
        const { data: mmData } = await supabase
          .from('manager_months')
          .select('id, month_start, month_label')
          .eq('season_id', seasonId)
          .order('month_start', { ascending: true });

        setManagerMonths((mmData as ManagerMonth[]) || []);

        // fetch game weeks for season
        const { data: gwData } = await supabase
          .from('game_weeks')
          .select('id, week_number, live_start')
          .eq('season_id', seasonId)
          .order('week_number', { ascending: true });

        setGameWeeks((gwData as GameWeek[]) || []);

        // fetch assignments
        const { data: assignData } = await supabase
          .from('manager_month_game_weeks')
          .select('manager_month_id, game_week_id')
          .in('manager_month_id', (mmData || []).map((m: any) => m.id));

        const map: Record<string, string[]> = {};
        (assignData || []).forEach((r: any) => {
          if (!map[r.manager_month_id]) map[r.manager_month_id] = [];
          map[r.manager_month_id].push(r.game_week_id);
        });
        setAssignments(map);
      } catch (err) {
        console.error(err);
        setMessage('Error loading data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [seasonId]);

  const existingMonthKeys = useMemo(() => new Set(managerMonths.map(m => {
    const d = new Date(m.month_start);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })), [managerMonths]);

  const handleToggleMonthCheck = (key: string) => {
    setCheckedMonths(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const createSelectedMonths = async () => {
    setLoading(true);
    try {
      const toCreate = months.filter(m => checkedMonths[m.key] && !existingMonthKeys.has(m.key));
      if (toCreate.length === 0) {
        setMessage('No new months to create');
        setLoading(false);
        return;
      }

      const inserts = toCreate.map(m => ({
        season_id: seasonId,
        month_start: m.start,
        month_label: m.label
      }));

      const { error } = await supabase.from('manager_months').insert(inserts);
      if (error) throw error;

      // reload manager months
      const { data: mmData } = await supabase
        .from('manager_months')
        .select('id, month_start, month_label')
        .eq('season_id', seasonId)
        .order('month_start', { ascending: true });

      setManagerMonths((mmData as ManagerMonth[]) || []);
      setMessage('Months created');
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || 'Error creating months');
    } finally {
      setLoading(false);
    }
  };

  const addCustomMonth = async () => {
    if (!customMonth || !customYear) {
      setMessage('Enter month and year');
      return;
    }

    // parse month number (accept numeric or month name)
    let monthNum = parseInt(customMonth, 10);
    if (Number.isNaN(monthNum)) {
      const parsed = new Date(`${customMonth} 1, ${customYear}`);
      if (isNaN(parsed.getTime())) {
        setMessage('Invalid month name');
        return;
      }
      monthNum = parsed.getMonth() + 1;
    }

    const yearNum = parseInt(customYear, 10);
    if (Number.isNaN(yearNum) || yearNum < 1900 || yearNum > 3000) {
      setMessage('Invalid year');
      return;
    }

    const key = `${yearNum}-${String(monthNum).padStart(2, '0')}`;
    if (existingMonthKeys.has(key)) {
      setMessage('Month already exists');
      return;
    }

    const monthStart = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
    const label = new Date(yearNum, monthNum - 1, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });

    setLoading(true);
    try {
      const { error } = await supabase.from('manager_months').insert([{ season_id: seasonId, month_start: monthStart, month_label: label }]);
      if (error) throw error;

      const { data: mmData } = await supabase
        .from('manager_months')
        .select('id, month_start, month_label')
        .eq('season_id', seasonId)
        .order('month_start', { ascending: true });

      setManagerMonths((mmData as ManagerMonth[]) || []);
      setCustomMonth('');
      setCustomYear('');
      setMessage('Month added');
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || 'Error adding month');
    } finally {
      setLoading(false);
    }
  };

  const assignedGameWeekIds = useMemo(() => {
    const s = new Set<string>();
    Object.values(assignments).forEach(arr => arr.forEach(a => s.add(a)));
    return s;
  }, [assignments]);

  const addGameWeekToMonth = async (managerMonthId: string, gameWeekId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('manager_month_game_weeks').insert([{ manager_month_id: managerMonthId, game_week_id: gameWeekId }]);
      if (error) throw error;

      // update local assignments
      setAssignments(prev => ({ ...prev, [managerMonthId]: [...(prev[managerMonthId] || []), gameWeekId] }));
      setMessage('Game week assigned');
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || 'Error assigning game week');
    } finally {
      setLoading(false);
    }
  };

  const removeGameWeekFromMonth = async (managerMonthId: string, gameWeekId: string) => {
    const confirmRemove = confirm(`Are you sure you want to remove game week ${gameWeeks.find(g => g.id === gameWeekId)?.week_number} from ${managerMonths.find(m => m.id === managerMonthId)?.month_label}?`);
    if (!confirmRemove) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('manager_month_game_weeks')
        .delete()
        .match({ manager_month_id: managerMonthId, game_week_id: gameWeekId });
      if (error) throw error;

      setAssignments(prev => ({ ...prev, [managerMonthId]: (prev[managerMonthId] || []).filter(id => id !== gameWeekId) }));
      setMessage('Game week removed');
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || 'Error removing game week');
    } finally {
      setLoading(false);
    }
  };

  const removeManagerMonth = async (managerMonthId: string) => {
    const mm = managerMonths.find(m => m.id === managerMonthId);
    const confirmRemove = confirm(`Are you sure you want to delete ${mm?.month_label}? This will remove any assigned game weeks.`);
    if (!confirmRemove) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('manager_months')
        .delete()
        .eq('id', managerMonthId);
      if (error) throw error;

      // remove locally
      setManagerMonths(prev => prev.filter(m => m.id !== managerMonthId));
      const newAssignments = { ...assignments };
      delete newAssignments[managerMonthId];
      setAssignments(newAssignments);
      setMessage('Month removed');
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || 'Error removing month');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-grow flex items-start justify-center min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
        <div className="absolute top-4 right-4">
          <DarkModeToggle />
        </div>

        <div className="w-full max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Edit Manager of the Month</h2>
          <button onClick={onClose} className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700">Back</button>

          {message && <div className="mb-4 text-sm text-gray-700 dark:text-gray-200">{message}</div>}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Confirm Months</h3>
            <div className="grid grid-cols-2 gap-2">
              {months.map(m => (
                <label key={m.key} className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={!!checkedMonths[m.key]} onChange={() => handleToggleMonthCheck(m.key)} className="form-checkbox" />
                  <span className="text-gray-900 dark:text-gray-100">{m.label} {existingMonthKeys.has(m.key) && <span className="text-sm text-green-600">(created)</span>}</span>
                </label>
              ))}
            </div>
            <div className="mt-4">
              <button onClick={createSelectedMonths} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Create Selected Months</button>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <input
                type="text"
                placeholder="Month (name or number)"
                value={customMonth}
                onChange={(e) => setCustomMonth(e.target.value)}
                className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <input
                type="text"
                placeholder="Year (e.g. 2026)"
                value={customYear}
                onChange={(e) => setCustomYear(e.target.value)}
                className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 w-28"
              />
              <button onClick={addCustomMonth} disabled={loading} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Month</button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Assign Game Weeks</h3>
            <div className="space-y-4">
              {managerMonths.map(mm => (
                <div key={mm.id} className="border-b pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{mm.month_label}</div>
                      <button
                        onClick={() => removeManagerMonth(mm.id)}
                        className="text-sm text-red-600 hover:text-red-800 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded"
                        title="Remove month"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) addGameWeekToMonth(mm.id, val);
                          e.currentTarget.value = '';
                        }}
                        className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        defaultValue=""
                      >
                        <option value="">Add game week...</option>
                        {gameWeeks.filter(gw => !assignedGameWeekIds.has(gw.id)).map(gw => (
                          <option key={gw.id} value={gw.id}>Game Week {gw.week_number} - {gw.live_start ? new Date(gw.live_start).toLocaleDateString() : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {(assignments[mm.id] || []).map(gwId => {
                      const gw = gameWeeks.find(g => g.id === gwId);
                      return (
                        <span key={gwId} className="inline-flex items-center gap-2 px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-sm">
                          <span>GW {gw?.week_number}</span>
                          <button onClick={() => removeGameWeekFromMonth(mm.id, gwId)} className="text-red-600 hover:text-red-800">×</button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
