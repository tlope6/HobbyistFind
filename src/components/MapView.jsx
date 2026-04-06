import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY

const PIN_COLORS = {
  Art: '#C96E8A',
  Music: '#8B72C8',
  Fitness: '#5A8C6A',
  Cooking: '#D4A84B',
  Tech: '#8B72C8',
  Outdoors: '#5A8C6A',
  Event: '#7A6880',
}

const MapView = ({ location, events = [] }) => {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markers = useRef([])

  useEffect(() => {
    if (!location || map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [location.lng, location.lat],
      zoom: 12,
    })

    new mapboxgl.Marker({ color: '#C96E8A' })
      .setLngLat([location.lng, location.lat])
      .addTo(map.current)

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [location])

  useEffect(() => {
    if (!map.current || !events.length) return

    markers.current.forEach((m) => m.remove())
    markers.current = []

    events.forEach((event) => {
      const color = PIN_COLORS[event.category] ?? '#7A6880'

      const el = document.createElement('div')
      el.style.cssText = `
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: ${color};
        border: 2px solid white;
        cursor: pointer;
        box-shadow: 0 1px 4px rgba(42,31,45,0.2);
      `

      const popup = new mapboxgl.Popup({ offset: 15, closeButton: false })
        .setHTML(`
          <div style="font-family:'DM Sans',sans-serif;background:#fff;border-radius:10px;padding:10px 12px;min-width:160px;border:1px solid rgba(42,31,45,0.1)">
            <div style="color:#2A1F2D;font-weight:600;font-size:13px;margin-bottom:2px">${event.title}</div>
            <div style="color:#7A6880;font-size:11px;margin-bottom:8px">${event.category} · ${event.price}</div>
            <a href="${event.url}" target="_blank" style="background:#C96E8A;color:#fff;border-radius:6px;padding:5px 10px;font-size:11px;text-decoration:none;font-weight:600">Sign up →</a>
          </div>
        `)

      const marker = new mapboxgl.Marker(el)
        .setLngLat([event.lng, event.lat])
        .setPopup(popup)
        .addTo(map.current)

      markers.current.push(marker)
    })
  }, [events])

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height: '400px',
        borderBottom: '1px solid #F7D6E3',
      }}
    />
  )
}

export default MapView