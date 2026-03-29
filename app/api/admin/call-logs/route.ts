import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.email !== process.env.ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: logs, error } = await supabase
    .from('call_logs')
    .select('id, caller_phone, status, outcome, ai_summary, duration_seconds, created_at, owner_id')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrich with business names
  const ownerIds = [...new Set(logs.map(l => l.owner_id).filter(Boolean))]
  let businessMap: Record<string, string> = {}
  if (ownerIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, business_name')
      .in('id', ownerIds)
    profiles?.forEach(p => { businessMap[p.id] = p.business_name })
  }

  return NextResponse.json({
    logs: logs.map(l => ({ ...l, business_name: businessMap[l.owner_id] ?? null }))
  })
}
