import { useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import useLocation from '../hooks/useLocation'
import useEvents from '../hooks/useEvents'
import MapView from '../components/MapView'
import EventCard from '../components/EventCard'

const CATS = ['All', 'Art', 'Music', 'Fitness', 'Cooking', 'Tech', 'Outdoors']

const Home = () => {
  const { location, setLocation, setCityName, activeCategory, setActiveCategory } = useAppContext()
  const { location: detected, loading: locLoading } = useLocation()
  const { events, loading } = useEvents(location, activeCategory === 'All' ? '' : activeCategory)

  useEffect(() => {
    if (!detected) return
    setLocation(detected)
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${detected.lat}&longitude=${detected.lng}&localityLanguage=en`)
      .then(r => r.json())
      .then(d => { if (d.city) setCityName(`${d.city}, ${d.principalSubdivisionCode}`) })
      .catch(() => {})
  }, [detected])

  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif' }}>

      {/* Search bar */}
      <div style={{ padding: '14px 16px 10px', background: '#fff', borderBottom: '1px solid #F0E8E4' }}>
        <div style={{
          background: '#FAF7F4', border: '1.5px solid #EDE5DC', borderRadius: '14px',
          display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px'
        }}>
          <span style={{ fontSize: '16px', color: '#B07090' }}>🔍</span>
          <input style={{
            background: 'transparent', border: 'none', outline: 'none',
            color: '#2A1F2D', fontSize: '15px', flex: 1,
            fontFamily: 'DM Sans, system-ui, sans-serif'
          }} placeholder="Search activities near you..." />
        </div>
      </div>

      {/* Category pills */}
      <div style={{
        display: 'flex', gap: '8px', padding: '12px 16px',
        overflowX: 'auto', background: '#fff', borderBottom: '1px solid #F0E8E4'
      }}>
        {CATS.map(cat => {
          const active = activeCategory === cat || (cat === 'All' && !activeCategory)
          return (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              flexShrink: 0, padding: '7px 18px', borderRadius: '20px',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              border: `1.5px solid ${active ? '#C96E8A' : '#EDE5DC'}`,
              background: active ? '#C96E8A' : 'transparent',
              color: active ? '#fff' : '#4A3850',
              fontFamily: 'DM Sans, system-ui, sans-serif',
              whiteSpace: 'nowrap', transition: 'all 0.15s'
            }}>{cat}</button>
          )
        })}
      </div>

      {/* Map */}
      {locLoading ? (
        <div style={{
          height: '320px', background: '#F4EFE9',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '10px'
        }}>
          <div style={{ fontSize: '36px' }}>📍</div>
          <div style={{ color: '#7A6880', fontSize: '14px' }}>Detecting your location...</div>
        </div>
      ) : <MapView location={location} events={events} />}

      {/* Events section */}
      <div style={{ padding: '20px 16px 100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{
            fontSize: '20px', fontWeight: 700, color: '#2A1F2D', margin: 0,
            fontFamily: 'Playfair Display, Georgia, serif'
          }}>Nearby today</h2>
          {events.length > 0 && (
            <span style={{ fontSize: '13px', color: '#7A6880', background: '#F4EFE9', padding: '4px 10px', borderRadius: '20px' }}>
              {events.length} events
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>✨</div>
            <div style={{ color: '#7A6880', fontSize: '15px' }}>Finding events near you...</div>
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
            <div style={{ color: '#2A1F2D', fontSize: '17px', fontWeight: 600, marginBottom: '6px' }}>No events found</div>
            <div style={{ color: '#7A6880', fontSize: '14px' }}>Try a different category or check back later</div>
          </div>
        ) : events.slice(0, 10).map(e => (
          <EventCard key={`${e.source}-${e.id}`} event={e} />
        ))}
      </div>
    </div>
  )
}

export default Home
