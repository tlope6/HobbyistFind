import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";


const HOBBIES = [
    { name: 'Art & Craft', icon: '🎨', category: 'Art', count: '12', bg: 'bg-blush', border: 'border-rose/30', text: 'text-rose-dark' },
    { name: 'Music', icon: '🎸', category: 'Music', count: '8', bg: 'bg-lavender-light', border: 'border-lavender/40', text: 'text-lavender-deep' },
    { name: 'Fitness', icon: '🏃', category: 'Fitness', count: '15', bg: 'bg-sage-light', border: 'border-sage/40', text: 'text-sage-deep' },
    { name: 'Cooking', icon: '🍳', category: 'Cooking', count: '6', bg: 'bg-gold-light', border: 'border-gold/30', text: 'text-gold' },
    { name: 'Tech & Making', icon: '💻', category: 'Tech', count: '5', bg: 'bg-lavender-light', border: 'border-lavender/40', text: 'text-lavender-deep' },
    { name: 'Outdoors', icon: '🏕', category: 'Outdoors', count: '9', bg: 'bg-sage-light', border: 'border-sage/40', text: 'text-sage-deep' },
]



const Hobbies = () => {
    const navigate = useNavigate()
    const { setActiveCategory } = useAppContext()
    const pick = (category) => { setActiveCategory(category); navigate('/events') }
    const surprise = () => { const r = HOBBIES[Math.floor(Math.random() * HOBBIES.length)]; pick(r.category) }


    return (
        <div>
            <div className="mb-5">
                <h1 className="font-serif font-bold text-2xl text-ink mb-1">Start a new hobby</h1>
                <p className="text-sm text-muted">Find beginner-friendly classes and events near you.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                {HOBBIES.map((h) => (
                    <button key={h.name} onClick={() => pick(h.category)}
                        className={`${h.bg} border ${h.border} rounded-2xl p-4 text-center hover:shadow-sm transition-all`}>
                        <div className="text-3xl mb-2">{h.icon}</div>
                        <div className={`text-sm font-semibold ${h.text} mb-1`}>{h.name}</div>
                        <div className="text-xs text-muted">{h.count} events nearby</div>
                    </button>
                ))}
            </div>

            <button onClick={surprise}
                className="w-full bg-rose-deep hover:bg-rose-dark text-white font-semibold py-4 rounded-2xl text-sm transition-colors">
                ✨ Surprise me — pick a random hobby
            </button>
        </div>
    )

}

export default Hobbies
