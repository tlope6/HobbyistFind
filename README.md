# HobbyFind 🎨✨

> Discover local events, classes, and activities near you — perfect for trying something new or diving deeper into a hobby you love.

![HobbyFind](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-6-purple?style=flat-square&logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-green?style=flat-square&logo=supabase)
![Mapbox](https://img.shields.io/badge/Mapbox-black?style=flat-square&logo=mapbox)

---

## What is HobbyFind?

HobbyFind is a location-based hobby discovery app that connects people with local events, workshops, and activities in their area. Whether you want to pick up painting, join a running club, find a cooking class, or try something completely new, HobbyFind makes it easy to explore and sign up same day.

---

## Features

- **Interactive map** — Browse events on a live Mapbox map with color-coded pins by category. Adjust the search radius from 1 to 100 miles.
- **Hobby categories** — Filter by Art, Music, Fitness, Cooking, Tech, and Outdoors.
- **New hobby discovery** — Not sure where to start? Browse beginner-friendly categories or hit Surprise Me for a random pick.
- **Smart search** — Live search with instant dropdown results across events, venues, and categories.
- **Rate events** — Rate events you've attended and leave notes. The app learns what you enjoy and recommends similar hobbies.
- **User profiles** — Personalized profiles with your photo, bio, saved events, ratings, and hobby list.
- **Authentication** — Sign up with email or Google via Supabase Auth.
- **Responsive** — Works on desktop, tablet, and mobile.


---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS v4 + inline styles |
| Map | Mapbox GL JS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + Google OAuth) |
| Storage | Supabase Storage (avatar images) |
| Events API | Ticketmaster Discovery API |
| Activities API | PredictHQ Fusion API (via proxy) |
| Deployment | Vercel (frontend) + Railway (backend proxy) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase account (free)
- A Mapbox account (free)
- A Ticketmaster developer account (free)
- A PredictHQ developer account (free trial)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/yourusername/hobby-finder.git
cd hobby-finder
```

**2. Install dependencies**

```bash
npm install
```

**3. Set up environment variables**

Copy the example env file and fill in your keys:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_TM_KEY=your-ticketmaster-key
VITE_MAPBOX_KEY=pk.your-mapbox-key
VITE_PHQ_KEY=your-yelp-key
```

**4. Set up the database**

Go to your Supabase project → SQL Editor and run the full SQL from `database/schema.sql`. This creates all tables, policies, and triggers.

**5. Run the app**

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Project Structure

```
hobby-finder/
├── src/
│   ├── components/
│   │   ├── EventCard.jsx       # Reusable event card with sign up + rating
│   │   ├── MapView.jsx         # Mapbox map with pins and radius control
│   │   ├── Navbar.jsx          # Top nav with location chip and avatar
│   │   └── ProtectedRoute.jsx  # Auth guard for private pages
│   ├── context/
│   │   └── AppContext.jsx      # Global state (location, category, radius)
│   ├── hooks/
│   │   ├── useAuth.js          # Supabase auth state
│   │   ├── useEvents.js        # Fetch + merge events from all APIs
│   │   └── useLocation.js      # Browser geolocation
│   ├── lib/
│   │   └── supabaseClient.js   # Supabase client init
│   ├── pages/
│   │   ├── Intro.jsx           # Animated intro screen
│   │   ├── Home.jsx            # Map + nearby events
│   │   ├── Events.jsx          # Full event list with search and ratings
│   │   ├── Hobbies.jsx         # Hobby discovery grid
│   │   ├── Profile.jsx         # User profile, saved events, ratings
│   │   └── Login.jsx           # Sign in / sign up
│   ├── services/
│   │   ├── locationService.js       # Browser geolocation wrapper
│   │   ├── ticketmasterService.js   # Ticketmaster API calls
│   │   └── predicthqService.js           # PredictHQ proxy calls
│   ├── App.jsx                 # Routes and tab bar
│   ├── main.jsx                # React entry point
│   └── index.css               # Tailwind + global styles
├── database/
│   └── schema.sql              # Full Supabase schema
├── .env.example
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## Database Schema

| Table | Purpose |
|---|---|
| `profiles` | User name, bio, avatar, city |
| `user_hobbies` | Hobbies a user has added to their profile |
| `user_preferences` | App settings (beginner only, free only, radius) |
| `saved_events` | Events a user has signed up for |
| `event_ratings` | Star ratings and notes left on events |

---

## API Keys Setup

### Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to Settings → API
3. Copy the **Project URL** and **anon public** key

### Mapbox
1. Create an account at [mapbox.com](https://mapbox.com)
2. Go to your account dashboard
3. Copy the **Default public token** (starts with `pk.eyJ1`)

### Ticketmaster
1. Register at [developer.ticketmaster.com](https://developer.ticketmaster.com)
2. Create an app and copy the **Consumer Key**

### PredictHQ
1. Register at [predicthq.com](https://www.predicthq.com/)
2. Create an app and copy the **API Key**

---

## Deployment

### Frontend — Vercel

1. Push code to GitHub
2. Import repo at [vercel.com](https://vercel.com)
3. Add all environment variables
4. Deploy — auto-deploys on every push


---

## Roadmap

- [ ] Push notifications for events opening near you
- [ ] Social features — see what friends are attending
- [ ] Event creation — let local organizers post their own events
- [ ] Calendar integration — add saved events to Google Calendar
- [ ] Offline support — cache recent events for offline viewing
- [ ] iOS and Android apps via React Native

---

## Contributing

Pull requests are welcome. For major changes please open an issue first to discuss what you would like to change.

---

## License

MIT

---

## Acknowledgements

- [Ticketmaster Discovery API](https://developer.ticketmaster.com) for event data
- [Yelp Fusion API](https://docs.developer.yelp.com) for local activity data
- [Mapbox](https://mapbox.com) for the interactive map
- [Supabase](https://supabase.com) for auth and database
- [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) and [DM Sans](https://fonts.google.com/specimen/DM+Sans) fonts
