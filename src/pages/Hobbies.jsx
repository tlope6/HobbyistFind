import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { COLORS, SPACING, RADIUS, FONTS, PAGE_STYLE, primaryButtonStyle } from '../theme'

const HOBBIES = [
  { name: 'Art & Craft', icon: '🎨', category: 'Art', count: 12, bg: COLORS.roseLight, color: COLORS.rose, border: COLORS.roseBorder },
  { name: 'Music', icon: '🎸', category: 'Music', count: 8, bg: COLORS.lavenderLight, color: COLORS.lavender, border: '#D4C8E8' },
  { name: 'Fitness', icon: '🏃', category: 'Fitness', count: 15, bg: COLORS.sageLight, color: COLORS.sage, border: '#A8C4B0' },
  { name: 'Cooking', icon: '🍳', category: 'Cooking', count: 6, bg: COLORS.goldLight, color: COLORS.gold, border: '#F0D8A0' },
  { name: 'Tech & Making', icon: '💻', category: 'Tech', count: 5, bg: COLORS.lavenderLight, color: COLORS.lavender, border: '#D4C8E8' },
  { name: 'Outdoors', icon: '🏕', category: 'Outdoors', count: 9, bg: COLORS.sageLight, color: COLORS.sage, border: '#A8C4B0' },
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
    <div style={{ ...PAGE_STYLE }}>

      {/* Header */}
      <div style={{ background: COLORS.roseLight, padding: `${SPACING.xxl} ${SPACING.xl} 24px`, borderBottom: `1px solid #F0E0E8` }}>
        <h1 style={{
          fontFamily: FONTS.heading,
          fontSize: '28px', fontWeight: 700, color: COLORS.ink,
          margin: '0 0 6px', letterSpacing: '-.01em'
        }}>Start a new hobby</h1>
        <p style={{ color: COLORS.muted, fontSize: '15px', margin: 0, fontFamily: FONTS.body }}>
          Find beginner-friendly classes and events near you.
        </p>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACING.lg, padding: `${SPACING.xl} ${SPACING.lg}` }}>
        {HOBBIES.map(h => (
          <button key={h.name} onClick={() => pick(h.category)} style={{
            background: COLORS.white, border: `1.5px solid ${h.border}`,
            borderRadius: RADIUS.xl, padding: '20px 16px',
            textAlign: 'center', cursor: 'pointer',
            fontFamily: FONTS.body,
            transition: 'all 0.15s', display: 'flex',
            flexDirection: 'column', alignItems: 'center', gap: SPACING.sm
          }}
          onMouseEnter={e => { e.currentTarget.style.background = h.bg; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = COLORS.white; e.currentTarget.style.transform = 'none' }}
          >
            <div style={{ fontSize: '38px', lineHeight: 1 }}>{h.icon}</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: COLORS.ink }}>{h.name}</div>
            <div style={{
              fontSize: '12px', fontWeight: 600, color: h.color,
              background: h.bg, padding: '3px 10px', borderRadius: RADIUS.pill
            }}>
              {h.count} events nearby
            </div>
          </button>
        ))}
      </div>

      {/* Surprise button */}
      <div style={{ padding: `0 ${SPACING.lg}` }}>
        <button onClick={surprise} style={{
          ...primaryButtonStyle,
          width: '100%', borderRadius: RADIUS.lg, padding: SPACING.lg,
          fontSize: '16px', letterSpacing: '.01em'
        }}>
          ✨ Surprise me — pick a random hobby
        </button>
      </div>
    </div>
  )
}

export default Hobbies
