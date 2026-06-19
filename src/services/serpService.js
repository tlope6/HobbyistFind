const normalizeCategory = (title = '') => {
  const t = title.toLowerCase()
  if (t.includes('art') || t.includes('paint') || t.includes('craft') || t.includes('pottery') || t.includes('draw')) return 'Art'
  if (t.includes('music') || t.includes('concert') || t.includes('guitar') || t.includes('piano') || t.includes('sing')) return 'Music'
  if (t.includes('yoga') || t.includes('fitness') || t.includes('pilates') || t.includes('run') || t.includes('dance') || t.includes('gym') || t.includes('workout')) return 'Fitness'
  if (t.includes('cook') || t.includes('bak') || t.includes('culinary') || t.includes('food')) return 'Cooking'
  if (t.includes('tech') || t.includes('code') || t.includes('program') || t.includes('hack')) return 'Tech'
  if (t.includes('hik') || t.includes('outdoor') || t.includes('nature') || t.includes('climb') || t.includes('kayak')) return 'Outdoors'
  return 'Event'
}

const parseDate = (dateStr = '') => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (!isNaN(d)) return d.toISOString().split('T')[0]
  } catch {}
  return ''
}

export const fetchSerpEvents = async (lat, lng, category = '', cityName = '') => {
  try {
    const params = new URLSearchParams({ lat, lng, category, city: cityName })
    const res = await fetch(`/api/serp?${params}`)
    if (!res.ok) throw new Error('SerpAPI proxy error')
    const data = await res.json()
    const events = data.events_results ?? []

    return events.map((e, i) => {
      const venue = e.venue ?? {}
      return {
        id: `serp-${i}-${Date.now()}`,
        source: 'serp',
        title: e.title ?? '',
        category: normalizeCategory(e.title + ' ' + (e.description ?? '')),
        date: parseDate(e.date?.start_date),
        time: e.date?.when?.split(',')[1]?.trim() ?? '',
        venue: venue.name ?? '',
        address: venue.rating ? '' : (e.address?.[0] ?? ''),
        city: e.address?.[1] ?? cityName ?? '',
        lat: parseFloat(e.venue?.rating ?? lat),
        lng: parseFloat(lng),
        price: e.ticket_info?.[0]?.price ?? 'See site',
        url: e.link ?? e.ticket_info?.[0]?.link ?? '',
        image: e.thumbnail ?? '',
      }
    }).filter(e => e.title)
  } catch (err) {
    console.error('SerpAPI error:', err)
    return []
  }
}
