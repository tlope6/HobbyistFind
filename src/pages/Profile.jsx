import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import useAuth from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const STAR_LABELS = ['', 'Not for me', 'It was okay', 'Pretty good', 'Really enjoyed it', 'Loved it!']

const CAT_STYLES = {
  Art:      { bg: '#F9ECF1', color: '#C96E8A', icon: '🎨' },
  Music:    { bg: '#EDE8F6', color: '#8B72C8', icon: '🎸' },
  Fitness:  { bg: '#DCF0E2', color: '#5A8C6A', icon: '🏃' },
  Cooking:  { bg: '#FAF0DC', color: '#D4A84B', icon: '🍳' },
  Tech:     { bg: '#EDE8F6', color: '#8B72C8', icon: '💻' },
  Outdoors: { bg: '#DCF0E2', color: '#5A8C6A', icon: '🏕' },
  Event:    { bg: '#F4EFE9', color: '#7A6880', icon: '📅' },
}

const ALL_HOBBY_OPTIONS = [
  { name: 'Watercolor', category: 'Art', icon: '🎨' },
  { name: 'Drawing', category: 'Art', icon: '✏️' },
  { name: 'Photography', category: 'Art', icon: '📸' },
  { name: 'Pottery', category: 'Art', icon: '🏺' },
  { name: 'Guitar', category: 'Music', icon: '🎸' },
  { name: 'Piano', category: 'Music', icon: '🎹' },
  { name: 'Singing', category: 'Music', icon: '🎤' },
  { name: 'Yoga', category: 'Fitness', icon: '🧘' },
  { name: 'Running', category: 'Fitness', icon: '🏃' },
  { name: 'Dancing', category: 'Fitness', icon: '💃' },
  { name: 'Climbing', category: 'Outdoors', icon: '🧗' },
  { name: 'Hiking', category: 'Outdoors', icon: '🥾' },
  { name: 'Cooking', category: 'Cooking', icon: '🍳' },
  { name: 'Baking', category: 'Cooking', icon: '🍰' },
  { name: 'Coding', category: 'Tech', icon: '💻' },
  { name: '3D Printing', category: 'Tech', icon: '🖨' },
]

const fmtDate = (d) => {
  if (!d) return 'Date TBD'
  const today = new Date().toISOString().split('T')[0]
  if (d === today) return 'Today'
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const StarDisplay = ({ rating }) => (
  <div style={{ display: 'flex', gap: '2px' }}>
    {[1,2,3,4,5].map(s => (
      <span key={s} style={{ fontSize: '14px', filter: s <= rating ? 'none' : 'grayscale(1) opacity(0.3)' }}>⭐</span>
    ))}
  </div>
)

const Profile = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [savedEvents, setSavedEvents] = useState([])
  const [ratings, setRatings] = useState([])
  const [hobbies, setHobbies] = useState([])
  const [profile, setProfile] = useState({ full_name: '', bio: '', avatar_url: '' })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('saved')
  const [prefs, setPrefs] = useState({ beginner: true, free: false, notifs: true })

  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedRating, setSelectedRating] = useState(null)
  const [showAddHobby, setShowAddHobby] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [removing, setRemoving] = useState(null)
  const [deletingRating, setDeletingRating] = useState(null)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [savedRes, ratingsRes, hobbiesRes, profileRes] = await Promise.all([
      supabase.from('saved_events').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('event_ratings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('user_hobbies').select('*').eq('user_id', user.id),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ])
    setSavedEvents(savedRes.data ?? [])
    setRatings(ratingsRes.data ?? [])
    setHobbies(hobbiesRes.data ?? [])
    if (profileRes.data) {
      setProfile(profileRes.data)
      setEditName(profileRes.data.full_name ?? '')
      setEditBio(profileRes.data.bio ?? '')
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  const saveProfile = async () => {
    setSavingProfile(true)
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: editName,
      bio: editBio,
    })
    setProfile(prev => ({ ...prev, full_name: editName, bio: editBio }))
    setSavingProfile(false)
    setEditingProfile(false)
  }

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const avatarUrl = data.publicUrl
      await supabase.from('profiles').upsert({ id: user.id, avatar_url: avatarUrl })
      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }))
    } catch (err) {
      console.error('Avatar upload error:', err)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const addHobby = async (hobby) => {
    if (hobbies.find(h => h.hobby_name === hobby.name)) return
    const { data } = await supabase.from('user_hobbies').insert({
      user_id: user.id,
      hobby_name: hobby.name,
      category: hobby.category,
      icon: hobby.icon,
    }).select().single()
    if (data) setHobbies(prev => [...prev, data])
  }

  const removeHobby = async (id) => {
    await supabase.from('user_hobbies').delete().eq('id', id)
    setHobbies(prev => prev.filter(h => h.id !== id))
  }

  const removeEvent = async (id) => {
    setRemoving(id)
    await supabase.from('saved_events').delete().eq('id', id).eq('user_id', user.id)
    setSavedEvents(prev => prev.filter(e => e.id !== id))
    setRemoving(null)
    setSelectedEvent(null)
  }

  const deleteRating = async (id) => {
    setDeletingRating(id)
    await supabase.from('event_ratings').delete().eq('id', id).eq('user_id', user.id)
    setRatings(prev => prev.filter(r => r.id !== id))
    setDeletingRating(null)
    setSelectedRating(null)
  }

  const initials = profile.full_name
    ? profile.full_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '??'

  const displayName = profile.full_name || user?.email?.split('@')[0] || ''

  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : null

  const tabs = [
    { id: 'saved',    label: '🎫 Saved',   count: savedEvents.length },
    { id: 'ratings',  label: '⭐ Ratings',  count: ratings.length },
    { id: 'hobbies',  label: '✨ Hobbies',  count: hobbies.length },
    { id: 'settings', label: '⚙️ Settings' },
  ]

  // ── Event detail view ──
  if (selectedEvent) {
    return (
      <div style={{ background: '#FAF7F4', minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', paddingBottom: '100px' }}>
        <div style={{ background: '#fff', padding: '16px 20px', borderBottom: '1px solid #F0E8E4', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setSelectedEvent(null)} style={{ background: '#F9ECF1', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#2A1F2D' }}>Saved event</span>
        </div>
        <div style={{ padding: '24px 20px' }}>
          <div style={{ background: '#F9ECF1', borderRadius: '16px', padding: '24px', marginBottom: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎫</div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#C96E8A', letterSpacing: '.06em', marginBottom: '6px' }}>SAVED EVENT</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#2A1F2D', fontFamily: 'Playfair Display, serif', lineHeight: 1.2 }}>{selectedEvent.event_title}</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #F0E8E4', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
            {[['Date', fmtDate(selectedEvent.event_date)], ['Source', selectedEvent.event_source], ['Saved on', new Date(selectedEvent.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })]].map(([label, val], i, arr) => (
              <div key={label} style={{ padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid #FAF7F4' : 'none', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: '#7A6880' }}>{label}</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#2A1F2D', textTransform: 'capitalize' }}>{val}</span>
              </div>
            ))}
          </div>
          {selectedEvent.event_url && <a href={selectedEvent.event_url} target="_blank" rel="noreferrer" style={{ display: 'block', background: '#C96E8A', color: '#fff', borderRadius: '14px', padding: '16px', textAlign: 'center', fontSize: '16px', fontWeight: 600, textDecoration: 'none', marginBottom: '12px' }}>View event & sign up →</a>}
          <button onClick={() => removeEvent(selectedEvent.id)} disabled={removing === selectedEvent.id} style={{ width: '100%', background: '#fff', border: '1.5px solid #F0C0C8', borderRadius: '14px', padding: '14px', fontSize: '15px', fontWeight: 600, color: '#C96E8A', cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
            {removing === selectedEvent.id ? 'Removing...' : 'Remove from saved'}
          </button>
        </div>
      </div>
    )
  }

  // ── Rating detail view ──
  if (selectedRating) {
    const s = CAT_STYLES[selectedRating.category] ?? CAT_STYLES.Event
    return (
      <div style={{ background: '#FAF7F4', minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', paddingBottom: '100px' }}>
        <div style={{ background: '#fff', padding: '16px 20px', borderBottom: '1px solid #F0E8E4', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setSelectedRating(null)} style={{ background: '#F9ECF1', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#2A1F2D' }}>My rating</span>
        </div>
        <div style={{ padding: '24px 20px' }}>
          <div style={{ background: s.bg, borderRadius: '16px', padding: '24px', marginBottom: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>{s.icon}</div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: s.color, letterSpacing: '.06em', marginBottom: '6px' }}>{selectedRating.category?.toUpperCase()}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#2A1F2D', fontFamily: 'Playfair Display, serif', lineHeight: 1.2, marginBottom: '14px' }}>{selectedRating.event_title}</div>
            <StarDisplay rating={selectedRating.rating} />
            <div style={{ fontSize: '14px', color: s.color, fontWeight: 600, marginTop: '8px' }}>{STAR_LABELS[selectedRating.rating]}</div>
          </div>
          {selectedRating.note && (
            <div style={{ background: '#fff', border: '1px solid #F0E8E4', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#7A6880', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '8px' }}>Your notes</div>
              <div style={{ fontSize: '14px', color: '#2A1F2D', lineHeight: 1.6 }}>{selectedRating.note}</div>
            </div>
          )}
          <button onClick={() => navigate('/events')} style={{ width: '100%', background: '#C96E8A', color: '#fff', border: 'none', borderRadius: '14px', padding: '15px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif', marginBottom: '12px' }}>Find similar events →</button>
          <button onClick={() => deleteRating(selectedRating.id)} disabled={deletingRating === selectedRating.id} style={{ width: '100%', background: '#fff', border: '1.5px solid #F0C0C8', borderRadius: '14px', padding: '14px', fontSize: '15px', fontWeight: 600, color: '#C96E8A', cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
            {deletingRating === selectedRating.id ? 'Deleting...' : 'Delete rating'}
          </button>
        </div>
      </div>
    )
  }

  // ── Add hobby picker ──
  if (showAddHobby) {
    const addedNames = hobbies.map(h => h.hobby_name)
    return (
      <div style={{ background: '#FAF7F4', minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', paddingBottom: '100px' }}>
        <div style={{ background: '#fff', padding: '16px 20px', borderBottom: '1px solid #F0E8E4', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setShowAddHobby(false)} style={{ background: '#F9ECF1', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#2A1F2D' }}>Add hobbies</span>
        </div>
        <div style={{ padding: '20px 16px' }}>
          <p style={{ fontSize: '14px', color: '#7A6880', marginBottom: '20px' }}>Tap a hobby to add it to your profile. We'll find events for you based on these.</p>
          {['Art', 'Music', 'Fitness', 'Cooking', 'Outdoors', 'Tech'].map(cat => {
            const s = CAT_STYLES[cat]
            const opts = ALL_HOBBY_OPTIONS.filter(h => h.category === cat)
            return (
              <div key={cat} style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{s.icon}</span> {cat}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {opts.map(h => {
                    const added = addedNames.includes(h.name)
                    return (
                      <button key={h.name} onClick={() => { if (!added) addHobby(h) }} style={{
                        padding: '8px 16px', borderRadius: '20px', fontSize: '13px',
                        fontWeight: 500, cursor: added ? 'default' : 'pointer',
                        border: `1.5px solid ${added ? s.color : '#EDE5DC'}`,
                        background: added ? s.bg : '#fff',
                        color: added ? s.color : '#4A3850',
                        fontFamily: 'DM Sans, system-ui, sans-serif',
                        display: 'flex', alignItems: 'center', gap: '5px'
                      }}>
                        <span style={{ fontSize: '16px' }}>{h.icon}</span>
                        {h.name}
                        {added && <span style={{ fontSize: '12px' }}>✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
          <button onClick={() => setShowAddHobby(false)} style={{ width: '100%', background: '#C96E8A', color: '#fff', border: 'none', borderRadius: '14px', padding: '15px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif', marginTop: '8px' }}>
            Done — save my hobbies
          </button>
        </div>
      </div>
    )
  }

  // ── Edit profile ──
  if (editingProfile) {
    return (
      <div style={{ background: '#FAF7F4', minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', paddingBottom: '100px' }}>
        <div style={{ background: '#fff', padding: '16px 20px', borderBottom: '1px solid #F0E8E4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setEditingProfile(false)} style={{ background: '#F9ECF1', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#2A1F2D' }}>Edit profile</span>
          </div>
          <button onClick={saveProfile} disabled={savingProfile} style={{ background: '#C96E8A', color: '#fff', border: 'none', borderRadius: '20px', padding: '7px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif', opacity: savingProfile ? 0.7 : 1 }}>
            {savingProfile ? 'Saving...' : 'Save'}
          </button>
        </div>
        <div style={{ padding: '28px 20px' }}>
          {/* Avatar */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div onClick={handleAvatarClick} style={{ width: '90px', height: '90px', borderRadius: '50%', background: profile.avatar_url ? 'transparent' : '#C96E8A', border: '3px solid #fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '30px', fontWeight: 700, cursor: 'pointer', position: 'relative', boxShadow: '0 4px 14px rgba(201,110,138,0.3)', overflow: 'hidden' }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials}
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                <span style={{ fontSize: '20px' }}>📷</span>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            <div style={{ fontSize: '13px', color: '#C96E8A', fontWeight: 600, marginTop: '8px', cursor: 'pointer' }} onClick={handleAvatarClick}>
              {uploadingAvatar ? 'Uploading...' : 'Change photo'}
            </div>
          </div>
          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#4A3850', letterSpacing: '.06em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Display name</label>
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" style={{ width: '100%', background: '#fff', border: '1.5px solid #EDE5DC', borderRadius: '12px', padding: '13px 16px', fontSize: '15px', color: '#2A1F2D', outline: 'none', fontFamily: 'DM Sans, system-ui, sans-serif', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#C96E8A'}
              onBlur={e => e.target.style.borderColor = '#EDE5DC'} />
          </div>
          {/* Bio */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#4A3850', letterSpacing: '.06em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Bio</label>
            <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Tell others about yourself and your hobbies..." rows={4} style={{ width: '100%', background: '#fff', border: '1.5px solid #EDE5DC', borderRadius: '12px', padding: '13px 16px', fontSize: '15px', color: '#2A1F2D', outline: 'none', resize: 'none', fontFamily: 'DM Sans, system-ui, sans-serif', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#C96E8A'}
              onBlur={e => e.target.style.borderColor = '#EDE5DC'} />
          </div>
        </div>
      </div>
    )
  }

  // ── Main profile ──
  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', paddingBottom: '100px' }}>

      {/* Header */}
      <div style={{ background: '#F9ECF1', padding: '28px 20px 24px', borderBottom: '1px solid #F0E0E8' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '14px' }}>
          <div onClick={handleAvatarClick} style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#C96E8A', border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '26px', fontWeight: 700, flexShrink: 0, boxShadow: '0 4px 14px rgba(201,110,138,0.3)', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#2A1F2D', fontFamily: 'Playfair Display, serif', marginBottom: '2px' }}>{displayName}</div>
            <div style={{ fontSize: '13px', color: '#7A6880', marginBottom: '4px' }}>{user?.email}</div>
            {profile.bio && <div style={{ fontSize: '13px', color: '#4A3850', lineHeight: 1.5, marginBottom: '4px' }}>{profile.bio}</div>}
            {avgRating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <StarDisplay rating={Math.round(Number(avgRating))} />
                <span style={{ fontSize: '12px', color: '#7A6880' }}>{avgRating} avg</span>
              </div>
            )}
          </div>
          <button onClick={() => setEditingProfile(true)} style={{ background: '#fff', border: '1px solid #EDE5DC', borderRadius: '20px', padding: '7px 14px', fontSize: '12px', color: '#4A3850', cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif', fontWeight: 500, flexShrink: 0 }}>Edit</button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { num: savedEvents.length, label: 'Saved', color: '#C96E8A' },
            { num: ratings.length, label: 'Ratings', color: '#D4A84B' },
            { num: hobbies.length, label: 'Hobbies', color: '#8B72C8' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: '#fff', borderRadius: '14px', padding: '12px 10px', textAlign: 'center', border: '1px solid rgba(201,110,138,0.12)' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>{s.num}</div>
              <div style={{ fontSize: '11px', color: '#7A6880', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '2px solid #F0E8E4', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flexShrink: 0, padding: '13px 12px', fontSize: '12px', fontWeight: 500, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif', color: activeTab === tab.id ? '#C96E8A' : '#7A6880', borderBottom: `2px solid ${activeTab === tab.id ? '#C96E8A' : 'transparent'}`, transition: 'all 0.15s', marginBottom: '-2px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && <span style={{ background: '#C96E8A', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '20px' }}>{tab.count}</span>}
          </button>
        ))}
      </div>

      <div style={{ padding: '20px 16px' }}>

        {/* SAVED */}
        {activeTab === 'saved' && (
          loading ? <div style={{ textAlign: 'center', padding: '40px 0', color: '#7A6880' }}>Loading...</div>
          : savedEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎫</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#2A1F2D', marginBottom: '8px', fontFamily: 'Playfair Display, serif' }}>No saved events yet</div>
              <div style={{ fontSize: '14px', color: '#7A6880', marginBottom: '24px' }}>Tap Sign up on any event to save it here</div>
              <button onClick={() => navigate('/events')} style={{ background: '#C96E8A', color: '#fff', border: 'none', borderRadius: '50px', padding: '12px 28px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>Browse events</button>
            </div>
          ) : savedEvents.map(e => (
            <div key={e.id} onClick={() => setSelectedEvent(e)} style={{ background: '#fff', border: '1px solid #F0E8E4', borderRadius: '16px', padding: '16px', marginBottom: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px' }}
              onMouseEnter={el => el.currentTarget.style.borderColor = '#E8A0B4'}
              onMouseLeave={el => el.currentTarget.style.borderColor = '#F0E8E4'}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F9ECF1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>🎫</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#2A1F2D', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.event_title}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#C96E8A', background: '#F9ECF1', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>{fmtDate(e.event_date)}</span>
                  <span style={{ fontSize: '11px', color: '#7A6880', textTransform: 'capitalize' }}>via {e.event_source}</span>
                </div>
              </div>
              <div style={{ color: '#C96E8A', fontSize: '20px', flexShrink: 0 }}>›</div>
            </div>
          ))
        )}

        {/* RATINGS */}
        {activeTab === 'ratings' && (
          loading ? <div style={{ textAlign: 'center', padding: '40px 0', color: '#7A6880' }}>Loading...</div>
          : ratings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>⭐</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#2A1F2D', marginBottom: '8px', fontFamily: 'Playfair Display, serif' }}>No ratings yet</div>
              <div style={{ fontSize: '14px', color: '#7A6880', marginBottom: '24px' }}>Rate events on the Events page to see them here</div>
              <button onClick={() => navigate('/events')} style={{ background: '#C96E8A', color: '#fff', border: 'none', borderRadius: '50px', padding: '12px 28px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>Browse events</button>
            </div>
          ) : (
            <>
              {avgRating && (
                <div style={{ background: '#FAF0DC', border: '1px solid #F0D8A0', borderRadius: '14px', padding: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ fontSize: '36px', fontWeight: 800, color: '#D4A84B' }}>{avgRating}</div>
                  <div><StarDisplay rating={Math.round(Number(avgRating))} /><div style={{ fontSize: '13px', color: '#7A6880', marginTop: '4px' }}>Average across {ratings.length} rating{ratings.length !== 1 ? 's' : ''}</div></div>
                </div>
              )}
              {ratings.map(r => {
                const s = CAT_STYLES[r.category] ?? CAT_STYLES.Event
                return (
                  <div key={r.id} onClick={() => setSelectedRating(r)} style={{ background: '#fff', border: '1px solid #F0E8E4', borderRadius: '16px', padding: '16px', marginBottom: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px' }}
                    onMouseEnter={el => el.currentTarget.style.borderColor = '#F0D8A0'}
                    onMouseLeave={el => el.currentTarget.style.borderColor = '#F0E8E4'}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>{s.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#2A1F2D', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.event_title}</div>
                      <StarDisplay rating={r.rating} />
                      <div style={{ fontSize: '11px', color: '#7A6880', marginTop: '3px' }}>{STAR_LABELS[r.rating]} · {r.category}</div>
                      {r.note && <div style={{ fontSize: '12px', color: '#7A6880', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{r.note}"</div>}
                    </div>
                    <div style={{ color: '#D4A84B', fontSize: '20px', flexShrink: 0 }}>›</div>
                  </div>
                )
              })}
            </>
          )
        )}

        {/* HOBBIES */}
        {activeTab === 'hobbies' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#2A1F2D' }}>My hobbies</div>
              <button onClick={() => setShowAddHobby(true)} style={{ background: '#C96E8A', color: '#fff', border: 'none', borderRadius: '20px', padding: '7px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>+ Add hobby</button>
            </div>

            {hobbies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✨</div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#2A1F2D', marginBottom: '8px', fontFamily: 'Playfair Display, serif' }}>No hobbies added yet</div>
                <div style={{ fontSize: '14px', color: '#7A6880', marginBottom: '20px' }}>Add hobbies to get personalized event recommendations</div>
                <button onClick={() => setShowAddHobby(true)} style={{ background: '#C96E8A', color: '#fff', border: 'none', borderRadius: '50px', padding: '12px 28px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>Add your first hobby</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                {hobbies.map(h => {
                  const s = CAT_STYLES[h.category] ?? CAT_STYLES.Event
                  return (
                    <div key={h.id} style={{ background: '#fff', border: `1.5px solid ${s.color}30`, borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative' }}>
                      <button onClick={() => removeHobby(h.id)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#7A6880', fontSize: '16px', lineHeight: 1, padding: '2px' }}>×</button>
                      <div style={{ fontSize: '32px' }}>{h.icon}</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#2A1F2D' }}>{h.hobby_name}</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: s.color, background: s.bg, padding: '2px 10px', borderRadius: '20px' }}>{h.category}</div>
                    </div>
                  )
                })}
              </div>
            )}

            <button onClick={() => navigate('/hobbies')} style={{ width: '100%', background: '#F9ECF1', color: '#C96E8A', border: '1.5px solid #F0C8D8', borderRadius: '14px', padding: '14px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
              ✨ Discover more hobbies near me
            </button>
          </div>
        )}

        {/* SETTINGS */}
        {activeTab === 'settings' && (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#2A1F2D', marginBottom: '14px' }}>Preferences</div>
            <div style={{ background: '#fff', border: '1px solid #F0E8E4', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
              {[
                { key: 'beginner', label: 'Beginner-friendly only', sub: 'Show intro-level events' },
                { key: 'free', label: 'Free events only', sub: 'Hide paid events' },
                { key: 'notifs', label: 'Nearby notifications', sub: 'Alert for events near you' },
              ].map((p, i, arr) => (
                <div key={p.key} onClick={() => setPrefs(prev => ({ ...prev, [p.key]: !prev[p.key] }))} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', cursor: 'pointer', borderBottom: i < arr.length - 1 ? '1px solid #FAF7F4' : 'none' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 500, color: '#2A1F2D' }}>{p.label}</div>
                    <div style={{ fontSize: '12px', color: '#7A6880', marginTop: '2px' }}>{p.sub}</div>
                  </div>
                  <div style={{ width: '44px', height: '24px', borderRadius: '12px', flexShrink: 0, background: prefs[p.key] ? '#C96E8A' : '#EDE5DC', position: 'relative', transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', top: '3px', left: prefs[p.key] ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
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
              <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setEditingProfile(true)}>
                <span style={{ fontSize: '15px', color: '#2A1F2D' }}>Edit profile</span>
                <span style={{ fontSize: '13px', color: '#C96E8A', fontWeight: 600 }}>Edit →</span>
              </div>
            </div>
            <button onClick={async () => { await signOut(); navigate('/') }} style={{ width: '100%', background: '#fff', border: '1.5px solid #F0C0C8', borderRadius: '14px', padding: '15px', fontSize: '15px', fontWeight: 600, color: '#C96E8A', cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
