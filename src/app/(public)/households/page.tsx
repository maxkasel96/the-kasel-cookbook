'use client'

import { FormEvent, useEffect, useState } from 'react'

import { useHouseholds } from '@/lib/use-households'

type HouseholdMember = {
  userId: string
  email: string | null
  role: 'owner' | 'admin' | 'member'
  createdAt: string
}

export default function HouseholdsPage() {
  const {
    households,
    selectedHouseholdId,
    setSelectedHouseholdId,
    isLoading,
    error,
    reload,
  } = useHouseholds()
  const [newHouseholdName, setNewHouseholdName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [memberError, setMemberError] = useState<string | null>(null)

  useEffect(() => {
    const loadMembers = async () => {
      setMemberError(null)

      if (!selectedHouseholdId) {
        setMembers([])
        return
      }

      const response = await fetch(`/api/households/${selectedHouseholdId}/members`)
      const payload = (await response.json()) as {
        members?: HouseholdMember[]
        error?: string
      }

      if (!response.ok) {
        setMemberError(payload.error ?? 'Unable to load members.')
        setMembers([])
        return
      }

      setMembers(payload.members ?? [])
    }

    loadMembers()
  }, [selectedHouseholdId])

  const onCreateHousehold = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus(null)

    const name = newHouseholdName.trim()
    if (!name) return

    const response = await fetch('/api/households', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    })

    const payload = (await response.json()) as {
      error?: string
      household?: { id: string }
    }

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to create household.')
      return
    }

    setNewHouseholdName('')
    await reload()
    if (payload.household?.id) {
      setSelectedHouseholdId(payload.household.id)
    }
    setStatus('Household created.')
  }

  const onInviteMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus(null)

    const email = inviteEmail.trim().toLowerCase()
    if (!email || !selectedHouseholdId) return

    const response = await fetch(`/api/households/${selectedHouseholdId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, role: inviteRole }),
    })

    const payload = (await response.json()) as { error?: string; message?: string }

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to add member.')
      return
    }

    setInviteEmail('')
    setStatus(payload.message ?? 'Member added.')

    const refreshResponse = await fetch(`/api/households/${selectedHouseholdId}/members`)
    const refreshPayload = (await refreshResponse.json()) as {
      members?: HouseholdMember[]
    }
    setMembers(refreshPayload.members ?? [])
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Households & groups</h1>
        <p className="text-sm text-foreground/70">
          Create a household, add members, and use it to share favorites.
        </p>
      </header>

      <section className="rounded-xl border border-border p-4">
        <h2 className="mb-3 text-lg font-semibold">Create household</h2>
        <form onSubmit={onCreateHousehold} className="flex flex-wrap gap-3">
          <input
            type="text"
            value={newHouseholdName}
            onChange={(event) => setNewHouseholdName(event.target.value)}
            placeholder="Kasel Family"
            className="min-w-[220px] flex-1 rounded-md border border-border bg-background px-3 py-2"
            required
          />
          <button type="submit" className="rounded-md bg-black px-4 py-2 text-white">
            Create
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-border p-4">
        <h2 className="mb-3 text-lg font-semibold">Select active household</h2>
        {isLoading ? (
          <p className="text-sm text-foreground/70">Loading households…</p>
        ) : households.length === 0 ? (
          <p className="text-sm text-foreground/70">No households yet.</p>
        ) : (
          <select
            value={selectedHouseholdId ?? ''}
            onChange={(event) => setSelectedHouseholdId(event.target.value || null)}
            className="w-full max-w-md rounded-md border border-border bg-background px-3 py-2"
          >
            {households.map((household) => (
              <option key={household.id} value={household.id}>
                {household.name}
              </option>
            ))}
          </select>
        )}
        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      </section>

      <section className="rounded-xl border border-border p-4">
        <h2 className="mb-3 text-lg font-semibold">Add member by email</h2>
        <form onSubmit={onInviteMember} className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input
            type="email"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            placeholder="family@example.com"
            className="rounded-md border border-border bg-background px-3 py-2"
            required
          />
          <select
            value={inviteRole}
            onChange={(event) => setInviteRole(event.target.value as 'admin' | 'member')}
            className="rounded-md border border-border bg-background px-3 py-2"
          >
            <option value="member">member</option>
            <option value="admin">admin</option>
          </select>
          <button
            type="submit"
            disabled={!selectedHouseholdId}
            className="rounded-md bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add member
          </button>
        </form>
        {status ? <p className="mt-2 text-sm text-green-700">{status}</p> : null}
      </section>

      <section className="rounded-xl border border-border p-4">
        <h2 className="mb-3 text-lg font-semibold">Current members</h2>
        {memberError ? (
          <p className="text-sm text-red-700">{memberError}</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-foreground/70">No members loaded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-2 font-semibold">Email</th>
                  <th className="px-2 py-2 font-semibold">Role</th>
                  <th className="px-2 py-2 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.userId} className="border-b border-border/60">
                    <td className="px-2 py-2">{member.email ?? '—'}</td>
                    <td className="px-2 py-2">{member.role}</td>
                    <td className="px-2 py-2">{new Date(member.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
