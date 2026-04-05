const TM_KEY = import.meta.env.VITE_TM_KEY
const BASE_URL = 'https://app.ticketmaster.com/discovery/v2'
export const fetchEvents = async (lat, lng, category = '') => {
  try {
    const params = new URLSearchParams({ apikey: TM_KEY, latlong: `${lat},${lng}`, radius: '10', unit: 'miles', size: '20', sort: 'date,asc', ...(category && { classificationName: category }) })
    const res = await fetch(`${BASE_URL}/events.json?${params}`)
    const data = await res.json()
    return (data._embedded?.events ?? []).map((e) => ({
      id: e.id, source: 'ticketmaster', title: e.name,
      category: e.classifications?.[0]?.segment?.name ?? 'Event',
      date: e.dates?.start?.localDate ?? '', time: e.dates?.start?.localTime ?? '',
      venue: e._embedded?.venues?.[0]?.name ?? '', address: e._embedded?.venues?.[0]?.address?.line1 ?? '',
      lat: parseFloat(e._embedded?.venues?.[0]?.location?.latitude ?? lat),
      lng: parseFloat(e._embedded?.venues?.[0]?.location?.longitude ?? lng),
      price: e.priceRanges?.[0]?.min ? `$${e.priceRanges[0].min}` : 'Free',
      url: e.url ?? '', image: e.images?.[0]?.url ?? '',
    }))
  } catch (err) { console.error('TM error:', err); return [] }
}
