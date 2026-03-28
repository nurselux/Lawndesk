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

  // Verify the requesting user is the admin
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.email !== process.env.ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Fetch all admin profiles (exclude workers)
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, business_name, subscription_status, subscription_plan, trial_ends_at, created_at')
    .eq('role', 'admin')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get emails from auth.users for each profile
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 })

  const emailMap = new Map(users.map(u => [u.id, u.email]))

  const result = profiles.map(p => ({
    ...p,
    email: emailMap.get(p.id) ?? 'unknown',
  }))

  return NextResponse.json({ users: result })
}
