import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(req: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'server misconfiguration: missing service role key' }, { status: 500 })
    }

    const body = await req.json()
    const { season_id, game_week_id, scores } = body

    if (!season_id || !game_week_id || !Array.isArray(scores)) {
      return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
    }

    // Basic limits to prevent huge payloads
    if (scores.length === 0) {
      return NextResponse.json({ error: 'scores array is empty' }, { status: 400 })
    }

    if (scores.length > 2000) {
      return NextResponse.json({ error: 'scores array too large' }, { status: 400 })
    }

    // Authenticate caller: require a Bearer token and ensure user is a host
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: 'missing auth token' }, { status: 401 });
    }

    // Validate token and fetch user
    try {
      const userRes: any = await supabaseAdmin.auth.getUser(token);
      const user = userRes?.data?.user || userRes?.user;
      if (!user || !user.id) return NextResponse.json({ error: 'invalid auth token' }, { status: 401 });

      const { data: profile, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .select('is_host')
        .eq('id', user.id)
        .single();

      if (profileErr || !profile || !profile.is_host) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
    } catch (e: any) {
      return NextResponse.json({ error: 'auth validation failed' }, { status: 401 });
    }

    // Call the DB RPC
    // Pass the scores array directly so it's treated as JSON/JSONB by the RPC
    const { data, error } = await supabaseAdmin.rpc('save_week_scores', {
      p_season: season_id,
      p_game_week: game_week_id,
      p_scores: scores
    })

    if (error) {
      const msg = String(error.message || '')
      // Map DB advisory-lock contention to 409 so clients can retry
      if (msg.toLowerCase().includes('lock_not_acquired') || msg.toLowerCase().includes('could not obtain lock')) {
        return NextResponse.json({ error: 'lock_not_acquired' }, { status: 409 })
      }

      return NextResponse.json({ error: msg }, { status: 500 })
    }

    return NextResponse.json({ season_scores: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
