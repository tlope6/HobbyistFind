export const fetchActivities = async (lat, lng, term = 'classes') => {
  try {
    const res = await fetch(`/api/yelp?${new URLSearchParams({ lat, lng, term })}`)
    if (!res.ok) throw new Error('Yelp proxy error')
    const data = await res.json()
    return (data.businesses ?? []).map((b) => ({
      id: b.id, source: 'yelp', title: b.name,
      category: b.categories?.[0]?.title ?? 'Activity',
      date: 'Ongoing', time: '', venue: b.name, address: b.location?.address1 ?? '',
      lat: b.coordinates?.latitude ?? lat, lng: b.coordinates?.longitude ?? lng,
      price: b.price ?? 'See website', url: b.url ?? '', image: b.image_url ?? '',
      distance: b.distance ? `${(b.distance * 0.000621371).toFixed(1)}mi` : '',
    }))
  } catch (err) { console.error('Yelp error:', err); return [] }
}
