import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const inputStyle = {
  width: '100%',
  background: '#fff',
  border: '1.5px solid #EDE5DC',
  borderRadius: '12px',
  padding: '14px 16px',
  fontSize: '15px',
  color: '#2A1F2D',
  outline: 'none',
  fontFamily: 'DM Sans, system-ui, sans-serif',
  boxSizing: 'border-box',
  display: 'block',
  marginTop: '6px',
}

const Login = () => {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleSubmit = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return }
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('Check your email to confirm your account!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/home')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: '#F9ECF1',
        padding: '52px 24px 36px',
        textAlign: 'center',
        borderBottom: '1px solid #F0E0E8',
      }}>
        <div style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontWeight: 700,
          fontSize: '40px',
          color: '#2A1F2D',
          letterSpacing: '-.02em',
          marginBottom: '8px',
        }}>
          hobby<span style={{ color: '#C96E8A' }}>find</span>
        </div>
        <div style={{ fontSize: '15px', color: '#7A6880', fontWeight: 400 }}>
          {mode === 'login' ? 'Welcome back 👋' : 'Create your account ✨'}
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: '32px 24px', maxWidth: '440px', margin: '0 auto' }}>

        {success ? (
          <div style={{
            background: '#DCF0E2', border: '1px solid #A8C4B0',
            borderRadius: '16px', padding: '24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>✉️</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#5A8C6A', marginBottom: '6px' }}>
              Check your inbox
            </div>
            <div style={{ fontSize: '14px', color: '#5A8C6A' }}>{success}</div>
          </div>
        ) : (
          <>
            {error && (
              <div style={{
                background: '#FEF0F3',
                border: '1.5px solid #F0C0C8',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                color: '#C96E8A',
                marginBottom: '20px',
                fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            {/* Email field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                fontSize: '12px', fontWeight: 600,
                color: '#4A3850', letterSpacing: '.06em',
                textTransform: 'uppercase', display: 'block',
              }}>
                Email address
              </label>
              <input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                onFocus={e => e.target.style.borderColor = '#C96E8A'}
                onBlur={e => e.target.style.borderColor = '#EDE5DC'}
                style={inputStyle}
              />
            </div>

            {/* Password field */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontSize: '12px', fontWeight: 600,
                color: '#4A3850', letterSpacing: '.06em',
                textTransform: 'uppercase', display: 'block',
              }}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                onFocus={e => e.target.style.borderColor = '#C96E8A'}
                onBlur={e => e.target.style.borderColor = '#EDE5DC'}
                style={inputStyle}
              />
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%',
                background: '#C96E8A',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: loading ? 'default' : 'pointer',
                fontFamily: 'DM Sans, system-ui, sans-serif',
                marginBottom: '20px',
                opacity: loading ? 0.7 : 1,
                letterSpacing: '.01em',
              }}
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{ flex: 1, height: '1px', background: '#EDE5DC' }} />
              <span style={{ fontSize: '13px', color: '#B07090' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: '#EDE5DC' }} />
            </div>

            {/* Google button */}
            <button
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
              style={{
                width: '100%',
                background: '#fff',
                border: '1.5px solid #EDE5DC',
                borderRadius: '14px',
                padding: '14px',
                fontSize: '15px',
                color: '#2A1F2D',
                cursor: 'pointer',
                fontFamily: 'DM Sans, system-ui, sans-serif',
                marginBottom: '28px',
                fontWeight: 500,
              }}
            >
              🔍 &nbsp;Continue with Google
            </button>

            {/* Switch mode */}
            <div style={{ textAlign: 'center', fontSize: '14px', color: '#7A6880' }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <span
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
                style={{
                  color: '#C96E8A',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textDecorationColor: 'rgba(201,110,138,0.3)',
                }}
              >
                {mode === 'login' ? 'Sign up free' : 'Sign in'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Login