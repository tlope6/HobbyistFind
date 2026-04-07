import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import useAuth from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const HOBBIES = [
  { name: '🎨 Watercolor', bg: '#F9ECF1', color: '#C96E8A' },
  { name: '🏃 Running', bg: '#DCF0E2', color: '#5A8C6A' },
  { name: '🍳 Cooking', bg: '#FAF0DC', color: '#D4A84B' },
]

const Profile = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [savedEvents, setSavedEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('saved')
  const [prefs, setPrefs] = useState({ beginner: true, free: false, notifs: true })

    useEffect(() => {
        if (!user) return
        setLoading(true)
        supabase
            .from('saved_events')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .then(({ data, error }) => {
            if (error) console.error('Profile load error:', error)
            setSavedEvents(data ?? [])
            setLoading(false)
            })
    }, [user, activeTab])

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : '??'
  const username = user?.email?.split('@')[0] ?? ''

  const tabs = [
    { id: 'saved', label: '🎫 Saved', count: savedEvents.length },
    { id: 'hobbies', label: '✨ Hobbies' },
    { id: 'settings', label: '⚙️ Settings' },
  ]

  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', paddingBottom: '100px' }}>

      {/* Profile header */}
      <div style={{ background: '#F9ECF1', padding: '28px 20px 24px', borderBottom: '1px solid #F0E0E8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{
            width: '68px', height: '68px', borderRadius: '50%',
            background: '#C96E8A', border: '3px solid #fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '24px', fontWeight: 700, flexShrink: 0,
            boxShadow: '0 4px 14px rgba(201,110,138,0.3)'
          }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#2A1F2D', fontFamily: 'Playfair Display, serif', marginBottom: '3px' }}>
              {username}
            </div>
            <div style={{ fontSize: '13px', color: '#7A6880' }}>{user?.email}</div>
          </div>
          <button onClick={() => {}} style={{
            background: '#fff', border: '1px solid #EDE5DC',
            borderRadius: '20px', padding: '7px 16px',
            fontSize: '13px', color: '#4A3850', cursor: 'pointer',
            fontFamily: 'DM Sans, system-ui, sans-serif', fontWeight: 500
          }}>Edit</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { num: savedEvents.length, label: 'Events saved', color: '#C96E8A' },
            { num: HOBBIES.length, label: 'Hobbies', color: '#8B72C8' },
            { num: 0, label: 'Attended', color: '#5A8C6A' },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: '#fff', borderRadius: '14px',
              padding: '14px 10px', textAlign: 'center',
              border: '1px solid rgba(201,110,138,0.12)'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.num}</div>
              <div style={{ fontSize: '11px', color: '#7A6880', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '2px solid #F0E8E4' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, padding: '14px 4px', fontSize: '13px', fontWeight: 500,
            border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: 'DM Sans, system-ui, sans-serif',
            color: activeTab === tab.id ? '#C96E8A' : '#7A6880',
            borderBottom: `2px solid ${activeTab === tab.id ? '#C96E8A' : 'transparent'}`,
            transition: 'all 0.15s', marginBottom: '-2px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
          }}>
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span style={{
                background: '#C96E8A', color: '#fff',
                fontSize: '10px', fontWeight: 700,
                padding: '1px 6px', borderRadius: '20px', marginLeft: '2px'
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: '20px 16px' }}>

        {/* Saved Events */}
        {activeTab === 'saved' && (
          loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#7A6880' }}>Loading...</div>
          ) : savedEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: '44px', marginBottom: '12px' }}>🎫</div>
              <div style={{ fontSize: '17px', fontWeight: 600, color: '#2A1F2D', marginBottom: '6px' }}>No saved events yet</div>
              <div style={{ fontSize: '14px', color: '#7A6880', marginBottom: '20px' }}>Sign up for events to see them here</div>
              <button onClick={() => navigate('/events')} style={{
                background: '#C96E8A', color: '#fff', border: 'none',
                borderRadius: '50px', padding: '12px 28px',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'DM Sans, system-ui, sans-serif'
              }}>Browse events</button>
            </div>
          ) : savedEvents.map(e => (
            <div key={e.id} style={{
              background: '#fff', border: '1px solid #F0E8E4',
              borderRadius: '14px', padding: '14px 16px',
              marginBottom: '10px', display: 'flex',
              alignItems: 'center', gap: '12px'
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#2A1F2D', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.event_title}</div>
                <div style={{ fontSize: '12px', color: '#7A6880' }}>📅 {e.event_date || 'Date TBD'}</div>
              </div>
              {e.event_url && (
                <a href={e.event_url} target="_blank" rel="noreferrer" style={{
                  background: '#F9ECF1', color: '#C96E8A',
                  padding: '7px 14px', borderRadius: '20px',
                  fontSize: '12px', fontWeight: 600,
                  textDecoration: 'none', flexShrink: 0
                }}>View →</a>
              )}
            </div>
          ))
        )}

        {/* Hobbies */}
        {activeTab === 'hobbies' && (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#2A1F2D', marginBottom: '14px' }}>My hobbies</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
              {HOBBIES.map(h => (
                <span key={h.name} style={{
                  background: h.bg, color: h.color,
                  padding: '9px 18px', borderRadius: '20px',
                  fontSize: '14px', fontWeight: 500
                }}>{h.name}</span>
              ))}
              <span style={{
                background: 'transparent', color: '#C96E8A',
                padding: '9px 18px', borderRadius: '20px',
                fontSize: '14px', fontWeight: 500,
                border: '1.5px dashed #E8A0B4', cursor: 'pointer'
              }}>+ Add hobby</span>
            </div>
            <button onClick={() => navigate('/hobbies')} style={{
              width: '100%', background: '#C96E8A', color: '#fff',
              border: 'none', borderRadius: '14px', padding: '15px',
              fontSize: '15px', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'DM Sans, system-ui, sans-serif'
            }}>✨ Explore hobbies near me</button>
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#2A1F2D', marginBottom: '14px' }}>Preferences</div>
            <div style={{ background: '#fff', border: '1px solid #F0E8E4', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
              {[
                { key: 'beginner', label: 'Beginner-friendly only', sub: 'Show intro-level events' },
                { key: 'free', label: 'Free events only', sub: 'Hide paid events' },
                { key: 'notifs', label: 'Nearby notifications', sub: 'Alert for events near you' },
              ].map((p, i, arr) => (
                <div key={p.key} onClick={() => setPrefs(prev => ({ ...prev, [p.key]: !prev[p.key] }))} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px', cursor: 'pointer',
                  borderBottom: i < arr.length - 1 ? '1px solid #FAF7F4' : 'none'
                }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 500, color: '#2A1F2D' }}>{p.label}</div>
                    <div style={{ fontSize: '12px', color: '#7A6880', marginTop: '2px' }}>{p.sub}</div>
                  </div>
                  <div style={{
                    width: '44px', height: '24px', borderRadius: '12px', flexShrink: 0,
                    background: prefs[p.key] ? '#C96E8A' : '#EDE5DC',
                    position: 'relative', transition: 'background 0.2s'
                  }}>
                    <div style={{
                      position: 'absolute', width: '18px', height: '18px',
                      borderRadius: '50%', background: '#fff',
                      top: '3px', left: prefs[p.key] ? '23px' : '3px',
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.15)'
                    }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '16px', fontWeight: 600, color: '#2A1F2D', marginBottom: '14px' }}>Account</div>
            <div style={{ background: '#fff', border: '1px solid #F0E8E4', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #FAF7F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', color: '#2A1F2D' }}>Email</span>
                <span style={{ fontSize: '13px', color: '#7A6880' }}>{user?.email}</span>
              </div>
              <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', color: '#2A1F2D' }}>Password</span>
                <span style={{ fontSize: '13px', color: '#C96E8A', cursor: 'pointer', fontWeight: 600 }}>Update</span>
              </div>
            </div>

            <button onClick={async () => { await signOut(); navigate('/') }} style={{
              width: '100%', background: '#fff',
              border: '1.5px solid #F0C0C8', borderRadius: '14px',
              padding: '15px', fontSize: '15px', fontWeight: 600,
              color: '#C96E8A', cursor: 'pointer',
              fontFamily: 'DM Sans, system-ui, sans-serif'
            }}>Sign out</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
