'use client'

import { useEffect, useState } from 'react'

interface StatusData {
  allUp: boolean
  downCount: number
  totalMonitors: number
}

export default function UptimeRobotStatus() {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/uptimerobot-status')
        const data = await res.json()

        if (data.error) {
          setError(data.error)
        } else {
          setStatus(data)
        }
      } catch (err) {
        setError('Failed to fetch status')
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    // Refresh every 5 minutes
    const interval = setInterval(fetchStatus, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div className="text-gray-400 text-sm">Loading...</div>
  if (error) return <div className="text-red-500 text-sm">{error}</div>

  return (
    <a href="https://stats.uptimerobot.com/hAsUIV5kKi" target="_blank" rel="noopener noreferrer"
       className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
       style={{
         backgroundColor: status?.allUp ? '#dcfce7' : '#fee2e2',
         color: status?.allUp ? '#166534' : '#991b1b',
       }}>
      <span className="text-xl">{status?.allUp ? '✅' : '⚠️'}</span>
      <span>
        {status?.allUp
          ? `All ${status.totalMonitors} monitors operational`
          : `${status?.downCount} of ${status?.totalMonitors} monitors down`}
      </span>
    </a>
  )
}
