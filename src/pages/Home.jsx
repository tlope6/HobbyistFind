import { useEffect, useState, useRef } from 'react'
import { useAppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import useLocation from '../hooks/useLocation'
import useEvents from '../hooks/useEvents'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { COLORS, SPACING, RADIUS, FONTS, SHADOW } from '../theme'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY

const CATS = ['All', 'Art', 'Music', 'Fitness', 'Cooking', 'Tech', 'Outdoors']

const CAT_COLORS = {
  Music: COLORS.lavender, Art: COLORS.rose, 'Arts & Theatre': COLORS.rose,
  Fitness: COLORS.sage, Sports: COLORS.sage, Cooking: COLORS.gold,
  Tech: COLORS.lavender, Outdoors: COLORS.sage, Event: COLORS.muted,
}
const CAT_ICONS = {
  Music: '🎸', Art: '🎨', 'Arts & Theatre': '🎭',
  Fitness: '🏃', Sports: '⚽', Cooking: '🍳',
  Tech: '💻', Outdoors: '🏕', Event: '📅',
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

const Home = () => {
  const { location, setLocation, setCityName, activeCategory, setActiveCategory, radius, setRadius } = useAppContext()
  const { location: detected, loading: locLoading } = useLocation()
  const { events, loading } = useEvents(location, activeCategory === 'All' ? '' : activeCategory, radius)
  const navigate = useNavigate()

  const mapContainer = useRef(null)
  const map = useRef(null)
  const markers = useRef([])

  const [selectedEvent, setSelectedEvent] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelFull, setPanelFull] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [showRadius, setShowRadius] = useState(false)

  const filteredEvents = events.filter(e => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      e.title?.toLowerCase().includes(q) ||
      e.venue?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q)
    )
  })

  useEffect(() => {
    if (!detected) return
    setLocation(detected)
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${detected.lat}&longitude=${detected.lng}&localityLanguage=en`)
      .then(r => r.json())
      .then(d => { if (d.city) setCityName(`${d.city}, ${d.principalSubdivisionCode}`) })
      .catch(() => {})
  }, [detected])

  useEffect(() => {
    if (!location || map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [location.lng, location.lat],
      zoom: 13,
      attributionControl: false,
    })

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')

    const userEl = document.createElement('div')
    userEl.style.cssText = 'width:22px;height:22px;position:relative'
    userEl.innerHTML = `
      <div style="position:absolute;inset:0;border-radius:50%;background:${COLORS.rose};animation:hfpulse 2s infinite;pointer-events:none"></div>
      <div style="position:absolute;inset:4px;border-radius:50%;background:${COLORS.rose};border:2px solid #fff;box-shadow:0 2px 8px rgba(201,110,138,0.5);pointer-events:none"></div>
      <style>@keyframes hfpulse{0%,100%{transform:scale(1);opacity:0.25}50%{transform:scale(2.5);opacity:0}}</style>
    `
    new mapboxgl.Marker({ element: userEl, anchor: 'center' })
      .setLngLat([location.lng, location.lat])
      .addTo(map.current)

    map.current.on('load', () => {
      const radiusKm = radius * 1.60934
      const pts = 64
      const coords = []
      for (let i = 0; i < pts; i++) {
        const angle = (i / pts) * 2 * Math.PI
        const dx = radiusKm / 111.32
        const dy = radiusKm / (111.32 * Math.cos((location.lat * Math.PI) / 180))
        coords.push([location.lng + dy * Math.sin(angle), location.lat + dx * Math.cos(angle)])
      }
      coords.push(coords[0])
      map.current.addSource('radius', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } }
      })
      map.current.addLayer({ id: 'radius-fill', type: 'fill', source: 'radius', paint: { 'fill-color': COLORS.rose, 'fill-opacity': 0.05 } })
      map.current.addLayer({ id: 'radius-line', type: 'line', source: 'radius', paint: { 'line-color': COLORS.rose, 'line-width': 1.5, 'line-dasharray': [3, 3], 'line-opacity': 0.4 } })
    })

    map.current.on('click', () => setSelectedEvent(null))

    return () => { map.current?.remove(); map.current = null }
  }, [location])

  // Redraw radius circle whenever radius changes
  useEffect(() => {
    if (!map.current || !location) return
    const redraw = () => {
      if (!map.current.getSource('radius')) return
      const radiusKm = radius * 1.60934
      const pts = 64
      const coords = []
      for (let i = 0; i < pts; i++) {
        const angle = (i / pts) * 2 * Math.PI
        const dx = radiusKm / 111.32
        const dy = radiusKm / (111.32 * Math.cos((location.lat * Math.PI) / 180))
        coords.push([location.lng + dy * Math.sin(angle), location.lat + dx * Math.cos(angle)])
      }
      coords.push(coords[0])
      map.current.getSource('radius').setData({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } })
    }
    if (map.current.loaded()) redraw()
    else map.current.on('load', redraw)
  }, [radius, location])

  useEffect(() => {
    if (!map.current || !events.length) return
    markers.current.forEach(m => m.remove())
    markers.current = []

    const add = () => {
      events.forEach(event => {
        if (!event.lat || !event.lng) return

        const color = CAT_COLORS[event.category] ?? COLORS.muted
        const icon = CAT_ICONS[event.category] ?? '📅'

        const el = document.createElement('div')
        el.style.cssText = [
          'width:38px', 'height:38px', 'border-radius:50%',
          `background:${color}`, 'border:3px solid #fff',
          'box-shadow:0 2px 10px rgba(0,0,0,0.22)',
          'display:flex', 'align-items:center', 'justify-content:center',
          'font-size:18px', 'line-height:1', 'cursor:pointer',
          'user-select:none', 'transition:transform 0.12s, box-shadow 0.12s',
          'box-sizing:border-box',
        ].join(';')
        el.textContent = icon

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)'
          el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)'
        })
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)'
          el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.22)'
        })
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          setSelectedEvent(event)
          setPanelOpen(false)
          map.current.flyTo({ center: [event.lng, event.lat], zoom: 14, duration: 500, offset: [0, 100] })
        })

        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([event.lng, event.lat])
          .addTo(map.current)

        markers.current.push(marker)
      })
    }

    if (map.current.loaded()) add()
    else map.current.on('load', add)
  }, [events])

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 120px)', overflow: 'hidden', fontFamily: FONTS.body }}>

      <div ref={mapContainer} style={{ position: 'absolute', inset: 0 }} />

      {/* Search bar */}
      <div style={{ position: 'absolute', top: SPACING.md, left: SPACING.md, right: SPACING.md, zIndex: 10 }}>
        <div style={{
          background: COLORS.white, borderRadius: RADIUS.md,
          display: 'flex', alignItems: 'center', gap: SPACING.sm,
          padding: '11px 16px', boxShadow: SHADOW.float,
          border: `1.5px solid ${searchFocused ? COLORS.rose : 'transparent'}`,
          transition: 'border-color 0.15s'
        }}>
          <span style={{ fontSize: '16px', color: '#B07090' }}>🔍</span>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: COLORS.ink, fontSize: '15px', flex: 1, fontFamily: FONTS.body }}
            placeholder="Search events, venues, hobbies..."
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.muted, fontSize: '20px', lineHeight: 1 }}>×</button>
          )}
        </div>

        {searchQuery && searchFocused && filteredEvents.length > 0 && (
          <div style={{ background: COLORS.white, borderRadius: RADIUS.sm, marginTop: SPACING.sm, boxShadow: SHADOW.float, overflow: 'hidden', maxHeight: '240px', overflowY: 'auto' }}>
            {filteredEvents.slice(0, 5).map(e => (
              <div key={`${e.source}-${e.id}`}
                onMouseDown={() => {
                  setSelectedEvent(e)
                  setSearchQuery('')
                  map.current?.flyTo({ center: [e.lng, e.lat], zoom: 14, duration: 500, offset: [0, 100] })
                }}
                style={{ padding: '11px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: SPACING.sm, borderBottom: '1px solid #FAF7F4' }}
                onMouseEnter={el => el.currentTarget.style.background = '#FAF7F4'}
                onMouseLeave={el => el.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '20px' }}>{CAT_ICONS[e.category] ?? '📅'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: COLORS.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                  <div style={{ fontSize: '11px', color: COLORS.muted }}>{e.category}{e.venue ? ` · ${e.venue}` : ''}</div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: e.price === 'Free' ? COLORS.sage : COLORS.ink, flexShrink: 0 }}>
                  {e.price === 'Free' ? 'Free' : e.price}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category pills */}
      <div style={{ position: 'absolute', top: '76px', left: 0, right: 0, zIndex: 9, padding: `0 ${SPACING.md}` }}>
        <div style={{ display: 'flex', gap: SPACING.sm, overflowX: 'auto', paddingBottom: SPACING.xs }}>
          {CATS.map(cat => {
            const active = activeCategory === cat || (cat === 'All' && !activeCategory)
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                flexShrink: 0, padding: '6px 16px', borderRadius: RADIUS.pill,
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                border: 'none', whiteSpace: 'nowrap',
                background: active ? COLORS.rose : 'rgba(255,255,255,0.95)',
                color: active ? COLORS.white : COLORS.ink2,
                boxShadow: SHADOW.card,
                fontFamily: FONTS.body,
                transition: 'all 0.15s'
              }}>{cat}</button>
            )
          })}
        </div>
      </div>

      {/* Radius control */}
      <div style={{ position: 'absolute', top: '120px', right: SPACING.md, zIndex: 9 }}>
        <button
          onClick={() => setShowRadius(!showRadius)}
          style={{
            background: 'rgba(255,255,255,0.95)', border: 'none',
            borderRadius: RADIUS.pill, padding: '6px 14px',
            fontSize: '12px', fontWeight: 600, color: COLORS.ink2,
            cursor: 'pointer', boxShadow: SHADOW.card,
            fontFamily: FONTS.body,
            display: 'flex', alignItems: 'center', gap: '5px'
          }}
        >
          📍 {radius} mi
        </button>

        {showRadius && (
          <div style={{
            position: 'absolute', top: '36px', right: 0,
            background: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.lg,
            boxShadow: SHADOW.float, width: '220px', zIndex: 20
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.ink, marginBottom: SPACING.md }}>Search radius</div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: SPACING.sm }}>
              {[5, 10, 25, 50].map(r => (
                <button key={r} onClick={() => { setRadius(r); setShowRadius(false) }} style={{
                  flex: 1, padding: '5px 0', borderRadius: RADIUS.pill, fontSize: '11px',
                  fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
                  background: radius === r ? COLORS.rose : 'transparent',
                  borderColor: radius === r ? COLORS.rose : COLORS.border,
                  color: radius === r ? COLORS.white : COLORS.ink2,
                  fontFamily: FONTS.body
                }}>{r} mi</button>
              ))}
            </div>
            <input type="range" min="1" max="100" step="1" value={radius}
              onChange={e => setRadius(Number(e.target.value))}
              style={{ width: '100%', accentColor: COLORS.rose }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: COLORS.muted, marginTop: SPACING.xs }}>
              <span>1 mi</span>
              <span style={{ fontWeight: 700, color: COLORS.rose }}>{radius} mi</span>
              <span>100 mi</span>
            </div>
          </div>
        )}
      </div>

      {/* View events floating button */}
      {!selectedEvent && !panelOpen && events.length > 0 && (
        <button onClick={() => { setPanelOpen(true); setPanelFull(false) }} style={{
          position: 'absolute', bottom: SPACING.xl, left: '50%',
          transform: 'translateX(-50%)',
          background: COLORS.rose, color: COLORS.white, border: 'none',
          borderRadius: RADIUS.pill, padding: '13px 28px',
          fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          zIndex: 10, boxShadow: '0 4px 16px rgba(201,110,138,0.45)',
          fontFamily: FONTS.body,
          whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: SPACING.sm
        }}>
          {loading ? 'Finding events...' : `View ${events.length} events nearby`}
          <span style={{ fontSize: '16px' }}>↑</span>
        </button>
      )}

      {/* Selected event card */}
      {selectedEvent && (
        <div style={{ position: 'absolute', bottom: SPACING.xl, left: SPACING.md, right: SPACING.md, zIndex: 20, animation: 'slideUp 0.25s ease' }}>
          <style>{`@keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
          <div style={{ background: COLORS.white, borderRadius: RADIUS.xl, boxShadow: SHADOW.deep, overflow: 'hidden' }}>
            {selectedEvent.image ? (
              <div style={{ height: '140px', overflow: 'hidden', position: 'relative' }}>
                <img src={selectedEvent.image} alt={selectedEvent.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(42,31,45,0.5) 0%, transparent 60%)' }} />
                <button onClick={() => setSelectedEvent(null)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>×</button>
              </div>
            ) : (
              <div style={{ height: '64px', background: (CAT_COLORS[selectedEvent.category] ?? COLORS.muted) + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', position: 'relative' }}>
                {CAT_ICONS[selectedEvent.category] ?? '📅'}
                <button onClick={() => setSelectedEvent(null)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>×</button>
              </div>
            )}

            <div style={{ padding: '14px 16px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: CAT_COLORS[selectedEvent.category] ?? COLORS.muted, background: (CAT_COLORS[selectedEvent.category] ?? COLORS.muted) + '18', padding: '2px 8px', borderRadius: RADIUS.pill, letterSpacing: '.05em' }}>
                  {(selectedEvent.category || 'Event').toUpperCase()}
                </span>
                <span style={{ fontSize: '12px', color: COLORS.muted }}>
                  {fmtDate(selectedEvent.date)}{selectedEvent.time ? ` · ${fmtTime(selectedEvent.time)}` : ''}
                </span>
              </div>

              <div style={{ fontSize: '17px', fontWeight: 700, color: COLORS.ink, lineHeight: 1.3, marginBottom: '5px', fontFamily: FONTS.heading }}>
                {selectedEvent.title}
              </div>

              {selectedEvent.venue && (
                <div style={{ fontSize: '13px', color: COLORS.muted, marginBottom: SPACING.md }}>
                  📍 {selectedEvent.venue}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
                <div style={{ flex: 1, fontSize: '16px', fontWeight: 700, color: selectedEvent.price === 'Free' ? COLORS.sage : COLORS.ink }}>
                  {selectedEvent.price === 'Free' ? '✓ Free' : selectedEvent.price}
                </div>
                {selectedEvent.url && (
                  <a href={selectedEvent.url} target="_blank" rel="noreferrer" style={{ background: CAT_COLORS[selectedEvent.category] ?? COLORS.rose, color: COLORS.white, borderRadius: RADIUS.pill, padding: '10px 20px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', fontFamily: FONTS.body, flexShrink: 0 }}>
                    Sign up →
                  </a>
                )}
                <button onClick={() => { setActiveCategory(selectedEvent.category); navigate('/events') }} style={{ background: COLORS.surface, color: COLORS.ink2, border: 'none', borderRadius: RADIUS.pill, padding: '10px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body, flexShrink: 0 }}>
                  More like this
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-up events panel */}
      {panelOpen && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20, background: COLORS.cream, borderRadius: '20px 20px 0 0', boxShadow: '0 -4px 24px rgba(42,31,45,0.15)', maxHeight: panelFull ? '80vh' : '48vh', transition: 'max-height 0.3s ease', display: 'flex', flexDirection: 'column' }}>
          <div onClick={() => setPanelFull(!panelFull)} style={{ padding: '12px 16px 8px', cursor: 'pointer', flexShrink: 0 }}>
            <div style={{ width: '40px', height: '4px', background: COLORS.border, borderRadius: '2px', margin: '0 auto 10px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '17px', fontWeight: 700, color: COLORS.ink, fontFamily: FONTS.heading }}>Nearby events</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
                <span style={{ fontSize: '13px', color: COLORS.muted, background: COLORS.surface2, padding: '3px 10px', borderRadius: RADIUS.pill }}>
                  {filteredEvents.length} found
                </span>
                <button onClick={e => { e.stopPropagation(); setPanelOpen(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.muted, fontSize: '20px', lineHeight: 1 }}>×</button>
              </div>
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, padding: `0 ${SPACING.md} ${SPACING.xl}` }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: COLORS.muted, fontSize: '14px' }}>Finding events near you...</div>
            ) : filteredEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', fontSize: '14px', color: COLORS.muted }}>No events found nearby</div>
            ) : filteredEvents.map(e => (
              <div key={`${e.source}-${e.id}`}
                onClick={() => {
                  setSelectedEvent(e)
                  setPanelOpen(false)
                  map.current?.flyTo({ center: [e.lng, e.lat], zoom: 14, duration: 500, offset: [0, 100] })
                }}
                style={{ background: COLORS.white, border: `1px solid ${COLORS.surface2}`, borderRadius: RADIUS.md, padding: '12px 14px', marginBottom: SPACING.sm, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: SPACING.md, transition: 'all 0.15s' }}
                onMouseEnter={el => { el.currentTarget.style.borderColor = '#E8A0B4'; el.currentTarget.style.boxShadow = '0 2px 8px rgba(201,110,138,0.1)' }}
                onMouseLeave={el => { el.currentTarget.style.borderColor = COLORS.surface2; el.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: RADIUS.sm, background: (CAT_COLORS[e.category] ?? COLORS.muted) + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                  {CAT_ICONS[e.category] ?? '📅'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: COLORS.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>{e.title}</div>
                  <div style={{ fontSize: '12px', color: COLORS.muted }}>
                    {fmtDate(e.date)}{e.time ? ` · ${fmtTime(e.time)}` : ''}{e.venue ? ` · ${e.venue}` : ''}
                  </div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: e.price === 'Free' ? COLORS.sage : COLORS.ink, flexShrink: 0 }}>
                  {e.price === 'Free' ? 'Free' : e.price}
                </div>
              </div>
            ))}

            <button onClick={() => navigate('/events')} style={{ width: '100%', background: COLORS.roseLight, color: COLORS.rose, border: '1.5px solid #F0C8D8', borderRadius: RADIUS.md, padding: '13px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body, marginTop: SPACING.xs }}>
              View all events with filters →
            </button>
          </div>
        </div>
      )}

      {/* Location loading screen */}
      {locLoading && (
        <div style={{ position: 'absolute', inset: 0, background: COLORS.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 30, gap: SPACING.md }}>
          <div style={{ fontSize: '40px' }}>📍</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: COLORS.ink, fontFamily: FONTS.heading }}>Finding your location</div>
          <div style={{ fontSize: '14px', color: COLORS.muted }}>Allow location access to see events near you</div>
        </div>
      )}
    </div>
  )
}

export default Home
