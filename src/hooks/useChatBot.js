import {useState, useCallback} from 'react'
import {useNavigate} from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import useAuth from './useAuth'


//INTENT
//each intent has trigger keywords, a reply, and an action to perform
//this is using non AI 

const INTENTS = [
  {
    id: 'find_art',
    keywords: ['art', 'paint', 'craft', 'pottery', 'draw'],
    reply: "Here's what's happening in Art near you — opening it now.",
    action: ({ navigate, setActiveCategory }) => {
      setActiveCategory('Art')
      navigate('/events')
    },
  },
  {
    id: 'find_music',
    keywords: ['music', 'concert', 'guitar', 'piano', 'band'],
    reply: "Pulling up Music events near you.",
    action: ({ navigate, setActiveCategory }) => {
      setActiveCategory('Music')
      navigate('/events')
    },
  },
  {
    id: 'find_fitness',
    keywords: ['fitness', 'yoga', 'gym', 'workout', 'run', 'dance'],
    reply: "Here are Fitness classes and events nearby.",
    action: ({ navigate, setActiveCategory }) => {
      setActiveCategory('Fitness')
      navigate('/events')
    },
  },
  {
    id: 'find_cooking',
    keywords: ['cook', 'bak', 'food', 'culinary'],
    reply: "Showing Cooking classes and food events near you.",
    action: ({ navigate, setActiveCategory }) => {
      setActiveCategory('Cooking')
      navigate('/events')
    },
  },
  {
    id: 'find_tech',
    keywords: ['tech', 'coding', 'program', 'hackathon'],
    reply: "Here are Tech meetups and workshops nearby.",
    action: ({ navigate, setActiveCategory }) => {
      setActiveCategory('Tech')
      navigate('/events')
    },
  },
  {
    id: 'find_outdoors',
    keywords: ['outdoor', 'hike', 'hiking', 'nature', 'climb', 'kayak'],
    reply: "Pulling up Outdoors events and activities near you.",
    action: ({ navigate, setActiveCategory }) => {
      setActiveCategory('Outdoors')
      navigate('/events')
    },
  },
  {
    id: 'view_map',
    keywords: ['map', 'nearby', 'around me', 'near me'],
    reply: "Here's the map with everything happening close to you.",
    action: ({ navigate, setActiveCategory }) => {
      setActiveCategory('All')
      navigate('/home')
    },
  },
  {
    id: 'view_saved',
    keywords: ['saved', 'my events', 'sign up', 'signed up'],
    reply: "Here are the events you've saved.",
    action: ({ navigate }) => navigate('/profile'),
  },
  {
    id: 'rate_event',
    keywords: ['rate', 'rating', 'review'],
    reply: "You can rate any event by tapping the ⭐ Rate button on its card in Events. Want me to take you there?",
    action: ({ navigate }) => navigate('/events'),
  },
  {
    id: 'add_hobby',
    keywords: ['add hobby', 'new hobby', 'add a hobby'],
    reply: "Let's add a hobby to your profile — opening the hobby picker.",
    action: ({ navigate, user }) => navigate(user ? '/profile' : '/login'),
  },
  {
    id: 'add_event',
    keywords: ['add event', 'create event', 'post an event', 'submit event'],
    reply: "Right now HobbyFind pulls events automatically from Ticketmaster and PredictHQ rather than letting users post their own — that feature's on the roadmap though. Want to browse what's already nearby instead?",
    action: null,
  },
  {
    id: 'radius',
    keywords: ['radius', 'distance', 'how far', 'miles'],
    reply: "You can change your search radius from the map screen — tap the 📍 button in the top right of the map to adjust it from 1 to 100 miles.",
    action: ({ navigate }) => navigate('/home'),
  },
  {
    id: 'login_help',
    keywords: ['sign in', 'log in', 'login', 'account', 'sign up for an account'],
    reply: "Want me to take you to sign in or create an account?",
    action: ({ navigate }) => navigate('/login'),
  },
  {
    id: 'greeting',
    keywords: ['hi', 'hello', 'hey'],
    reply: "Hey! I can help you find events, check your saved hobbies, or explain how something works. What are you in the mood for?",
    action: null,
  },
  {
    id: 'thanks',
    keywords: ['thanks', 'thank you', 'appreciate'],
    reply: "Anytime! Let me know if you want help finding anything else.",
    action: null,
  },
]

const FALLBACK_REPLY = "I'm not totally sure about that one yet — I can help you find events by category, check your saved events, or explain how the radius search works. What would you like to do?"

const matchIntent = (text) => {
  const lower = text.toLowerCase()
  return INTENTS.find(intent => intent.keywords.some(k => lower.includes(k)))
}

export const QUICK_REPLIES = [
  { label: '🎨 Find Art events', text: 'Find art events near me' },
  { label: '🏃 Find Fitness classes', text: 'Find fitness classes near me' },
  { label: '🗺 Show the map', text: 'Show me the map' },
  { label: '🎫 My saved events', text: 'Show my saved events' },
]

export const useChatBot = () => {
  const navigate = useNavigate()
  const { setActiveCategory } = useAppContext()
  const { user } = useAuth()

  const [messages, setMessages] = useState([
    { id: 'welcome', from: 'bot', text: "Hi! I'm here to help you find hobbies and events near you. Ask me to find something, or tap a suggestion below." }
  ])
  const [isTyping, setIsTyping] = useState(false)

  const sendMessage = useCallback((text) => {
    if (!text.trim()) return

    const userMsg = { id: Date.now() + '-u', from: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    setTimeout(() => {
      const intent = matchIntent(text)
      const replyText = intent ? intent.reply : FALLBACK_REPLY

      const botMsg = { id: Date.now() + '-b', from: 'bot', text: replyText }
      setMessages(prev => [...prev, botMsg])
      setIsTyping(false)

      if (intent?.action) {
        intent.action({ navigate, setActiveCategory, user })
      }
    }, 500) // small delay feels more natural than instant reply
  }, [navigate, setActiveCategory, user])

  const resetChat = useCallback(() => {
    setMessages([
      { id: 'welcome', from: 'bot', text: "Hi! I'm here to help you find hobbies and events near you. Ask me to find something, or tap a suggestion below." }
    ])
  }, [])

  return { messages, isTyping, sendMessage, resetChat }
}
