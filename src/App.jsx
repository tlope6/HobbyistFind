import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Intro from './pages/Intro'
import Home from './pages/Home'
import Events from './pages/Events'
import Hobbies from './pages/Hobbies'
import Profile from './pages/Profile'
import Login from './pages/Login'

const TabBar = () => {
  const tabs = [
    { to: '/home', icon: '🗺', label: 'Map' },
    { to: '/events', icon: '📋', label: 'Events' },
    { to: '/hobbies', icon: '✨', label: 'New Hobby' },
    { to: '/profile', icon: '👤', label: 'Account' },
  ]
  const location = useLocation()
  if (['/', '/login'].includes(location.pathname)) return null
  return (
   <div style={{ display: 'flex', background: '#fff', borderTop: '1px solid #F7D6E3', width: '100%' }}>
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to}
          style={({ isActive }) => ({
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '10px 0', fontSize: '11px', fontWeight: 500, textDecoration: 'none',
            color: isActive ? '#C96E8A' : '#7A6880',
            borderTop: isActive ? '2px solid #C96E8A' : '2px solid transparent',
          })}>
          <span style={{ fontSize: '16px' }}>{t.icon}</span>
          {t.label}
        </NavLink>
      ))}
    </div>
  )
}

const Layout = () => {
  const location = useLocation()
  const hideNav = ['/', '/login'].includes(location.pathname)
  return (
  <div style={{ background: '#FAF7F4', minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%' }}>
      {!hideNav && <Navbar />}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Routes>
          <Route path="/" element={<Intro />} />
          <Route path="/home" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/hobbies" element={<Hobbies />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </div>
      <TabBar />
    </div>
  )
}

const App = () => (
  <AppProvider>
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  </AppProvider>
)

export default App