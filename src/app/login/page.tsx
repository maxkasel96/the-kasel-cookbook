'use client'

import { supabaseBrowserClient } from '@/lib/supabase/client'

export default function LoginPage() {
  async function signInWithGoogle() {
    const origin = window.location.origin
    await supabaseBrowserClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border p-6">
        <h1 className="text-2xl font-bold mb-4">Sign in</h1>
        <button
          onClick={signInWithGoogle}
          className="w-full rounded-md bg-black text-white py-2"
        >
          Continue with Google
        </button>
      </div>
    </main>
  )
}
