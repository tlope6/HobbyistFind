import { useState, useEffect } from 'react'
import { fetchEvents } from '../services/ticketmasterService'
import { fetchEventbriteEvents } from '../services/eventbriteService'

const TM_CATEGORY_MAP = {
  'Music':    'Music',
  'Art':      'Arts & Theatre',
  'Fitness':  'Sports',
  'Outdoors': 'Sports',
}

const EB_CATEGORY_MAP = {
  'Art':      '105',
  'Music':    '103',
  'Fitness':  '113',
  'Cooking':  '110',
  'Tech':     '102',
  'Outdoors': '111',
  '':         '',
}

const EB_KEYWORD_MAP = {
  'Art':      'art class painting watercolor drawing pottery craft workshop',
  'Music':    'music class concert performance workshop',
  'Fitness':  'yoga pilates fitness workout dance class',
  'Cooking':  'cooking class baking culinary food workshop',
  'Tech':     'coding workshop hackathon tech class programming',
  'Outdoors': 'hiking outdoor nature adventure walk tour',
  '':         'class workshop activity hobby',
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
        const ebCategory = EB_CATEGORY_MAP[category] ?? ''
        const ebKeyword = EB_KEYWORD_MAP[category] ?? EB_KEYWORD_MAP['']

        const shouldUseTM = ['Music', 'Art', 'Fitness', ''].includes(category)

        const [tmEvents, ebEvents] = await Promise.all([
          shouldUseTM
            ? fetchEvents(location.lat, location.lng, tmCategory, radius)
            : Promise.resolve([]),
          fetchEventbriteEvents(location.lat, location.lng, ebCategory, ebKeyword, radius),
        ])

        const allEvents = [...tmEvents, ...ebEvents]

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