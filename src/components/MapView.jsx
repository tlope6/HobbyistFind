import { useEffect, useRef, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

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
  Undefined:        '#7A6880',
}

const CAT_ICONS = {
  Music: '🎸', Art: '🎨', 'Arts & Theatre': '🎭',
  Fitness: '🏃', Sports: '⚽', Cooking: '🍳',
  Tech: '💻', Outdoors: '🏕', Miscellaneous: '✨',
}

const MapView = ({ location, events = [], onEventClick }) => {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markers = useRef([])
  const popups = useRef([])

  const clearMarkers = () => {
    markers.current.forEach(m => m.remove())
    markers.current = []
    popups.current.forEach(p => p.remove())
    popups.current = []
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

    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }))
    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')

    // User location pulse marker
    const pulseEl = document.createElement('div')
    pulseEl.innerHTML = `
      <div style="position:relative;width:20px;height:20px">
        <div style="position:absolute;inset:0;border-radius:50%;background:#C96E8A;opacity:0.3;animation:pulse 2s infinite"></div>
        <div style="position:absolute;inset:3px;border-radius:50%;background:#C96E8A;border:2px solid #fff;box-shadow:0 2px 6px rgba(201,110,138,0.5)"></div>
      </div>
      <style>@keyframes pulse{0%,100%{transform:scale(1);opacity:0.3}50%{transform:scale(2.2);opacity:0}}</style>
    `

    new mapboxgl.Marker({ element: pulseEl, anchor: 'center' })
      .setLngLat([location.lng, location.lat])
      .setPopup(new mapboxgl.Popup({ offset: 15, closeButton: false })
        .setHTML(`<div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;color:#2A1F2D;padding:4px 2px">📍 You are here</div>`))
      .addTo(map.current)

    return () => {
      clearMarkers()
      map.current?.remove()
      map.current = null
    }
  }, [location])

  // Add event markers whenever events change
  useEffect(() => {
    if (!map.current) return
    clearMarkers()
    if (!events.length) return

    // Wait for map to be ready
    const addMarkers = () => {
      events.forEach((event, idx) => {
        if (!event.lat || !event.lng) return

        const color = CAT_COLORS[event.category] ?? '#7A6880'
        const icon = CAT_ICONS[event.category] ?? '📅'

        // Custom pin element
        const el = document.createElement('div')
        el.style.cssText = 'cursor:pointer;position:relative'
        el.innerHTML = `
          <div style="
            background:${color};
            border:2px solid #fff;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            width:32px;height:32px;
            box-shadow:0 2px 8px rgba(0,0,0,0.2);
            display:flex;align-items:center;justify-content:center;
            transition:transform 0.15s;
          ">
            <span style="transform:rotate(45deg);font-size:14px;line-height:1">${icon}</span>
          </div>
        `

        el.addEventListener('mouseenter', () => {
          el.querySelector('div').style.transform = 'rotate(-45deg) scale(1.2)'
        })
        el.addEventListener('mouseleave', () => {
          el.querySelector('div').style.transform = 'rotate(-45deg) scale(1)'
        })

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

        const popup = new mapboxgl.Popup({
          offset: [0, -36],
          closeButton: true,
          maxWidth: '260px',
          className: 'hobby-popup'
        }).setHTML(`
          <div style="font-family:'DM Sans',system-ui,sans-serif;padding:4px 2px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
              <span style="font-size:16px">${icon}</span>
              <span style="font-size:10px;font-weight:700;color:${color};background:${color}20;padding:2px 8px;border-radius:20px;letter-spacing:.04em">
                ${(event.category || 'Event').toUpperCase()}
              </span>
            </div>
            <div style="font-size:15px;font-weight:700;color:#2A1F2D;line-height:1.3;margin-bottom:6px">
              ${event.title}
            </div>
            ${event.venue ? `<div style="font-size:12px;color:#7A6880;margin-bottom:6px">📍 ${event.venue}</div>` : ''}
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              <span style="font-size:12px;color:#7A6880">${fmtDate(event.date)}${event.time ? ' · ' + fmtTime(event.time) : ''}</span>
              <span style="font-size:14px;font-weight:700;color:${event.price === 'Free' ? '#5A8C6A' : '#2A1F2D'}">
                ${event.price === 'Free' ? '✓ Free' : event.price}
              </span>
            </div>
            ${event.url ? `<a href="${event.url}" target="_blank" style="
              display:block;text-align:center;
              background:${color};color:#fff;
              border-radius:8px;padding:8px;
              font-size:13px;font-weight:600;
              text-decoration:none;
            ">Sign up →</a>` : ''}
          </div>
        `)

        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([event.lng, event.lat])
          .setPopup(popup)
          .addTo(map.current)

        markers.current.push(marker)
        popups.current.push(popup)
      })
    }

    if (map.current.loaded()) {
      addMarkers()
    } else {
      map.current.on('load', addMarkers)
    }
  }, [events])

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '380px' }} />

      {/* Legend */}
      {events.length > 0 && (
        <div style={{
          position: 'absolute', bottom: '36px', left: '10px',
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid #F0E8E4',
          borderRadius: '10px', padding: '8px 12px',
          display: 'flex', gap: '10px', flexWrap: 'wrap',
          maxWidth: '240px', backdropFilter: 'blur(4px)'
        }}>
          {[...new Set(events.map(e => e.category).filter(Boolean))].slice(0, 4).map(cat => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: CAT_COLORS[cat] ?? '#7A6880', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: '#4A3850', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>{cat}</span>
            </div>
          ))}
        </div>
      )}

      {/* Event count badge */}
      {events.length > 0 && (
        <div style={{
          position: 'absolute', top: '10px', left: '10px',
          background: '#C96E8A', color: '#fff',
          borderRadius: '20px', padding: '5px 12px',
          fontSize: '12px', fontWeight: 700,
          boxShadow: '0 2px 8px rgba(201,110,138,0.35)',
          fontFamily: 'DM Sans, sans-serif'
        }}>
          {events.length} events nearby
        </div>
      )}
    </div>
  )
}

export default MapView
