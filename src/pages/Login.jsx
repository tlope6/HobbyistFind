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
  marginTop: '8px',
  transition: 'border-color 0.15s',
}

const Login = () => {
  const navigate = useNavigate()
  const [screen, setScreen] = useState('landing')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const reset = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess('')
  }

  const goTo = (s) => { reset(); setScreen(s) }

  const handleSignIn = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return }
    setError(''); setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      navigate('/home')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleSignUp = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setError(''); setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      setSuccess('Account created! Check your email to confirm.')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/home`
      }
    })
    if (error) setError(error.message)
  }

  // Shared header
  const Header = ({ title, subtitle, showBack, backTo }) => (
    <div style={{ background: '#F9ECF1', padding: '0 0 28px', borderBottom: '1px solid #F0E0E8' }}>
      {showBack && (
        <div style={{ padding: '16px 20px 0' }}>
          <button onClick={() => goTo(backTo)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            color: '#7A6880', fontSize: '14px', fontWeight: 500,
            fontFamily: 'DM Sans, system-ui, sans-serif', padding: '8px 0'
          }}>
            <span style={{ fontSize: '20px', lineHeight: 1 }}>←</span>
            Back
          </button>
        </div>
      )}
      <div style={{ padding: showBack ? '16px 24px 0' : '52px 24px 0', textAlign: 'center' }}>
        <div style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontWeight: 700, fontSize: '36px', color: '#2A1F2D',
          letterSpacing: '-.02em', marginBottom: '8px'
        }}>
          hobby<span style={{ color: '#C96E8A' }}>find</span>
        </div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#2A1F2D', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '14px', color: '#7A6880' }}>{subtitle}</div>
      </div>
    </div>
  )

  const ErrorBox = () => error ? (
    <div style={{
      background: '#FEF0F3', border: '1.5px solid #F0C0C8',
      borderRadius: '12px', padding: '12px 16px',
      fontSize: '14px', color: '#C96E8A', marginBottom: '20px', fontWeight: 500
    }}>{error}</div>
  ) : null

  const SuccessBox = () => success ? (
    <div style={{
      background: '#DCF0E2', border: '1px solid #A8C4B0',
      borderRadius: '12px', padding: '16px',
      fontSize: '14px', color: '#5A8C6A', marginBottom: '20px',
      fontWeight: 500, textAlign: 'center'
    }}>
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>✉️</div>
      {success}
    </div>
  ) : null

  // LANDING SCREEN
  if (screen === 'landing') {
    return (
      <div style={{ background: '#FAF7F4', minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
        <Header title="Discover hobbies near you" subtitle="Sign in or create a free account" showBack={false} />

        <div style={{ padding: '32px 24px', maxWidth: '440px', margin: '0 auto' }}>

          {/* Google button — most prominent */}
          <button onClick={handleGoogle} style={{
            width: '100%', background: '#fff',
            border: '2px solid #EDE5DC', borderRadius: '14px',
            padding: '16px', fontSize: '16px', fontWeight: 600,
            color: '#2A1F2D', cursor: 'pointer',
            fontFamily: 'DM Sans, system-ui, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            marginBottom: '16px', transition: 'border-color 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#C96E8A'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#EDE5DC'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ flex: 1, height: '1px', background: '#EDE5DC' }} />
            <span style={{ fontSize: '13px', color: '#B07090' }}>or use email</span>
            <div style={{ flex: 1, height: '1px', background: '#EDE5DC' }} />
          </div>

          {/* Email sign in */}
          <button onClick={() => goTo('signin')} style={{
            width: '100%', background: '#C96E8A', color: '#fff',
            border: 'none', borderRadius: '14px', padding: '16px',
            fontSize: '16px', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'DM Sans, system-ui, sans-serif', marginBottom: '12px'
          }}>Sign in with email</button>

          {/* Create account */}
          <button onClick={() => goTo('signup')} style={{
            width: '100%', background: '#fff',
            border: '1.5px solid #EDE5DC', borderRadius: '14px',
            padding: '15px', fontSize: '16px', fontWeight: 600,
            color: '#2A1F2D', cursor: 'pointer',
            fontFamily: 'DM Sans, system-ui, sans-serif'
          }}>Create a free account</button>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#B07090', marginTop: '24px', lineHeight: 1.6 }}>
            By continuing you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    )
  }

  // SIGN IN SCREEN
  if (screen === 'signin') {
    return (
      <div style={{ background: '#FAF7F4', minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
        <Header title="Welcome back 👋" subtitle="Sign in to your account" showBack backTo="landing" />

        <div style={{ padding: '32px 24px', maxWidth: '440px', margin: '0 auto' }}>
          <ErrorBox />

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#4A3850', letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Email address
            </label>
            <input type="email" placeholder="you@email.com" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignIn()}
              onFocus={e => e.target.style.borderColor = '#C96E8A'}
              onBlur={e => e.target.style.borderColor = '#EDE5DC'}
              style={inputStyle} />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#4A3850', letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Password
            </label>
            <input type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignIn()}
              onFocus={e => e.target.style.borderColor = '#C96E8A'}
              onBlur={e => e.target.style.borderColor = '#EDE5DC'}
              style={inputStyle} />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '24px' }}>
            <span style={{ fontSize: '13px', color: '#C96E8A', cursor: 'pointer', fontWeight: 600 }}>
              Forgot password?
            </span>
          </div>

          <button onClick={handleSignIn} disabled={loading} style={{
            width: '100%', background: '#C96E8A', color: '#fff',
            border: 'none', borderRadius: '14px', padding: '16px',
            fontSize: '16px', fontWeight: 600, cursor: loading ? 'default' : 'pointer',
            fontFamily: 'DM Sans, system-ui, sans-serif',
            opacity: loading ? 0.7 : 1, marginBottom: '20px'
          }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: '#EDE5DC' }} />
            <span style={{ fontSize: '13px', color: '#B07090' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#EDE5DC' }} />
          </div>

          <button onClick={handleGoogle} style={{
            width: '100%', background: '#fff',
            border: '1.5px solid #EDE5DC', borderRadius: '14px',
            padding: '14px', fontSize: '15px', color: '#2A1F2D',
            cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            marginBottom: '24px'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ textAlign: 'center', fontSize: '14px', color: '#7A6880' }}>
            Don't have an account?{' '}
            <span onClick={() => goTo('signup')} style={{ color: '#C96E8A', fontWeight: 600, cursor: 'pointer' }}>
              Sign up free
            </span>
          </div>
        </div>
      </div>
    )
  }

  // SIGN UP SCREEN
  if (screen === 'signup') {
    return (
      <div style={{ background: '#FAF7F4', minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
        <Header title="Create your account ✨" subtitle="Join and discover hobbies near you" showBack backTo="landing" />

        <div style={{ padding: '32px 24px', maxWidth: '440px', margin: '0 auto' }}>
          <ErrorBox />
          <SuccessBox />

          {!success && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#4A3850', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                  Email address
                </label>
                <input type="email" placeholder="you@email.com" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#C96E8A'}
                  onBlur={e => e.target.style.borderColor = '#EDE5DC'}
                  style={inputStyle} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#4A3850', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                  Password
                </label>
                <input type="password" placeholder="At least 6 characters" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#C96E8A'}
                  onBlur={e => e.target.style.borderColor = '#EDE5DC'}
                  style={inputStyle} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#4A3850', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                  Confirm password
                </label>
                <input type="password" placeholder="Repeat your password" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSignUp()}
                  onFocus={e => e.target.style.borderColor = '#C96E8A'}
                  onBlur={e => e.target.style.borderColor = '#EDE5DC'}
                  style={inputStyle} />
              </div>

              <button onClick={handleSignUp} disabled={loading} style={{
                width: '100%', background: '#C96E8A', color: '#fff',
                border: 'none', borderRadius: '14px', padding: '16px',
                fontSize: '16px', fontWeight: 600, cursor: loading ? 'default' : 'pointer',
                fontFamily: 'DM Sans, system-ui, sans-serif',
                opacity: loading ? 0.7 : 1, marginBottom: '20px'
              }}>
                {loading ? 'Creating account...' : 'Create account'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                <div style={{ flex: 1, height: '1px', background: '#EDE5DC' }} />
                <span style={{ fontSize: '13px', color: '#B07090' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: '#EDE5DC' }} />
              </div>

              <button onClick={handleGoogle} style={{
                width: '100%', background: '#fff',
                border: '1.5px solid #EDE5DC', borderRadius: '14px',
                padding: '14px', fontSize: '15px', color: '#2A1F2D',
                cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                marginBottom: '24px'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </button>

              <div style={{ textAlign: 'center', fontSize: '14px', color: '#7A6880' }}>
                Already have an account?{' '}
                <span onClick={() => goTo('signin')} style={{ color: '#C96E8A', fontWeight: 600, cursor: 'pointer' }}>
                  Sign in
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }
}

export default Login