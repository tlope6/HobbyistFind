const PHQ_KEY = import.meta.env.VITE_PHQ_KEY

const CATEGORY_MAP = {
  'Music':    'concerts,performing-arts',
  'Art':      'performing-arts,community',
  'Fitness':  'sports,community',
  'Cooking':  'community',
  'Tech':     'conferences,expos',
  'Outdoors': 'outdoor,community',
  '':         'concerts,performing-arts,sports,community,conferences,outdoor',
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

    const params = new URLSearchParams({
      'location_around.origin': `${lat},${lng}`,
      'location_around.offset': `${radius}mi`,
      'category': categories,
      'limit': 20,
      'sort': 'start',
      'active.gte': today,
    })

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
      return {
        id: `phq-${e.id}`,
        source: 'predicthq',
        title: e.title,
        category: mapPHQCategory(e.category),
        date: e.start?.split('T')[0] ?? '',
        time: e.start?.split('T')[1]?.slice(0, 5) ?? '',
        venue: e.entities?.find(en => en.type === 'venue')?.name ?? '',
        address: '',
        city: e.entities?.find(en => en.type === 'venue')?.formatted_address ?? '',
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
