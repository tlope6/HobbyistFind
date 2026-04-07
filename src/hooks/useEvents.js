import { useState, useEffect } from 'react'
import { fetchEvents } from '../services/ticketmasterService'
import { fetchActivities } from '../services/yelpService'

const TM_CATEGORY_MAP = {
  'Music':    'Music',
  'Art':      'Arts & Theatre',
  'Fitness':  'Sports',
  'Sports':   'Sports',
  'Cooking':  'Miscellaneous',
  'Tech':     'Miscellaneous',
  'Outdoors': 'Miscellaneous',
}

const YELP_TERM_MAP = {
  'Music':    'music classes concerts',
  'Art':      'art classes painting drawing',
  'Fitness':  'fitness gym yoga pilates',
  'Cooking':  'cooking classes culinary',
  'Tech':     'coding bootcamp tech classes',
  'Outdoors': 'hiking outdoor activities parks nature',
  'All':      'classes activities events',
}

const normalizeCategory = (cat) => {
  if (!cat) return 'Event'
  if (cat.includes('Arts') || cat.includes('Theatre')) return 'Art'
  if (cat === 'Sports') return 'Fitness'
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
        const tmCategory = category ? (TM_CATEGORY_MAP[category] ?? category) : ''
        const yelpTerm = category
          ? (YELP_TERM_MAP[category] ?? category + ' classes')
          : 'classes activities'

        const [tmEvents, yelpEvents] = await Promise.all([
          fetchEvents(location.lat, location.lng, tmCategory, radius),
          fetchActivities(location.lat, location.lng, yelpTerm),
        ])

        const normalized = [...tmEvents, ...yelpEvents].map(e => ({
          ...e,
          category: normalizeCategory(e.category),
        }))

        const sorted = normalized
          .filter(e => e.lat && e.lng)
          .sort((a, b) => (a.date || '').localeCompare(b.date || ''))

        setEvents(sorted)
      } catch (err) {
        setError('Could not load events.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [location, category, radius])

  return { events, loading, error }
}

export default useEvents
