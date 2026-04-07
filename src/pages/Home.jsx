import { useEffect, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import useLocation from '../hooks/useLocation'
import useEvents from '../hooks/useEvents'
import MapView from '../components/MapView'
import EventCard from '../components/EventCard'
import { useNavigate } from 'react-router-dom'

const CATS = ['All', 'Art', 'Music', 'Fitness', 'Cooking', 'Tech', 'Outdoors']

const Home = () => {
  const { location, setLocation, setCityName, activeCategory, setActiveCategory, radius } = useAppContext()
  const { location: detected, loading: locLoading } = useLocation()
  const { events, loading } = useEvents(
    location,
    activeCategory === 'All' ? '' : activeCategory,
    radius
  )
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  useEffect(() => {
    if (!detected) return
    setLocation(detected)
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${detected.lat}&longitude=${detected.lng}&localityLanguage=en`)
      .then(r => r.json())
      .then(d => { if (d.city) setCityName(`${d.city}, ${d.principalSubdivisionCode}`) })
      .catch(() => {})
  }, [detected])

  // Filter events by search query
  const filteredEvents = events.filter(e => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      e.title?.toLowerCase().includes(q) ||
      e.venue?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q) ||
      e.address?.toLowerCase().includes(q) ||
      e.city?.toLowerCase().includes(q)
    )
  })

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif' }}>

      {/* Search bar */}
      <div style={{ padding: '14px 16px 10px', background: '#fff', borderBottom: '1px solid #F0E8E4' }}>
        <div style={{
          background: '#FAF7F4',
          border: `1.5px solid ${searchFocused ? '#C96E8A' : '#EDE5DC'}`,
          borderRadius: '14px',
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '11px 16px',
          transition: 'border-color 0.15s'
        }}>
          <span style={{ fontSize: '16px', color: '#B07090' }}>🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onKeyDown={handleSearchSubmit}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: '#2A1F2D', fontSize: '15px', flex: 1,
              fontFamily: 'DM Sans, system-ui, sans-serif'
            }}
            placeholder="Search activities, venues, categories..."
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              style={{
                background: '#EDE5DC', border: 'none', borderRadius: '50%',
                width: '22px', height: '22px', cursor: 'pointer',
                fontSize: '14px', color: '#7A6880', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}
            >×</button>
          ) : (
            <button
              onClick={() => navigate('/search')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '12px', color: '#C96E8A', fontWeight: 600,
                fontFamily: 'DM Sans, system-ui, sans-serif', flexShrink: 0
              }}
            >Advanced</button>
          )}
        </div>

        {/* Live search results dropdown */}
        {query && filteredEvents.length > 0 && searchFocused && (
          <div style={{
            position: 'absolute', left: '16px', right: '16px',
            background: '#fff', border: '1px solid #F0E8E4',
            borderRadius: '12px', marginTop: '8px',
            boxShadow: '0 8px 24px rgba(42,31,45,0.12)',
            zIndex: 50, maxHeight: '280px', overflowY: 'auto'
          }}>
            <div style={{ padding: '8px 14px 6px', fontSize: '11px', fontWeight: 700, color: '#7A6880', textTransform: 'uppercase', letterSpacing: '.07em' }}>
              {filteredEvents.length} results
            </div>
            {filteredEvents.slice(0, 5).map(e => (
              <div
                key={`${e.source}-${e.id}`}
                onMouseDown={() => {
                  setQuery(e.title)
                  setSearchFocused(false)
                }}
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  borderTop: '1px solid #FAF7F4',
                  display: 'flex', alignItems: 'center', gap: '10px'
                }}
                onMouseEnter={el => el.currentTarget.style.background = '#FAF7F4'}
                onMouseLeave={el => el.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '20px' }}>
                  {e.category === 'Music' ? '🎸' : e.category === 'Art' ? '🎨' : e.category === 'Fitness' ? '🏃' : e.category === 'Cooking' ? '🍳' : e.category === 'Tech' ? '💻' : e.category === 'Outdoors' ? '🏕' : '📅'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#2A1F2D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#7A6880' }}>
                    {e.category}{e.venue ? ` · ${e.venue}` : ''}
                  </div>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: e.price === 'Free' ? '#5A8C6A' : '#2A1F2D', flexShrink: 0 }}>
                  {e.price === 'Free' ? '✓ Free' : e.price}
                </div>
              </div>
            ))}
            {filteredEvents.length > 5 && (
              <div
                onMouseDown={() => navigate(`/search?q=${encodeURIComponent(query)}`)}
                style={{
                  padding: '12px 14px', textAlign: 'center',
                  fontSize: '13px', fontWeight: 600, color: '#C96E8A',
                  cursor: 'pointer', borderTop: '1px solid #FAF7F4'
                }}
              >
                See all {filteredEvents.length} results →
              </div>
            )}
          </div>
        )}

        {/* No results message */}
        {query && filteredEvents.length === 0 && !loading && searchFocused && (
          <div style={{
            position: 'absolute', left: '16px', right: '16px',
            background: '#fff', border: '1px solid #F0E8E4',
            borderRadius: '12px', marginTop: '8px',
            boxShadow: '0 8px 24px rgba(42,31,45,0.12)',
            zIndex: 50, padding: '20px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#2A1F2D', marginBottom: '4px' }}>
              No results for "{query}"
            </div>
            <div style={{ fontSize: '12px', color: '#7A6880' }}>
              Try a different search term or category
            </div>
          </div>
        )}
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', overflowX: 'auto', background: '#fff', borderBottom: '1px solid #F0E8E4', position: 'relative', zIndex: 1 }}>
        {CATS.map(cat => {
          const active = activeCategory === cat || (cat === 'All' && !activeCategory)
          return (
            <button key={cat} onClick={() => { setActiveCategory(cat); setQuery('') }} style={{
              flexShrink: 0, padding: '7px 18px', borderRadius: '20px',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              border: `1.5px solid ${active ? '#C96E8A' : '#EDE5DC'}`,
              background: active ? '#C96E8A' : 'transparent',
              color: active ? '#fff' : '#4A3850',
              fontFamily: 'DM Sans, system-ui, sans-serif', whiteSpace: 'nowrap',
              transition: 'all 0.15s'
            }}>{cat}</button>
          )
        })}
      </div>

      {/* Map */}
      {locLoading ? (
        <div style={{ height: '380px', background: '#F4EFE9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '36px' }}>📍</div>
          <div style={{ color: '#7A6880', fontSize: '14px' }}>Detecting your location...</div>
        </div>
      ) : (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <MapView location={location} events={query ? filteredEvents : events} />
        </div>
      )}

      {/* Events list */}
      <div style={{ padding: '20px 16px 100px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#2A1F2D', margin: 0, fontFamily: 'Playfair Display, Georgia, serif' }}>
            {query ? `Results for "${query}"` : 'Nearby today'}
          </h2>
          <span style={{ fontSize: '13px', color: '#7A6880', background: '#F4EFE9', padding: '4px 10px', borderRadius: '20px' }}>
            {loading ? '...' : `${filteredEvents.length} events`}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>✨</div>
            <div style={{ color: '#7A6880', fontSize: '15px' }}>Finding events near you...</div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
            <div style={{ color: '#2A1F2D', fontSize: '17px', fontWeight: 600, marginBottom: '6px' }}>
              {query ? `No results for "${query}"` : 'No events found'}
            </div>
            <div style={{ color: '#7A6880', fontSize: '14px', marginBottom: '16px' }}>
              {query ? 'Try a different search term' : 'Try increasing the radius or changing the category'}
            </div>
            {query && (
              <button onClick={() => setQuery('')} style={{
                background: '#C96E8A', color: '#fff', border: 'none',
                borderRadius: '50px', padding: '12px 28px',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'DM Sans, system-ui, sans-serif'
              }}>Clear search</button>
            )}
          </div>
        ) : (
          filteredEvents.slice(0, 10).map(e => (
            <EventCard key={`${e.source}-${e.id}`} event={e} />
          ))
        )}
      </div>
    </div>
  )
}

export default Home