import { useState, useEffect, useRef } from 'react'
import { useAppContext } from '../context/AppContext'
import { supabase } from '../lib/supabaseClient'
import useAuth from '../hooks/useAuth'
import useEvents from '../hooks/useEvents'
import EventCard from '../components/EventCard'
import { useNavigate } from 'react-router-dom'

const ALL_HOBBIES = [
  { name: 'Watercolor', category: 'Art', icon: '🎨', related: ['Art', 'Music'] },
  { name: 'Guitar', category: 'Music', icon: '🎸', related: ['Music', 'Art'] },
  { name: 'Yoga', category: 'Fitness', icon: '🧘', related: ['Fitness', 'Outdoors'] },
  { name: 'Running', category: 'Fitness', icon: '🏃', related: ['Fitness', 'Outdoors'] },
  { name: 'Cooking', category: 'Cooking', icon: '🍳', related: ['Cooking'] },
  { name: 'Baking', category: 'Cooking', icon: '🍰', related: ['Cooking'] },
  { name: 'Hiking', category: 'Outdoors', icon: '🥾', related: ['Outdoors', 'Fitness'] },
  { name: 'Photography', category: 'Art', icon: '📸', related: ['Art', 'Outdoors'] },
  { name: 'Coding', category: 'Tech', icon: '💻', related: ['Tech'] },
  { name: 'Dancing', category: 'Fitness', icon: '💃', related: ['Fitness', 'Music'] },
  { name: 'Drawing', category: 'Art', icon: '✏️', related: ['Art'] },
  { name: 'Pottery', category: 'Art', icon: '🏺', related: ['Art'] },
  { name: 'Climbing', category: 'Outdoors', icon: '🧗', related: ['Outdoors', 'Fitness'] },
  { name: 'Swimming', category: 'Fitness', icon: '🏊', related: ['Fitness', 'Outdoors'] },
  { name: 'Piano', category: 'Music', icon: '🎹', related: ['Music', 'Art'] },
  { name: '3D Printing', category: 'Tech', icon: '🖨', related: ['Tech', 'Art'] },
]

const CAT_COLORS = {
  Art: { bg: '#F9ECF1', color: '#C96E8A', border: '#F0C8D8' },
  Music: { bg: '#EDE8F6', color: '#8B72C8', border: '#D4C8E8' },
  Fitness: { bg: '#DCF0E2', color: '#5A8C6A', border: '#A8C4B0' },
  Cooking: { bg: '#FAF0DC', color: '#D4A84B', border: '#F0D8A0' },
  Tech: { bg: '#EDE8F6', color: '#8B72C8', border: '#D4C8E8' },
  Outdoors: { bg: '#DCF0E2', color: '#5A8C6A', border: '#A8C4B0' },
}

const STAR_LABELS = ['', 'Not for me', 'It was okay', 'Pretty good', 'Really enjoyed it', 'Loved it!']

const Search = () => {
  const { location, activeCategory, setActiveCategory, radius } = useAppContext()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [selectedHobbies, setSelectedHobbies] = useState([])
  const [ratingEvent, setRatingEvent] = useState(null)
  const [starHover, setStarHover] = useState(0)
  const [starSelected, setStarSelected] = useState(0)
  const [ratingNote, setRatingNote] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)
  const [ratingDone, setRatingDone] = useState(false)
  const [userRatings, setUserRatings] = useState([])
  const [recommendedCategories, setRecommendedCategories] = useState([])
  const [view, setView] = useState('search') // 'search' | 'rating' | 'recommended'

  const searchCategory = selectedHobbies.length > 0
    ? selectedHobbies[0].category
    : (activeCategory === 'All' ? '' : activeCategory)

  const { events, loading } = useEvents(location, searchCategory, radius)

  const filteredEvents = events.filter(e => {
    if (!query) return true
    return e.title.toLowerCase().includes(query.toLowerCase()) ||
      e.venue?.toLowerCase().includes(query.toLowerCase()) ||
      e.category?.toLowerCase().includes(query.toLowerCase())
  })

  // Load user ratings and build recommendations
  useEffect(() => {
    if (!user) return
    supabase.from('event_ratings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!data) return
        setUserRatings(data)

        // Build recommended categories from high ratings (4-5 stars)
        const highRated = data.filter(r => r.rating >= 4)
        const catScores = {}
        highRated.forEach(r => {
          const hobby = ALL_HOBBIES.find(h => h.category === r.category)
          if (!hobby) return
          hobby.related.forEach(rel => {
            catScores[rel] = (catScores[rel] ?? 0) + r.rating
          })
        })
        const sorted = Object.entries(catScores)
          .sort((a, b) => b[1] - a[1])
          .map(([cat]) => cat)
        setRecommendedCategories(sorted)
      })
  }, [user, ratingDone])

  const toggleHobby = (hobby) => {
    setSelectedHobbies(prev => {
      const exists = prev.find(h => h.name === hobby.name)
      if (exists) return prev.filter(h => h.name !== hobby.name)
      return [...prev, hobby]
    })
  }

  const openRating = (event) => {
    if (!user) { navigate('/login'); return }
    setRatingEvent(event)
    setStarSelected(0)
    setStarHover(0)
    setRatingNote('')
    setRatingDone(false)
    setView('rating')
  }

  const submitRating = async () => {
    if (!starSelected || !ratingEvent || !user) return
    setSubmittingRating(true)
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
      setTimeout(() => setView('recommended'), 1500)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingRating(false)
    }
  }

  // RATING SCREEN
  if (view === 'rating' && ratingEvent) {
    return (
      <div style={{ background: '#FAF7F4', minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', paddingBottom: '100px' }}>
        <div style={{ background: '#fff', padding: '16px 20px', borderBottom: '1px solid #F0E8E4', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setView('search')} style={{ background: '#F9ECF1', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px' }}>←</button>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#2A1F2D' }}>Rate this event</span>
        </div>

        <div style={{ padding: '28px 24px' }}>
          {/* Event info */}
          <div style={{ background: '#F9ECF1', borderRadius: '16px', padding: '20px', marginBottom: '28px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎫</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#2A1F2D', fontFamily: 'Playfair Display, serif', lineHeight: 1.3 }}>
              {ratingEvent.title}
            </div>
            <div style={{ fontSize: '13px', color: '#7A6880', marginTop: '6px' }}>{ratingEvent.category}</div>
          </div>

          {ratingDone ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '52px', marginBottom: '14px' }}>🎉</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#2A1F2D', fontFamily: 'Playfair Display, serif', marginBottom: '8px' }}>
                Thanks for rating!
              </div>
              <div style={{ fontSize: '14px', color: '#7A6880' }}>
                Finding similar hobbies you'll love...
              </div>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#2A1F2D', marginBottom: '16px' }}>
                  How was your experience?
                </div>

                {/* Stars */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star}
                      onMouseEnter={() => setStarHover(star)}
                      onMouseLeave={() => setStarHover(0)}
                      onClick={() => setStarSelected(star)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '40px', lineHeight: 1, padding: '4px',
                        transform: (starHover || starSelected) >= star ? 'scale(1.2)' : 'scale(1)',
                        transition: 'transform 0.15s',
                        filter: (starHover || starSelected) >= star ? 'none' : 'grayscale(1) opacity(0.4)',
                      }}>
                      ⭐
                    </button>
                  ))}
                </div>

                {(starHover || starSelected) > 0 && (
                  <div style={{ fontSize: '15px', color: '#C96E8A', fontWeight: 600, marginBottom: '8px' }}>
                    {STAR_LABELS[starHover || starSelected]}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#4A3850', letterSpacing: '.06em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Any notes? (optional)
                </label>
                <textarea
                  value={ratingNote}
                  onChange={e => setRatingNote(e.target.value)}
                  placeholder="What did you enjoy? Would you try something similar?"
                  rows={3}
                  style={{
                    width: '100%', background: '#fff', border: '1.5px solid #EDE5DC',
                    borderRadius: '12px', padding: '12px 14px', fontSize: '14px',
                    color: '#2A1F2D', outline: 'none', resize: 'none',
                    fontFamily: 'DM Sans, system-ui, sans-serif', boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = '#C96E8A'}
                  onBlur={e => e.target.style.borderColor = '#EDE5DC'}
                />
              </div>

              <button
                onClick={submitRating}
                disabled={!starSelected || submittingRating}
                style={{
                  width: '100%', background: starSelected ? '#C96E8A' : '#EDE5DC',
                  color: starSelected ? '#fff' : '#7A6880',
                  border: 'none', borderRadius: '14px', padding: '16px',
                  fontSize: '16px', fontWeight: 600,
                  cursor: starSelected ? 'pointer' : 'default',
                  fontFamily: 'DM Sans, system-ui, sans-serif',
                  transition: 'all 0.2s'
                }}
              >
                {submittingRating ? 'Saving...' : 'Submit rating'}
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // RECOMMENDED SCREEN (after rating)
  if (view === 'recommended') {
    const topCats = recommendedCategories.slice(0, 3)
    const suggestedHobbies = ALL_HOBBIES.filter(h => topCats.includes(h.category)).slice(0, 6)

    return (
      <div style={{ background: '#FAF7F4', minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', paddingBottom: '100px' }}>
        <div style={{ background: '#F9ECF1', padding: '32px 24px 24px', borderBottom: '1px solid #F0E0E8', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✨</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', fontWeight: 700, color: '#2A1F2D', margin: '0 0 8px' }}>
            Based on your ratings
          </h1>
          <p style={{ color: '#7A6880', fontSize: '14px', margin: 0 }}>
            Here are hobbies and events we think you'll love
          </p>
        </div>

        <div style={{ padding: '24px 16px' }}>
          {suggestedHobbies.length > 0 ? (
            <>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#2A1F2D', marginBottom: '14px' }}>
                Hobbies for you
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
                {suggestedHobbies.map(h => {
                  const style = CAT_COLORS[h.category] ?? CAT_COLORS.Art
                  return (
                    <button key={h.name}
                      onClick={() => { setSelectedHobbies([h]); setView('search') }}
                      style={{
                        background: '#fff', border: `1.5px solid ${style.border}`,
                        borderRadius: '16px', padding: '18px 14px',
                        textAlign: 'center', cursor: 'pointer',
                        fontFamily: 'DM Sans, system-ui, sans-serif',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = style.bg }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
                    >
                      <div style={{ fontSize: '32px' }}>{h.icon}</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#2A1F2D' }}>{h.name}</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: style.color, background: style.bg, padding: '2px 8px', borderRadius: '20px' }}>
                        {h.category}
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#7A6880' }}>
              Rate more events to get personalized recommendations
            </div>
          )}

          <button onClick={() => setView('search')} style={{
            width: '100%', background: '#C96E8A', color: '#fff',
            border: 'none', borderRadius: '14px', padding: '15px',
            fontSize: '15px', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'DM Sans, system-ui, sans-serif'
          }}>
            Browse all events →
          </button>
        </div>
      </div>
    )
  }

  // MAIN SEARCH SCREEN
  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', paddingBottom: '100px' }}>

      {/* Search bar */}
      <div style={{ padding: '14px 16px 10px', background: '#fff', borderBottom: '1px solid #F0E8E4' }}>
        <div style={{
          background: '#FAF7F4', border: '1.5px solid #EDE5DC', borderRadius: '14px',
          display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px'
        }}>
          <span style={{ fontSize: '16px', color: '#B07090' }}>🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: '#2A1F2D', fontSize: '15px', flex: 1,
              fontFamily: 'DM Sans, system-ui, sans-serif'
            }}
            placeholder="Search events, hobbies, venues..."
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A6880', fontSize: '18px', lineHeight: 1 }}>×</button>
          )}
        </div>
      </div>

      {/* Hobby filter chips */}
      <div style={{ padding: '12px 16px 10px', background: '#fff', borderBottom: '1px solid #F0E8E4' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#7A6880', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '10px' }}>
          Filter by hobby
        </div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {ALL_HOBBIES.map(h => {
            const selected = selectedHobbies.find(s => s.name === h.name)
            const style = CAT_COLORS[h.category] ?? CAT_COLORS.Art
            return (
              <button key={h.name} onClick={() => toggleHobby(h)} style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: '20px',
                fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                border: `1.5px solid ${selected ? style.color : '#EDE5DC'}`,
                background: selected ? style.bg : 'transparent',
                color: selected ? style.color : '#4A3850',
                fontFamily: 'DM Sans, system-ui, sans-serif',
                display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap'
              }}>
                <span style={{ fontSize: '14px' }}>{h.icon}</span>
                {h.name}
              </button>
            )
          })}
        </div>
        {selectedHobbies.length > 0 && (
          <button onClick={() => setSelectedHobbies([])} style={{
            marginTop: '8px', background: 'none', border: 'none',
            color: '#C96E8A', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif', padding: 0
          }}>
            Clear filters ×
          </button>
        )}
      </div>

      {/* Past ratings shortcut */}
      {user && userRatings.length > 0 && (
        <div style={{ padding: '12px 16px', background: '#F9ECF1', borderBottom: '1px solid #F0E0E8' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#2A1F2D' }}>
                ✨ You've rated {userRatings.length} event{userRatings.length !== 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: '12px', color: '#7A6880', marginTop: '2px' }}>
                See your personalized recommendations
              </div>
            </div>
            <button onClick={() => setView('recommended')} style={{
              background: '#C96E8A', color: '#fff', border: 'none',
              borderRadius: '20px', padding: '7px 14px',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'DM Sans, system-ui, sans-serif'
            }}>For you →</button>
          </div>
        </div>
      )}

      {/* Results */}
      <div style={{ padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#2A1F2D', margin: 0, fontFamily: 'Playfair Display, Georgia, serif' }}>
            {selectedHobbies.length > 0
              ? `${selectedHobbies.map(h => h.name).join(', ')} events`
              : query ? `Results for "${query}"` : 'All events nearby'}
          </h2>
          {!loading && (
            <span style={{ fontSize: '13px', color: '#7A6880', background: '#F4EFE9', padding: '4px 10px', borderRadius: '20px' }}>
              {filteredEvents.length} found
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>✨</div>
            <div style={{ color: '#7A6880', fontSize: '15px' }}>Finding events...</div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
            <div style={{ color: '#2A1F2D', fontSize: '17px', fontWeight: 600, marginBottom: '6px' }}>No events found</div>
            <div style={{ color: '#7A6880', fontSize: '14px', marginBottom: '20px' }}>Try a different hobby or search term</div>
            <button onClick={() => { setQuery(''); setSelectedHobbies([]) }} style={{
              background: '#C96E8A', color: '#fff', border: 'none',
              borderRadius: '50px', padding: '12px 28px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'DM Sans, system-ui, sans-serif'
            }}>Clear filters</button>
          </div>
        ) : filteredEvents.map(e => (
          <div key={`${e.source}-${e.id}`} style={{ position: 'relative' }}>
            <EventCard event={e} />
            <button
              onClick={() => openRating(e)}
              style={{
                position: 'absolute', bottom: '26px', right: '76px',
                background: '#FAF0DC', color: '#D4A84B',
                border: '1px solid #F0D8A0', borderRadius: '20px',
                padding: '5px 12px', fontSize: '11px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              ⭐ Rate
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Search