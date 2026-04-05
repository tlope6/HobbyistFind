import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import useAuth from '../hooks/useAuth'

const Navbar = () => {
  const { cityName } = useAppContext()
  const { user } = useAuth()
  const navigate = useNavigate()

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '?'

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid #F7D6E3',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div
        onClick={() => navigate('/')}
        style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontWeight: 700,
          fontSize: '20px',
          color: '#2A1F2D',
          cursor: 'pointer',
          letterSpacing: '-.02em'
        }}
      >
        hobby<span style={{ color: '#C96E8A' }}>find</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#F9ECF1',
          border: '1px solid #F7D6E3',
          borderRadius: '20px',
          padding: '5px 10px',
          fontSize: '11px',
          color: '#C96E8A',
          fontWeight: 500
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#5A8C6A',
            display: 'inline-block'
          }} />
          {cityName}
        </div>

        <div
          onClick={() => navigate(user ? '/profile' : '/login')}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#F7D6E3',
            border: '1.5px solid #E8A0B4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8B3A56',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {initials}
        </div>
      </div>
    </nav>
  )
}

export default Navbar