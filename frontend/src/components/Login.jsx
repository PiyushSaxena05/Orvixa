import { useState } from 'react'
import FaceCapture from './FaceCapture'

function Login({ onAuth }) {
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [faceDescriptor, setFaceDescriptor] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')

    if (!faceDescriptor) {
      setError('Please complete face scan first')
      return
    }

    setLoading(true)
    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login'
      const body = isSignup
        ? { email, password, fullName, faceDescriptor: JSON.stringify(faceDescriptor) }
        : { email, password, faceDescriptor: JSON.stringify(faceDescriptor) }

      const res = await fetch(`http://localhost:8080${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || 'Something went wrong')
      }

      const data = await res.json()
      localStorage.setItem('token', data.token)
      localStorage.setItem('email', data.email)
      onAuth(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-24 bg-surface border border-border-soft rounded-2xl p-8">
      <p className="font-mono text-[11px] text-text-muted uppercase tracking-widest mb-6">
        {isSignup ? 'Create Account' : 'Login'}
      </p>

      {isSignup && (
        <input
          type="text"
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full bg-ink border border-border-soft rounded-lg px-3 py-2 text-sm text-text-primary outline-none mb-3"
        />
      )}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full bg-ink border border-border-soft rounded-lg px-3 py-2 text-sm text-text-primary outline-none mb-3"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full bg-ink border border-border-soft rounded-lg px-3 py-2 text-sm text-text-primary outline-none mb-3"
      />

      <div className="mb-3 p-3 bg-ink rounded-lg">
        <p className="text-xs text-text-muted mb-2">Face verification required</p>
        <FaceCapture onCapture={setFaceDescriptor} buttonLabel="Scan Face" />
      </div>

      {error && <p className="text-sm text-danger mb-3">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-brass hover:bg-brass-dim transition-colors text-ink font-medium py-3 rounded-xl disabled:opacity-50"
      >
        {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Login'}
      </button>

      <p className="text-center text-sm text-text-muted mt-4">
        {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => {
            setIsSignup(!isSignup)
            setFaceDescriptor(null)
          }}
          className="text-brass underline"
        >
          {isSignup ? 'Login' : 'Sign Up'}
        </button>
      </p>
    </div>
  )
}

export default Login
