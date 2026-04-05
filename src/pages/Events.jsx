import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import useEvents from '../hooks/useEvents'
import EventCard from '../components/EventCard'

const CATEGORIES = ['All', 'Art', 'Music', 'Fitness', 'Cooking', 'Tech', 'Outdoors']
const FILTERS = ['Today', 'This week', 'Free', 'Beginner']

const Events = () => {
  const { location, activeCategory, setActiveCategory } = useAppContext()
  const [activeFilter, setActiveFilter] = useState('')
  const { events, loading } = useEvents(
    location,
    activeCategory === 'All' ? '' : activeCategory
  )
  const today = new Date().toISOString().split('T')[0]

  const filtered = events.filter((e) => {
    if (activeFilter === 'Today') return e.date === today
    if (activeFilter === 'Free') return e.price === 'Free' || e.price === '$0'
    return true
  })

  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh' }}>
      <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #F7D6E3' }}>
        <div style={{ background: '#F4EFE9', border: '1px solid #EDE5DC', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px' }}>
          <span style={{ color: '#7A6880', fontSize: '14px' }}>🔍</span>
          <input
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#2A1F2D', fontSize: '13px', flex: 1, fontFamily: 'DM Sans, sans-serif' }}
            placeholder="Search events..."
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', padding: '10px 16px', overflowX: 'auto', background: '#fff', borderBottom: '1px solid #F7D6E3' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              flexShrink: 0, padding: '5px 12px', borderRadius: '20px', fontSize: '11px',
              fontWeight: 500, border: '1.5px solid', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              background: activeCategory === cat || (cat === 'All' && !activeCategory) ? '#C96E8A' : 'transparent',
              borderColor: activeCategory === cat || (cat === 'All' && !activeCategory) ? '#C96E8A' : '#EDE5DC',
              color: activeCategory === cat || (cat === 'All' && !activeCategory) ? '#fff' : '#4A3850',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '6px', padding: '8px 16px 10px', overflowX: 'auto', background: '#fff', borderBottom: '1px solid #F7D6E3' }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(activeFilter === f ? '' : f)}
            style={{
              flexShrink: 0, padding: '4px 12px', borderRadius: '20px', fontSize: '11px',
              border: '1px solid', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              background: activeFilter === f ? '#8B72C8' : 'transparent',
              borderColor: activeFilter === f ? '#8B72C8' : '#EDE5DC',
              color: activeFilter === f ? '#fff' : '#7A6880',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, color: '#7A6880', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
          {filtered.length} events found
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#7A6880', fontSize: '14px' }}>
            Finding events near you...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map((e) => (
              <EventCard key={`${e.source}-${e.id}`} event={e} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Events