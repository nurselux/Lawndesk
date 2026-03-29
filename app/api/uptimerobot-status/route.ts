export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_UPTIMEROBOT_API_KEY

  if (!apiKey) {
    return Response.json({ error: 'API key not configured' }, { status: 500 })
  }

  try {
    const res = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `api_key=${apiKey}&format=json`,
    })

    const data = await res.json()

    if (!data.monitors) {
      return Response.json({ error: 'Failed to fetch monitors' }, { status: 500 })
    }

    const allUp = data.monitors.every((m: any) => m.status === 2) // 2 = up
    const downCount = data.monitors.filter((m: any) => m.status !== 2).length

    return Response.json({
      allUp,
      downCount,
      totalMonitors: data.monitors.length,
      monitors: data.monitors,
    })
  } catch (error) {
    return Response.json({ error: 'Failed to fetch status' }, { status: 500 })
  }
}
