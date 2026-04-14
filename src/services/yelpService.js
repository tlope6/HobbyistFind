// Yelp category aliases for more accurate results per hobby
const YELP_CATEGORY_MAP = {
  'Art':      'art classes painting watercolor pottery ceramics drawing sculpture craft workshops',
  'Music':    'music lessons guitar piano singing drum classes concerts live music',
  'Fitness':  'yoga pilates fitness barre crossfit martialarts dance zumba bootcamp personaltraining',
  'Cooking':  'cookingclasses culinary baking pastry food workshops',
  'Tech':     'codingbootcamps computerclasses hackerspaces',
  'Outdoors': 'hiking outdooractivities rockclimbing kayaking cycling naturetours',
}

// Maps Yelp category titles back to our app categories
const normalizeYelpCategory = (yelpTitle = '') => {
  const t = yelpTitle.toLowerCase()
  if (t.includes('art') || t.includes('paint') || t.includes('craft') || t.includes('pottery') || t.includes('draw') || t.includes('sculpt') || t.includes('ceramics')) return 'Art'
  if (t.includes('music') || t.includes('guitar') || t.includes('piano') || t.includes('sing') || t.includes('drum') || t.includes('concert')) return 'Music'
  if (t.includes('yoga') || t.includes('pilates') || t.includes('fitness') || t.includes('gym') || t.includes('dance') || t.includes('barre') || t.includes('crossfit') || t.includes('martial') || t.includes('zumba') || t.includes('training')) return 'Fitness'
  if (t.includes('cook') || t.includes('bak') || t.includes('culinary') || t.includes('pastry') || t.includes('food')) return 'Cooking'
  if (t.includes('tech') || t.includes('coding') || t.includes('computer') || t.includes('program')) return 'Tech'
  if (t.includes('hik') || t.includes('outdoor') || t.includes('climb') || t.includes('kayak') || t.includes('cycl') || t.includes('nature')) return 'Outdoors'
  return 'Event'
}

const formatPrice = (priceSymbol) => {
  if (!priceSymbol) return 'See site'
  const map = { '$': 'Under $10', '$$': '$10–$30', '$$$': '$30–$60', '$$$$': '$60+' }
  return map[priceSymbol] ?? priceSymbol
}

export const fetchActivities = async (lat, lng, term = 'classes') => {
  try {
    // Use the mapped term if it exists, otherwise use what was passed in
    const mappedTerm = YELP_CATEGORY_MAP[term] ?? term

    const res = await fetch(`/api/yelp?${new URLSearchParams({ lat, lng, term: mappedTerm })}`)
    if (!res.ok) throw new Error('Yelp proxy error')
    const data = await res.json()

    return (data.businesses ?? []).map(b => {
      const yelpCategoryTitle = b.categories?.[0]?.title ?? ''
      return {
        id: `yelp-${b.id}`,
        source: 'yelp',
        title: b.name,
        category: normalizeYelpCategory(yelpCategoryTitle),
        date: 'Ongoing',
        time: '',
        venue: b.name,
        address: b.location?.address1 ?? '',
        city: b.location?.city ?? '',
        lat: b.coordinates?.latitude ?? lat,
        lng: b.coordinates?.longitude ?? lng,
        price: formatPrice(b.price),
        url: b.url ?? '',
        image: b.image_url ?? '',
        distance: b.distance
          ? `${(b.distance * 0.000621371).toFixed(1)} mi`
          : '',
      }
    })
  } catch (err) {
    console.error('Yelp error:', err)
    return []
  }
}
