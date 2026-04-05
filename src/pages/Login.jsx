import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'   // signUp / signIn


// //sign up
// supabase.auth.signUp({email, password})


// //sign in
// supabase.auth.signInWithPassword({email, password})

// //google OAuth
// supabase.auth.signInWithOAuth({provider: 'google'})


const Login = () => {
    const navigate = useNavigate()
    const [mode, setMode] = useState('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')


    const handleSubmit = async() => {
        setError(''); setLoading(true)
        try {
            if (mode === 'signup') {
                const {error} = await supabase.auth.signUp({email, password})
                if (error) throw error
                setSuccess('Check your email to confirm your account!')
            } else {
                const {error} = await supabase.auth.signInWithPassword({email, password})
                if (error) throw error
                navigate('/')
            }
        } catch (err) {setError(err.message)} finally { setLoading(false)}
    }

    return (
        <div className="bg-cream min-h-screen flex items-start justify-center pt-14 px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                <div className="font-serif font-bold text-4xl text-ink mb-2">
                    hobby<span className="text-rose-deep">find</span>
                </div>
                <p className="text-sm text-muted">{mode === 'login' ? 'Welcome back' : 'Create your account'}</p>
                </div>

                {success ? (
                <div className="bg-sage-light border border-sage rounded-xl p-4 text-sage-deep text-sm text-center">{success}</div>
                ) : (
                <>
                    {error && <div className="bg-rose-light border border-rose rounded-xl p-3 text-rose-dark text-sm mb-4">{error}</div>}

                    <div className="space-y-3 mb-4">
                    <div className="bg-white border border-surface2 rounded-xl flex items-center gap-2 px-4 py-3">
                        <span className="text-muted text-sm">✉</span>
                        <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="bg-transparent border-none outline-none text-ink text-sm flex-1 placeholder-muted/60 font-sans" />
                    </div>
                    <div className="bg-white border border-surface2 rounded-xl flex items-center gap-2 px-4 py-3">
                        <span className="text-muted text-sm">🔒</span>
                        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                        className="bg-transparent border-none outline-none text-ink text-sm flex-1 placeholder-muted/60 font-sans" />
                    </div>
                    </div>

                    <button onClick={handleSubmit} disabled={loading}
                    className="w-full bg-rose-deep hover:bg-rose-dark text-white font-semibold py-3.5 rounded-xl text-sm transition-colors mb-3 disabled:opacity-50">
                    {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
                    </button>

                    <div className="text-center text-muted text-xs mb-3">or</div>

                    <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
                    className="w-full bg-white border border-surface2 hover:border-rose rounded-xl py-3 text-sm text-ink2 transition-colors mb-6 font-sans">
                    G&nbsp;&nbsp;Continue with Google
                    </button>

                    <div className="text-center text-xs text-muted">
                    {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-rose-deep hover:text-rose-dark font-medium">
                        {mode === 'login' ? 'Sign up' : 'Sign in'}
                    </button>
                    </div>
                </>
                )}
            </div>
        </div>
        
    )
}
export default Login