import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useAppContext } from '../context/AppContext'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY

const CAT_COLORS = {
  Music:            '#8B72C8',
  Art:              '#C96E8A',
  'Arts & Theatre': '#C96E8A',
  Fitness:          '#5A8C6A',
  Sports:           '#5A8C6A',
  Cooking:          '#D4A84B',
  Tech:             '#8B72C8',
  Outdoors:         '#5A8C6A',
  Miscellaneous:    '#7A6880',
  Event:            '#7A6880',
}

const CAT_ICONS = {
  Music: '🎸', Art: '🎨', 'Arts & Theatre': '🎭',
  Fitness: '🏃', Sports: '⚽', Cooking: '🍳',
  Tech: '💻', Outdoors: '🏕', Miscellaneous: '✨', Event: '📅',
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
  if (d === today) return '<span style="color:#C96E8A;font-weight:700">Today</span>'
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const MapView = ({ location, events = [] }) => {
  const { radius, setRadius } = useAppContext()
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markers = useRef([])
  const radiusCircle = useRef(null)
  const [showRadiusSlider, setShowRadiusSlider] = useState(false)
  const [localRadius, setLocalRadius] = useState(radius)

  const clearMarkers = () => {
    markers.current.forEach(m => m.remove())
    markers.current = []
  }

  // Draw radius circle on map
  const drawRadiusCircle = (map, lat, lng, radiusMiles) => {
    const radiusKm = radiusMiles * 1.60934
    const points = 64
    const coords = []
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI
      const dx = radiusKm / 111.32
      const dy = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))
      coords.push([lng + dy * Math.sin(angle), lat + dx * Math.cos(angle)])
    }
    coords.push(coords[0])

    if (map.getSource('radius-source')) {
      map.getSource('radius-source').setData({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } })
    } else {
      map.addSource('radius-source', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } }
      })
      map.addLayer({
        id: 'radius-fill',
        type: 'fill',
        source: 'radius-source',
        paint: { 'fill-color': '#C96E8A', 'fill-opacity': 0.06 }
      })
      map.addLayer({
        id: 'radius-line',
        type: 'line',
        source: 'radius-source',
        paint: { 'line-color': '#C96E8A', 'line-width': 1.5, 'line-dasharray': [3, 3], 'line-opacity': 0.5 }
      })
    }
  }

  // Init map
  useEffect(() => {
    if (!location || map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [location.lng, location.lat],
      zoom: 12,
      attributionControl: false,
    })

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')

    // Pulsing user location
    const el = document.createElement('div')
    el.innerHTML = `
      <div style="position:relative;width:22px;height:22px">
        <div style="position:absolute;inset:0;border-radius:50%;background:#C96E8A;animation:hfpulse 2s infinite"></div>
        <div style="position:absolute;inset:4px;border-radius:50%;background:#C96E8A;border:2px solid #fff;box-shadow:0 2px 8px rgba(201,110,138,0.5)"></div>
      </div>
      <style>@keyframes hfpulse{0%,100%{transform:scale(1);opacity:0.25}50%{transform:scale(2.5);opacity:0}}</style>
    `

    new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([location.lng, location.lat])
      .setPopup(new mapboxgl.Popup({ offset: 15, closeButton: false })
        .setHTML(`<div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;color:#2A1F2D;padding:2px">📍 You are here</div>`))
      .addTo(map.current)

    map.current.on('load', () => {
      drawRadiusCircle(map.current, location.lat, location.lng, radius)
    })

    return () => {
      clearMarkers()
      map.current?.remove()
      map.current = null
    }
  }, [location])

  // Update radius circle when radius changes
  useEffect(() => {
    if (!map.current || !location) return
    const update = () => drawRadiusCircle(map.current, location.lat, location.lng, radius)
    if (map.current.loaded()) update()
    else map.current.on('load', update)
  }, [radius, location])

  // Add event markers
  useEffect(() => {
    if (!map.current) return
    clearMarkers()
    if (!events.length) return

    const addMarkers = () => {
      events.forEach((event) => {
        if (!event.lat || !event.lng) return
        const color = CAT_COLORS[event.category] ?? '#7A6880'
        const icon = CAT_ICONS[event.category] ?? '📅'

        const el = document.createElement('div')
        el.style.cssText = 'cursor:pointer;transform-origin:bottom center'
        el.innerHTML = `
          <div style="
            width:36px;height:36px;
            background:${color};
            border:2.5px solid #fff;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 3px 10px rgba(0,0,0,0.18);
            transition:transform 0.15s, box-shadow 0.15s;
          ">
            <span style="transform:rotate(45deg);font-size:16px;line-height:1">${icon}</span>
          </div>
        `

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)'
          el.style.zIndex = '999'
        })
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)'
          el.style.zIndex = ''
        })

        const popup = new mapboxgl.Popup({
          offset: [0, -40], closeButton: true, maxWidth: '270px'
        }).setHTML(`
          <div style="font-family:'DM Sans',system-ui,sans-serif;padding:4px 2px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
              <span style="font-size:18px">${icon}</span>
              <span style="font-size:10px;font-weight:700;color:${color};background:${color}18;padding:2px 8px;border-radius:20px;letter-spacing:.05em">
                ${(event.category || 'Event').toUpperCase()}
              </span>
            </div>
            <div style="font-size:15px;font-weight:700;color:#2A1F2D;line-height:1.3;margin-bottom:6px">${event.title}</div>
            ${event.venue ? `<div style="font-size:12px;color:#7A6880;margin-bottom:6px">📍 ${event.venue}</div>` : ''}
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <span style="font-size:12px;color:#7A6880">${fmtDate(event.date)}${event.time ? ' · ' + fmtTime(event.time) : ''}</span>
              <span style="font-size:14px;font-weight:700;color:${event.price === 'Free' ? '#5A8C6A' : '#2A1F2D'}">${event.price === 'Free' ? '✓ Free' : event.price}</span>
            </div>
            ${event.url ? `<a href="${event.url}" target="_blank" style="display:block;text-align:center;background:${color};color:#fff;border-radius:8px;padding:8px 12px;font-size:13px;font-weight:600;text-decoration:none">Sign up →</a>` : ''}
          </div>
        `)

        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([event.lng, event.lat])
          .setPopup(popup)
          .addTo(map.current)

        markers.current.push(marker)
      })
    }

    if (map.current.loaded()) addMarkers()
    else map.current.on('load', addMarkers)
  }, [events])

  const applyRadius = () => {
    setRadius(localRadius)
    setShowRadiusSlider(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '380px' }} />

      {/* Event count */}
      {events.length > 0 && (
        <div style={{
          position: 'absolute', top: '10px', left: '10px',
          background: '#C96E8A', color: '#fff',
          borderRadius: '20px', padding: '5px 12px',
          fontSize: '12px', fontWeight: 700,
          boxShadow: '0 2px 8px rgba(201,110,138,0.35)',
          fontFamily: 'DM Sans, sans-serif', zIndex: 1
        }}>
          {events.length} events nearby
        </div>
      )}

      {/* Radius control button */}
      <button
        onClick={() => setShowRadiusSlider(!showRadiusSlider)}
        style={{
          position: 'absolute', top: '10px', right: '10px',
          background: '#fff', border: '1.5px solid #F0E8E4',
          borderRadius: '20px', padding: '6px 14px',
          fontSize: '12px', fontWeight: 600, color: '#4A3850',
          cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
          display: 'flex', alignItems: 'center', gap: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 1
        }}
      >
        📍 {radius} mi radius
      </button>

      {/* Radius slider panel */}
      {showRadiusSlider && (
        <div style={{
          position: 'absolute', top: '46px', right: '10px',
          background: '#fff', border: '1px solid #F0E8E4',
          borderRadius: '14px', padding: '16px 18px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          zIndex: 10, width: '220px',
          fontFamily: 'DM Sans, system-ui, sans-serif'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#2A1F2D', marginBottom: '12px' }}>
            Search radius
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            {[5, 10, 25, 50].map(r => (
              <button key={r} onClick={() => setLocalRadius(r)} style={{
                padding: '5px 10px', borderRadius: '20px', fontSize: '12px',
                fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
                fontFamily: 'DM Sans, sans-serif',
                background: localRadius === r ? '#C96E8A' : 'transparent',
                borderColor: localRadius === r ? '#C96E8A' : '#EDE5DC',
                color: localRadius === r ? '#fff' : '#4A3850',
              }}>{r} mi</button>
            ))}
          </div>

          <input
            type="range"
            min="1" max="100" step="1"
            value={localRadius}
            onChange={e => setLocalRadius(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#C96E8A', margin: '8px 0' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: '#7A6880' }}>1 mile</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#C96E8A' }}>{localRadius} mi</span>
            <span style={{ fontSize: '12px', color: '#7A6880' }}>100 miles</span>
          </div>

          <button onClick={applyRadius} style={{
            width: '100%', background: '#C96E8A', color: '#fff',
            border: 'none', borderRadius: '10px', padding: '10px',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'DM Sans, system-ui, sans-serif'
          }}>
            Apply — show events within {localRadius} mi
          </button>
        </div>
      )}

      {/* Category legend */}
      {events.length > 0 && (
        <div style={{
          position: 'absolute', bottom: '36px', left: '10px',
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid #F0E8E4', borderRadius: '10px',
          padding: '8px 12px', display: 'flex', gap: '10px',
          flexWrap: 'wrap', maxWidth: '200px', zIndex: 1
        }}>
          {[...new Set(events.map(e => e.category).filter(Boolean))].slice(0, 4).map(cat => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: CAT_COLORS[cat] ?? '#7A6880' }} />
              <span style={{ fontSize: '11px', color: '#4A3850', fontFamily: 'DM Sans, sans-serif' }}>{cat}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MapView
