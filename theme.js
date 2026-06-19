//fixes the inconsitent spacing/colors across pages

export const COLORS = {
  cream: '#FAF7F4',
  surface: '#F4EFE9',
  surface2: '#F0E8E4',

  rose: '#C96E8A',
  roseLight: '#F9ECF1',
  roseBorder: '#F0C8D8',

  lavender: '#8B72C8',
  lavenderLight: '#EDE8F6',

  sage: '#5A8C6A',
  sageLight: '#DCF0E2',

  gold: '#D4A84B',
  goldLight: '#FAF0DC',

  ink: '#2A1F2D',
  ink2: '#4A3850',
  muted: '#7A6880',
  border: '#EDE5DC',

  white: '#FFFFFF',
}

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '14px',
  lg: '16px',
  xl: '20px',
  xxl: '28px',
}

export const RADIUS = {
  sm: '10px',
  md: '14px',
  lg: '16px',
  xl: '20px',
  pill: '50px',
}

export const SHADOW = {
  card: '0 2px 8px rgba(42,31,45,0.08)',
  float: '0 4px 20px rgba(42,31,45,0.15)',
  deep: '0 8px 32px rgba(42,31,45,0.18)',
}

export const FONTS = {
  heading: "'Playfair Display', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
}

// Standard page container — wrap page content in this for consistent
// padding/background across Home, Events, Hobbies, Profile
export const PAGE_STYLE = {
  background: COLORS.cream,
  minHeight: '100vh',
  fontFamily: FONTS.body,
  paddingBottom: '100px', // clears tab bar
}

// Standard section header style (used for "Nearby events", "My hobbies" etc)
export const SECTION_HEADER_STYLE = {
  fontSize: '18px',
  fontWeight: 700,
  color: COLORS.ink,
  fontFamily: FONTS.heading,
  margin: 0,
}

// Standard pill button (category filters, quick filters)
export const pillStyle = (active) => ({
  flexShrink: 0,
  padding: '7px 18px',
  borderRadius: RADIUS.pill,
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  border: `1.5px solid ${active ? COLORS.rose : COLORS.border}`,
  background: active ? COLORS.rose : 'transparent',
  color: active ? COLORS.white : COLORS.ink2,
  fontFamily: FONTS.body,
  whiteSpace: 'nowrap',
  transition: 'all 0.15s',
})

// Standard primary button (Sign up, Submit, Save)
export const primaryButtonStyle = {
  background: COLORS.rose,
  color: COLORS.white,
  border: 'none',
  borderRadius: RADIUS.md,
  padding: '14px',
  fontSize: '15px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: FONTS.body,
}

// Standard card style (event cards, saved items, list rows)
export const cardStyle = {
  background: COLORS.white,
  border: `1px solid ${COLORS.surface2}`,
  borderRadius: RADIUS.lg,
  padding: '14px 16px',
}
