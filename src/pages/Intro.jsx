import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Intro = () => {
  const canvasRef = useRef(null)
  const navigate = useNavigate()
  const [titleVisible, setTitleVisible] = useState(false)
  const [btnVisible, setBtnVisible] = useState(false)
  const goHome = () => navigate('/home')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const W = canvas.width
    const H = canvas.height
    const CX = W * 0.5
    const CY = H * 0.42
    const GLOBE_R = Math.min(W, H) * 0.22

    const PIN_X = CX
    const PIN_Y = CY + GLOBE_R + 2

    let t = 0
    let raf
    let planeDone = false
    let pinScale = 0
    let ripple = 0

    // Plane orbits the globe for ~3 seconds then lands
    const ORBIT_DURATION = 180
    const LAND_DURATION = 80
    const trail = []

    const easeOut = v => 1 - Math.pow(1 - v, 3)
    const easeInOut = v => v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2

    const drawGlobe = () => {
      // Ocean base
      ctx.beginPath()
      ctx.arc(CX, CY, GLOBE_R, 0, Math.PI * 2)
      ctx.fillStyle = '#b8d4e8'
      ctx.fill()

      // Continent shapes (simplified landmasses)
      ctx.fillStyle = '#8aba8a'

      // North America
      ctx.beginPath()
      ctx.ellipse(CX - GLOBE_R * 0.28, CY - GLOBE_R * 0.15, GLOBE_R * 0.22, GLOBE_R * 0.28, -0.3, 0, Math.PI * 2)
      ctx.fill()

      // South America
      ctx.beginPath()
      ctx.ellipse(CX - GLOBE_R * 0.15, CY + GLOBE_R * 0.3, GLOBE_R * 0.13, GLOBE_R * 0.22, 0.2, 0, Math.PI * 2)
      ctx.fill()

      // Europe / Africa
      ctx.beginPath()
      ctx.ellipse(CX + GLOBE_R * 0.08, CY - GLOBE_R * 0.05, GLOBE_R * 0.14, GLOBE_R * 0.38, 0.1, 0, Math.PI * 2)
      ctx.fill()

      // Asia
      ctx.beginPath()
      ctx.ellipse(CX + GLOBE_R * 0.35, CY - GLOBE_R * 0.18, GLOBE_R * 0.26, GLOBE_R * 0.22, -0.2, 0, Math.PI * 2)
      ctx.fill()

      // Australia
      ctx.beginPath()
      ctx.ellipse(CX + GLOBE_R * 0.38, CY + GLOBE_R * 0.32, GLOBE_R * 0.12, GLOBE_R * 0.09, 0.1, 0, Math.PI * 2)
      ctx.fill()

      // Latitude lines
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.lineWidth = 0.8
      for (let i = -2; i <= 2; i++) {
        const ly = CY + (i / 2.5) * GLOBE_R
        const lw = Math.sqrt(Math.max(0, GLOBE_R * GLOBE_R - (ly - CY) * (ly - CY)))
        ctx.beginPath()
        ctx.ellipse(CX, ly, lw, lw * 0.15, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Longitude lines
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI
        ctx.beginPath()
        ctx.ellipse(CX, CY, GLOBE_R * 0.15, GLOBE_R, angle, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Globe border
      ctx.beginPath()
      ctx.arc(CX, CY, GLOBE_R, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Shine
      ctx.beginPath()
      ctx.arc(CX - GLOBE_R * 0.3, CY - GLOBE_R * 0.3, GLOBE_R * 0.18, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.12)'
      ctx.fill()
    }

    const drawPlane = (x, y, angle, alpha) => {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(x, y)
      ctx.rotate(angle)
      ctx.fillStyle = '#2A1F2D'
      ctx.beginPath()
      ctx.moveTo(18, 0)
      ctx.lineTo(-10, 7)
      ctx.lineTo(-6, 0)
      ctx.lineTo(-10, -7)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#C96E8A'
      ctx.beginPath()
      ctx.moveTo(18, 0)
      ctx.lineTo(0, 3)
      ctx.lineTo(0, -3)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    const drawPin = (x, y, scale) => {
      if (scale <= 0) return
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(scale, scale)
      ctx.fillStyle = '#C96E8A'
      ctx.beginPath()
      ctx.arc(0, -14, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(-6, -4)
      ctx.quadraticCurveTo(0, 14, 0, 16)
      ctx.quadraticCurveTo(0, 14, 6, -4)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(0, -14, 5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.fill()
      ctx.restore()
    }

    const frame = () => {
      t++

      // Background
      ctx.fillStyle = '#FAF7F4'
      ctx.fillRect(0, 0, W, H)

      // Dot grid
      for (let x = 0; x < W; x += 40) {
        for (let y = 0; y < H; y += 40) {
          ctx.beginPath()
          ctx.arc(x, y, 1, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(201,110,138,0.08)'
          ctx.fill()
        }
      }

      // Globe (fades in)
      ctx.save()
      ctx.globalAlpha = Math.min(1, t / 40)
      drawGlobe()
      ctx.restore()

      // Plane orbit phase
      if (t <= ORBIT_DURATION) {
        const orbitAngle = (t / ORBIT_DURATION) * Math.PI * 2.5 - Math.PI * 0.5
        const orbitR = GLOBE_R + 18
        const px = CX + Math.cos(orbitAngle) * orbitR
        const py = CY + Math.sin(orbitAngle) * orbitR * 0.45
        const nextAngle = orbitAngle + 0.08
        const nx = CX + Math.cos(nextAngle) * orbitR
        const ny = CY + Math.sin(nextAngle) * orbitR * 0.45
        const planeAngle = Math.atan2(ny - py, nx - px)

        trail.push({ x: px, y: py })
        if (trail.length > 30) trail.shift()

        // Trail
        for (let i = 1; i < trail.length; i++) {
          ctx.strokeStyle = `rgba(201,110,138,${(i / trail.length) * 0.3})`
          ctx.lineWidth = 1.2
          ctx.setLineDash([3, 4])
          ctx.beginPath()
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y)
          ctx.lineTo(trail[i].x, trail[i].y)
          ctx.stroke()
        }
        ctx.setLineDash([])

        // Hide plane behind globe when it goes "behind"
        const behindGlobe = Math.sin((t / ORBIT_DURATION) * Math.PI * 2.5 - Math.PI * 0.5) < -0.3
        if (!behindGlobe) {
          drawPlane(px, py, planeAngle, Math.min(1, t / 20))
        }
      }

      // Landing phase
      if (t > ORBIT_DURATION && t <= ORBIT_DURATION + LAND_DURATION) {
        const lt = (t - ORBIT_DURATION) / LAND_DURATION
        const startX = CX + Math.cos(Math.PI * 2.5 - Math.PI * 0.5) * (GLOBE_R + 18)
        const startY = CY + Math.sin(Math.PI * 2.5 - Math.PI * 0.5) * (GLOBE_R + 18) * 0.45
        const px = startX + (PIN_X - startX) * easeInOut(lt)
        const py = startY + (PIN_Y - startY) * easeInOut(lt)
        const angle = Math.atan2(PIN_Y - startY, PIN_X - startX)

        drawPlane(px, py, angle, 1 - easeOut(lt))

        if (lt >= 1 && !planeDone) {
          planeDone = true
          ripple = 0.01
        }
      }

      // Pin + ripple
      if (planeDone) {
        if (ripple > 0 && ripple < 1) {
          for (let i = 0; i < 3; i++) {
            const rr = ripple * 60 * (i + 1) / 3
            ctx.beginPath()
            ctx.arc(PIN_X, PIN_Y, rr, 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(201,110,138,${(1 - ripple) * (1 - i / 3) * 0.5})`
            ctx.lineWidth = 1.5
            ctx.stroke()
          }
          ripple = Math.min(1, ripple + 0.025)
        }

        pinScale = easeOut(Math.min(1, (t - ORBIT_DURATION - LAND_DURATION) / 20))
        drawPin(PIN_X, PIN_Y, pinScale)

        // Trigger title
        if (pinScale > 0.8 && !titleVisible) {
          setTitleVisible(true)
          setTimeout(() => setBtnVisible(true), 600)
        }
      }

      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#FAF7F4', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block' }} />

      {/* Title above globe */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: 0,
        right: 0,
        textAlign: 'center',
        opacity: titleVisible ? 1 : 0,
        transform: titleVisible ? 'translateY(0)' : 'translateY(-16px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
        pointerEvents: 'none'
      }}>
        <h1 style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontWeight: 700,
          fontSize: 'clamp(36px, 8vw, 60px)',
          color: '#2A1F2D',
          letterSpacing: '-.02em',
          margin: 0
        }}>
          hobby<span style={{ color: '#C96E8A' }}>find</span>
        </h1>
        <p style={{
          color: '#7A6880',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '.14em',
          fontWeight: 300,
          margin: '8px 0 0'
        }}>
          discover what's near you
        </p>
      </div>

      {/* Button below globe / pin */}
      <div style={{
        position: 'absolute',
        bottom: '12%',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity: btnVisible ? 1 : 0,
        transform: btnVisible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}>
        <button
          onClick={goHome}
          style={{
            background: '#C96E8A',
            color: '#fff',
            border: 'none',
            borderRadius: '50px',
            padding: '14px 40px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            letterSpacing: '.02em'
          }}
        >
          Explore now
        </button>
      </div>
    </div>
  )
}

export default Intro