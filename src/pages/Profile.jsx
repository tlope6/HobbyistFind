import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import useAuth from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const HOBBIES = [
  { name: '🎨 Watercolor', bg: '#F9ECF1', color: '#C96E8A' },
  { name: '🏃 Running', bg: '#DCF0E2', color: '#5A8C6A' },
  { name: '🍳 Cooking', bg: '#FAF0DC', color: '#D4A84B' },
]

const fmtDate = (d) => {
  if (!d) return 'Date TBD'
  const today = new Date().toISOString().split('T')[0]
  const tom = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  if (d === today) return 'Today'
  if (d === tom) return 'Tomorrow'
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const Profile = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [savedEvents, setSavedEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('saved')
  const [prefs, setPrefs] = useState({ beginner: true, free: false, notifs: true })
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [removing, setRemoving] = useState(null)

  const fetchSaved = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('saved_events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) console.error('Fetch error:', error)
    setSavedEvents(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchSaved()
  }, [fetchSaved, activeTab])

  const removeEvent = async (id) => {
    setRemoving(id)
    const { error } = await supabase
      .from('saved_events')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (!error) setSavedEvents(prev => prev.filter(e => e.id !== id))
    setRemoving(null)
  }

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : '??'
  const username = user?.email?.split('@')[0] ?? ''

  const tabs = [
    { id: 'saved', label: '🎫 Saved', count: savedEvents.length },
    { id: 'hobbies', label: '✨ Hobbies' },
    { id: 'settings', label: '⚙️ Settings' },
  ]

  // Event detail modal
  if (selectedEvent) {
    return (
      <div style={{ background: '#FAF7F4', minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', paddingBottom: '100px' }}>
        <div style={{ background: '#fff', padding: '16px 20px', borderBottom: '1px solid #F0E8E4', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setSelectedEvent(null)} style={{
            background: '#F9ECF1', border: 'none', borderRadius: '50%',
            width: '36px', height: '36px', cursor: 'pointer',
            fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>←</button>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#2A1F2D' }}>Event details</span>
        </div>

        <div style={{ padding: '24px 20px' }}>
          <div style={{
            background: '#F9ECF1', borderRadius: '16px',
            padding: '24px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '16px'
          }}>
            <div style={{ fontSize: '48px' }}>🎫</div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#C96E8A', letterSpacing: '.06em', marginBottom: '6px' }}>SAVED EVENT</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#2A1F2D', fontFamily: 'Playfair Display, serif', lineHeight: 1.2 }}>
                {selectedEvent.event_title}
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #F0E8E4', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #FAF7F4', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#7A6880' }}>Date</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#2A1F2D' }}>{fmtDate(selectedEvent.event_date)}</span>
            </div>
            <div style={{ padding: '16px', borderBottom: '1px solid #FAF7F4', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#7A6880' }}>Source</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#2A1F2D', textTransform: 'capitalize' }}>{selectedEvent.event_source}</span>
            </div>
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#7A6880' }}>Saved on</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#2A1F2D' }}>
                {new Date(selectedEvent.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          {selectedEvent.event_url && (
            <a href={selectedEvent.event_url} target="_blank" rel="noreferrer" style={{
              display: 'block', background: '#C96E8A', color: '#fff',
              borderRadius: '14px', padding: '16px', textAlign: 'center',
              fontSize: '16px', fontWeight: 600, textDecoration: 'none',
              marginBottom: '12px'
            }}>View event & sign up →</a>
          )}

          <button onClick={() => { removeEvent(selectedEvent.id); setSelectedEvent(null) }} style={{
            width: '100%', background: '#fff', border: '1.5px solid #F0C0C8',
            borderRadius: '14px', padding: '14px', fontSize: '15px',
            fontWeight: 600, color: '#C96E8A', cursor: 'pointer',
            fontFamily: 'DM Sans, system-ui, sans-serif'
          }}>Remove from saved</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', paddingBottom: '100px' }}>

      {/* Header */}
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
                padding: '1px 6px', borderRadius: '20px'
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: '20px 16px' }}>

        {/* SAVED EVENTS TAB */}
        {activeTab === 'saved' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
                <div style={{ color: '#7A6880', fontSize: '14px' }}>Loading your saved events...</div>
              </div>
            ) : savedEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '14px' }}>🎫</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#2A1F2D', marginBottom: '8px', fontFamily: 'Playfair Display, serif' }}>
                  No saved events yet
                </div>
                <div style={{ fontSize: '14px', color: '#7A6880', marginBottom: '24px', lineHeight: 1.5 }}>
                  When you tap Sign up on an event it will appear here
                </div>
                <button onClick={() => navigate('/home')} style={{
                  background: '#C96E8A', color: '#fff', border: 'none',
                  borderRadius: '50px', padding: '13px 32px',
                  fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'DM Sans, system-ui, sans-serif'
                }}>Browse events</button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '13px', color: '#7A6880', marginBottom: '14px' }}>
                  {savedEvents.length} event{savedEvents.length !== 1 ? 's' : ''} saved
                </div>
                {savedEvents.map(e => (
                  <div key={e.id}
                    onClick={() => setSelectedEvent(e)}
                    style={{
                      background: '#fff', border: '1px solid #F0E8E4',
                      borderRadius: '16px', padding: '16px',
                      marginBottom: '10px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '14px',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={el => el.currentTarget.style.borderColor = '#E8A0B4'}
                    onMouseLeave={el => el.currentTarget.style.borderColor = '#F0E8E4'}
                  >
                    {/* Icon */}
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '12px',
                      background: '#F9ECF1', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: '24px', flexShrink: 0
                    }}>🎫</div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '15px', fontWeight: 600, color: '#2A1F2D',
                        marginBottom: '4px', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>{e.event_title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '11px', color: '#C96E8A',
                          background: '#F9ECF1', padding: '2px 8px',
                          borderRadius: '20px', fontWeight: 600
                        }}>{fmtDate(e.event_date)}</span>
                        <span style={{ fontSize: '11px', color: '#7A6880', textTransform: 'capitalize' }}>
                          via {e.event_source}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div style={{ color: '#C96E8A', fontSize: '18px', flexShrink: 0 }}>›</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* HOBBIES TAB */}
        {activeTab === 'hobbies' && (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#2A1F2D', marginBottom: '14px' }}>My hobbies</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '28px' }}>
              {HOBBIES.map(h => (
                <span key={h.name} style={{
                  background: h.bg, color: h.color,
                  padding: '10px 18px', borderRadius: '20px',
                  fontSize: '14px', fontWeight: 500
                }}>{h.name}</span>
              ))}
              <span style={{
                background: 'transparent', color: '#C96E8A',
                padding: '10px 18px', borderRadius: '20px',
                fontSize: '14px', fontWeight: 500,
                border: '1.5px dashed #E8A0B4', cursor: 'pointer'
              }}>+ Add hobby</span>
            </div>
            <button onClick={() => navigate('/hobbies')} style={{
              width: '100%', background: '#C96E8A', color: '#fff',
              border: 'none', borderRadius: '14px', padding: '16px',
              fontSize: '15px', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'DM Sans, system-ui, sans-serif'
            }}>✨ Explore hobbies near me</button>
          </div>
        )}

        {/* SETTINGS TAB */}
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