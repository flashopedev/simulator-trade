'use client'

import { useState } from 'react'

interface AuthFormProps {
  onSignUp: (email: string, password: string) => Promise<{ error: unknown }>
  onSignIn: (email: string, password: string) => Promise<{ error: unknown }>
  onClose: () => void
}

export function AuthForm({ onSignUp, onSignIn, onClose }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const fn = mode === 'login' ? onSignIn : onSignUp
    const result = await fn(email, password)

    if (result.error) {
      setError(String((result.error as { message?: string })?.message || result.error))
    } else {
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(0,0,0,0.7)] backdrop-blur-sm">
      <div className="bg-s2 border border-brd rounded-lg p-6 w-[320px] max-w-[90vw]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-t1 text-[14px] font-bold">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-t4 hover:text-t1 text-[18px] cursor-pointer bg-transparent border-0"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] text-t3 font-medium block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-s1 border border-brd rounded py-2 px-3 text-t1 text-[12px] outline-0 focus:border-t4 transition-colors"
              required
            />
          </div>
          <div>
            <label className="text-[10px] text-t3 font-medium block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-s1 border border-brd rounded py-2 px-3 text-t1 text-[12px] outline-0 focus:border-t4 transition-colors"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="text-red text-[11px] bg-red2 p-2 rounded border border-[rgba(239,68,68,0.25)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-acc text-black font-bold text-[12px] rounded cursor-pointer border-0 hover:brightness-110 disabled:opacity-50 transition-all"
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-3 text-center">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError('')
            }}
            className="text-[11px] text-acc bg-transparent border-0 cursor-pointer hover:underline"
          >
            {mode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  )
}
