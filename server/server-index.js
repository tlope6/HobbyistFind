import express from 'express'
import fetch from 'node-fetch'
import cors from 'cors'

const app = express()
app.use(cors())

// Yelp proxy
app.get('/api/yelp', async (req, res) => {
  const { lat, lng, term } = req.query
  try {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lng,
      term,
      limit: 20,
    })
    const response = await fetch(
      `https://api.yelp.com/v3/businesses/search?${params}`,
      { headers: { Authorization: `Bearer ${process.env.YELP_KEY}` } }
    )
    const data = await response.json()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// SerpAPI Google Events proxy
app.get('/api/serp', async (req, res) => {
  const { lat, lng, category, radius } = req.query
  try {
    const location = req.query.city ?? 'Chicago'
    const query = category
      ? `${category} classes events near me`
      : 'hobby classes events near me'

    const params = new URLSearchParams({
      engine: 'google_events',
      q: query,
      location,
      api_key: process.env.SERP_KEY,
    })

    const response = await fetch(`https://serpapi.com/search?${params}`)
    const data = await response.json()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(3001, () => console.log('Proxy running on port 3001'))
