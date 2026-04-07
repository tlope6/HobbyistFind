const TM_KEY = import.meta.env.VITE_TM_KEY
const BASE_URL = 'https://app.ticketmaster.com/discovery/v2'

export const fetchEvents = async (lat, lng, category = '') => {
  try {
    const params = new URLSearchParams({
      apikey: TM_KEY,
      latlong: `${lat},${lng}`,
      radius: '25',
      unit: 'miles',
      size: '20',
      sort: 'date,asc',
    })

    if (category) params.append('classificationName', category)

    const res = await fetch(`${BASE_URL}/events.json?${params}`)
    if (!res.ok) throw new Error(`TM API error: ${res.status}`)
    const data = await res.json()
    const events = data._embedded?.events ?? []

    return events.map((e) => {
      const venue = e._embedded?.venues?.[0]
      return {
        id: e.id,
        source: 'ticketmaster',
        title: e.name,
        category: e.classifications?.[0]?.segment?.name ?? 'Event',
        subCategory: e.classifications?.[0]?.genre?.name ?? '',
        date: e.dates?.start?.localDate ?? '',
        time: e.dates?.start?.localTime ?? '',
        venue: venue?.name ?? '',
        address: venue?.address?.line1 ?? '',
        city: venue?.city?.name ?? '',
        lat: parseFloat(venue?.location?.latitude ?? lat),
        lng: parseFloat(venue?.location?.longitude ?? lng),
        price: e.priceRanges?.[0]?.min
          ? `$${Math.round(e.priceRanges[0].min)}`
          : 'Free',
        url: e.url ?? '',
        image: e.images?.find(img => img.ratio === '16_9' && img.width > 500)?.url
          ?? e.images?.[0]?.url ?? '',
      }
    })
  } catch (err) {
    console.error('Ticketmaster fetch error:', err)
    return []
  }
}
