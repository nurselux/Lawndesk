'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import { useSubscriptionGate } from '../../lib/useSubscriptionGate'

interface Worker {
  id: string
  name: string | null
  role: string
  created_at: string
  email?: string
}

interface Invite {
  id: string
  email: string
  token: string
  status: string
  created_at: string
}

export default function TeamPage() {
  const { user, loading } = useAuth()
  const { checking } = useSubscriptionGate()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (user) {
      fetchWorkers()
      fetchInvites()
    }
  }, [user])

  const fetchWorkers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, role, created_at')
      .eq('owner_id', user?.id)
      .eq('role', 'worker')
    if (data) setWorkers(data as Worker[])
  }

  const fetchInvites = async () => {
    const { data } = await supabase
      .from('invites')
      .select('id, email, token, status, admin_id, created_at')
      .eq('admin_id', user?.id)
      .order('created_at', { ascending: false })
    if (data) setInvites(data as Invite[])
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setSending(true)
    const { data, error } = await supabase
      .from('invites')
      .insert({ admin_id: user?.id, email: inviteEmail.trim() })
      .select()
      .single()
    if (!error && data) {
      setInviteEmail('')
      fetchInvites()

      // Send email automatically
      const link = `${window.location.origin}/invite/${data.token}`
      const emailRes = await fetch(
        'https://jxsodtvsebtgipgqtdgl.supabase.co/functions/v1/send-invite-email',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            inviteLink: link,
            adminName: user?.email,
          }),
        }
      )
      if (emailRes.ok) {
        setSuccessMessage(`✅ Invite email sent to ${data.email}!`)
      } else {
        setSuccessMessage('Invite created but email failed — use the Share button below.')
      }
      setTimeout(() => setSuccessMessage(''), 6000)
    }
    setSending(false)
  }

  const getInviteLink = (token: string) =>
    `${window.location.origin}/invite/${token}`

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(getInviteLink(token))
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const shareLink = async (token: string, email: string) => {
    const link = getInviteLink(token)
    if (navigator.share) {
      await navigator.share({
        title: 'Join my LawnDesk team',
        text: `You've been invited to join LawnDesk. Tap the link to set up your worker account.`,
        url: link,
      })
    } else {
      copyLink(token)
    }
  }

  const deleteInvite = async (inviteId: string) => {
    await supabase.from('invites').delete().eq('id', inviteId)
    fetchInvites()
  }

  const removeWorker = async (workerId: string) => {
    if (!confirm('Remove this worker from your team?')) return
    await supabase
      .from('profiles')
      .update({ role: 'admin', owner_id: null })
      .eq('id', workerId)
    fetchWorkers()
    setSuccessMessage('Worker removed from your team.')
    setTimeout(() => setSuccessMessage(''), 4000)
  }

  if (checking) return (
    <div className="flex items-center justify-center min-h-dvh">
      <p className="text-green-700 text-xl font-bold">Loading...</p>
    </div>
  )

  return (
    <div className="p-6 pb-6 bg-gray-50 min-h-dvh">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-2xl w-12 h-12 rounded-xl flex items-center justify-center shadow-md">👷</div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 leading-none">Team</h2>
          <p className="text-gray-500 text-sm">Invite workers and manage your crew</p>
        </div>
      </div>

      {/* Invite form */}
      <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
        <h3 className="font-bold text-gray-800 mb-4">📨 Invite a Worker</h3>
        <div className="flex gap-3">
          <input
            type="email"
            placeholder="Worker's email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            className="flex-1 border border-gray-300 rounded-lg p-3 text-gray-800"
          />
          <button
            onClick={handleInvite}
            disabled={sending || !inviteEmail.trim()}
            className="bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-200 cursor-pointer shadow disabled:opacity-50"
          >
            {sending ? '⏳' : '+ Invite'}
          </button>
        </div>
        {successMessage && (
          <p className="mt-3 text-green-700 font-semibold text-sm">{successMessage}</p>
        )}
        <p className="text-gray-400 text-xs mt-3">
          An invite email will be sent automatically. You can also use the Share button to send it via text, WhatsApp, or any other app.
        </p>
      </div>

      {/* Pending invites */}
      {invites.filter(i => i.status !== 'used').length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <h3 className="font-bold text-gray-800 mb-4">🔗 Pending Invites</h3>
          <div className="space-y-3">
            {invites.filter(i => i.status !== 'used').map((invite) => (
              <div key={invite.id} className="flex items-center justify-between gap-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{invite.email}</p>
                  <p className="text-gray-400 text-xs">Created {new Date(invite.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => shareLink(invite.token, invite.email)}
                    className="text-xs font-bold py-2 px-3 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors cursor-pointer"
                  >
                    📤 Share
                  </button>
                  <button
                    onClick={() => copyLink(invite.token)}
                    className="text-xs font-bold py-2 px-3 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors cursor-pointer"
                  >
                    {copiedToken === invite.token ? '✓ Copied!' : '📋 Copy'}
                  </button>
                  <button
                    onClick={() => deleteInvite(invite.id)}
                    className="text-xs font-bold py-2 px-3 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active workers */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h3 className="font-bold text-gray-800 mb-4">👷 Active Workers ({workers.length})</h3>
        {workers.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-5xl mb-3">👷</p>
            <p className="text-gray-700 font-bold mb-1">No workers yet</p>
            <p className="text-gray-400 text-sm">Invite your first worker above to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workers.map((worker) => (
              <div key={worker.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-violet-100 text-violet-700 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                    {worker.name ? worker.name[0].toUpperCase() : '?'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{worker.name || 'Unnamed Worker'}</p>
                    <p className="text-gray-400 text-xs">Joined {new Date(worker.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeWorker(worker.id)}
                  className="text-red-400 hover:text-red-600 text-sm font-semibold cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
