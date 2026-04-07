import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import useAuth from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const CAT = {
  Music:           { bg: '#EDE8F6', color: '#8B72C8', icon: '🎸' },
  Art:             { bg: '#F9ECF1', color: '#C96E8A', icon: '🎨' },
  'Arts & Theatre':{ bg: '#F9ECF1', color: '#C96E8A', icon: '🎭' },
  Fitness:         { bg: '#DCF0E2', color: '#5A8C6A', icon: '🏃' },
  Sports:          { bg: '#DCF0E2', color: '#5A8C6A', icon: '⚽' },
  Cooking:         { bg: '#FAF0DC', color: '#D4A84B', icon: '🍳' },
  Tech:            { bg: '#EDE8F6', color: '#8B72C8', icon: '💻' },
  Outdoors:        { bg: '#DCF0E2', color: '#5A8C6A', icon: '🏕' },
  Miscellaneous:   { bg: '#F4EFE9', color: '#7A6880', icon: '✨' },
  Undefined:       { bg: '#F4EFE9', color: '#7A6880', icon: '📅' },
}

const fmtTime = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hr = parseInt(h)
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`
}

const fmtDate = (d) => {
  if (!d) return ''
  const today = new Date().toISOString().split('T')[0]
  const tom = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  if (d === today) return 'Today'
  if (d === tom) return 'Tomorrow'
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const EventCard = ({ event }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const s = CAT[event.category] ?? CAT.Undefined
  const isToday = event.date === new Date().toISOString().split('T')[0]

  const handleSignUp = async () => {
        if (!user) { navigate('/login'); return }
        setSaving(true)
        try {
            const { error } = await supabase.from('saved_events').upsert({
            user_id: user.id,
            event_id: event.id,
            event_source: event.source,
            event_title: event.title,
            event_date: event.date,
            event_url: event.url,
            }, {
            onConflict: 'user_id,event_id'
            })
            if (error) throw error
            setSaved(true)
        } catch (err) {
            console.error('Save error:', err)
            alert('Could not save event. Please try again.')
        } finally {
            setSaving(false)
        }
    }

  return (
    <div style={{
      background: '#fff', borderRadius: '16px',
      border: '1px solid #F0E8E4', marginBottom: '14px',
      overflow: 'hidden', fontFamily: 'DM Sans, system-ui, sans-serif',
    }}>
      {/* Image or colored banner */}
      {event.image ? (
        <div style={{ position: 'relative', height: '160px', overflow: 'hidden', background: s.bg }}>
          <img src={event.image} alt={event.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.target.style.display = 'none' }} />
          {isToday && (
            <div style={{
              position: 'absolute', top: '10px', left: '10px',
              background: '#C96E8A', color: '#fff', fontSize: '10px',
              fontWeight: 700, padding: '3px 10px', borderRadius: '20px', letterSpacing: '.05em'
            }}>TODAY</div>
          )}
        </div>
      ) : (
        <div style={{
          height: '72px', background: s.bg, display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: '30px', position: 'relative'
        }}>
          {s.icon}
          {isToday && (
            <div style={{
              position: 'absolute', top: '10px', left: '10px',
              background: '#C96E8A', color: '#fff', fontSize: '10px',
              fontWeight: 700, padding: '3px 10px', borderRadius: '20px'
            }}>TODAY</div>
          )}
        </div>
      )}

      {/* Body */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{
            fontSize: '10px', fontWeight: 700, color: s.color,
            background: s.bg, padding: '3px 10px', borderRadius: '20px', letterSpacing: '.05em'
          }}>{(event.category || 'Event').toUpperCase()}</span>
          <span style={{ fontSize: '12px', color: '#7A6880' }}>
            {fmtDate(event.date)}{event.time ? ` · ${fmtTime(event.time)}` : ''}
          </span>
        </div>

        <div style={{ fontSize: '16px', fontWeight: 600, color: '#2A1F2D', lineHeight: 1.3, marginBottom: '6px' }}>
          {event.title}
        </div>

        {event.venue && (
          <div style={{ fontSize: '13px', color: '#7A6880', marginBottom: '12px' }}>
            📍 {event.venue}{event.distance ? ` · ${event.distance}` : ''}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{
            fontSize: '16px', fontWeight: 700,
            color: event.price === 'Free' ? '#5A8C6A' : '#2A1F2D'
          }}>
            {event.price === 'Free' ? '✓ Free' : event.price}
          </div>
          <button onClick={handleSignUp} disabled={saved || saving} style={{
            background: saved ? '#DCF0E2' : '#C96E8A',
            color: saved ? '#5A8C6A' : '#fff',
            border: 'none', borderRadius: '50px',
            padding: '9px 22px', fontSize: '13px', fontWeight: 600,
            cursor: saved ? 'default' : 'pointer',
            fontFamily: 'DM Sans, system-ui, sans-serif',
          }}>
            {saved ? '✓ Saved' : saving ? '...' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EventCard
