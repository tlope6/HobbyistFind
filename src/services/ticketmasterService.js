const TM_KEY = import.meta.env.VITE_TM_KEY
const BASE_URL = 'https://app.ticketmaster.com/discovery/v2'

export const fetchEvents = async (lat, lng, category = '', radius = 10) => {
  try {
    const params = new URLSearchParams({
      apikey: TM_KEY,
      latlong: `${lat},${lng}`,
      radius: String(radius),
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

      // Accurate price detection
      let price = 'Free'
      if (e.priceRanges && e.priceRanges.length > 0) {
        const min = e.priceRanges[0].min
        const max = e.priceRanges[0].max
        if (min === 0 && (!max || max === 0)) {
          price = 'Free'
        } else if (min === 0 && max > 0) {
          price = `Free–$${Math.round(max)}`
        } else if (min > 0) {
          price = min === max
            ? `$${Math.round(min)}`
            : `$${Math.round(min)}–$${Math.round(max)}`
        }
      } else if (e.pleaseNote?.toLowerCase().includes('free')) {
        price = 'Free'
      } else {
        // No price info — mark as unknown not Free
        price = 'See site'
      }

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
        price,
        url: e.url ?? '',
        image: e.images?.find(img => img.ratio === '16_9' && img.width > 500)?.url
          ?? e.images?.[0]?.url ?? '',
        priceMin: e.priceRanges?.[0]?.min ?? null,
      }
    })
  } catch (err) {
    console.error('Ticketmaster fetch error:', err)
    return []
  }
}
