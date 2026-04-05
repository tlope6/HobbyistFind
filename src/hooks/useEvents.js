import { useState, useEffect } from 'react'
import { fetchEvents } from '../services/ticketmasterService'
import { fetchActivities } from '../services/yelpService'

const useEvents = (location, category = '') => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!location) return
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [tmEvents, yelpEvents] = await Promise.all([
          fetchEvents(location.lat, location.lng, category),
          fetchActivities(location.lat, location.lng, category || 'classes'),
        ])
        const merged = [...tmEvents, ...yelpEvents].sort((a, b) =>
          a.date.localeCompare(b.date)
        )
        setEvents(merged)
      } catch (err) {
        setError('Could not load events.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [location, category])

  return { events, loading, error }
}

export default useEvents