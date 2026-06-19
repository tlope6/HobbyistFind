import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import useAuth from '../hooks/useAuth'
import useEvents from '../hooks/useEvents'
import EventCard from '../components/EventCard'
import { COLORS, SPACING, RADIUS, FONTS, SHADOW, PAGE_STYLE, SECTION_HEADER_STYLE, pillStyle } from '../theme'

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

  const [ratingEvent, setRatingEvent] = useState(null)
  const [starHover, setStarHover] = useState(0)
  const [starSelected, setStarSelected] = useState(0)
  const [ratingNote, setRatingNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [ratingDone, setRatingDone] = useState(false)

  const { events, loading } = useEvents(location, activeCategory === 'All' ? '' : activeCategory, radius)
  const today = new Date().toISOString().split('T')[0]

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
    <div style={{ ...PAGE_STYLE }}>

      {/* Rating modal */}
      {ratingEvent && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(42,31,45,0.5)',
          zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }} onClick={e => { if (e.target === e.currentTarget) closeRating() }}>
          <div style={{
            background: COLORS.cream, borderRadius: '24px 24px 0 0',
            padding: '24px 24px 40px', width: '100%', maxWidth: '540px',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ width: '40px', height: '4px', background: COLORS.border, borderRadius: '2px', margin: '0 auto 20px' }} />

            {ratingDone ? (
              <div style={{ textAlign: 'center', padding: '20px 0 10px' }}>
                <div style={{ fontSize: '56px', marginBottom: SPACING.md }}>🎉</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: COLORS.ink, fontFamily: FONTS.heading, marginBottom: SPACING.sm }}>
                  Rating saved!
                </div>
                <div style={{ fontSize: '14px', color: COLORS.muted, marginBottom: SPACING.xxl, lineHeight: 1.5 }}>
                  Your review is now visible on your profile. We'll use it to recommend similar events.
                </div>
                <button onClick={() => { closeRating(); navigate('/profile') }} style={{
                  background: COLORS.rose, color: COLORS.white, border: 'none',
                  borderRadius: RADIUS.pill, padding: '12px 28px',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  fontFamily: FONTS.body, marginRight: SPACING.md
                }}>View in profile</button>
                <button onClick={closeRating} style={{
                  background: COLORS.white, color: COLORS.muted,
                  border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.pill,
                  padding: '12px 28px', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: FONTS.body
                }}>Close</button>
              </div>
            ) : (
              <>
                <div style={{ background: COLORS.roseLight, borderRadius: RADIUS.lg, padding: '16px 20px', marginBottom: SPACING.xxl, display: 'flex', alignItems: 'center', gap: SPACING.md }}>
                  <div style={{ fontSize: '36px' }}>🎫</div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: COLORS.rose, letterSpacing: '.06em', marginBottom: SPACING.xs }}>RATING</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: COLORS.ink, fontFamily: FONTS.heading, lineHeight: 1.3 }}>
                      {ratingEvent.title}
                    </div>
                    <div style={{ fontSize: '12px', color: COLORS.muted, marginTop: '3px' }}>{ratingEvent.category}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: SPACING.xxl }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: COLORS.ink, marginBottom: SPACING.lg }}>
                    How was your experience?
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.sm }}>
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
                    <div style={{ fontSize: '15px', color: COLORS.rose, fontWeight: 600 }}>
                      {STAR_LABELS[starHover || starSelected]}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: SPACING.xl }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: COLORS.ink2, letterSpacing: '.06em', textTransform: 'uppercase', display: 'block', marginBottom: SPACING.sm }}>
                    Leave a note (optional)
                  </label>
                  <textarea
                    value={ratingNote}
                    onChange={e => setRatingNote(e.target.value)}
                    placeholder="What did you enjoy? Would you try something similar?"
                    rows={3}
                    style={{
                      width: '100%', background: COLORS.white,
                      border: `1.5px solid ${COLORS.border}`, borderRadius: RADIUS.md,
                      padding: '12px 14px', fontSize: '14px', color: COLORS.ink,
                      outline: 'none', resize: 'none', boxSizing: 'border-box',
                      fontFamily: FONTS.body,
                    }}
                    onFocus={e => e.target.style.borderColor = COLORS.rose}
                    onBlur={e => e.target.style.borderColor = COLORS.border}
                  />
                </div>

                <button onClick={submitRating} disabled={!starSelected || submitting} style={{
                  width: '100%', background: starSelected ? COLORS.rose : COLORS.border,
                  color: starSelected ? COLORS.white : COLORS.muted,
                  border: 'none', borderRadius: RADIUS.md, padding: SPACING.lg,
                  fontSize: '16px', fontWeight: 600,
                  cursor: starSelected ? 'pointer' : 'default',
                  fontFamily: FONTS.body, transition: 'all 0.2s'
                }}>
                  {submitting ? 'Saving...' : 'Submit rating'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Search bar */}
      <div style={{ padding: `${SPACING.md} ${SPACING.lg} ${SPACING.sm}`, background: COLORS.white, borderBottom: `1px solid ${COLORS.surface2}`, position: 'relative', zIndex: 10 }}>
        <div style={{
          background: COLORS.cream, border: `1.5px solid ${searchFocused ? COLORS.rose : COLORS.border}`,
          borderRadius: RADIUS.md, display: 'flex', alignItems: 'center', gap: SPACING.sm,
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
              color: COLORS.ink, fontSize: '15px', flex: 1,
              fontFamily: FONTS.body
            }}
            placeholder="Search events, venues, categories..."
          />
          {query && (
            <button onClick={() => setQuery('')} style={{
              background: COLORS.border, border: 'none', borderRadius: '50%',
              width: '22px', height: '22px', cursor: 'pointer', fontSize: '14px',
              color: COLORS.muted, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>×</button>
          )}
        </div>

        {query && searchFocused && displayed.length > 0 && (
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.surface2}`, borderRadius: RADIUS.md, boxShadow: SHADOW.float, zIndex: 50, maxHeight: '240px', overflowY: 'auto', position: 'absolute', left: SPACING.lg, right: SPACING.lg, top: '68px' }}>
            {displayed.slice(0, 5).map(e => (
              <div key={`${e.source}-${e.id}`}
                onMouseDown={() => { setQuery(e.title); setSearchFocused(false) }}
                style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: SPACING.sm, borderBottom: '1px solid #FAF7F4' }}
                onMouseEnter={el => el.currentTarget.style.background = '#FAF7F4'}
                onMouseLeave={el => el.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '18px' }}>
                  {e.category === 'Music' ? '🎸' : e.category === 'Art' ? '🎨' : e.category === 'Fitness' ? '🏃' : e.category === 'Cooking' ? '🍳' : e.category === 'Tech' ? '💻' : e.category === 'Outdoors' ? '🏕' : '📅'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: COLORS.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                  <div style={{ fontSize: '11px', color: COLORS.muted }}>{e.category}{e.venue ? ` · ${e.venue}` : ''}</div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: e.price === 'Free' ? COLORS.sage : COLORS.ink, flexShrink: 0 }}>
                  {e.price === 'Free' ? '✓ Free' : e.price}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: SPACING.sm, padding: `${SPACING.sm} ${SPACING.lg} ${SPACING.sm}`, overflowX: 'auto', background: COLORS.white }}>
        {CATS.map(cat => {
          const active = activeCategory === cat || (cat === 'All' && !activeCategory)
          return (
            <button key={cat} onClick={() => { setActiveCategory(cat); setQuery('') }} style={pillStyle(active)}>
              {cat}
            </button>
          )
        })}
      </div>

      {/* Quick filters + sort */}
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, padding: `${SPACING.sm} ${SPACING.lg} ${SPACING.md}`, overflowX: 'auto', background: COLORS.white, borderBottom: `1px solid ${COLORS.surface2}` }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setActiveFilter(activeFilter === f ? '' : f)} style={{
            flexShrink: 0, padding: '5px 14px', borderRadius: RADIUS.pill,
            fontSize: '12px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
            border: `1px solid ${activeFilter === f ? COLORS.lavender : COLORS.border}`,
            background: activeFilter === f ? COLORS.lavender : 'transparent',
            color: activeFilter === f ? COLORS.white : COLORS.muted,
            fontFamily: FONTS.body
          }}>{f}</button>
        ))}
        <div style={{ marginLeft: 'auto', position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setShowSort(!showSort)} style={{
            padding: '5px 14px', borderRadius: RADIUS.pill, fontSize: '12px',
            fontWeight: 500, cursor: 'pointer', border: `1px solid ${COLORS.border}`,
            background: COLORS.white, color: COLORS.ink2,
            fontFamily: FONTS.body,
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            ↕ {sortBy}
          </button>
          {showSort && (
            <div style={{
              position: 'absolute', right: 0, top: '34px',
              background: COLORS.white, border: `1px solid ${COLORS.surface2}`,
              borderRadius: RADIUS.sm, zIndex: 20,
              boxShadow: SHADOW.card, overflow: 'hidden'
            }}>
              {SORT_OPTIONS.map(opt => (
                <button key={opt} onClick={() => { setSortBy(opt); setShowSort(false) }} style={{
                  display: 'block', width: '100%', padding: '10px 16px',
                  textAlign: 'left', fontSize: '13px', fontWeight: sortBy === opt ? 600 : 400,
                  color: sortBy === opt ? COLORS.rose : COLORS.ink,
                  background: sortBy === opt ? COLORS.roseLight : COLORS.white,
                  border: 'none', cursor: 'pointer',
                  fontFamily: FONTS.body,
                  borderBottom: '1px solid #FAF7F4',
                  whiteSpace: 'nowrap'
                }}>{opt}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results header */}
      <div style={{ padding: `${SPACING.lg} ${SPACING.lg} ${SPACING.sm}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={SECTION_HEADER_STYLE}>
          {query ? `"${query}"` : activeCategory && activeCategory !== 'All' ? `${activeCategory} events` : 'All events'}
        </h2>
        <span style={{ fontSize: '13px', color: COLORS.muted, background: COLORS.surface, padding: '4px 10px', borderRadius: RADIUS.pill }}>
          {loading ? '...' : `${displayed.length} found`}
        </span>
      </div>

      {/* Event list */}
      <div style={{ padding: `${SPACING.sm} ${SPACING.lg} ${SPACING.xl}` }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '36px', marginBottom: SPACING.md }}>✨</div>
            <div style={{ color: COLORS.muted, fontSize: '15px' }}>Loading events...</div>
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: SPACING.md }}>🔍</div>
            <div style={{ color: COLORS.ink, fontSize: '17px', fontWeight: 600, marginBottom: SPACING.sm }}>No events found</div>
            <div style={{ color: COLORS.muted, fontSize: '14px', marginBottom: SPACING.lg }}>Try a different search or filter</div>
            <button onClick={() => { setQuery(''); setActiveFilter('') }} style={{
              background: COLORS.rose, color: COLORS.white, border: 'none',
              borderRadius: RADIUS.pill, padding: '12px 28px', fontSize: '14px',
              fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body
            }}>Clear filters</button>
          </div>
        ) : displayed.map(e => (
          <div key={`${e.source}-${e.id}`}>
            <EventCard event={e} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px', marginBottom: SPACING.lg, paddingRight: SPACING.xs }}>
              <button onClick={() => openRating(e)} style={{
                background: COLORS.goldLight, color: COLORS.gold,
                border: '1px solid #F0D8A0', borderRadius: RADIUS.pill,
                padding: '6px 14px', fontSize: '11px', fontWeight: 600,
                cursor: 'pointer', fontFamily: FONTS.body,
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
