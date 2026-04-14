const PHQ_KEY = import.meta.env.VITE_PHQ_KEY

const CATEGORY_MAP = {
  'Music':    'concerts,performing-arts,festivals',
  'Art':      'performing-arts,festivals,community',
  'Fitness':  'sports,community',
  'Cooking':  'community,expos,festivals',
  'Tech':     'conferences,expos',
  'Outdoors': 'sports,community,festivals',
  '':         'concerts,performing-arts,sports,community,conferences,expos,festivals',
}

const mapPHQCategory = (cat) => {
  const map = {
    'concerts':        'Music',
    'performing-arts': 'Art',
    'sports':          'Fitness',
    'community':       'Event',
    'conferences':     'Tech',
    'expos':           'Tech',
    'outdoor':         'Outdoors',
    'food-drink':      'Cooking',
  }
  return map[cat] ?? 'Event'
}

export const fetchPredictHQEvents = async (lat, lng, category = '', radius = 10) => {
  if (!PHQ_KEY) {
    console.warn('No PredictHQ key found — add VITE_PHQ_KEY to your .env')
    return []
  }

  try {
    const categories = CATEGORY_MAP[category] ?? CATEGORY_MAP['']
    const today = new Date().toISOString().split('T')[0]

    const params = new URLSearchParams()
    params.append('location_around.origin', `${lat},${lng}`)
    params.append('location_around.offset', `${radius}mi`)
    params.append('limit', '20')
    params.append('sort', 'start')
    params.append('active.gte', today)
    params.append('category', categories)  // single comma-separated string

    // Add each category as a separate parameter
    params.append('category', categories)

    const res = await fetch(`https://api.predicthq.com/v1/events/?${params}`, {
      headers: {
        'Authorization': `Bearer ${PHQ_KEY}`,
        'Accept': 'application/json',
      }
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('PredictHQ error response:', errText)
      throw new Error(`PredictHQ error: ${res.status}`)
    }

    const data = await res.json()
    const events = data.results ?? []

    return events.map(e => {
      const coords = e.geo?.geometry?.coordinates
      const venueEntity = e.entities?.find(en => en.type === 'venue')
      return {
        id: `phq-${e.id}`,
        source: 'predicthq',
        title: e.title,
        category: mapPHQCategory(e.category),
        date: e.start?.split('T')[0] ?? '',
        time: e.start?.split('T')[1]?.slice(0, 5) ?? '',
        venue: venueEntity?.name ?? '',
        address: venueEntity?.formatted_address ?? '',
        city: e.location?.[0] ?? '',
        lat: coords ? parseFloat(coords[1]) : lat,
        lng: coords ? parseFloat(coords[0]) : lng,
        price: 'See site',
        url: `https://predicthq.com/events/${e.id}`,
        image: '',
      }
    })
  } catch (err) {
    console.error('PredictHQ error:', err)
    return []
  }
}