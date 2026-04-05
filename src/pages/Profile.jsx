import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import useAuth from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const HOBBY_PILLS = [
  { name: '🎨 Watercolor', bg: 'bg-blush text-rose-dark border-rose/30' },
  { name: '🏃 Running', bg: 'bg-sage-light text-sage-deep border-sage/30' },
  { name: '🍳 Cooking', bg: 'bg-gold-light text-gold border-gold/30' },
]

const Profile = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [savedEvents, setSavedEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('saved_events').select('*').eq('user_id', user.id).then(({ data }) => {
      setSavedEvents(data ?? [])
      setLoading(false)
    })
  }, [user])

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : '??'

  return (
    <div className="bg-cream min-h-screen px-4 py-5">
      <div className="bg-white border border-rose-light/40 rounded-2xl p-4 flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-full bg-rose-light border-2 border-rose flex items-center justify-center text-rose-dark text-lg font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-ink">{user?.email}</div>
          <div className="text-xs text-muted mt-0.5">Member since 2025</div>
        </div>
        <button className="text-xs text-muted border border-surface2 rounded-lg px-3 py-1.5 bg-white hover:border-rose transition-colors">Edit</button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white border border-rose-light/40 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-rose-deep">{savedEvents.length}</div>
          <div className="text-xs text-muted mt-1">Events saved</div>
        </div>
        <div className="bg-white border border-rose-light/40 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-lavender-deep">3</div>
          <div className="text-xs text-muted mt-1">Hobbies explored</div>
        </div>
      </div>

      <div className="bg-white border border-rose-light/40 rounded-2xl p-4 mb-4">
        <div className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-3">My hobbies</div>
        <div className="flex flex-wrap gap-2">
          {HOBBY_PILLS.map((h) => (
            <span key={h.name} className={`text-xs font-medium px-3 py-1.5 rounded-full border ${h.bg}`}>{h.name}</span>
          ))}
          <span className="text-xs font-medium px-3 py-1.5 rounded-full border border-dashed border-rose/40 text-rose-deep cursor-pointer">+ Add</span>
        </div>
      </div>

      <div className="bg-white border border-rose-light/40 rounded-2xl p-4 mb-4">
        <div className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-3">Preferences</div>
        {[
          { label: 'Beginner-friendly only', sub: 'Filter to intro-level events', on: true },
          { label: 'Free events only', sub: 'Hide paid events', on: false },
          { label: 'Nearby notifications', sub: 'Alert for events near you', on: true },
        ].map((s) => (
          <div key={s.label} className="flex items-center justify-between py-2.5 border-b border-surface last:border-0">
            <div>
              <div className="text-sm text-ink font-medium">{s.label}</div>
              <div className="text-xs text-muted">{s.sub}</div>
            </div>
            <div className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${s.on ? 'bg-rose-deep' : 'bg-surface2'}`}>
              <div className={`absolute w-3.5 h-3.5 bg-white rounded-full top-0.5 transition-all ${s.on ? 'right-0.5' : 'left-0.5'}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-rose-light/40 rounded-2xl p-4 mb-4">
        <div className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-3">Saved events</div>
        {loading ? <div className="text-muted text-sm">Loading...</div>
          : savedEvents.length === 0 ? <div className="text-muted text-sm">No saved events yet.</div>
          : <div className="space-y-2">{savedEvents.map((e) => (
              <div key={e.id} className="flex justify-between items-center">
                <span className="text-sm text-ink">{e.event_title}</span>
                <span className="text-xs text-muted">{e.event_date}</span>
              </div>
            ))}</div>
        }
      </div>

      <button onClick={async () => { await signOut(); navigate('/') }}
        className="w-full border border-rose/30 bg-white hover:bg-rose-light text-rose-deep font-semibold py-3 rounded-xl text-sm transition-colors">
        Sign out
      </button>
    </div>
  )
}
export default Profile
