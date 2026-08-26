import { useState } from 'react'
import FaceCapture from './FaceCapture'

const API_URL = import.meta.env.VITE_API_URL

function Login({ onAuth }) {
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [faceDescriptor, setFaceDescriptor] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpStep, setOtpStep] = useState(false)
  const [otp, setOtp] = useState('')

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

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || 'Something went wrong')
      }

      if (isSignup) {
        const data = await res.json()
        localStorage.setItem('token', data.token)
        localStorage.setItem('email', data.email)
        onAuth(data)
      } else {
        setOtpStep(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || 'Invalid OTP')
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

  const StepIndicator = ({ step }) => (
    <div className="flex items-center gap-1.5 mb-6">
      {['Details', 'Face', 'OTP'].map((label, idx) => {
        const stepNum = idx + 1
        const isActive = step === stepNum
        const isDone = step > stepNum
        return (
          <div key={label} className="flex items-center gap-1.5 flex-1">
            <div
              className={`h-1 rounded-full flex-1 transition-colors ${
                isDone || isActive ? 'bg-accent' : 'bg-border-soft'
              }`}
            />
          </div>
        )
      })}
    </div>
  )

  if (otpStep) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-surface border border-border-soft rounded-2xl p-8 shadow-2xl shadow-black/40">
        <StepIndicator step={3} />

        <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mb-5">
          <svg width="22" height="22" viewBox="0 0 24 24" className="text-accent">
            <path d="M3 7l9 6 9-6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"
              fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <p className="font-display font-semibold text-xl text-text-primary mb-1.5">
          Check your email
        </p>
        <p className="text-sm text-text-muted mb-6 leading-relaxed">
          We sent a 6-digit verification code to <span className="text-text-primary">{email}</span>. Enter it below to finish signing in.
        </p>

        <input
          type="text"
          placeholder="000000"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
          autoFocus
          className="w-full bg-ink border border-border-soft focus:border-accent rounded-lg px-3 py-3 text-text-primary outline-none mb-4 tracking-[0.5em] text-center text-xl font-mono transition-colors"
        />

        {error && (
          <div className="flex items-start gap-2 mb-4 text-sm text-danger">
            <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleVerifyOtp}
          disabled={loading || otp.length !== 6}
          className="w-full bg-accent hover:bg-accent-dim transition-colors text-ink font-semibold py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify & continue'}
        </button>

        <button
          onClick={() => setOtpStep(false)}
          className="w-full text-center text-sm text-text-muted hover:text-text-primary mt-4 transition-colors"
        >
          ← Back
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-20 bg-surface border border-border-soft rounded-2xl p-8 shadow-2xl shadow-black/40">
      <StepIndicator step={isSignup ? 1 : 1} />

      <p className="font-display font-semibold text-xl text-text-primary mb-1">
        {isSignup ? 'Create your account' : 'Welcome back'}
      </p>
      <p className="text-sm text-text-muted mb-6">
        {isSignup
          ? 'Secured with password, face verification, and email OTP.'
          : 'Sign in to continue to your account.'}
      </p>

      <div className="space-y-3 mb-4">
        {isSignup && (
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-ink border border-border-soft focus:border-accent rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors"
          />
        )}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-ink border border-border-soft focus:border-accent rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-ink border border-border-soft focus:border-accent rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none transition-colors"
        />
      </div>

      <div className="mb-4 p-4 bg-ink border border-border-soft rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <svg width="14" height="14" viewBox="0 0 24 24" className="text-accent">
            <path d="M12 2a5 5 0 015 5v3M7 10V7a5 5 0 0110 0M5 10h14v9a2 2 0 01-2 2H7a2 2 0 01-2-2v-9z"
              fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-xs text-text-muted uppercase tracking-wider">Face verification required</p>
        </div>
        <FaceCapture onCapture={setFaceDescriptor} buttonLabel="Scan face" />
      </div>

      {error && (
        <div className="flex items-start gap-2 mb-4 text-sm text-danger">
          <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-accent hover:bg-accent-dim transition-colors text-ink font-semibold py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Continue'}
      </button>

      <p className="text-center text-sm text-text-muted mt-5">
        {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => {
            setIsSignup(!isSignup)
            setFaceDescriptor(null)
            setError('')
          }}
          className="text-accent hover:text-accent-dim underline underline-offset-2 transition-colors"
        >
          {isSignup ? 'Sign in' : 'Sign up'}
        </button>
      </p>
    </div>
  )
}

export default Login
