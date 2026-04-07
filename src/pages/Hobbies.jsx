import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const HOBBIES = [
  { name: 'Art & Craft', icon: '🎨', category: 'Art', count: 12, bg: '#F9ECF1', color: '#C96E8A', border: '#F0C8D8' },
  { name: 'Music', icon: '🎸', category: 'Music', count: 8, bg: '#EDE8F6', color: '#8B72C8', border: '#D4C8E8' },
  { name: 'Fitness', icon: '🏃', category: 'Fitness', count: 15, bg: '#DCF0E2', color: '#5A8C6A', border: '#A8C4B0' },
  { name: 'Cooking', icon: '🍳', category: 'Cooking', count: 6, bg: '#FAF0DC', color: '#D4A84B', border: '#F0D8A0' },
  { name: 'Tech & Making', icon: '💻', category: 'Tech', count: 5, bg: '#EDE8F6', color: '#8B72C8', border: '#D4C8E8' },
  { name: 'Outdoors', icon: '🏕', category: 'Outdoors', count: 9, bg: '#DCF0E2', color: '#5A8C6A', border: '#A8C4B0' },
]

const Hobbies = () => {
  const navigate = useNavigate()
  const { setActiveCategory } = useAppContext()

  const pick = (category) => {
    setActiveCategory(category)
    navigate('/events')
  }

  const surprise = () => {
    const r = HOBBIES[Math.floor(Math.random() * HOBBIES.length)]
    pick(r.category)
  }

  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', paddingBottom: '100px' }}>

      {/* Header */}
      <div style={{ background: '#F9ECF1', padding: '28px 20px 24px', borderBottom: '1px solid #F0E0E8' }}>
        <h1 style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: '28px', fontWeight: 700, color: '#2A1F2D',
          margin: '0 0 6px', letterSpacing: '-.01em'
        }}>Start a new hobby</h1>
        <p style={{ color: '#7A6880', fontSize: '15px', margin: 0 }}>
          Find beginner-friendly classes and events near you.
        </p>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', padding: '20px 16px' }}>
        {HOBBIES.map(h => (
          <button key={h.name} onClick={() => pick(h.category)} style={{
            background: '#fff', border: `1.5px solid ${h.border}`,
            borderRadius: '20px', padding: '20px 16px',
            textAlign: 'center', cursor: 'pointer',
            fontFamily: 'DM Sans, system-ui, sans-serif',
            transition: 'all 0.15s', display: 'flex',
            flexDirection: 'column', alignItems: 'center', gap: '8px'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = h.bg; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'none' }}
          >
            <div style={{ fontSize: '38px', lineHeight: 1 }}>{h.icon}</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#2A1F2D' }}>{h.name}</div>
            <div style={{
              fontSize: '12px', fontWeight: 600, color: h.color,
              background: h.bg, padding: '3px 10px', borderRadius: '20px'
            }}>
              {h.count} events nearby
            </div>
          </button>
        ))}
      </div>

      {/* Surprise button */}
      <div style={{ padding: '0 16px' }}>
        <button onClick={surprise} style={{
          width: '100%', background: '#C96E8A', color: '#fff',
          border: 'none', borderRadius: '16px', padding: '16px',
          fontSize: '16px', fontWeight: 600, cursor: 'pointer',
          fontFamily: 'DM Sans, system-ui, sans-serif',
          letterSpacing: '.01em'
        }}>
          ✨ Surprise me — pick a random hobby
        </button>
      </div>
    </div>
  )
}

export default Hobbies
