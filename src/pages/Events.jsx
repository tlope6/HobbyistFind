import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import useEvents from '../hooks/useEvents'
import EventCard from '../components/EventCard'

const CATS = ['All', 'Art', 'Music', 'Fitness', 'Cooking', 'Tech', 'Outdoors']
const FILTERS = ['Today', 'This week', 'Free', 'Beginner']

const Events = () => {
  const { location, activeCategory, setActiveCategory } = useAppContext()
  const [activeFilter, setActiveFilter] = useState('')
  const { events, loading } = useEvents(location, activeCategory === 'All' ? '' : activeCategory)
  const today = new Date().toISOString().split('T')[0]

  const filtered = events.filter(e => {
    if (activeFilter === 'Today') return e.date === today
    if (activeFilter === 'Free') return e.price === 'Free' || e.price === '$0'
    return true
  })

  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif' }}>

      {/* Search */}
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
          }} placeholder="Search events..." />
        </div>
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px 16px 8px', overflowX: 'auto', background: '#fff' }}>
        {CATS.map(cat => {
          const active = activeCategory === cat || (cat === 'All' && !activeCategory)
          return (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              flexShrink: 0, padding: '7px 18px', borderRadius: '20px',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              border: `1.5px solid ${active ? '#C96E8A' : '#EDE5DC'}`,
              background: active ? '#C96E8A' : 'transparent',
              color: active ? '#fff' : '#4A3850',
              fontFamily: 'DM Sans, system-ui, sans-serif', whiteSpace: 'nowrap'
            }}>{cat}</button>
          )
        })}
      </div>

      {/* Quick filters */}
      <div style={{ display: 'flex', gap: '8px', padding: '8px 16px 12px', overflowX: 'auto', background: '#fff', borderBottom: '1px solid #F0E8E4' }}>
        {FILTERS.map(f => {
          const active = activeFilter === f
          return (
            <button key={f} onClick={() => setActiveFilter(active ? '' : f)} style={{
              flexShrink: 0, padding: '5px 14px', borderRadius: '20px',
              fontSize: '12px', fontWeight: 500, cursor: 'pointer',
              border: `1px solid ${active ? '#8B72C8' : '#EDE5DC'}`,
              background: active ? '#8B72C8' : 'transparent',
              color: active ? '#fff' : '#7A6880',
              fontFamily: 'DM Sans, system-ui, sans-serif', whiteSpace: 'nowrap'
            }}>{f}</button>
          )
        })}
      </div>

      {/* Results */}
      <div style={{ padding: '20px 16px 100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#2A1F2D', margin: 0, fontFamily: 'Playfair Display, Georgia, serif' }}>
            Events
          </h2>
          <span style={{ fontSize: '13px', color: '#7A6880', background: '#F4EFE9', padding: '4px 10px', borderRadius: '20px' }}>
            {filtered.length} found
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>✨</div>
            <div style={{ color: '#7A6880', fontSize: '15px' }}>Loading events...</div>
          </div>
        ) : filtered.map(e => <EventCard key={`${e.source}-${e.id}`} event={e} />)}
      </div>
    </div>
  )
}

export default Events
