import { useState, useEffect } from 'react'
import { fetchEvents } from '../services/ticketmasterService'
import { fetchPredictHQEvents } from '../services/predicthqService'

const TM_CATEGORY_MAP = {
  'Music':    'Music',
  'Art':      'Arts & Theatre',
  'Fitness':  'Sports',
  'Outdoors': 'Sports',
}

const normalizeCategory = (cat) => {
  if (!cat) return 'Event'
  if (cat.includes('Arts') || cat.includes('Theatre')) return 'Art'
  if (cat === 'Sports') return 'Fitness'
  if (cat.includes('Food') || cat.includes('Drink')) return 'Cooking'
  if (cat.includes('Tech') || cat.includes('Science')) return 'Tech'
  if (cat.includes('Outdoor') || cat.includes('Travel')) return 'Outdoors'
  return cat
}

const useEvents = (location, category = '', radius = 10) => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!location) return

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const tmCategory = TM_CATEGORY_MAP[category] ?? ''
        const shouldUseTM = ['Music', 'Art', 'Fitness', ''].includes(category)

        const [tmEvents, phqEvents] = await Promise.all([
          shouldUseTM
            ? fetchEvents(location.lat, location.lng, tmCategory, radius)
            : Promise.resolve([]),
          fetchPredictHQEvents(location.lat, location.lng, category, radius),
        ])

        const allEvents = [...tmEvents, ...phqEvents]

        const seen = new Set()
        const normalized = allEvents
          .map(e => ({ ...e, category: normalizeCategory(e.category) }))
          .filter(e => {
            if (!e.lat || !e.lng) return false
            const key = e.title?.toLowerCase().trim()
            if (!key || seen.has(key)) return false
            seen.add(key)
            return true
          })
          .sort((a, b) => (a.date || '').localeCompare(b.date || ''))

        setEvents(normalized)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [location, category, radius])

  return { events, loading, error }
}

export default useEvents
