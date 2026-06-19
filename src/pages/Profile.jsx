import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import useAuth from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { COLORS, SPACING, RADIUS, FONTS, SHADOW, PAGE_STYLE, cardStyle } from '../theme'

const STAR_LABELS = ['', 'Not for me', 'It was okay', 'Pretty good', 'Really enjoyed it', 'Loved it!']

const CAT_STYLES = {
  Art:      { bg: COLORS.roseLight, color: COLORS.rose, icon: '🎨' },
  Music:    { bg: COLORS.lavenderLight, color: COLORS.lavender, icon: '🎸' },
  Fitness:  { bg: COLORS.sageLight, color: COLORS.sage, icon: '🏃' },
  Cooking:  { bg: COLORS.goldLight, color: COLORS.gold, icon: '🍳' },
  Tech:     { bg: COLORS.lavenderLight, color: COLORS.lavender, icon: '💻' },
  Outdoors: { bg: COLORS.sageLight, color: COLORS.sage, icon: '🏕' },
  Event:    { bg: COLORS.surface, color: COLORS.muted, icon: '📅' },
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

const BackHeader = ({ title, onBack }) => (
  <div style={{ background: COLORS.white, padding: `${SPACING.lg} ${SPACING.xl}`, borderBottom: `1px solid ${COLORS.surface2}`, display: 'flex', alignItems: 'center', gap: SPACING.md }}>
    <button onClick={onBack} style={{ background: COLORS.roseLight, border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
    <span style={{ fontSize: '16px', fontWeight: 600, color: COLORS.ink, fontFamily: FONTS.body }}>{title}</span>
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
      id: user.id, email: user.email, full_name: editName, bio: editBio,
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
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
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
      user_id: user.id, hobby_name: hobby.name, category: hobby.category, icon: hobby.icon,
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

  const initials = profile.full_name ? profile.full_name.slice(0, 2).toUpperCase() : user?.email?.slice(0, 2).toUpperCase() ?? '??'
  const displayName = profile.full_name || user?.email?.split('@')[0] || ''
  const avgRating = ratings.length > 0 ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1) : null

  const tabs = [
    { id: 'saved',    label: '🎫 Saved',   count: savedEvents.length },
    { id: 'ratings',  label: '⭐ Ratings',  count: ratings.length },
    { id: 'hobbies',  label: '✨ Hobbies',  count: hobbies.length },
    { id: 'settings', label: '⚙️ Settings' },
  ]

  if (selectedEvent) {
    return (
      <div style={{ ...PAGE_STYLE }}>
        <BackHeader title="Saved event" onBack={() => setSelectedEvent(null)} />
        <div style={{ padding: `${SPACING.xxl} ${SPACING.xl}` }}>
          <div style={{ background: COLORS.roseLight, borderRadius: RADIUS.lg, padding: SPACING.xxl, marginBottom: SPACING.lg, textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: SPACING.sm }}>🎫</div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: COLORS.rose, letterSpacing: '.06em', marginBottom: SPACING.sm }}>SAVED EVENT</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: COLORS.ink, fontFamily: FONTS.heading, lineHeight: 1.2 }}>{selectedEvent.event_title}</div>
          </div>
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', marginBottom: SPACING.lg }}>
            {[['Date', fmtDate(selectedEvent.event_date)], ['Source', selectedEvent.event_source], ['Saved on', new Date(selectedEvent.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })]].map(([label, val], i, arr) => (
              <div key={label} style={{ padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid #FAF7F4' : 'none', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: COLORS.muted }}>{label}</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: COLORS.ink, textTransform: 'capitalize' }}>{val}</span>
              </div>
            ))}
          </div>
          {selectedEvent.event_url && <a href={selectedEvent.event_url} target="_blank" rel="noreferrer" style={{ display: 'block', background: COLORS.rose, color: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.lg, textAlign: 'center', fontSize: '16px', fontWeight: 600, textDecoration: 'none', marginBottom: SPACING.md }}>View event & sign up →</a>}
          <button onClick={() => removeEvent(selectedEvent.id)} disabled={removing === selectedEvent.id} style={{ width: '100%', background: COLORS.white, border: '1.5px solid #F0C0C8', borderRadius: RADIUS.md, padding: '14px', fontSize: '15px', fontWeight: 600, color: COLORS.rose, cursor: 'pointer', fontFamily: FONTS.body }}>
            {removing === selectedEvent.id ? 'Removing...' : 'Remove from saved'}
          </button>
        </div>
      </div>
    )
  }

  if (selectedRating) {
    const s = CAT_STYLES[selectedRating.category] ?? CAT_STYLES.Event
    return (
      <div style={{ ...PAGE_STYLE }}>
        <BackHeader title="My rating" onBack={() => setSelectedRating(null)} />
        <div style={{ padding: `${SPACING.xxl} ${SPACING.xl}` }}>
          <div style={{ background: s.bg, borderRadius: RADIUS.lg, padding: SPACING.xxl, marginBottom: SPACING.xl, textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: SPACING.sm }}>{s.icon}</div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: s.color, letterSpacing: '.06em', marginBottom: SPACING.sm }}>{selectedRating.category?.toUpperCase()}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: COLORS.ink, fontFamily: FONTS.heading, lineHeight: 1.2, marginBottom: SPACING.md }}>{selectedRating.event_title}</div>
            <StarDisplay rating={selectedRating.rating} />
            <div style={{ fontSize: '14px', color: s.color, fontWeight: 600, marginTop: SPACING.sm }}>{STAR_LABELS[selectedRating.rating]}</div>
          </div>
          {selectedRating.note && (
            <div style={{ ...cardStyle, borderRadius: RADIUS.md, marginBottom: SPACING.lg }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: SPACING.sm }}>Your notes</div>
              <div style={{ fontSize: '14px', color: COLORS.ink, lineHeight: 1.6 }}>{selectedRating.note}</div>
            </div>
          )}
          <button onClick={() => navigate('/events')} style={{ width: '100%', background: COLORS.rose, color: COLORS.white, border: 'none', borderRadius: RADIUS.md, padding: '15px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body, marginBottom: SPACING.md }}>Find similar events →</button>
          <button onClick={() => deleteRating(selectedRating.id)} disabled={deletingRating === selectedRating.id} style={{ width: '100%', background: COLORS.white, border: '1.5px solid #F0C0C8', borderRadius: RADIUS.md, padding: '14px', fontSize: '15px', fontWeight: 600, color: COLORS.rose, cursor: 'pointer', fontFamily: FONTS.body }}>
            {deletingRating === selectedRating.id ? 'Deleting...' : 'Delete rating'}
          </button>
        </div>
      </div>
    )
  }

  if (showAddHobby) {
    const addedNames = hobbies.map(h => h.hobby_name)
    return (
      <div style={{ ...PAGE_STYLE }}>
        <BackHeader title="Add hobbies" onBack={() => setShowAddHobby(false)} />
        <div style={{ padding: `${SPACING.xl} ${SPACING.lg}` }}>
          <p style={{ fontSize: '14px', color: COLORS.muted, marginBottom: SPACING.xl, fontFamily: FONTS.body }}>Tap a hobby to add it to your profile. We'll find events for you based on these.</p>
          {['Art', 'Music', 'Fitness', 'Cooking', 'Outdoors', 'Tech'].map(cat => {
            const s = CAT_STYLES[cat]
            const opts = ALL_HOBBY_OPTIONS.filter(h => h.category === cat)
            return (
              <div key={cat} style={{ marginBottom: SPACING.xl }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: SPACING.md, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{s.icon}</span> {cat}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.sm }}>
                  {opts.map(h => {
                    const added = addedNames.includes(h.name)
                    return (
                      <button key={h.name} onClick={() => { if (!added) addHobby(h) }} style={{
                        padding: '8px 16px', borderRadius: RADIUS.pill, fontSize: '13px',
                        fontWeight: 500, cursor: added ? 'default' : 'pointer',
                        border: `1.5px solid ${added ? s.color : COLORS.border}`,
                        background: added ? s.bg : COLORS.white,
                        color: added ? s.color : COLORS.ink2,
                        fontFamily: FONTS.body,
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
          <button onClick={() => setShowAddHobby(false)} style={{ width: '100%', background: COLORS.rose, color: COLORS.white, border: 'none', borderRadius: RADIUS.md, padding: '15px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body, marginTop: SPACING.sm }}>
            Done — save my hobbies
          </button>
        </div>
      </div>
    )
  }

  if (editingProfile) {
    return (
      <div style={{ ...PAGE_STYLE }}>
        <div style={{ background: COLORS.white, padding: `${SPACING.lg} ${SPACING.xl}`, borderBottom: `1px solid ${COLORS.surface2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
            <button onClick={() => setEditingProfile(false)} style={{ background: COLORS.roseLight, border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
            <span style={{ fontSize: '16px', fontWeight: 600, color: COLORS.ink }}>Edit profile</span>
          </div>
          <button onClick={saveProfile} disabled={savingProfile} style={{ background: COLORS.rose, color: COLORS.white, border: 'none', borderRadius: RADIUS.pill, padding: '7px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body, opacity: savingProfile ? 0.7 : 1 }}>
            {savingProfile ? 'Saving...' : 'Save'}
          </button>
        </div>
        <div style={{ padding: `${SPACING.xxl} ${SPACING.xl}` }}>
          <div style={{ textAlign: 'center', marginBottom: SPACING.xxl }}>
            <div onClick={handleAvatarClick} style={{ width: '90px', height: '90px', borderRadius: '50%', background: profile.avatar_url ? 'transparent' : COLORS.rose, border: '3px solid #fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: COLORS.white, fontSize: '30px', fontWeight: 700, cursor: 'pointer', position: 'relative', boxShadow: SHADOW.card, overflow: 'hidden' }}>
              {profile.avatar_url ? <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            <div style={{ fontSize: '13px', color: COLORS.rose, fontWeight: 600, marginTop: SPACING.sm, cursor: 'pointer' }} onClick={handleAvatarClick}>
              {uploadingAvatar ? 'Uploading...' : 'Change photo'}
            </div>
          </div>
          <div style={{ marginBottom: SPACING.lg }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: COLORS.ink2, letterSpacing: '.06em', textTransform: 'uppercase', display: 'block', marginBottom: SPACING.sm }}>Display name</label>
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" style={{ width: '100%', background: COLORS.white, border: `1.5px solid ${COLORS.border}`, borderRadius: RADIUS.md, padding: '13px 16px', fontSize: '15px', color: COLORS.ink, outline: 'none', fontFamily: FONTS.body, boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = COLORS.rose}
              onBlur={e => e.target.style.borderColor = COLORS.border} />
          </div>
          <div style={{ marginBottom: SPACING.lg }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: COLORS.ink2, letterSpacing: '.06em', textTransform: 'uppercase', display: 'block', marginBottom: SPACING.sm }}>Bio</label>
            <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Tell others about yourself and your hobbies..." rows={4} style={{ width: '100%', background: COLORS.white, border: `1.5px solid ${COLORS.border}`, borderRadius: RADIUS.md, padding: '13px 16px', fontSize: '15px', color: COLORS.ink, outline: 'none', resize: 'none', fontFamily: FONTS.body, boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = COLORS.rose}
              onBlur={e => e.target.style.borderColor = COLORS.border} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...PAGE_STYLE }}>

      <div style={{ background: COLORS.roseLight, padding: `${SPACING.xxl} ${SPACING.xl} 24px`, borderBottom: '1px solid #F0E0E8' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACING.lg, marginBottom: SPACING.md }}>
          <div onClick={handleAvatarClick} style={{ width: '72px', height: '72px', borderRadius: '50%', background: COLORS.rose, border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.white, fontSize: '26px', fontWeight: 700, flexShrink: 0, boxShadow: SHADOW.card, cursor: 'pointer', overflow: 'hidden' }}>
            {profile.avatar_url ? <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: COLORS.ink, fontFamily: FONTS.heading, marginBottom: '2px' }}>{displayName}</div>
            <div style={{ fontSize: '13px', color: COLORS.muted, marginBottom: '4px' }}>{user?.email}</div>
            {profile.bio && <div style={{ fontSize: '13px', color: COLORS.ink2, lineHeight: 1.5, marginBottom: '4px' }}>{profile.bio}</div>}
            {avgRating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <StarDisplay rating={Math.round(Number(avgRating))} />
                <span style={{ fontSize: '12px', color: COLORS.muted }}>{avgRating} avg</span>
              </div>
            )}
          </div>
          <button onClick={() => setEditingProfile(true)} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.pill, padding: '7px 14px', fontSize: '12px', color: COLORS.ink2, cursor: 'pointer', fontFamily: FONTS.body, fontWeight: 500, flexShrink: 0 }}>Edit</button>
        </div>
        <div style={{ display: 'flex', gap: SPACING.sm }}>
          {[
            { num: savedEvents.length, label: 'Saved', color: COLORS.rose },
            { num: ratings.length, label: 'Ratings', color: COLORS.gold },
            { num: hobbies.length, label: 'Hobbies', color: COLORS.lavender },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: COLORS.white, borderRadius: RADIUS.md, padding: '12px 10px', textAlign: 'center', border: '1px solid rgba(201,110,138,0.12)' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>{s.num}</div>
              <div style={{ fontSize: '11px', color: COLORS.muted, marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', background: COLORS.white, borderBottom: `2px solid ${COLORS.surface2}`, overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flexShrink: 0, padding: '13px 12px', fontSize: '12px', fontWeight: 500, border: 'none', background: 'none', cursor: 'pointer', fontFamily: FONTS.body, color: activeTab === tab.id ? COLORS.rose : COLORS.muted, borderBottom: `2px solid ${activeTab === tab.id ? COLORS.rose : 'transparent'}`, transition: 'all 0.15s', marginBottom: '-2px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && <span style={{ background: COLORS.rose, color: COLORS.white, fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: RADIUS.pill }}>{tab.count}</span>}
          </button>
        ))}
      </div>

      <div style={{ padding: `${SPACING.xl} ${SPACING.lg}` }}>

        {activeTab === 'saved' && (
          loading ? <div style={{ textAlign: 'center', padding: '40px 0', color: COLORS.muted }}>Loading...</div>
          : savedEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: SPACING.md }}>🎫</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: COLORS.ink, marginBottom: SPACING.sm, fontFamily: FONTS.heading }}>No saved events yet</div>
              <div style={{ fontSize: '14px', color: COLORS.muted, marginBottom: SPACING.xl }}>Tap Sign up on any event to save it here</div>
              <button onClick={() => navigate('/events')} style={{ background: COLORS.rose, color: COLORS.white, border: 'none', borderRadius: RADIUS.pill, padding: '12px 28px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body }}>Browse events</button>
            </div>
          ) : savedEvents.map(e => (
            <div key={e.id} onClick={() => setSelectedEvent(e)} style={{ ...cardStyle, borderRadius: RADIUS.lg, marginBottom: SPACING.sm, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: SPACING.md }}
              onMouseEnter={el => el.currentTarget.style.borderColor = '#E8A0B4'}
              onMouseLeave={el => el.currentTarget.style.borderColor = COLORS.surface2}>
              <div style={{ width: '48px', height: '48px', borderRadius: RADIUS.sm, background: COLORS.roseLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>🎫</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: COLORS.ink, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.event_title}</div>
                <div style={{ display: 'flex', gap: SPACING.sm }}>
                  <span style={{ fontSize: '11px', color: COLORS.rose, background: COLORS.roseLight, padding: '2px 8px', borderRadius: RADIUS.pill, fontWeight: 600 }}>{fmtDate(e.event_date)}</span>
                  <span style={{ fontSize: '11px', color: COLORS.muted, textTransform: 'capitalize' }}>via {e.event_source}</span>
                </div>
              </div>
              <div style={{ color: COLORS.rose, fontSize: '20px', flexShrink: 0 }}>›</div>
            </div>
          ))
        )}

        {activeTab === 'ratings' && (
          loading ? <div style={{ textAlign: 'center', padding: '40px 0', color: COLORS.muted }}>Loading...</div>
          : ratings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: SPACING.md }}>⭐</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: COLORS.ink, marginBottom: SPACING.sm, fontFamily: FONTS.heading }}>No ratings yet</div>
              <div style={{ fontSize: '14px', color: COLORS.muted, marginBottom: SPACING.xl }}>Rate events on the Events page to see them here</div>
              <button onClick={() => navigate('/events')} style={{ background: COLORS.rose, color: COLORS.white, border: 'none', borderRadius: RADIUS.pill, padding: '12px 28px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body }}>Browse events</button>
            </div>
          ) : (
            <>
              {avgRating && (
                <div style={{ background: COLORS.goldLight, border: '1px solid #F0D8A0', borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.lg, display: 'flex', alignItems: 'center', gap: SPACING.md }}>
                  <div style={{ fontSize: '36px', fontWeight: 800, color: COLORS.gold }}>{avgRating}</div>
                  <div><StarDisplay rating={Math.round(Number(avgRating))} /><div style={{ fontSize: '13px', color: COLORS.muted, marginTop: '4px' }}>Average across {ratings.length} rating{ratings.length !== 1 ? 's' : ''}</div></div>
                </div>
              )}
              {ratings.map(r => {
                const s = CAT_STYLES[r.category] ?? CAT_STYLES.Event
                return (
                  <div key={r.id} onClick={() => setSelectedRating(r)} style={{ ...cardStyle, borderRadius: RADIUS.lg, marginBottom: SPACING.sm, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: SPACING.md }}
                    onMouseEnter={el => el.currentTarget.style.borderColor = '#F0D8A0'}
                    onMouseLeave={el => el.currentTarget.style.borderColor = COLORS.surface2}>
                    <div style={{ width: '48px', height: '48px', borderRadius: RADIUS.sm, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>{s.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: COLORS.ink, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.event_title}</div>
                      <StarDisplay rating={r.rating} />
                      <div style={{ fontSize: '11px', color: COLORS.muted, marginTop: '3px' }}>{STAR_LABELS[r.rating]} · {r.category}</div>
                      {r.note && <div style={{ fontSize: '12px', color: COLORS.muted, marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{r.note}"</div>}
                    </div>
                    <div style={{ color: COLORS.gold, fontSize: '20px', flexShrink: 0 }}>›</div>
                  </div>
                )
              })}
            </>
          )
        )}

        {activeTab === 'hobbies' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: COLORS.ink }}>My hobbies</div>
              <button onClick={() => setShowAddHobby(true)} style={{ background: COLORS.rose, color: COLORS.white, border: 'none', borderRadius: RADIUS.pill, padding: '7px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body }}>+ Add hobby</button>
            </div>

            {hobbies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: SPACING.md }}>✨</div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: COLORS.ink, marginBottom: SPACING.sm, fontFamily: FONTS.heading }}>No hobbies added yet</div>
                <div style={{ fontSize: '14px', color: COLORS.muted, marginBottom: SPACING.lg }}>Add hobbies to get personalized event recommendations</div>
                <button onClick={() => setShowAddHobby(true)} style={{ background: COLORS.rose, color: COLORS.white, border: 'none', borderRadius: RADIUS.pill, padding: '12px 28px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body }}>Add your first hobby</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACING.sm, marginBottom: SPACING.lg }}>
                {hobbies.map(h => {
                  const s = CAT_STYLES[h.category] ?? CAT_STYLES.Event
                  return (
                    <div key={h.id} style={{ background: COLORS.white, border: `1.5px solid ${s.color}30`, borderRadius: RADIUS.lg, padding: SPACING.lg, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACING.sm, position: 'relative' }}>
                      <button onClick={() => removeHobby(h.id)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: COLORS.muted, fontSize: '16px', lineHeight: 1, padding: '2px' }}>×</button>
                      <div style={{ fontSize: '32px' }}>{h.icon}</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: COLORS.ink }}>{h.hobby_name}</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: s.color, background: s.bg, padding: '2px 10px', borderRadius: RADIUS.pill }}>{h.category}</div>
                    </div>
                  )
                })}
              </div>
            )}

            <button onClick={() => navigate('/hobbies')} style={{ width: '100%', background: COLORS.roseLight, color: COLORS.rose, border: '1.5px solid #F0C8D8', borderRadius: RADIUS.md, padding: SPACING.lg, fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body }}>
              ✨ Discover more hobbies near me
            </button>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: COLORS.ink, marginBottom: SPACING.md }}>Preferences</div>
            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', marginBottom: SPACING.xl }}>
              {[
                { key: 'beginner', label: 'Beginner-friendly only', sub: 'Show intro-level events' },
                { key: 'free', label: 'Free events only', sub: 'Hide paid events' },
                { key: 'notifs', label: 'Nearby notifications', sub: 'Alert for events near you' },
              ].map((p, i, arr) => (
                <div key={p.key} onClick={() => setPrefs(prev => ({ ...prev, [p.key]: !prev[p.key] }))} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, cursor: 'pointer', borderBottom: i < arr.length - 1 ? '1px solid #FAF7F4' : 'none' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 500, color: COLORS.ink }}>{p.label}</div>
                    <div style={{ fontSize: '12px', color: COLORS.muted, marginTop: '2px' }}>{p.sub}</div>
                  </div>
                  <div style={{ width: '44px', height: '24px', borderRadius: '12px', flexShrink: 0, background: prefs[p.key] ? COLORS.rose : COLORS.border, position: 'relative', transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', width: '18px', height: '18px', borderRadius: '50%', background: COLORS.white, top: '3px', left: prefs[p.key] ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: COLORS.ink, marginBottom: SPACING.md }}>Account</div>
            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', marginBottom: SPACING.xl }}>
              <div style={{ padding: SPACING.lg, borderBottom: '1px solid #FAF7F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', color: COLORS.ink }}>Email</span>
                <span style={{ fontSize: '13px', color: COLORS.muted }}>{user?.email}</span>
              </div>
              <div style={{ padding: SPACING.lg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setEditingProfile(true)}>
                <span style={{ fontSize: '15px', color: COLORS.ink }}>Edit profile</span>
                <span style={{ fontSize: '13px', color: COLORS.rose, fontWeight: 600 }}>Edit →</span>
              </div>
            </div>
            <button onClick={async () => { await signOut(); navigate('/') }} style={{ width: '100%', background: COLORS.white, border: '1.5px solid #F0C0C8', borderRadius: RADIUS.md, padding: '15px', fontSize: '15px', fontWeight: 600, color: COLORS.rose, cursor: 'pointer', fontFamily: FONTS.body }}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
