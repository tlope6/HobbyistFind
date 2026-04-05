import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import useAuth from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const STYLES = {
  Art:     { bg: 'bg-blush',          tag: 'text-rose-deep bg-blush',            icon: '🎨' },
  Music:   { bg: 'bg-lavender-light', tag: 'text-lavender-deep bg-lavender-light', icon: '🎸' },
  Fitness: { bg: 'bg-sage-light',     tag: 'text-sage-deep bg-sage-light',       icon: '🏃' },
  Cooking: { bg: 'bg-gold-light',     tag: 'text-gold bg-gold-light',            icon: '🍳' },
  Tech:    { bg: 'bg-lavender-light', tag: 'text-lavender-deep bg-lavender-light', icon: '💻' },
  Outdoors:{ bg: 'bg-sage-light',     tag: 'text-sage-deep bg-sage-light',       icon: '🏕' },
  Event:   { bg: 'bg-surface',        tag: 'text-muted bg-surface',              icon: '📅' },
}

const EventCard = ({ event }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const s = STYLES[event.category] ?? STYLES.Event
  const isToday = event.date === new Date().toISOString().split('T')[0]

  const handleSignUp = async () => {
    if (!user) { navigate('/login'); return }
    setSaving(true)
    try {
      await supabase.from('saved_events').upsert({ user_id: user.id, event_id: event.id, event_source: event.source, event_title: event.title, event_date: event.date, event_url: event.url })
      setSaved(true)
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  return (
    <div className="bg-white border border-rose-light/40 rounded-xl p-3 flex gap-3 hover:border-rose/60 transition-all">
      <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center text-xl flex-shrink-0`}>{s.icon}</div>
      <div className="flex-1 min-w-0">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${s.tag} inline-block mb-1`}>{event.category}</span>
        <div className="text-sm font-medium text-ink truncate mb-0.5">{event.title}</div>
        <div className="text-xs text-muted">{event.distance && `📍 ${event.distance} · `}{event.time && `${event.time} · `}{event.price}</div>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        {isToday && <span className="text-[9px] font-bold text-sage-deep bg-sage-light border border-sage rounded px-1.5 py-0.5">TODAY</span>}
        <button onClick={handleSignUp} disabled={saved || saving}
          className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${saved ? 'bg-sage-light text-sage-deep cursor-default' : 'bg-rose-deep hover:bg-rose-dark text-white'}`}>
          {saved ? '✓ Saved' : saving ? '...' : 'Sign up'}
        </button>
      </div>
    </div>
  )
}
export default EventCard
