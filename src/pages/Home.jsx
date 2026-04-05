import { useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import useLocation from '../hooks/useLocation'
import useEvents from '../hooks/useEvents'
import MapView from '../components/MapView'
import EventCard from '../components/EventCard'

const CATEGORIES = ['ALL', 'Art', 'Music', 'Fitness', 'Cooking', 'Tech', 'Outdoors']

const Home = () => {
    const {location, setLocation, activeCategory, setActiveCategory} = useAppContext()
    const { location: detected, loading: locLoading} = useLocation()
    const {events, loading: eventsLoading} = useEvents(location, activeCategory === 'All' ? '' : activeCategory)

    useEffect(() => {if (detected) setLocation(detected)}, [detected])
    
    return (
        <div className="bg-cream min-h-screen">
        <div className="px-4 pt-3 pb-2 bg-white border-b border-rose-light/40">
            <div className="bg-surface border border-surface2 rounded-xl flex items-center gap-2 px-3 py-2.5">
            <span className="text-muted text-sm">🔍</span>
            <input className="bg-transparent border-none outline-none text-ink text-sm flex-1 placeholder-muted/60 font-sans" placeholder="Search activities near you..." />
            </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', padding: '10px 16px', overflowX: 'auto', background: '#fff', borderBottom: '1px solid #F7D6E3' }}>
                {CATEGORIES.map((cat) => (
                    <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                        flexShrink: 0,
                        padding: '5px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 500,
                        border: '1.5px solid',
                        cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif',
                        whiteSpace: 'nowrap',
                        background: activeCategory === cat || (cat === 'All' && !activeCategory) ? '#C96E8A' : 'transparent',
                        borderColor: activeCategory === cat || (cat === 'All' && !activeCategory) ? '#C96E8A' : '#EDE5DC',
                        color: activeCategory === cat || (cat === 'All' && !activeCategory) ? '#fff' : '#4A3850',
                    }}
                    >
                    {cat}
                    </button>
                ))}
        </div>

        {locLoading
            ? <div className="h-[260px] bg-surface flex items-center justify-center text-muted text-sm">Detecting your location...</div>
            : <MapView location={location} events={events} />
        }

        <div className="px-4 pt-4 pb-6">
            <div className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-3">Nearby today</div>
            {eventsLoading
            ? <div className="text-muted text-sm text-center py-10">Finding events near you...</div>
            : events.length === 0
            ? <div className="text-muted text-sm text-center py-10">No events found nearby.</div>
            : <div className="flex flex-col gap-2">{events.slice(0, 6).map((e) => <EventCard key={`${e.source}-${e.id}`} event={e} />)}</div>
            }
        </div>
        </div>
    )
}

export default Home