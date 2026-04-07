import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import useAuth from '../hooks/useAuth'
import useEvents from '../hooks/useEvents'
import EventCard from '../components/EventCard'

const CATS = ['All', 'Art', 'Music', 'Fitness', 'Cooking', 'Tech', 'Outdoors']
const FILTERS = ['Today', 'This week', 'Free', 'Beginner friendly']
const SORT_OPTIONS = ['Date', 'Price: Free first', 'Distance']
const STAR_LABELS = ['', 'Not for me', 'It was okay', 'Pretty good', 'Really enjoyed it', 'Loved it!']

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

const Events = () => {
  const { location, activeCategory, setActiveCategory, radius } = useAppContext()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [activeFilter, setActiveFilter] = useState('')
  const [sortBy, setSortBy] = useState('Date')
  const [showSort, setShowSort] = useState(false)

  // Rating state
  const [ratingEvent, setRatingEvent] = useState(null)
  const [starHover, setStarHover] = useState(0)
  const [starSelected, setStarSelected] = useState(0)
  const [ratingNote, setRatingNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [ratingDone, setRatingDone] = useState(false)

  const { events, loading } = useEvents(
    location,
    activeCategory === 'All' ? '' : activeCategory,
    radius
  )

  const today = new Date().toISOString().split('T')[0]

  // Filter + search + sort
  let displayed = events.filter(e => {
    if (activeFilter === 'Today') return e.date === today
    if (activeFilter === 'This week') {
      const evDate = new Date(e.date)
      const now = new Date()
      const weekOut = new Date(now.getTime() + 7 * 86400000)
      return evDate >= now && evDate <= weekOut
    }
    if (activeFilter === 'Free') return e.price === 'Free' || e.price === '$0'
    return true
  }).filter(e => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      e.title?.toLowerCase().includes(q) ||
      e.venue?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q) ||
      e.city?.toLowerCase().includes(q)
    )
  })

  if (sortBy === 'Price: Free first') {
    displayed = [...displayed].sort((a, b) => {
      if (a.price === 'Free' && b.price !== 'Free') return -1
      if (b.price === 'Free' && a.price !== 'Free') return 1
      return 0
    })
  }

  const openRating = (event) => {
    if (!user) { navigate('/login'); return }
    setRatingEvent(event)
    setStarSelected(0)
    setStarHover(0)
    setRatingNote('')
    setRatingDone(false)
  }

  const closeRating = () => setRatingEvent(null)

  const submitRating = async () => {
    if (!starSelected || !ratingEvent || !user) return
    setSubmitting(true)
    try {
      await supabase.from('event_ratings').upsert({
        user_id: user.id,
        event_id: ratingEvent.id,
        event_title: ratingEvent.title,
        event_source: ratingEvent.source,
        category: ratingEvent.category,
        rating: starSelected,
        note: ratingNote,
        created_at: new Date().toISOString(),
      }, { onConflict: 'user_id,event_id' })
      setRatingDone(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', paddingBottom: '100px' }}>

      {/* Rating modal overlay */}
      {ratingEvent && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(42,31,45,0.5)',
          zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }} onClick={e => { if (e.target === e.currentTarget) closeRating() }}>
          <div style={{
            background: '#FAF7F4', borderRadius: '24px 24px 0 0',
            padding: '24px 24px 40px', width: '100%', maxWidth: '540px',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            {/* Handle bar */}
            <div style={{ width: '40px', height: '4px', background: '#EDE5DC', borderRadius: '2px', margin: '0 auto 20px' }} />

            {ratingDone ? (
              <div style={{ textAlign: 'center', padding: '20px 0 10px' }}>
                <div style={{ fontSize: '56px', marginBottom: '14px' }}>🎉</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#2A1F2D', fontFamily: 'Playfair Display, serif', marginBottom: '8px' }}>
                  Rating saved!
                </div>
                <div style={{ fontSize: '14px', color: '#7A6880', marginBottom: '24px', lineHeight: 1.5 }}>
                  Your review is now visible on your profile. We'll use it to recommend similar events.
                </div>
                <button onClick={() => { closeRating(); navigate('/profile') }} style={{
                  background: '#C96E8A', color: '#fff', border: 'none',
                  borderRadius: '50px', padding: '12px 28px',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'DM Sans, system-ui, sans-serif', marginRight: '10px'
                }}>View in profile</button>
                <button onClick={closeRating} style={{
                  background: '#fff', color: '#7A6880',
                  border: '1px solid #EDE5DC', borderRadius: '50px',
                  padding: '12px 28px', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif'
                }}>Close</button>
              </div>
            ) : (
              <>
                <div style={{ background: '#F9ECF1', borderRadius: '16px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ fontSize: '36px' }}>🎫</div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#C96E8A', letterSpacing: '.06em', marginBottom: '4px' }}>RATING</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#2A1F2D', fontFamily: 'Playfair Display, serif', lineHeight: 1.3 }}>
                      {ratingEvent.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#7A6880', marginTop: '3px' }}>{ratingEvent.category}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#2A1F2D', marginBottom: '16px' }}>
                    How was your experience?
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star}
                        onMouseEnter={() => setStarHover(star)}
                        onMouseLeave={() => setStarHover(0)}
                        onClick={() => setStarSelected(star)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: '42px', lineHeight: 1, padding: '2px',
                          transform: (starHover || starSelected) >= star ? 'scale(1.25)' : 'scale(1)',
                          transition: 'transform 0.15s',
                          filter: (starHover || starSelected) >= star ? 'none' : 'grayscale(1) opacity(0.35)',
                        }}>⭐</button>
                    ))}
                  </div>
                  {(starHover || starSelected) > 0 && (
                    <div style={{ fontSize: '15px', color: '#C96E8A', fontWeight: 600 }}>
                      {STAR_LABELS[starHover || starSelected]}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#4A3850', letterSpacing: '.06em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    Leave a note (optional)
                  </label>
                  <textarea
                    value={ratingNote}
                    onChange={e => setRatingNote(e.target.value)}
                    placeholder="What did you enjoy? Would you try something similar?"
                    rows={3}
                    style={{
                      width: '100%', background: '#fff',
                      border: '1.5px solid #EDE5DC', borderRadius: '12px',
                      padding: '12px 14px', fontSize: '14px', color: '#2A1F2D',
                      outline: 'none', resize: 'none', boxSizing: 'border-box',
                      fontFamily: 'DM Sans, system-ui, sans-serif',
                    }}
                    onFocus={e => e.target.style.borderColor = '#C96E8A'}
                    onBlur={e => e.target.style.borderColor = '#EDE5DC'}
                  />
                </div>

                <button onClick={submitRating} disabled={!starSelected || submitting} style={{
                  width: '100%', background: starSelected ? '#C96E8A' : '#EDE5DC',
                  color: starSelected ? '#fff' : '#7A6880',
                  border: 'none', borderRadius: '14px', padding: '16px',
                  fontSize: '16px', fontWeight: 600,
                  cursor: starSelected ? 'pointer' : 'default',
                  fontFamily: 'DM Sans, system-ui, sans-serif', transition: 'all 0.2s'
                }}>
                  {submitting ? 'Saving...' : 'Submit rating'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Search bar */}
      <div style={{ padding: '14px 16px 10px', background: '#fff', borderBottom: '1px solid #F0E8E4', position: 'relative', zIndex: 10 }}>
        <div style={{
          background: '#FAF7F4', border: `1.5px solid ${searchFocused ? '#C96E8A' : '#EDE5DC'}`,
          borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '11px 16px', transition: 'border-color 0.15s'
        }}>
          <span style={{ fontSize: '16px', color: '#B07090' }}>🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: '#2A1F2D', fontSize: '15px', flex: 1,
              fontFamily: 'DM Sans, system-ui, sans-serif'
            }}
            placeholder="Search events, venues, categories..."
          />
          {query && (
            <button onClick={() => setQuery('')} style={{
              background: '#EDE5DC', border: 'none', borderRadius: '50%',
              width: '22px', height: '22px', cursor: 'pointer', fontSize: '14px',
              color: '#7A6880', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>×</button>
          )}
        </div>

        {/* Dropdown suggestions */}
        {query && searchFocused && displayed.length > 0 && (
          <div style={{
            position: 'absolute', left: '16px', right: '16px', top: '68px',
            background: '#fff', border: '1px solid #F0E8E4', borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(42,31,45,0.12)', zIndex: 50,
            maxHeight: '240px', overflowY: 'auto'
          }}>
            {displayed.slice(0, 5).map(e => (
              <div key={`${e.source}-${e.id}`}
                onMouseDown={() => { setQuery(e.title); setSearchFocused(false) }}
                style={{
                  padding: '10px 14px', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: '10px', borderBottom: '1px solid #FAF7F4'
                }}
                onMouseEnter={el => el.currentTarget.style.background = '#FAF7F4'}
                onMouseLeave={el => el.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '18px' }}>
                  {e.category === 'Music' ? '🎸' : e.category === 'Art' ? '🎨' : e.category === 'Fitness' ? '🏃' : e.category === 'Cooking' ? '🍳' : e.category === 'Tech' ? '💻' : e.category === 'Outdoors' ? '🏕' : '📅'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#2A1F2D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                  <div style={{ fontSize: '11px', color: '#7A6880' }}>{e.category}{e.venue ? ` · ${e.venue}` : ''}</div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: e.price === 'Free' ? '#5A8C6A' : '#2A1F2D', flexShrink: 0 }}>
                  {e.price === 'Free' ? '✓ Free' : e.price}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: '8px', padding: '10px 16px 8px', overflowX: 'auto', background: '#fff' }}>
        {CATS.map(cat => {
          const active = activeCategory === cat || (cat === 'All' && !activeCategory)
          return (
            <button key={cat} onClick={() => { setActiveCategory(cat); setQuery('') }} style={{
              flexShrink: 0, padding: '6px 16px', borderRadius: '20px',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
              border: `1.5px solid ${active ? '#C96E8A' : '#EDE5DC'}`,
              background: active ? '#C96E8A' : 'transparent',
              color: active ? '#fff' : '#4A3850',
              fontFamily: 'DM Sans, system-ui, sans-serif'
            }}>{cat}</button>
          )
        })}
      </div>

      {/* Quick filters + sort */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px 12px', overflowX: 'auto', background: '#fff', borderBottom: '1px solid #F0E8E4' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setActiveFilter(activeFilter === f ? '' : f)} style={{
            flexShrink: 0, padding: '5px 14px', borderRadius: '20px',
            fontSize: '12px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
            border: `1px solid ${activeFilter === f ? '#8B72C8' : '#EDE5DC'}`,
            background: activeFilter === f ? '#8B72C8' : 'transparent',
            color: activeFilter === f ? '#fff' : '#7A6880',
            fontFamily: 'DM Sans, system-ui, sans-serif'
          }}>{f}</button>
        ))}
        <div style={{ marginLeft: 'auto', position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setShowSort(!showSort)} style={{
            padding: '5px 14px', borderRadius: '20px', fontSize: '12px',
            fontWeight: 500, cursor: 'pointer', border: '1px solid #EDE5DC',
            background: '#fff', color: '#4A3850',
            fontFamily: 'DM Sans, system-ui, sans-serif',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            ↕ {sortBy}
          </button>
          {showSort && (
            <div style={{
              position: 'absolute', right: 0, top: '34px',
              background: '#fff', border: '1px solid #F0E8E4',
              borderRadius: '10px', zIndex: 20,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)', overflow: 'hidden'
            }}>
              {SORT_OPTIONS.map(opt => (
                <button key={opt} onClick={() => { setSortBy(opt); setShowSort(false) }} style={{
                  display: 'block', width: '100%', padding: '10px 16px',
                  textAlign: 'left', fontSize: '13px', fontWeight: sortBy === opt ? 600 : 400,
                  color: sortBy === opt ? '#C96E8A' : '#2A1F2D',
                  background: sortBy === opt ? '#F9ECF1' : '#fff',
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'DM Sans, system-ui, sans-serif',
                  borderBottom: '1px solid #FAF7F4',
                  whiteSpace: 'nowrap'
                }}>{opt}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#2A1F2D', margin: 0, fontFamily: 'Playfair Display, Georgia, serif' }}>
          {query ? `"${query}"` : activeCategory && activeCategory !== 'All' ? `${activeCategory} events` : 'All events'}
        </h2>
        <span style={{ fontSize: '13px', color: '#7A6880', background: '#F4EFE9', padding: '4px 10px', borderRadius: '20px' }}>
          {loading ? '...' : `${displayed.length} found`}
        </span>
      </div>

      {/* Event list */}
      <div style={{ padding: '8px 16px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>✨</div>
            <div style={{ color: '#7A6880', fontSize: '15px' }}>Loading events...</div>
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
            <div style={{ color: '#2A1F2D', fontSize: '17px', fontWeight: 600, marginBottom: '6px' }}>No events found</div>
            <div style={{ color: '#7A6880', fontSize: '14px', marginBottom: '16px' }}>Try a different search or filter</div>
            <button onClick={() => { setQuery(''); setActiveFilter('') }} style={{
              background: '#C96E8A', color: '#fff', border: 'none',
              borderRadius: '50px', padding: '12px 28px', fontSize: '14px',
              fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif'
            }}>Clear filters</button>
          </div>
        ) : displayed.map(e => (
          <div key={`${e.source}-${e.id}`}>
            <EventCard event={e} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px', marginBottom: '14px', paddingRight: '4px' }}>
              <button onClick={() => openRating(e)} style={{
                background: '#FAF0DC', color: '#D4A84B',
                border: '1px solid #F0D8A0', borderRadius: '20px',
                padding: '6px 14px', fontSize: '11px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}>⭐ Rate this event</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Events
