const EB_KEY = import.meta.env.VITE_EVENTBRITE_KEY
const BASE_URL = 'https://www.eventbriteapi.com/v3'

const EB_CATEGORY_IDS = {
  'Art':      '105',
  'Music':    '103',
  'Fitness':  '113',
  'Cooking':  '110',
  'Tech':     '102',
  'Outdoors': '111',
}

const mapEBCategory = (categoryId) => {
  const map = {
    '105': 'Art',
    '103': 'Music',
    '113': 'Fitness',
    '110': 'Cooking',
    '102': 'Tech',
    '111': 'Outdoors',
    '108': 'Fitness',
    '107': 'Art',
    '116': 'Art',
  }
  return map[String(categoryId)] ?? 'Event'
}

export const fetchEventbriteEvents = async (lat, lng, categoryId = '', keyword = '', radius = 10) => {
  if (!EB_KEY) {
    console.warn('No Eventbrite key found')
    return []
  }

  try {
    const params = new URLSearchParams({
      'location.latitude': lat,
      'location.longitude': lng,
      'location.within': `${radius}mi`,
      'expand': 'venue,ticket_availability',
      'sort_by': 'date',
      'page_size': '20',
    })

    if (categoryId) params.append('categories', categoryId)
    if (keyword) params.append('q', keyword)

    const res = await fetch(`${BASE_URL}/events/search/?${params}`, {
      headers: {
        'Authorization': `Bearer ${EB_KEY}`,
      }
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Eventbrite error response:', errText)
      throw new Error(`Eventbrite error: ${res.status}`)
    }

    const data = await res.json()
    const events = data.events ?? []

    if (events.length === 0) {
      console.log('Eventbrite returned 0 events for', { categoryId, keyword, lat, lng })
    }

    return events.map(e => {
      const venue = e.venue

      let price = 'See site'
      if (e.is_free) {
        price = 'Free'
      } else if (e.ticket_availability?.minimum_ticket_price) {
        const min = parseFloat(e.ticket_availability.minimum_ticket_price.major_value ?? 0)
        const max = parseFloat(e.ticket_availability.maximum_ticket_price?.major_value ?? min)
        if (min === 0) price = 'Free'
        else if (min === max) price = `$${Math.round(min)}`
        else price = `$${Math.round(min)}–$${Math.round(max)}`
      }

      return {
        id: `eb-${e.id}`,
        source: 'eventbrite',
        title: e.name?.text ?? '',
        category: mapEBCategory(e.category_id),
        date: e.start?.local?.split('T')[0] ?? '',
        time: e.start?.local?.split('T')[1]?.slice(0, 5) ?? '',
        venue: venue?.name ?? '',
        address: venue?.address?.address_1 ?? '',
        city: venue?.address?.city ?? '',
        lat: parseFloat(venue?.latitude ?? lat),
        lng: parseFloat(venue?.longitude ?? lng),
        price,
        url: e.url ?? '',
        image: e.logo?.original?.url ?? e.logo?.url ?? '',
      }
    }).filter(e => e.title)

  } catch (err) {
    console.error('Eventbrite fetch error:', err)
    return []
  }
}