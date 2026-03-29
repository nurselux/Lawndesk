import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const RECEPTIONIST_URL = 'https://lawndesk-receptionist-production.up.railway.app'

function twilioAuth() {
  const sid = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!
  return 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64')
}

export async function POST(req: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return NextResponse.json({ error: 'Twilio credentials not configured' }, { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Verify admin
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { ownerId, areaCode } = await req.json()
  if (!ownerId) return NextResponse.json({ error: 'ownerId required' }, { status: 400 })

  const sid = process.env.TWILIO_ACCOUNT_SID
  const auth = twilioAuth()

  // Search for an available local number
  const searchParams = new URLSearchParams({ VoiceEnabled: 'true', SmsEnabled: 'false' })
  if (areaCode) searchParams.set('AreaCode', areaCode)

  const searchRes = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/AvailablePhoneNumbers/US/Local.json?${searchParams}`,
    { headers: { Authorization: auth } }
  )
  const searchData = await searchRes.json()

  if (!searchData.available_phone_numbers?.length) {
    return NextResponse.json({ error: 'No available numbers' + (areaCode ? ` in area code ${areaCode}` : '') }, { status: 404 })
  }

  const phoneNumber = searchData.available_phone_numbers[0].phone_number

  // Purchase the number and point it at our receptionist
  const buyBody = new URLSearchParams({
    PhoneNumber: phoneNumber,
    VoiceUrl: `${RECEPTIONIST_URL}/incoming-call`,
    VoiceMethod: 'POST',
    StatusCallback: `${RECEPTIONIST_URL}/call-status`,
    StatusCallbackMethod: 'POST',
    FriendlyName: `LawnDesk - ${ownerId.slice(0, 8)}`
  })

  const buyRes = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/IncomingPhoneNumbers.json`,
    { method: 'POST', headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' }, body: buyBody }
  )
  const buyData = await buyRes.json()

  if (!buyRes.ok) {
    return NextResponse.json({ error: buyData.message || 'Failed to purchase number' }, { status: 500 })
  }

  // Save to profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ twilio_number: phoneNumber, ai_receptionist_enabled: true })
    .eq('id', ownerId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ phoneNumber })
}
